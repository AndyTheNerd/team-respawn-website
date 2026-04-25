import {
  Env, TournamentRow,
  jsonResponse, errorResponse, isExpired,
  verifyAdminPassword, validateTournamentId,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../_shared';

// ── POST /api/tournaments/:id/verify-admin ────────────────────────────────────
// Body: { adminPassword }
// Verifies the admin password without rotating any token.
// Returns { ok: true } on success so the client can cache the password in
// sessionStorage and use it for subsequent admin actions in the same session.
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

  if (!adminPassword) return errorResponse('Admin password is required', 400);

  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    await adminPasswordRecordFailure(env, id, request);
    return errorResponse('Incorrect admin password', 401);
  }

  await adminPasswordRecordSuccess(env, id, request);
  return jsonResponse({ ok: true });
};
