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
export async function verifyAdminPassword(raw: string, storedHash: string): Promise<boolean> {
  const hash = await hashSecret(raw.trim());
  return hash === storedHash;
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
