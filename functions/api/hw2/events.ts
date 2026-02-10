import { errorResponse, fetchWithKeyFallback, HALO_ENDPOINTS, jsonResponse, statusFromError } from './_shared';

type Env = {
  HW2_API_KEY_1?: string;
  HW2_API_KEY_2?: string;
  HW2_API_KEY_3?: string;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId') || '';
  if (!matchId) {
    return errorResponse({ type: 'unknown', message: 'matchId is required.' }, 400);
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );

  const encoded = encodeURIComponent(matchId);
  const urlEvents = `${HALO_ENDPOINTS.SUMMARY_API_URL}/matches/${encoded}/events`;
  const result = await fetchWithKeyFallback<any>(urlEvents, apiKeys);
  if (!result.ok) {
    return errorResponse(result.error, statusFromError(result.error));
  }

  return jsonResponse(result.data);
};
