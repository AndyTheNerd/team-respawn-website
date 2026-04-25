import { BracketsManager } from 'brackets-manager';
import { InMemoryDatabase } from '../../../_storage';
import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired, parseBracketData, validateTournamentId,
  verifyAdminPassword,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../../../_shared';

// ── PATCH /api/tournaments/:id/matches/:matchId ───────────────────────────────
// Body: { adminPassword, winnerId, mapId?, p1LeaderId?, p2LeaderId?, hw2MatchId? }
// Records a match result (organizer only — same secret as override / start).
export const onRequestPatch: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const tournamentId = params.id as string;
  if (!validateTournamentId(tournamentId)) return errorResponse('Tournament not found', 404);

  const bracketsMatchId = Number(params.matchId);
  if (!Number.isFinite(bracketsMatchId)) return errorResponse('Invalid match ID');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  const winnerId = typeof body.winnerId === 'number' ? body.winnerId : null;
  const mapId = typeof body.mapId === 'string' ? body.mapId : null;
  const p1LeaderId = typeof body.p1LeaderId === 'number' ? body.p1LeaderId : null;
  const p2LeaderId = typeof body.p2LeaderId === 'number' ? body.p2LeaderId : null;
  const hw2MatchId = typeof body.hw2MatchId === 'string' ? body.hw2MatchId.trim() : null;

  if (winnerId === null) return errorResponse('winnerId is required');

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(tournamentId).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (!tournament.admin_password_hash) return errorResponse('Admin password not configured', 400);

  const locked = await adminPasswordCheckRateLimit(env, tournamentId, request);
  if (locked) return locked;

  if (!adminPassword) return errorResponse('adminPassword is required', 401);

  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    await adminPasswordRecordFailure(env, tournamentId, request);
    return errorResponse('Incorrect admin password', 403);
  }

  await adminPasswordRecordSuccess(env, tournamentId, request);

  if (tournament.status !== 'active') return errorResponse('Tournament is not active');

  const bracketContent = parseBracketData(tournament.bracket_data);
  if (!bracketContent) return errorResponse('Bracket data is missing or corrupted', 500);

  // Verify winner is a participant
  const winner = await env.DB.prepare(
    'SELECT gamertag FROM tournament_participants WHERE tournament_id = ? AND id = ?'
  ).bind(tournamentId, winnerId).first<{ gamertag: string }>();
  if (!winner) return errorResponse('Winner is not a participant in this tournament');

  // Resolve the two participants for this bracket match
  const bracketMatches: any[] = (bracketContent.match as any[]) ?? [];
  const bracketParticipants: any[] = (bracketContent.participant as any[]) ?? [];
  const bracketMatch = bracketMatches.find((m: any) => m.id === bracketsMatchId);
  if (!bracketMatch) return errorResponse('Match not found in bracket');

  const p1BracketPart = bracketParticipants.find((p: any) => p.id === bracketMatch.opponent1?.id);
  const p2BracketPart = bracketParticipants.find((p: any) => p.id === bracketMatch.opponent2?.id);

  if (!p1BracketPart || !p2BracketPart) {
    return errorResponse('This bracket match does not have two participants yet');
  }

  const winnerGamertag = winner.gamertag;
  const bWinner = bracketParticipants.find(
    (p: any) => p.name?.toLowerCase() === winnerGamertag.toLowerCase()
  );
  if (!bWinner) return errorResponse('Winner not found in bracket seeding');
  if (bWinner.id !== bracketMatch.opponent1?.id && bWinner.id !== bracketMatch.opponent2?.id) {
    return errorResponse('Winner must be one of the players in this match');
  }

  const db = new InMemoryDatabase(bracketContent as any);
  const manager = new BracketsManager(db);

  try {
    await manager.update.match({
      id: bracketsMatchId,
      ...(bracketMatch.opponent1?.id === bWinner.id
        ? { opponent1: { result: 'win' }, opponent2: { result: 'loss' } }
        : { opponent1: { result: 'loss' }, opponent2: { result: 'win' } }),
    });
  } catch (e: any) {
    return errorResponse(`Bracket update failed: ${e?.message ?? 'unknown error'}`, 500);
  }

  const updatedBracketData = JSON.stringify(db.content);
  const newStatus = isTournamentComplete(db.content) ? 'completed' : 'active';

  // Determine round from bracket data
  const updatedMatch = (db.content.match as any[]).find((m: any) => m.id === bracketsMatchId);
  const roundNumber: number = updatedMatch?.round_id ?? 0;

  await Promise.all([
    env.DB.prepare(
      `INSERT INTO tournament_matches
         (tournament_id, brackets_match_id, round, map_id, p1_leader_id, p2_leader_id, hw2_match_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
       ON CONFLICT(tournament_id, brackets_match_id) DO UPDATE SET
         round = excluded.round,
         map_id = excluded.map_id,
         p1_leader_id = excluded.p1_leader_id,
         p2_leader_id = excluded.p2_leader_id,
         hw2_match_id = COALESCE(excluded.hw2_match_id, tournament_matches.hw2_match_id),
         status = 'completed'`
    ).bind(tournamentId, bracketsMatchId, roundNumber, mapId, p1LeaderId, p2LeaderId, hw2MatchId).run(),
    env.DB.prepare(
      'UPDATE tournaments SET bracket_data = ?, status = ? WHERE id = ?'
    ).bind(updatedBracketData, newStatus, tournamentId).run(),
  ]);

  return jsonResponse({ ok: true, tournament_status: newStatus, bracket_data: db.content });
};

/**
 * A tournament is complete when brackets-manager has no more matches where
 * both opponents are seated and neither has a result yet.
 */
function isTournamentComplete(content: any): boolean {
  const matches: any[] = content.match ?? [];
  return !matches.some(
    (m: any) =>
      m.opponent1?.id != null &&
      m.opponent2?.id != null &&
      m.opponent1?.result == null &&
      m.opponent2?.result == null
  );
}
