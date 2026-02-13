import { buildApiUrl, errorResponse, fetchAoe4World, jsonResponse, statusFromError } from './_shared';

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const profileIdRaw = url.searchParams.get('profileId')?.trim() || '';
  const includeAlts = url.searchParams.get('includeAlts')?.trim() === 'true';

  if (!profileIdRaw) {
    return errorResponse({ type: 'bad_request', message: 'profileId is required.' }, 400);
  }

  const profileId = Number(profileIdRaw);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return errorResponse({ type: 'bad_request', message: 'profileId must be a positive number.' }, 400);
  }

  const targetUrl = buildApiUrl(`/players/${profileId}`, {
    include_alts: includeAlts ? 'true' : undefined,
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
