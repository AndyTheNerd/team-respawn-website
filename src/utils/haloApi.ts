import type { ApiResult, ApiError, PlayerStatsSummaryResponse, SeasonStatsResponse, MatchResult } from '../data/haloWars2/types';

const HALO_API_URL = 'https://www.haloapi.com/stats/hw2';
const SUMMARY_API_URL = 'https://s3publicapis.azure-api.net/stats/hw2';
const METADATA_API_URL = 'https://s3publicapis.azure-api.net/metadata/hw2';
const PAGES_API_BASE = '/api/hw2';

const API_KEYS = [
  import.meta.env.PUBLIC_HW2_API_KEY_1,
  import.meta.env.PUBLIC_HW2_API_KEY_2,
  import.meta.env.PUBLIC_HW2_API_KEY_3,
].filter(Boolean) as string[];

function parseApiError(status: number): ApiError {
  switch (status) {
    case 401:
    case 403:
      return { type: 'auth', message: 'API key issue - stats may be temporarily unavailable.' };
    case 404:
      return { type: 'not_found', message: 'Gamertag not found. Check spelling and try again.' };
    case 429:
      return { type: 'rate_limit', message: 'Rate limit reached. Please wait a moment and try again.' };
    default:
      return { type: 'unknown', message: `Unexpected error (${status}). Please try again later.` };
  }
}

async function fetchFromPagesFunction<T>(
  url: string,
  options: RequestInit,
  fallback?: () => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;
    if (response.ok) {
      return { ok: true, data: data as T };
    }

    if (fallback && (response.status === 404 || response.status === 405)) {
      return fallback();
    }

    if (!isJson && fallback) {
      return fallback();
    }

    if (data?.error?.type && data?.error?.message) {
      return { ok: false, error: data.error as ApiError };
    }

    if (fallback) {
      return fallback();
    }

    return { ok: false, error: parseApiError(response.status) };
  } catch {
    if (fallback) {
      return fallback();
    }
    return {
      ok: false,
      error: { type: 'network', message: 'Unable to connect to Halo servers. Check your connection.' },
    };
  }
}

async function fetchWithKeyFallback<T>(url: string, extraHeaders: Record<string, string> = {}): Promise<ApiResult<T>> {
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEYS[i], ...extraHeaders },
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data: data as T };
      }

      if (response.status === 401 || response.status === 403 || response.status === 429) {
        if (i < API_KEYS.length - 1) continue;
        return { ok: false, error: parseApiError(response.status) };
      }

      return { ok: false, error: parseApiError(response.status) };
    } catch {
      if (i < API_KEYS.length - 1) continue;
      return {
        ok: false,
        error: { type: 'network', message: 'Unable to connect to Halo servers. Check your connection.' },
      };
    }
  }

  return {
    ok: false,
    error: { type: 'auth', message: 'No API keys configured. Stats are unavailable.' },
  };
}

export async function getPlayerStats(gamertag: string): Promise<ApiResult<PlayerStatsSummaryResponse>> {
  const encoded = encodeURIComponent(gamertag);
  return fetchWithKeyFallback<PlayerStatsSummaryResponse>(`${SUMMARY_API_URL}/players/${encoded}/stats`);
}

export async function getPlayerSeasonStats(gamertag: string, seasonId: string): Promise<ApiResult<SeasonStatsResponse>> {
  const encoded = encodeURIComponent(gamertag);
  return fetchWithKeyFallback<SeasonStatsResponse>(`${SUMMARY_API_URL}/players/${encoded}/stats/seasons/${seasonId}`);
}

export async function getMatchResult(matchId: string): Promise<ApiResult<any>> {
  const encoded = encodeURIComponent(matchId);
  return fetchFromPagesFunction<any>(
    `${PAGES_API_BASE}/match?matchId=${encoded}`,
    { method: 'GET' },
    () => fetchWithKeyFallback<any>(`${HALO_API_URL}/matches/${encoded}`)
  );
}

export async function getMatchEvents(matchId: string): Promise<ApiResult<any>> {
  const encoded = encodeURIComponent(matchId);
  return fetchFromPagesFunction<any>(
    `${PAGES_API_BASE}/events?matchId=${encoded}`,
    { method: 'GET' },
    () => fetchWithKeyFallback<any>(`${SUMMARY_API_URL}/matches/${encoded}/events`)
  );
}

export async function getPlayerMatches(gamertag: string, count = 10): Promise<ApiResult<{ Results: MatchResult[] }>> {
  const encoded = encodeURIComponent(gamertag);
  return fetchFromPagesFunction<{ Results: MatchResult[] }>(
    `${PAGES_API_BASE}/matches`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gamertag, count }),
    },
    () =>
      fetchWithKeyFallback<{ Results: MatchResult[] }>(
        `${HALO_API_URL}/players/${encoded}/matches?start=0&count=${count}`
      )
  );
}

let leaderPowerMapCache: Record<string, string> | null = null;
let leaderPowerMapPromise: Promise<ApiResult<Record<string, string>>> | null = null;

export async function getLeaderPowerMap(): Promise<ApiResult<Record<string, string>>> {
  if (leaderPowerMapCache) {
    return { ok: true, data: leaderPowerMapCache };
  }

  if (leaderPowerMapPromise) {
    return leaderPowerMapPromise;
  }

  leaderPowerMapPromise = (async () => {
    const map: Record<string, string> = {};
    let startAt = 0;
    let totalCount = Infinity;

    while (startAt < totalCount) {
      const pageResult = await fetchWithKeyFallback<any>(
        `${METADATA_API_URL}/leader-powers?startAt=${startAt}`,
        { 'Accept-Language': 'en-US' }
      );
      if (!pageResult.ok) {
        return pageResult as ApiResult<Record<string, string>>;
      }

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

    leaderPowerMapCache = map;
    return { ok: true, data: map };
  })();

  const result = await leaderPowerMapPromise;
  if (!result.ok) {
    leaderPowerMapPromise = null;
  }
  return result;
}

let gameObjectMapCache: Record<string, string> | null = null;
let gameObjectMapPromise: Promise<ApiResult<Record<string, string>>> | null = null;

export async function getGameObjectMap(): Promise<ApiResult<Record<string, string>>> {
  if (gameObjectMapCache) {
    return { ok: true, data: gameObjectMapCache };
  }

  if (gameObjectMapPromise) {
    return gameObjectMapPromise;
  }

  gameObjectMapPromise = (async () => {
    const map: Record<string, string> = {};
    let startAt = 0;
    let totalCount = Infinity;

    while (startAt < totalCount) {
      const pageResult = await fetchWithKeyFallback<any>(
        `${METADATA_API_URL}/game-objects?startAt=${startAt}`,
        { 'Accept-Language': 'en-US' }
      );
      if (!pageResult.ok) {
        return pageResult as ApiResult<Record<string, string>>;
      }

      const data = pageResult.data;
      const items = Array.isArray(data?.ContentItems) ? data.ContentItems : [];
      items.forEach((item: any) => {
        const view = item?.View || {};
        const obj = view?.HW2Object || view?.HW2GameObject || view?.GameObject || view;
        const objId = obj?.ObjectTypeId || view?.HW2Object?.ObjectTypeId || view?.ObjectTypeId;
        const displayInfo =
          obj?.DisplayInfo
          || view?.HW2Object?.DisplayInfo
          || view?.DisplayInfo;
        const displayView = displayInfo?.View || displayInfo;
        const name =
          displayView?.HW2ObjectDisplayInfo?.Name
          || displayView?.HW2GameObjectDisplayInfo?.Name
          || displayView?.Name
          || displayView?.Title
          || view?.Title
          || obj?.Name;
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

    gameObjectMapCache = map;
    return { ok: true, data: map };
  })();

  const result = await gameObjectMapPromise;
  if (!result.ok) {
    gameObjectMapPromise = null;
  }
  return result;
}

let techMapCache: Record<string, string> | null = null;
let techMapPromise: Promise<ApiResult<Record<string, string>>> | null = null;

export async function getTechMap(): Promise<ApiResult<Record<string, string>>> {
  if (techMapCache) {
    return { ok: true, data: techMapCache };
  }

  if (techMapPromise) {
    return techMapPromise;
  }

  techMapPromise = (async () => {
    const map: Record<string, string> = {};
    let startAt = 0;
    let totalCount = Infinity;

    while (startAt < totalCount) {
      const pageResult = await fetchWithKeyFallback<any>(
        `${METADATA_API_URL}/techs?startAt=${startAt}`,
        { 'Accept-Language': 'en-US' }
      );
      if (!pageResult.ok) {
        return pageResult as ApiResult<Record<string, string>>;
      }

      const data = pageResult.data;
      const items = Array.isArray(data?.ContentItems) ? data.ContentItems : [];
      items.forEach((item: any) => {
        const view = item?.View || {};
        const tech = view?.HW2Tech || view?.Tech || view;
        const techId = tech?.TechId || tech?.ObjectTypeId || view?.HW2Tech?.TechId || view?.HW2Tech?.ObjectTypeId || view?.TechId;
        const displayInfo =
          tech?.DisplayInfo
          || view?.HW2Tech?.DisplayInfo
          || view?.DisplayInfo;
        const displayView = displayInfo?.View || displayInfo;
        const name =
          displayView?.HW2TechDisplayInfo?.Name
          || displayView?.Name
          || displayView?.Title
          || view?.Title
          || tech?.Name;
        if (techId && name) {
          map[String(techId)] = String(name);
        }
      });

      const paging = data?.Paging || {};
      const inlineCount = typeof paging.InlineCount === 'number' ? paging.InlineCount : items.length;
      totalCount = typeof paging.TotalCount === 'number' ? paging.TotalCount : startAt + inlineCount;
      startAt = (typeof paging.StartAt === 'number' ? paging.StartAt : startAt) + inlineCount;

      if (inlineCount === 0) break;
    }

    techMapCache = map;
    return { ok: true, data: map };
  })();

  const result = await techMapPromise;
  if (!result.ok) {
    techMapPromise = null;
  }
  return result;
}
