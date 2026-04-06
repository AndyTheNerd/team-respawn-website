import { errorResponse, fetchWithKeyFallback, HALO_ENDPOINTS, jsonResponse, statusFromError } from './_shared';

type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
  HW2_API_KEY_1?: string;
  HW2_API_KEY_2?: string;
  HW2_API_KEY_3?: string;
};

type MatchSummary = {
  MatchId?: string;
  MatchType?: number;
  GameMode?: number;
  SeasonId?: string;
  PlaylistId?: string;
  MapId?: string;
  MatchStartDate?: { ISO8601Date?: string };
  PlayerMatchDuration?: string;
  Players?: Array<{
    HumanPlayerId?: string;
    PlayerType?: number;
    TeamId?: number;
    LeaderId?: number;
    MatchOutcome?: number;
  }>;
};

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function shouldUseCache(errorType: string): boolean {
  return errorType !== 'not_found';
}

const MATCHES_API_PAGE_SIZE = 25;

type CompactMatchesCacheRow = {
  payload_json: string;
  fetched_at: string;
};

async function loadCompactCachedMatches(db: D1Database, gamertag: string, count: number) {
  try {
    const row = await db.prepare(
      'SELECT payload_json, fetched_at FROM player_matches_cache WHERE player_id = ?'
    ).bind(normalizePlayerId(gamertag)).first<CompactMatchesCacheRow>();

    if (!row?.payload_json) return null;

    const parsed = JSON.parse(row.payload_json);
    const basePayload =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    const results = Array.isArray(basePayload.Results)
      ? (basePayload.Results as MatchSummary[]).slice(0, count)
      : [];

    return {
      payload: {
        ...basePayload,
        Results: results,
        _meta: { cached: true, fetchedAt: row.fetched_at },
      },
      fetchedAt: row.fetched_at,
    };
  } catch {
    return null;
  }
}

async function loadCachedMatches(db: D1Database, gamertag: string, count: number) {
  return loadCompactCachedMatches(db, gamertag, count);
}

async function fetchMatchesBatched(gamertag: string, count: number, apiKeys: string[]) {
  const encoded = encodeURIComponent(gamertag);
  const collected: MatchSummary[] = [];
  let start = 0;

  while (collected.length < count) {
    const remaining = count - collected.length;
    const batchCount = Math.min(remaining, MATCHES_API_PAGE_SIZE);
    const url = `${HALO_ENDPOINTS.HALO_API_URL}/players/${encoded}/matches?start=${start}&count=${batchCount}`;
    const batchResult = await fetchWithKeyFallback<{ Results: MatchSummary[] }>(url, apiKeys);

    if (!batchResult.ok) {
      if (collected.length > 0) break;
      return batchResult;
    }

    const batchMatches = Array.isArray(batchResult.data?.Results) ? batchResult.data.Results : [];
    if (batchMatches.length === 0) break;

    collected.push(...batchMatches);
    if (batchMatches.length < batchCount) break;
    start += batchMatches.length;
  }

  return { ok: true as const, data: { Results: collected.slice(0, count) } };
}

async function storeMatchSummaries(db: Env['DB'], gamertag: string, matches: MatchSummary[]) {
  if (!db || matches.length === 0) return;
  const now = new Date().toISOString();
  const playerId = normalizePlayerId(gamertag);

  try {
    await db.batch([
      db.prepare(
        `INSERT INTO player_matches_cache (player_id, gamertag, payload_json, fetched_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           payload_json = excluded.payload_json,
           fetched_at = excluded.fetched_at`
      ).bind(playerId, gamertag, JSON.stringify({ Results: matches }), now),
      db.prepare(
        `INSERT INTO players (player_id, gamertag, last_seen_at)
         VALUES (?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           last_seen_at = excluded.last_seen_at`
      ).bind(playerId, gamertag, now),
      db.prepare(
        `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), playerId, now, matches.length),
    ]);
  } catch (cacheErr) {
    console.error('[matches] player_matches_cache write failed; D1 will be stale:', cacheErr);
    await db.batch([
      db.prepare(
        `INSERT INTO players (player_id, gamertag, last_seen_at)
         VALUES (?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           last_seen_at = excluded.last_seen_at`
      ).bind(playerId, gamertag, now),
      db.prepare(
        `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), playerId, now, matches.length),
    ]);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  let payload: { gamertag?: string; count?: number; cacheOnly?: boolean } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const gamertag = payload?.gamertag?.trim() || '';
  const count = Math.min(Math.max(Number(payload?.count ?? 10), 1), 100);
  if (!gamertag) {
    return errorResponse({ type: 'unknown', message: 'Gamertag is required.' }, 400);
  }

  const cacheOnly = payload?.cacheOnly === true;
  if (cacheOnly) {
    const cached = await loadCachedMatches(env.DB, gamertag, count);
    if (cached?.payload) {
      const fetchedAt = (cached.payload as any)?._meta?.fetchedAt || cached.fetchedAt;
      const cacheAgeSeconds = fetchedAt
        ? Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000)
        : undefined;
      return jsonResponse({
        ...(cached.payload as Record<string, unknown>),
        _meta: { ...(cached.payload as any)?._meta, cacheAgeSeconds, reason: 'cache_only' },
      });
    }
    return errorResponse({ type: 'not_found', message: 'No cached data available.' }, 404);
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );
  const result = await fetchMatchesBatched(gamertag, count, apiKeys);
  if (!result.ok) {
    if (shouldUseCache(result.error.type)) {
      const cached = await loadCachedMatches(env.DB, gamertag, count);
      if (cached?.payload) {
        const fetchedAt = (cached.payload as any)?._meta?.fetchedAt || cached.fetchedAt;
        const cacheAgeSeconds = fetchedAt
          ? Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000)
          : undefined;
        return jsonResponse({
          ...(cached.payload as Record<string, unknown>),
          _meta: { ...(cached.payload as any)?._meta, cacheAgeSeconds, reason: result.error.type },
        });
      }
    }
    return errorResponse(result.error, statusFromError(result.error));
  }

  const matches = Array.isArray(result.data?.Results) ? result.data.Results : [];
  await storeMatchSummaries(env.DB, gamertag, matches);

  return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
};
