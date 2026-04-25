import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired, validateTournamentId, verifySha256SecretConstantTime,
} from '../_shared';

// ── POST /api/tournaments/:id/join ────────────────────────────────────────────
// Body: { gamertag, joinPassword? }
// Adds a participant using an atomic conditional INSERT to prevent over-capacity
// in concurrent join scenarios.
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const gamertag = typeof body.gamertag === 'string' ? body.gamertag.trim() : '';
  const joinPassword = typeof body.joinPassword === 'string' ? body.joinPassword : null;

  if (!gamertag) return errorResponse('Gamertag is required');
  if (gamertag.length > 50) return errorResponse('Gamertag too long');

  const tournament = await env.DB.prepare(
    'SELECT * FROM tournaments WHERE id = ?'
  ).bind(id).first<TournamentRow>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (isExpired(tournament)) return errorResponse('This tournament has expired', 410);
  if (tournament.status !== 'registration') {
    return errorResponse('Registration for this tournament is closed');
  }

  // Verify join password for private tournaments
  if (tournament.join_password_hash) {
    if (!joinPassword) return errorResponse('A join password is required for this tournament', 403);
    if (!(await verifySha256SecretConstantTime(joinPassword, tournament.join_password_hash))) {
      return errorResponse('Incorrect join password', 403);
    }
  }

  const existingParticipant = await env.DB.prepare(
    'SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND LOWER(gamertag) = LOWER(?)'
  ).bind(id, gamertag).first();
  if (existingParticipant) {
    return errorResponse('This gamertag has already joined');
  }

  // Atomic conditional INSERT: only inserts if the current count is below max_participants.
  // This eliminates the race condition between the count check and the insert.
  try {
    const result = await env.DB.prepare(
      `INSERT INTO tournament_participants (tournament_id, gamertag, joined_at)
       SELECT ?, ?, ?
       WHERE (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = ?) < ?`
    ).bind(id, gamertag, Date.now(), id, tournament.max_participants).run();

    if (result.meta.changes === 0) {
      // Could be full OR the gamertag was already added by a concurrent request —
      // check which case this is.
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

  return jsonResponse({ ok: true });
};
