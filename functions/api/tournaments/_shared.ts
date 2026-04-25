export type TournamentFormat = 'single_elimination' | 'double_elimination';
export type TournamentStatus = 'registration' | 'active' | 'completed';
export type MatchStatus = 'pending' | 'completed';

export interface TournamentRow {
  id: string;
  name: string;
  organizer_name: string;
  /** Legacy field — kept in schema but no longer exposed to clients. */
  admin_token_hash: string;
  admin_password_hash: string | null;
  join_password_hash: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  bracket_data: string | null;
  notes: string | null;
  /** Optional public rules (format, bans, etc.). */
  rules: string | null;
  /** Optional scheduled start instant (Unix ms). */
  starts_at: number | null;
  max_participants: number;
  seeding: string;
  created_at: number;
  expires_at: number;
}

export interface ParticipantRow {
  id: number;
  tournament_id: string;
  gamertag: string;
  joined_at: number;
}

export interface TournamentMatchRow {
  id: number;
  tournament_id: string;
  brackets_match_id: number;
  round: number;
  map_id: string | null;
  p1_leader_id: number | null;
  p2_leader_id: number | null;
  hw2_match_id: string | null;
  override_by_organizer: number;
  status: MatchStatus;
}

export type Env = {
  DB?: D1Database;
  /**
   * Secret pepper for tournament admin rate-limit buckets. When set, D1 stores only
   * SHA-256(pepper + tournamentId + clientIp) — never raw IPs. When unset, rate limiting is disabled.
   */
  TOURNAMENT_RATE_LIMIT_PEPPER?: string;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Valid tournament ID pattern — guards against arbitrary strings in D1 queries. */
const TOURNAMENT_ID_RE = /^trn_[0-9a-f]{12}$/;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/** Validate that `id` looks like a tournament ID before hitting D1. */
export function validateTournamentId(id: string): boolean {
  return TOURNAMENT_ID_RE.test(id);
}

/** Generate a cryptographically random short ID, e.g. "trn_a8f3kx2ab1cd". */
export function generateId(prefix = 'trn'): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

/** SHA-256 hash a plain-text secret using the Web Crypto API. */
export async function hashSecret(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const SHA256_HEX_LEN = 64;
const SHA256_BYTE_LEN = 32;

function hexNibble(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30;
  if (code >= 0x41 && code <= 0x46) return code - 0x41 + 10;
  if (code >= 0x61 && code <= 0x66) return code - 0x61 + 10;
  return -1;
}

/** Decode exactly 64 hex chars to 32 bytes. Returns null if malformed. */
function sha256HexToBytes(hex: string): Uint8Array | null {
  if (typeof hex !== 'string' || hex.length !== SHA256_HEX_LEN) return null;
  const out = new Uint8Array(SHA256_BYTE_LEN);
  for (let i = 0; i < SHA256_BYTE_LEN; i++) {
    const hi = hexNibble(hex.charCodeAt(i * 2));
    const lo = hexNibble(hex.charCodeAt(i * 2 + 1));
    if (hi < 0 || lo < 0) return null;
    out[i] = (hi << 4) | lo;
  }
  return out;
}

/**
 * Compare a plain secret to a stored SHA-256 hex digest using constant-time equality
 * on the raw digest bytes (via SubtleCrypto.timingSafeEqual).
 */
export async function verifySha256SecretConstantTime(
  plain: string,
  storedHashHex: string | null | undefined,
): Promise<boolean> {
  if (storedHashHex == null || storedHashHex === '') return false;
  const stored = sha256HexToBytes(storedHashHex);
  if (!stored) return false;

  const encoded = new TextEncoder().encode(plain.trim());
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const computed = new Uint8Array(digest);

  // Workers expose timingSafeEqual; DOM lib types may lag behind.
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: BufferSource, b: BufferSource): boolean;
  };
  return subtle.timingSafeEqual(computed as BufferSource, stored as BufferSource);
}

export function expiresAt(createdAt: number): number {
  return createdAt + THIRTY_DAYS_MS;
}

export function isExpired(tournament: TournamentRow): boolean {
  return Date.now() > tournament.expires_at;
}

/**
 * Verify the raw admin password against the stored SHA-256 hash.
 * Passwords are always trimmed before hashing for consistency.
 */
export async function verifyAdminPassword(
  raw: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  return verifySha256SecretConstantTime(raw, storedHash);
}

/** Max wrong admin password attempts per tournament + client before lockout. */
const ADMIN_PW_MAX_ATTEMPTS = 5;
/** Lockout duration after hitting the max (Unix ms delta). */
const ADMIN_PW_LOCKOUT_MS = 24 * 60 * 60 * 1000;

function rawClientIpForRateLimit(request: Request): string {
  const cf = request.headers.get('CF-Connecting-IP');
  if (cf?.trim()) return cf.trim().slice(0, 256);
  const trueClient = request.headers.get('True-Client-IP');
  if (trueClient?.trim()) return trueClient.trim().slice(0, 256);
  const xff = request.headers.get('X-Forwarded-For');
  const first = xff?.split(',')[0]?.trim();
  if (first) return first.slice(0, 256);
  return 'unknown';
}

/**
 * Opaque bucket for D1 (never store raw IP). Requires `TOURNAMENT_RATE_LIMIT_PEPPER` on env.
 */
async function adminPasswordRateLimitBucketKey(
  env: Env,
  tournamentId: string,
  request: Request,
): Promise<string | null> {
  const pepper = typeof env.TOURNAMENT_RATE_LIMIT_PEPPER === 'string' ? env.TOURNAMENT_RATE_LIMIT_PEPPER.trim() : '';
  if (!pepper) return null;
  const raw = rawClientIpForRateLimit(request);
  return hashSecret(`${pepper}\n${tournamentId}\n${raw}`);
}

/**
 * Returns a 429 JSON response if this client is locked out for this tournament; otherwise null.
 * Clears the rate-limit row when a previous lockout has expired.
 */
export async function adminPasswordCheckRateLimit(
  env: Env,
  tournamentId: string,
  request: Request,
): Promise<Response | null> {
  if (!env.DB) return null;
  const bucket = await adminPasswordRateLimitBucketKey(env, tournamentId, request);
  if (!bucket) return null;
  const now = Date.now();
  try {
    const row = await env.DB.prepare(
      `SELECT failed_attempts, locked_until FROM tournament_admin_rate_limits
       WHERE tournament_id = ? AND client_key = ?`
    ).bind(tournamentId, bucket).first<{ failed_attempts: number; locked_until: number }>();

    if (!row) return null;

    if (row.locked_until > now) {
      return errorResponse(
        'Too many incorrect admin password attempts for this tournament. Try again in 24 hours.',
        429,
      );
    }

    if (row.locked_until > 0 && row.locked_until <= now) {
      await env.DB.prepare(
        `DELETE FROM tournament_admin_rate_limits WHERE tournament_id = ? AND client_key = ?`
      ).bind(tournamentId, bucket).run();
    }
    return null;
  } catch (e: unknown) {
    const msg = String((e as { message?: unknown })?.message ?? e ?? '');
    if (/no such table/i.test(msg)) return null;
    throw e;
  }
}

/** Call after a successful admin password verification. */
export async function adminPasswordRecordSuccess(
  env: Env,
  tournamentId: string,
  request: Request,
): Promise<void> {
  if (!env.DB) return;
  const bucket = await adminPasswordRateLimitBucketKey(env, tournamentId, request);
  if (!bucket) return;
  try {
    await env.DB.prepare(
      `DELETE FROM tournament_admin_rate_limits WHERE tournament_id = ? AND client_key = ?`
    ).bind(tournamentId, bucket).run();
  } catch (e: unknown) {
    const msg = String((e as { message?: unknown })?.message ?? e ?? '');
    if (/no such table/i.test(msg)) return;
    throw e;
  }
}

/** Call after a failed admin password verification (increments counter; locks at max attempts). */
export async function adminPasswordRecordFailure(
  env: Env,
  tournamentId: string,
  request: Request,
): Promise<void> {
  if (!env.DB) return;
  const bucket = await adminPasswordRateLimitBucketKey(env, tournamentId, request);
  if (!bucket) return;
  const now = Date.now();
  const lockUntil = now + ADMIN_PW_LOCKOUT_MS;
  try {
    await env.DB.prepare(
      `INSERT INTO tournament_admin_rate_limits (tournament_id, client_key, failed_attempts, locked_until, updated_at)
       VALUES (?, ?, 1, 0, ?)
       ON CONFLICT(tournament_id, client_key) DO UPDATE SET
         failed_attempts = tournament_admin_rate_limits.failed_attempts + 1,
         locked_until = CASE
           WHEN tournament_admin_rate_limits.failed_attempts + 1 >= ?
           THEN ?
           ELSE tournament_admin_rate_limits.locked_until
         END,
         updated_at = excluded.updated_at`
    ).bind(tournamentId, bucket, now, ADMIN_PW_MAX_ATTEMPTS, lockUntil).run();
  } catch (e: unknown) {
    const msg = String((e as { message?: unknown })?.message ?? e ?? '');
    if (/no such table/i.test(msg)) return;
    throw e;
  }
}

/**
 * Safely parse bracket_data JSON. Returns null if the string is absent or malformed.
 */
export function parseBracketData(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** HW2 `MatchOutcome` / D1 `outcome`: 1 = win, 2 = loss. */
export function normalizeHw2MatchOutcome(outcome: unknown): 'win' | 'loss' | null {
  if (outcome === 1 || outcome === '1') return 'win';
  if (outcome === 2 || outcome === '2') return 'loss';
  if (typeof outcome === 'string') {
    const normalized = outcome.trim().toLowerCase();
    if (normalized === 'win' || normalized === 'won') return 'win';
    if (normalized === 'loss' || normalized === 'lose' || normalized === 'lost') return 'loss';
  }
  return null;
}

/**
 * Infer which bracket-side gamertag won a 1v1 from both human players' outcomes.
 * Returns null when ambiguous (missing data, draw-like symmetry, contradictory values).
 */
export function inferBracket1v1WinnerGamertag(
  p1Outcome: unknown,
  p2Outcome: unknown,
  p1Gamertag: string,
  p2Gamertag: string,
): string | null {
  const n1 = normalizeHw2MatchOutcome(p1Outcome);
  const n2 = normalizeHw2MatchOutcome(p2Outcome);
  if (n1 === 'win' && n2 !== 'win') return p1Gamertag;
  if (n2 === 'win' && n1 !== 'win') return p2Gamertag;
  if (n1 === 'loss' && n2 !== 'loss') return p2Gamertag;
  if (n2 === 'loss' && n1 !== 'loss') return p1Gamertag;
  return null;
}
