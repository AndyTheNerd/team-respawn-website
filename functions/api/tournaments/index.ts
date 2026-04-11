import {
  Env, TournamentFormat,
  jsonResponse, errorResponse,
  generateId, hashSecret, expiresAt,
} from './_shared';

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

  await env.DB.prepare(
    `INSERT INTO tournaments
       (id, name, organizer_name, admin_token_hash, admin_password_hash, join_password_hash,
        format, status, bracket_data, max_participants, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'registration', NULL, ?, ?, ?)`
  ).bind(
    id, name, organizerName, legacyTokenHash, adminPasswordHash, joinPasswordHash,
    format, maxParticipants, now, expiresAt(now)
  ).run();

  return jsonResponse({ id }, 201);
};
