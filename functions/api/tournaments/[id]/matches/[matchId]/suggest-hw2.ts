import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired, parseBracketData, validateTournamentId,
} from '../../../_shared';

// ── GET /api/tournaments/:id/matches/:matchId/suggest-hw2 ─────────────────────
// Returns up to 5 recent cached HW2 1v1 matches between the two bracket participants.
// Requires both players to have had their stats loaded at least once (so their matches
// are cached in the match_players table). Read-only — does not write any result.
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const tournamentId = params.id as string;
  if (!validateTournamentId(tournamentId)) return errorResponse('Tournament not found', 404);

  const bracketsMatchId = Number(params.matchId);
  if (!Number.isFinite(bracketsMatchId)) return errorResponse('Invalid match ID');

  const tournament = await env.DB.prepare(
    'SELECT id, status, bracket_data, expires_at FROM tournaments WHERE id = ?'
  ).bind(tournamentId).first<Pick<TournamentRow, 'id' | 'status' | 'bracket_data' | 'expires_at'>>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament as TournamentRow)) return errorResponse('This tournament has expired', 410);
  if (tournament.status !== 'active') return errorResponse('Tournament is not active');

  const bracketContent = parseBracketData(tournament.bracket_data);
  if (!bracketContent) return errorResponse('Bracket data is missing or corrupted', 500);

  // Resolve the two gamertags for this bracket match
  const bracketMatches: any[] = (bracketContent.match as any[]) ?? [];
  const bracketParticipants: any[] = (bracketContent.participant as any[]) ?? [];
  const bracketMatch = bracketMatches.find((m: any) => m.id === bracketsMatchId);
  if (!bracketMatch) return errorResponse('Match not found in bracket');

  const p1 = bracketParticipants.find((p: any) => p.id === bracketMatch.opponent1?.id);
  const p2 = bracketParticipants.find((p: any) => p.id === bracketMatch.opponent2?.id);

  if (!p1 || !p2) {
    return errorResponse('This bracket match does not have two participants yet');
  }

  const p1Gamertag: string = p1.name ?? '';
  const p2Gamertag: string = p2.name ?? '';

  // Query the HW2 match cache for recent 1v1 matches where both players appear.
  // match_players.player_name holds the gamertag; is_human = 1 excludes AI slots.
  const rows = await env.DB.prepare(
    `SELECT
       m.match_id,
       m.map_id,
       m.started_at,
       mp1.leader_id  AS p1_leader_id,
       mp2.leader_id  AS p2_leader_id,
       mp1.outcome    AS p1_outcome
     FROM matches m
     JOIN match_players mp1
       ON mp1.match_id = m.match_id
      AND LOWER(mp1.player_name) = LOWER(?)
      AND mp1.is_human = 1
     JOIN match_players mp2
       ON mp2.match_id = m.match_id
      AND LOWER(mp2.player_name) = LOWER(?)
      AND mp2.is_human = 1
     WHERE m.team_size = 1
     ORDER BY m.started_at DESC
     LIMIT 5`
  ).bind(p1Gamertag, p2Gamertag).all<{
    match_id: string;
    map_id: string | null;
    started_at: string;
    p1_leader_id: number | null;
    p2_leader_id: number | null;
    p1_outcome: number | null;
  }>();

  const suggestions = rows.results.map(r => {
    // Outcome: 1 = win, 2 = loss (HW2 convention)
    const p1Won = r.p1_outcome === 1;
    return {
      hw2_match_id: r.match_id,
      map_id: r.map_id,
      started_at: r.started_at,
      p1_leader_id: r.p1_leader_id,
      p2_leader_id: r.p2_leader_id,
      inferred_winner: p1Won ? p1Gamertag : p2Gamertag,
    };
  });

  return jsonResponse({
    p1_gamertag: p1Gamertag,
    p2_gamertag: p2Gamertag,
    suggestions,
  });
};
