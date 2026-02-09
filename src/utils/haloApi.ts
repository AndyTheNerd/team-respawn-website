import type { ApiResult, ApiError, PlayerStatsSummaryResponse, SeasonStatsResponse, MatchResult } from '../data/haloWars2/types';

const HALO_API_URL = 'https://www.haloapi.com/stats/hw2';
const SUMMARY_API_URL = 'https://s3publicapis.azure-api.net/stats/hw2';

const API_KEYS = [
  import.meta.env.PUBLIC_HW2_API_KEY_1,
  import.meta.env.PUBLIC_HW2_API_KEY_2,
  import.meta.env.PUBLIC_HW2_API_KEY_3,
].filter(Boolean) as string[];

function parseApiError(status: number): ApiError {
  switch (status) {
    case 401:
    case 403:
      return { type: 'auth', message: 'API key issue — stats may be temporarily unavailable.' };
    case 404:
      return { type: 'not_found', message: 'Gamertag not found. Check spelling and try again.' };
    case 429:
      return { type: 'rate_limit', message: 'Rate limit reached. Please wait a moment and try again.' };
    default:
      return { type: 'unknown', message: `Unexpected error (${status}). Please try again later.` };
  }
}

async function fetchWithKeyFallback<T>(url: string): Promise<ApiResult<T>> {
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEYS[i] },
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data: data as T };
      }

      if (response.status === 401 || response.status === 403) {
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

export async function getPlayerMatches(gamertag: string, count = 10): Promise<ApiResult<{ Results: MatchResult[] }>> {
  const encoded = encodeURIComponent(gamertag);
  return fetchWithKeyFallback<{ Results: MatchResult[] }>(
    `${HALO_API_URL}/players/${encoded}/matches?start=0&count=${count}`
  );
}
