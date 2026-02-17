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

const CACHE_KEY = 'campaign_levels';

function shouldUseCache(errorType: string): boolean {
  return errorType === 'rate_limit' || errorType === 'network' || errorType === 'auth';
}

async function loadCached(db: D1Database) {
  const row = await db.prepare(
    'SELECT payload_json, fetched_at FROM campaign_levels_cache WHERE cache_key = ?'
  ).bind(CACHE_KEY).first<CachedRow>();
  if (!row?.payload_json) return null;
  try {
    const payload = JSON.parse(row.payload_json);
    return { payload, fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

async function storeLevels(db: D1Database, payload: unknown) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(
      `INSERT INTO campaign_levels_cache (cache_key, payload_json, fetched_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at`
    ).bind(CACHE_KEY, JSON.stringify(payload), now),
  ]);
  return now;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );
  const apiUrl = `${HALO_ENDPOINTS.METADATA_API_URL}/campaign-levels`;
  const result = await fetchWithKeyFallback<any>(apiUrl, apiKeys, { 'Accept-Language': 'en-US' });

  if (result.ok) {
    const fetchedAt = await storeLevels(env.DB, result.data);
    return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt } });
  }

  if (shouldUseCache(result.error.type)) {
    const cached = await loadCached(env.DB);
    if (cached) {
      return jsonResponse({
        ...cached.payload,
        _meta: { cached: true, fetchedAt: cached.fetchedAt, reason: result.error.type },
      });
    }
  }

  return errorResponse(result.error, statusFromError(result.error));
};
