import {
  Env, TournamentRow,
  jsonResponse, errorResponse,
  verifyAdminPassword, validateTournamentId,
  adminPasswordCheckRateLimit,
  adminPasswordRecordFailure,
  adminPasswordRecordSuccess,
} from '../_shared';

const RULES_MAX = 4000;

// POST /api/tournaments/:id/sidebar
// Body: { adminPassword, rules: string, starts_at: number | null }
// Updates optional public "rules" text and scheduled start time (Unix ms, or null to clear).
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
  const rulesTrimmed = typeof body.rules === 'string' ? body.rules.trim() : '';
  const nextRules = rulesTrimmed.length > 0 ? rulesTrimmed : null;
  if (nextRules && nextRules.length > RULES_MAX) {
    return errorResponse(`Rules must be ${RULES_MAX} characters or fewer`);
  }

  let nextStartsAt: number | null = null;
  if (body.starts_at === null) {
    nextStartsAt = null;
  } else if (typeof body.starts_at === 'number' && Number.isFinite(body.starts_at)) {
    nextStartsAt = Math.floor(body.starts_at);
  } else {
    return errorResponse('starts_at must be a number (Unix ms) or null to clear');
  }

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

  if (!adminPassword) return errorResponse('Admin password is required', 401);

  if (!(await verifyAdminPassword(adminPassword, tournament.admin_password_hash))) {
    await adminPasswordRecordFailure(env, id, request);
    return errorResponse('Incorrect admin password', 403);
  }

  await adminPasswordRecordSuccess(env, id, request);

  if (nextStartsAt !== null && nextStartsAt > tournament.expires_at) {
    return errorResponse('Scheduled start must be on or before the tournament expiry date');
  }

  try {
    await env.DB.prepare(
      'UPDATE tournaments SET rules = ?, starts_at = ? WHERE id = ?'
    ).bind(nextRules, nextStartsAt, id).run();
  } catch (error: unknown) {
    const message = String((error as { message?: unknown })?.message ?? error ?? '');
    if (/no such column:\s*(rules|starts_at)/i.test(message)) {
      return errorResponse(
        'Rules and scheduled start require D1 migration 0016 (tournament_rules_starts).',
        503,
      );
    }
    return errorResponse('Failed to save tournament details', 500);
  }

  return jsonResponse({ ok: true, rules: nextRules, starts_at: nextStartsAt });
};
