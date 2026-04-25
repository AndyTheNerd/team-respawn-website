import { BracketsManager } from 'brackets-manager';
import { InMemoryDatabase } from '../../../_storage';
import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired,
  verifyAdminPassword, parseBracketData, validateTournamentId,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../../../_shared';

// POST /api/tournaments/:id/matches/:matchId/reset
// Body: { adminPassword }
// Reopens a completed match and also clears any downstream completed matches that
// depended on its result so the organizer can correct the bracket safely.
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
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

  if (tournament.status !== 'active' && tournament.status !== 'completed') {
    return errorResponse('Tournament has not started yet');
  }

  const bracketContent = parseBracketData(tournament.bracket_data);
  if (!bracketContent) return errorResponse('Bracket data is missing or corrupted', 500);

  const bracketMatches: any[] = (bracketContent.match as any[]) ?? [];
  const bracketMatch = bracketMatches.find((m: any) => m.id === bracketsMatchId);
  if (!bracketMatch) return errorResponse('Match not found in bracket');
  if (!hasRecordedResult(bracketMatch)) {
    return errorResponse('This match is not completed');
  }

  const db = new InMemoryDatabase(bracketContent as any);
  const manager = new BracketsManager(db);

  try {
    const dependentMatchIds = await collectCompletedDescendantMatchIds(manager, bracketsMatchId);
    const reopenedMatchIds = [...dependentMatchIds, bracketsMatchId];
    for (const matchId of reopenedMatchIds) {
      await manager.reset.matchResults(matchId);
    }
    const updatedBracketData = JSON.stringify(db.content);
    const completedMatchIds = new Set(
      ((db.content.match as any[]) ?? []).filter(hasRecordedResult).map((match: any) => match.id)
    );
    const newStatus = completedMatchIds.size > 0 && isTournamentComplete(db.content) ? 'completed' : 'active';

    await env.DB.prepare(
      'UPDATE tournament_matches SET status = ? WHERE tournament_id = ?'
    ).bind('pending', tournamentId).run();

    await Promise.all([
      ...Array.from(completedMatchIds).map((matchId) =>
        env.DB!.prepare(
          'UPDATE tournament_matches SET status = ? WHERE tournament_id = ? AND brackets_match_id = ?'
        ).bind('completed', tournamentId, matchId).run()
      ),
      env.DB.prepare(
        'UPDATE tournaments SET bracket_data = ?, status = ? WHERE id = ?'
      ).bind(updatedBracketData, newStatus, tournamentId).run(),
    ]);

    return jsonResponse({
      ok: true,
      reset_match_id: bracketsMatchId,
      reopened_match_ids: reopenedMatchIds,
      tournament_status: newStatus,
      bracket_data: db.content,
    });
  } catch (e: any) {
    return errorResponse(`Could not reopen match: ${e?.message ?? 'unknown error'}`, 409);
  }
};

function hasRecordedResult(match: any): boolean {
  return match?.opponent1?.result != null || match?.opponent2?.result != null;
}

async function collectCompletedDescendantMatchIds(
  manager: BracketsManager,
  matchId: number,
  visited = new Set<number>(),
): Promise<number[]> {
  const nextMatches = await manager.find.nextMatches(matchId);
  const ids: number[] = [];

  for (const nextMatch of nextMatches) {
    if (!nextMatch || visited.has(nextMatch.id)) continue;
    visited.add(nextMatch.id);
    ids.push(...await collectCompletedDescendantMatchIds(manager, nextMatch.id, visited));
    if (hasRecordedResult(nextMatch)) ids.push(nextMatch.id);
  }

  return ids;
}

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
