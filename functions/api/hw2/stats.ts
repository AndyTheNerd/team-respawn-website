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

type CachedRow = {
  payload_json: string;
  fetched_at: string;
};

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function shouldUseCache(errorType: string): boolean {
  return errorType === 'rate_limit' || errorType === 'network' || errorType === 'auth';
}

async function loadCachedStats(db: D1Database, playerId: string) {
  const row = await db.prepare(
    'SELECT payload_json, fetched_at FROM player_stats_cache WHERE player_id = ?'
  ).bind(playerId).first<CachedRow>();
  if (!row?.payload_json) return null;
  try {
    const payload = JSON.parse(row.payload_json);
    return { payload, fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

async function storeStats(db: D1Database, playerId: string, gamertag: string, payload: unknown) {
  const now = new Date().toISOString();
  const statements: unknown[] = [];

  statements.push(
    db.prepare(
      `INSERT INTO player_stats_cache (player_id, gamertag, payload_json, fetched_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(player_id) DO UPDATE SET
         gamertag = excluded.gamertag,
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at`
    ).bind(playerId, gamertag, JSON.stringify(payload), now)
  );

  statements.push(
    db.prepare(
      `INSERT INTO players (player_id, gamertag, last_seen_at)
       VALUES (?, ?, ?)
       ON CONFLICT(player_id) DO UPDATE SET
         gamertag = excluded.gamertag,
         last_seen_at = excluded.last_seen_at`
    ).bind(playerId, gamertag, now)
  );

  await db.batch(statements);
  return now;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  const url = new URL(request.url);
  const gamertag = url.searchParams.get('gamertag')?.trim() || '';
  if (!gamertag) {
    return errorResponse({ type: 'unknown', message: 'Gamertag is required.' }, 400);
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );
  const encoded = encodeURIComponent(gamertag);
  const urlStats = `${HALO_ENDPOINTS.SUMMARY_API_URL}/players/${encoded}/stats`;
  const result = await fetchWithKeyFallback<any>(urlStats, apiKeys);

  if (result.ok) {
    const fetchedAt = await storeStats(env.DB, normalizePlayerId(gamertag), gamertag, result.data);
    return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt } });
  }

  if (shouldUseCache(result.error.type)) {
    const cached = await loadCachedStats(env.DB, normalizePlayerId(gamertag));
    if (cached) {
      return jsonResponse({
        ...cached.payload,
        _meta: { cached: true, fetchedAt: cached.fetchedAt, reason: result.error.type },
      });
    }
  }

  return errorResponse(result.error, statusFromError(result.error));
};
