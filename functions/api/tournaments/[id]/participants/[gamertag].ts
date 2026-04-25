import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired,
  verifyAdminPassword, validateTournamentId,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../../_shared';

async function requireEditableTournament(
  env: Env,
  id: string,
  adminPassword: string,
  request: Request,
): Promise<TournamentRow | Response> {
  const tournament = await env.DB!.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(id).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (!tournament.admin_password_hash) return errorResponse('Admin password not configured', 400);

  const locked = await adminPasswordCheckRateLimit(env, id, request);
  if (locked) return locked;

  if (!adminPassword) return errorResponse('adminPassword is required', 401);

  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    await adminPasswordRecordFailure(env, id, request);
    return errorResponse('Incorrect admin password', 403);
  }

  await adminPasswordRecordSuccess(env, id, request);

  if (tournament.status !== 'registration') {
    return errorResponse('Participants can only be changed during registration');
  }

  return tournament;
}

// POST /api/tournaments/:id/participants/:gamertag
// Body: { adminPassword }
// Adds a participant as an organizer, bypassing any public join password.
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  const gamertag = decodeURIComponent(params.gamertag as string).trim();
  if (!gamertag) return errorResponse('Gamertag is required');
  if (gamertag.length > 50) return errorResponse('Gamertag too long');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  const tournamentOrResponse = await requireEditableTournament(env, id, adminPassword, request);
  if (tournamentOrResponse instanceof Response) return tournamentOrResponse;

  const existingParticipant = await env.DB.prepare(
    'SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
  ).bind(id, gamertag).first();
  if (existingParticipant) return errorResponse('This gamertag has already joined');

  try {
    const result = await env.DB.prepare(
      `INSERT INTO tournament_participants (tournament_id, gamertag, joined_at)
       SELECT ?, ?, ?
       WHERE (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = ?) < ?`
    ).bind(id, gamertag, Date.now(), id, tournamentOrResponse.max_participants).run();

    if (result.meta.changes === 0) {
      const existing = await env.DB.prepare(
        'SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
      ).bind(id, gamertag).first();
      if (existing) return errorResponse('This gamertag has already joined');
      return errorResponse('Tournament is full');
    }
  } catch (e: any) {
    if (String(e?.message).includes('UNIQUE')) {
      return errorResponse('This gamertag has already joined');
    }
    throw e;
  }

  return jsonResponse({ ok: true }, 201);
};

// DELETE /api/tournaments/:id/participants/:gamertag
// Body: { adminPassword }
// Removes a participant from a tournament in registration status only.
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
  const tournamentOrResponse = await requireEditableTournament(env, id, adminPassword, request);
  if (tournamentOrResponse instanceof Response) return tournamentOrResponse;

  const result = await env.DB.prepare(
    'DELETE FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
  ).bind(id, gamertag).run();

  if (result.meta.changes === 0) {
    return errorResponse('Participant not found', 404);
  }

  return jsonResponse({ ok: true });
};
