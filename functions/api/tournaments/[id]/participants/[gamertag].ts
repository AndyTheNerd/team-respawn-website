import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired,
  verifyAdminPassword, validateTournamentId,
} from '../../_shared';

// ── DELETE /api/tournaments/:id/participants/:gamertag ────────────────────────
// Body: { adminPassword }
// Removes a participant from a tournament in 'registration' status only.
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  const gamertag = decodeURIComponent(params.gamertag as string).trim();
  if (!gamertag) return errorResponse('Gamertag is required');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  if (!adminPassword) return errorResponse('adminPassword is required', 401);

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(id).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (!tournament.admin_password_hash) return errorResponse('Admin password not configured', 400);
  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    return errorResponse('Incorrect admin password', 403);
  }
  if (tournament.status !== 'registration') {
    return errorResponse('Participants can only be removed during registration');
  }

  const result = await env.DB.prepare(
    'DELETE FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
  ).bind(id, gamertag).run();

  if (result.meta.changes === 0) {
    return errorResponse('Participant not found', 404);
  }

  return jsonResponse({ ok: true });
};
