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

const CACHE_KEY = 'leader_powers';

function shouldUseCache(errorType: string): boolean {
  return errorType === 'rate_limit' || errorType === 'network' || errorType === 'auth';
}

async function loadCached(db: D1Database) {
  const row = await db.prepare(
    'SELECT payload_json, fetched_at FROM metadata_cache WHERE cache_key = ?'
  ).bind(CACHE_KEY).first<CachedRow>();
  if (!row?.payload_json) return null;
  try {
    const payload = JSON.parse(row.payload_json);
    return { payload, fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

async function storeMetadata(db: D1Database, payload: unknown) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(
      `INSERT INTO metadata_cache (cache_key, payload_json, fetched_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at`
    ).bind(CACHE_KEY, JSON.stringify(payload), now),
  ]);
  return now;
}

async function fetchAllPages(apiKeys: string[]) {
  const map: Record<string, string> = {};
  let startAt = 0;
  let totalCount = Infinity;

  while (startAt < totalCount) {
    const pageResult = await fetchWithKeyFallback<any>(
      `${HALO_ENDPOINTS.METADATA_API_URL}/leader-powers?startAt=${startAt}`,
      apiKeys,
      { 'Accept-Language': 'en-US' }
    );
    if (!pageResult.ok) return pageResult;

    const data = pageResult.data;
    const items = Array.isArray(data?.ContentItems) ? data.ContentItems : [];
    items.forEach((item: any) => {
      const objId = item?.View?.HW2LeaderPower?.ObjectTypeId;
      const name =
        item?.View?.HW2LeaderPower?.DisplayInfo?.View?.HW2LeaderPowerDisplayInfo?.Name
        || item?.View?.HW2LeaderPower?.DisplayInfo?.View?.Title
        || item?.View?.Title;
      if (objId && name) {
        map[String(objId)] = String(name);
      }
    });

    const paging = data?.Paging || {};
    const inlineCount = typeof paging.InlineCount === 'number' ? paging.InlineCount : items.length;
    totalCount = typeof paging.TotalCount === 'number' ? paging.TotalCount : startAt + inlineCount;
    startAt = (typeof paging.StartAt === 'number' ? paging.StartAt : startAt) + inlineCount;

    if (inlineCount === 0) break;
  }

  return { ok: true as const, data: map };
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
  const result = await fetchAllPages(apiKeys);

  if (result.ok) {
    const fetchedAt = await storeMetadata(env.DB, result.data);
    return jsonResponse({ data: result.data, _meta: { cached: false, fetchedAt } });
  }

  if (shouldUseCache(result.error.type)) {
    const cached = await loadCached(env.DB);
    if (cached) {
      return jsonResponse({
        data: cached.payload,
        _meta: { cached: true, fetchedAt: cached.fetchedAt, reason: result.error.type },
      });
    }
  }

  return errorResponse(result.error, statusFromError(result.error));
};
