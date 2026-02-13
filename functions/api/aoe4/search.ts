import { buildApiUrl, errorResponse, fetchAoe4World, jsonResponse, statusFromError } from './_shared';

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim() || '';
  const page = url.searchParams.get('page')?.trim() || '';
  const exact = url.searchParams.get('exact')?.trim() || '';

  if (query.length < 3) {
    return errorResponse(
      { type: 'bad_request', message: 'Search query must be at least 3 characters.' },
      400
    );
  }

  const targetUrl = buildApiUrl('/players/search', {
    query,
    page: page || undefined,
    exact: exact === 'true' ? 'true' : undefined,
  });

  const result = await fetchAoe4World<any>(targetUrl);
  if (!result.ok) {
    return errorResponse(result.error, statusFromError(result.error));
  }

  return jsonResponse({
    ...result.data,
    _meta: { cached: false, fetchedAt: new Date().toISOString() },
  });
};
