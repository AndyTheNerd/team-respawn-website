import { buildApiUrl, errorResponse, fetchAoe4World, jsonResponse, statusFromError } from './_shared';

function normalizeLeaderboard(value: string): string | null {
  const allowed = new Set([
    'rm_solo',
    'rm_2v2',
    'rm_3v3',
    'rm_4v4',
    'qm_1v1',
    'qm_2v2',
    'qm_3v3',
    'qm_4v4',
  ]);
  if (!value) return null;
  return allowed.has(value) ? value : null;
}

function normalizeMetaType(value: string): 'civilizations' | 'maps' | 'matchups' | 'teams' | null {
  if (!value) return null;
  if (value === 'civilizations' || value === 'maps' || value === 'matchups' || value === 'teams') {
    return value;
  }
  return null;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const leaderboardRaw = url.searchParams.get('leaderboard')?.trim() || '';
  const typeRaw = url.searchParams.get('type')?.trim() || '';
  const mapId = url.searchParams.get('mapId')?.trim() || '';
  const leaderboard = normalizeLeaderboard(leaderboardRaw);
  const type = normalizeMetaType(typeRaw);

  if (!leaderboard) {
    return errorResponse({ type: 'bad_request', message: 'Valid leaderboard is required.' }, 400);
  }
  if (!type) {
    return errorResponse({ type: 'bad_request', message: 'Valid stats type is required.' }, 400);
  }
  if (type === 'teams' && !leaderboard.startsWith('qm_')) {
    return errorResponse({ type: 'bad_request', message: 'teams stats are only available for quick match team queues.' }, 400);
  }

  const path =
    type === 'maps' && mapId
      ? `/stats/${leaderboard}/maps/${encodeURIComponent(mapId)}`
      : `/stats/${leaderboard}/${type}`;

  const patch = url.searchParams.get('patch')?.trim() || '';
  const rankLevel = url.searchParams.get('rankLevel')?.trim() || '';
  const rating = url.searchParams.get('rating')?.trim() || '';
  const includeCivs = url.searchParams.get('includeCivs')?.trim() === 'true';

  const targetUrl = buildApiUrl(path, {
    patch: patch || undefined,
    rank_level: rankLevel || undefined,
    rating: rating || undefined,
    include_civs: includeCivs ? 'true' : undefined,
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
