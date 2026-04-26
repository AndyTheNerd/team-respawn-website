import {
  Env, TournamentFormat,
  jsonResponse, errorResponse,
  generateId, hashSecret, expiresAt,
} from './_shared';

function d1ErrorMessage(e: unknown): string {
  return String((e as { message?: unknown })?.message ?? e ?? '');
}

/** Map D1 insert failures to JSON — never throw so clients avoid CF HTML 1101 pages. */
function tournamentCreateInsertErrorResponse(message: string): Response {
  if (/no such column:.*\badmin_password_hash\b/i.test(message)) {
    return errorResponse(
      'Database is missing admin password support. Apply D1 migration 0012 (npm run cf:d1:migrate:12), then retry.',
      503,
    );
  }
  if (/no such table:.*\btournaments\b/i.test(message)) {
    return errorResponse(
      'Tournament tables are missing. Apply D1 migration 0011 (npm run cf:d1:migrate:11).',
      503,
    );
  }
  console.error('[api/tournaments POST] insert failed:', message);
  return errorResponse('Could not create tournament.', 500);
}

// ── GET /api/tournaments ──────────────────────────────────────────────────────
// Returns non-expired tournaments. Optional ?status= filter.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status'); // 'registration' | 'active' | 'completed' | null
  const validStatuses = ['registration', 'active', 'completed'];

  const now = Date.now();
  const whereStatus = statusFilter && validStatuses.includes(statusFilter)
    ? `AND t.status = '${statusFilter}'`
    : '';

  const rows = await env.DB.prepare(
    `SELECT t.id, t.name, t.organizer_name, t.format, t.status,
            t.join_password_hash IS NOT NULL AS is_private,
            t.max_participants, t.created_at, t.expires_at,
            COUNT(p.id) AS participant_count
     FROM tournaments t
     LEFT JOIN tournament_participants p ON p.tournament_id = t.id
     WHERE t.expires_at > ? ${whereStatus}
     GROUP BY t.id
     ORDER BY
       CASE t.status WHEN 'active' THEN 0 WHEN 'registration' THEN 1 ELSE 2 END,
       t.created_at DESC
     LIMIT 100`
  ).bind(now).all();

  return jsonResponse({ tournaments: rows.results });
};

// ── POST /api/tournaments ─────────────────────────────────────────────────────
// Body: { name, organizerName, adminPassword, joinPassword?, format?, maxParticipants? }
// Returns: { id } — no token. Auth is password-based from here on.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return errorResponse('Database unavailable', 503);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const organizerName = typeof body.organizerName === 'string' ? body.organizerName.trim() : '';
  const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
  const joinPassword = typeof body.joinPassword === 'string' && body.joinPassword.trim()
    ? body.joinPassword.trim()
    : null;
  const format: TournamentFormat =
    body.format === 'double_elimination' ? 'double_elimination' : 'single_elimination';
  const maxParticipants = typeof body.maxParticipants === 'number'
    ? Math.min(64, Math.max(2, Math.floor(body.maxParticipants)))
    : 16;

  const rulesRaw = typeof body.rules === 'string' ? body.rules.trim() : '';
  const rules = rulesRaw.length > 0 ? rulesRaw : null;
  if (rules && rules.length > 4000) {
    return errorResponse('Rules must be 4000 characters or fewer');
  }

  let startsAt: number | null = null;
  if (body.starts_at !== undefined && body.starts_at !== null) {
    if (typeof body.starts_at !== 'number' || !Number.isFinite(body.starts_at)) {
      return errorResponse('starts_at must be a valid timestamp or omitted');
    }
    startsAt = Math.floor(body.starts_at);
  }

  if (!name) return errorResponse('Tournament name is required');
  if (name.length > 80) return errorResponse('Tournament name must be 80 characters or fewer');
  if (!organizerName) return errorResponse('Organizer name is required');
  if (organizerName.length > 50) return errorResponse('Organizer name must be 50 characters or fewer');
  if (!adminPassword || adminPassword.length < 6) {
    return errorResponse('Admin password must be at least 6 characters');
  }

  const id = generateId('trn');
  // admin_token_hash column is required by schema but no longer used for auth.
  // Populate with a random value that is never exposed.
  const legacyTokenHash = await hashSecret(crypto.randomUUID());
  const adminPasswordHash = await hashSecret(adminPassword);
  const joinPasswordHash = joinPassword ? await hashSecret(joinPassword) : null;
  const now = Date.now();
  const expires = expiresAt(now);
  if (startsAt !== null && startsAt > expires) {
    return errorResponse('Scheduled start must be on or before the tournament expiry date');
  }

  try {
    await env.DB.prepare(
      `INSERT INTO tournaments
         (id, name, organizer_name, admin_token_hash, admin_password_hash, join_password_hash,
          format, status, bracket_data, max_participants, created_at, expires_at, rules, starts_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'registration', NULL, ?, ?, ?, ?, ?)`
    ).bind(
      id, name, organizerName, legacyTokenHash, adminPasswordHash, joinPasswordHash,
      format, maxParticipants, now, expires, rules, startsAt,
    ).run();
  } catch (e: unknown) {
    const message = d1ErrorMessage(e);
    // Older DBs from 0011 + 0012 but before 0016 — no rules / starts_at columns.
    if (/no such column:.*\b(rules|starts_at)\b/i.test(message)) {
      try {
        await env.DB.prepare(
          `INSERT INTO tournaments
             (id, name, organizer_name, admin_token_hash, admin_password_hash, join_password_hash,
              format, status, bracket_data, max_participants, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'registration', NULL, ?, ?, ?)`
        ).bind(
          id, name, organizerName, legacyTokenHash, adminPasswordHash, joinPasswordHash,
          format, maxParticipants, now, expires,
        ).run();
        return jsonResponse({ id }, 201);
      } catch (e2: unknown) {
        return tournamentCreateInsertErrorResponse(d1ErrorMessage(e2));
      }
    }
    return tournamentCreateInsertErrorResponse(message);
  }

  return jsonResponse({ id }, 201);
};
