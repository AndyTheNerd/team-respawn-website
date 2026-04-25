import {
  Env, TournamentRow,
  jsonResponse, errorResponse,
  verifyAdminPassword, validateTournamentId,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../_shared';

// POST /api/tournaments/:id/notes
// Body: { adminPassword, notes }
// Updates the organizer notes shown on the tournament page.
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const id = params.id as string;
  if (!validateTournamentId(id)) return errorResponse('Tournament not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (notes.length > 500) return errorResponse('Notes must be 500 characters or fewer');

  const tournament = await env.DB.prepare(
    'SELECT id, admin_password_hash, expires_at FROM tournaments WHERE id = ?'
  ).bind(id).first<Pick<TournamentRow, 'id' | 'admin_password_hash' | 'expires_at'>>();

  if (!tournament) return errorResponse('Tournament not found', 404);
  if (Date.now() > tournament.expires_at) return errorResponse('This tournament has expired', 410);
  if (!tournament.admin_password_hash) {
    return errorResponse('This tournament predates password auth. Contact the organizer.', 400);
  }

  const locked = await adminPasswordCheckRateLimit(env, id, request);
  if (locked) return locked;

  if (!adminPassword) return errorResponse('Admin password is required');

  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    await adminPasswordRecordFailure(env, id, request);
    return errorResponse('Incorrect admin password', 401);
  }

  await adminPasswordRecordSuccess(env, id, request);

  const nextNotes = notes || null;

  try {
    await env.DB.prepare(
      'UPDATE tournaments SET notes = ? WHERE id = ?'
    ).bind(nextNotes, id).run();
  } catch (error: unknown) {
    const message = String((error as { message?: unknown })?.message ?? error ?? '');
    if (/no such column:\s*notes/i.test(message)) {
      return errorResponse('Tournament notes are not available until the latest D1 migration is applied.', 503);
    }
    return errorResponse('Failed to save tournament notes', 500);
  }

  return jsonResponse({ ok: true, notes: nextNotes });
};
