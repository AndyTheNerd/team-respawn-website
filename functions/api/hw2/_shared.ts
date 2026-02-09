export type ApiError = {
  type: 'not_found' | 'rate_limit' | 'auth' | 'network' | 'unknown';
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const HALO_API_URL = 'https://www.haloapi.com/stats/hw2';
const SUMMARY_API_URL = 'https://s3publicapis.azure-api.net/stats/hw2';
const METADATA_API_URL = 'https://s3publicapis.azure-api.net/metadata/hw2';

export const HALO_ENDPOINTS = {
  HALO_API_URL,
  SUMMARY_API_URL,
  METADATA_API_URL,
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(error: ApiError, status = 500): Response {
  return jsonResponse({ error }, status);
}

export function parseApiError(status: number): ApiError {
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

export function statusFromError(error: ApiError): number {
  switch (error.type) {
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'auth':
      return 401;
    case 'network':
      return 502;
    default:
      return 500;
  }
}

export async function fetchWithKeyFallback<T>(
  url: string,
  apiKeys: string[],
  extraHeaders: Record<string, string> = {}
): Promise<ApiResult<T>> {
  if (apiKeys.length === 0) {
    return { ok: false, error: { type: 'auth', message: 'No API keys configured. Stats are unavailable.' } };
  }

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKeys[i], ...extraHeaders },
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data: data as T };
      }

      if (response.status === 401 || response.status === 403 || response.status === 429) {
        if (i < apiKeys.length - 1) continue;
        return { ok: false, error: parseApiError(response.status) };
      }

      return { ok: false, error: parseApiError(response.status) };
    } catch {
      if (i < apiKeys.length - 1) continue;
      return {
        ok: false,
        error: { type: 'network', message: 'Unable to connect to Halo servers. Check your connection.' },
      };
    }
  }

  return { ok: false, error: { type: 'auth', message: 'No API keys configured. Stats are unavailable.' } };
}
