export type ApiError = {
  type: 'bad_request' | 'not_found' | 'rate_limit' | 'network' | 'unknown';
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const AOE4WORLD_API_BASE = 'https://aoe4world.com/api/v0';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(error: ApiError, status = 500): Response {
  return jsonResponse({ error }, status);
}

export function statusFromError(error: ApiError): number {
  switch (error.type) {
    case 'bad_request':
      return 400;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'network':
      return 502;
    default:
      return 500;
  }
}

export function buildApiUrl(path: string, query: Record<string, string | number | boolean | null | undefined> = {}): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${AOE4WORLD_API_BASE}${normalizedPath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function parseApiError(status: number, fallback = ''): ApiError {
  switch (status) {
    case 400:
      return { type: 'bad_request', message: fallback || 'Invalid request. Check parameters and try again.' };
    case 404:
      return { type: 'not_found', message: fallback || 'Requested AoE4 data was not found.' };
    case 429:
      return { type: 'rate_limit', message: fallback || 'Rate limit reached. Please wait a moment and try again.' };
    default:
      return { type: 'unknown', message: fallback || `Unexpected error (${status}). Please try again later.` };
  }
}

export async function fetchAoe4World<T>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, data: data as T };
    }

    let message = '';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      message =
        payload?.error?.message
        || payload?.message
        || payload?.error
        || '';
    } else {
      const text = await response.text().catch(() => '');
      if (typeof text === 'string' && text.trim()) {
        message = text.trim().slice(0, 200);
      }
    }

    return { ok: false, error: parseApiError(response.status, message) };
  } catch {
    return {
      ok: false,
      error: { type: 'network', message: 'Unable to reach AoE4World. Check your connection and try again.' },
    };
  }
}
