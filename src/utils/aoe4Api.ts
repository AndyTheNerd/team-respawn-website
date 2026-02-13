export type ApiError = {
  type: 'bad_request' | 'not_found' | 'rate_limit' | 'network' | 'unknown';
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type CacheMeta = {
  cached?: boolean;
  fetchedAt?: string;
  reason?: string;
};

type WithMeta<T> = T & { _meta?: CacheMeta };

const PAGES_API_BASE = '/api/aoe4';
const AOE4WORLD_API_BASE = 'https://aoe4world.com/api/v0';

function parseApiError(status: number): ApiError {
  switch (status) {
    case 400:
      return { type: 'bad_request', message: 'Invalid request. Check parameters and try again.' };
    case 404:
      return { type: 'not_found', message: 'Requested AoE4 data was not found.' };
    case 429:
      return { type: 'rate_limit', message: 'Rate limit reached. Please wait a moment and try again.' };
    default:
      return { type: 'unknown', message: `Unexpected error (${status}). Please try again later.` };
  }
}

function buildDirectUrl(path: string, query: Record<string, string | number | boolean | null | undefined> = {}): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${AOE4WORLD_API_BASE}${normalizedPath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchDirect<T>(
  path: string,
  query: Record<string, string | number | boolean | null | undefined> = {}
): Promise<ApiResult<T>> {
  const url = buildDirectUrl(path, query);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      return { ok: true, data: data as T };
    }
    return { ok: false, error: parseApiError(response.status) };
  } catch {
    return {
      ok: false,
      error: { type: 'network', message: 'Unable to reach AoE4World. Check your connection and try again.' },
    };
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
      error: { type: 'network', message: 'Unable to connect to Team Respawn services.' },
    };
  }
}

export type GetGamesOptions = {
  leaderboard?: string;
  page?: number;
  limit?: number;
  since?: string | number;
  opponentProfileId?: number | string;
  includeAlts?: boolean;
  includeStats?: boolean;
};

export async function searchAoe4Players(
  query: string,
  page = 1,
  exact = false
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ query });
  if (page > 1) params.set('page', String(page));
  if (exact) params.set('exact', 'true');
  const pagesUrl = `${PAGES_API_BASE}/search?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>('/players/search', {
      query,
      page: page > 1 ? page : undefined,
      exact: exact ? 'true' : undefined,
    })
  );
}

export async function getAoe4Player(
  profileId: number | string,
  includeAlts = false
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ profileId: String(profileId) });
  if (includeAlts) params.set('includeAlts', 'true');
  const pagesUrl = `${PAGES_API_BASE}/player?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>(`/players/${encodeURIComponent(String(profileId))}`, {
      include_alts: includeAlts ? 'true' : undefined,
    })
  );
}

export async function getAoe4PlayerGames(
  profileId: number | string,
  options: GetGamesOptions = {}
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ profileId: String(profileId) });
  if (options.leaderboard) params.set('leaderboard', options.leaderboard);
  if (typeof options.page === 'number') params.set('page', String(options.page));
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (options.since != null) params.set('since', String(options.since));
  if (options.opponentProfileId != null) params.set('opponentProfileId', String(options.opponentProfileId));
  if (options.includeAlts) params.set('includeAlts', 'true');
  if (options.includeStats) params.set('includeStats', 'true');

  const pagesUrl = `${PAGES_API_BASE}/games?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>(`/players/${encodeURIComponent(String(profileId))}/games`, {
      leaderboard: options.leaderboard,
      page: options.page,
      limit: options.limit,
      since: options.since,
      opponent_profile_id: options.opponentProfileId,
      include_alts: options.includeAlts ? 'true' : undefined,
      include_stats: options.includeStats ? 'true' : undefined,
    })
  );
}

export async function getAoe4LastGame(
  profileId: number | string,
  includeStats = false
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ profileId: String(profileId), last: 'true' });
  if (includeStats) params.set('includeStats', 'true');
  const pagesUrl = `${PAGES_API_BASE}/games?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>(`/players/${encodeURIComponent(String(profileId))}/games/last`, {
      include_stats: includeStats ? 'true' : undefined,
    })
  );
}

export async function getAoe4PlayerGame(
  profileId: number | string,
  gameId: number | string,
  includeStats = false
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ profileId: String(profileId), gameId: String(gameId) });
  if (includeStats) params.set('includeStats', 'true');
  const pagesUrl = `${PAGES_API_BASE}/games?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>(
      `/players/${encodeURIComponent(String(profileId))}/games/${encodeURIComponent(String(gameId))}`,
      { include_stats: includeStats ? 'true' : undefined }
    )
  );
}

export async function getAoe4LeaderboardCard(
  key: string,
  profileId: number | string
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ key, profileId: String(profileId) });
  const pagesUrl = `${PAGES_API_BASE}/leaderboard?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () =>
    fetchDirect<WithMeta<any>>(`/leaderboards/${encodeURIComponent(key)}`, { profile_id: profileId })
  );
}

export type MetaStatsOptions = {
  mapId?: string | number;
  patch?: string | number;
  rankLevel?: string;
  rating?: string;
  includeCivs?: boolean;
};

export async function getAoe4MetaStats(
  leaderboard: string,
  type: 'civilizations' | 'maps' | 'matchups' | 'teams',
  options: MetaStatsOptions = {}
): Promise<ApiResult<WithMeta<any>>> {
  const params = new URLSearchParams({ leaderboard, type });
  if (options.mapId != null) params.set('mapId', String(options.mapId));
  if (options.patch != null) params.set('patch', String(options.patch));
  if (options.rankLevel) params.set('rankLevel', options.rankLevel);
  if (options.rating) params.set('rating', options.rating);
  if (options.includeCivs) params.set('includeCivs', 'true');

  const pagesUrl = `${PAGES_API_BASE}/meta?${params.toString()}`;

  return fetchFromPagesFunction<WithMeta<any>>(pagesUrl, { method: 'GET' }, () => {
    const path =
      type === 'maps' && options.mapId != null
        ? `/stats/${encodeURIComponent(leaderboard)}/maps/${encodeURIComponent(String(options.mapId))}`
        : `/stats/${encodeURIComponent(leaderboard)}/${encodeURIComponent(type)}`;
    return fetchDirect<WithMeta<any>>(path, {
      patch: options.patch,
      rank_level: options.rankLevel,
      rating: options.rating,
      include_civs: options.includeCivs ? 'true' : undefined,
    });
  });
}
