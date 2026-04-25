import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired, parseBracketData, validateTournamentId,
} from '../_shared';

// ── POST /api/tournaments/:id/link-hw2 ───────────────────────────────────────
// Body: { hw2MatchId, bracketsMatchId }
// Looks up the HW2 match in D1 (must already be cached from the stats system).
// If both players in the bracket match are found in the HW2 match, returns
// { winner_gamertag, winner_participant_id, map_id, p1_leader_id, p2_leader_id }.
// Does NOT write the result — the client calls PATCH /matches/:matchId.
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const tournamentId = params.id as string;
  if (!validateTournamentId(tournamentId)) return errorResponse('Tournament not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const hw2MatchId = typeof body.hw2MatchId === 'string' ? body.hw2MatchId.trim() : '';
  const bracketsMatchId = typeof body.bracketsMatchId === 'number' ? body.bracketsMatchId : null;

  if (!hw2MatchId) return errorResponse('hw2MatchId is required');
  if (bracketsMatchId === null) return errorResponse('bracketsMatchId is required');

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(tournamentId).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (tournament.status !== 'active') return errorResponse('Tournament is not active');

  const bracketContent = parseBracketData(tournament.bracket_data);
  if (!bracketContent) return errorResponse('Bracket data is missing or corrupted', 500);

  // Fetch the raw match payload from D1 (must already be cached via the stats system)
  const matchRow = await env.DB.prepare(
    'SELECT payload_json FROM raw_match_payloads WHERE match_id = ?'
  ).bind(hw2MatchId).first<{ payload_json: string }>();

  if (!matchRow) {
    return errorResponse(
      'HW2 match not found in the database. Both players must have looked up their stats first.',
      404
    );
  }

  let matchPayload: any;
  try {
    matchPayload = JSON.parse(matchRow.payload_json);
  } catch {
    return errorResponse('Failed to parse HW2 match data', 500);
  }

  // Find the two bracket participants for this match from bracket_data
  const bracketMatches: any[] = (bracketContent.match as any[]) ?? [];
  const bracketParticipants: any[] = (bracketContent.participant as any[]) ?? [];
  const bMatch = bracketMatches.find((m: any) => m.id === bracketsMatchId);
  if (!bMatch) return errorResponse('Match not found in bracket');

  const p1BracketId = bMatch.opponent1?.id;
  const p2BracketId = bMatch.opponent2?.id;
  if (p1BracketId == null || p2BracketId == null) {
    return errorResponse('This bracket match does not have two participants yet');
  }

  const p1Gamertag = bracketParticipants.find((p: any) => p.id === p1BracketId)?.name ?? '';
  const p2Gamertag = bracketParticipants.find((p: any) => p.id === p2BracketId)?.name ?? '';

  // Locate each gamertag in the HW2 match players
  const players: any[] = Array.isArray(matchPayload.Players)
    ? matchPayload.Players
    : Object.values(matchPayload.Players ?? {});

  function findPlayer(gamertag: string) {
    return players.find((p: any) => {
      const gt = String(
        typeof p.HumanPlayerId === 'object' ? p.HumanPlayerId?.Gamertag : p.HumanPlayerId
      ) || p.Gamertag || '';
      return gt.toLowerCase() === gamertag.toLowerCase();
    });
  }

  const p1 = findPlayer(p1Gamertag);
  const p2 = findPlayer(p2Gamertag);

  if (!p1 || !p2) {
    const missing = [!p1 && p1Gamertag, !p2 && p2Gamertag].filter(Boolean).join(', ');
    return errorResponse(
      `Could not find ${missing} in this HW2 match. Verify both players were in the match.`,
      422
    );
  }

  const p1Outcome = p1.MatchOutcome ?? p1.PlayerMatchOutcome;
  const p2Outcome = p2.MatchOutcome ?? p2.PlayerMatchOutcome;

  function normalizeOutcome(outcome: unknown): 'win' | 'loss' | null {
    if (outcome === 1 || outcome === '1') return 'win';
    if (outcome === 2 || outcome === '2') return 'loss';
    if (typeof outcome === 'string') {
      const normalized = outcome.trim().toLowerCase();
      if (normalized === 'win' || normalized === 'won') return 'win';
      if (normalized === 'loss' || normalized === 'lose' || normalized === 'lost') return 'loss';
    }
    return null;
  }

  const normalizedP1Outcome = normalizeOutcome(p1Outcome);
  const normalizedP2Outcome = normalizeOutcome(p2Outcome);

  let winnerGamertag: string;
  if (normalizedP1Outcome === 'win' && normalizedP2Outcome !== 'win') {
    winnerGamertag = p1Gamertag;
  } else if (normalizedP2Outcome === 'win' && normalizedP1Outcome !== 'win') {
    winnerGamertag = p2Gamertag;
  } else if (normalizedP1Outcome === 'loss' && normalizedP2Outcome !== 'loss') {
    winnerGamertag = p2Gamertag;
  } else if (normalizedP2Outcome === 'loss' && normalizedP1Outcome !== 'loss') {
    winnerGamertag = p1Gamertag;
  } else {
    return errorResponse(
      'Could not determine a winner from this HW2 match. Please verify the result manually.',
      422
    );
  }

  const mapId: string = matchPayload.MapId ?? '';
  const p1LeaderId: number | null = p1.LeaderId ?? null;
  const p2LeaderId: number | null = p2.LeaderId ?? null;
  const winnerParticipant = await env.DB.prepare(
    'SELECT id FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
  ).bind(tournamentId, winnerGamertag).first<{ id: number }>();

  return jsonResponse({
    ok: true,
    hw2_match_id: hw2MatchId,
    winner_gamertag: winnerGamertag,
    winner_participant_id: winnerParticipant?.id ?? null,
    map_id: mapId,
    p1_leader_id: p1LeaderId,
    p2_leader_id: p2LeaderId,
  });
};
