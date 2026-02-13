import { buildApiUrl, errorResponse, fetchAoe4World, jsonResponse, statusFromError } from './_shared';

function normalizeLeaderboard(value: string): string | null {
  const allowed = new Set([
    'rm_solo',
    'rm_team',
    'rm_1v1',
    'rm_2v2',
    'rm_3v3',
    'rm_4v4',
    'qm_1v1',
    'qm_2v2',
    'qm_3v3',
    'qm_4v4',
    'qm_ffa',
    'rm_solo_console',
    'rm_team_console',
    'qm_1v1_console',
    'qm_2v2_console',
    'qm_3v3_console',
    'qm_4v4_console',
    'qm_ffa_console',
  ]);
  if (!value) return null;
  return allowed.has(value) ? value : null;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const keyRaw = url.searchParams.get('key')?.trim() || '';
  const key = normalizeLeaderboard(keyRaw);
  if (!key) {
    return errorResponse({ type: 'bad_request', message: 'Valid leaderboard key is required.' }, 400);
  }

  const profileId = url.searchParams.get('profileId')?.trim() || '';
  const season = url.searchParams.get('season')?.trim() || '';
  const query = url.searchParams.get('query')?.trim() || '';
  const country = url.searchParams.get('country')?.trim() || '';

  const targetUrl = buildApiUrl(`/leaderboards/${key}`, {
    profile_id: profileId || undefined,
    season: season || undefined,
    query: query || undefined,
    country: country || undefined,
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
