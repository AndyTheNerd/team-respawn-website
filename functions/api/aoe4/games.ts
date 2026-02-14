import { buildApiUrl, errorResponse, fetchAoe4World, jsonResponse, statusFromError } from './_shared';

type Env = {
  AOE4WORLD_API_KEY?: string;
};

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
  ]);
  const aliases: Record<string, string> = {
    'rm_1v1_elo': 'rm_1v1',
    'rm_2v2_elo': 'rm_2v2',
    'rm_3v3_elo': 'rm_3v3',
  };
  if (!value) return null;
  if (aliases[value]) return aliases[value];
  return allowed.has(value) ? value : null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const profileIdRaw = url.searchParams.get('profileId')?.trim() || '';
  const gameIdRaw = url.searchParams.get('gameId')?.trim() || '';
  const last = url.searchParams.get('last')?.trim() === 'true';
  const includeAlts = url.searchParams.get('includeAlts')?.trim() === 'true';
  const includeStats = url.searchParams.get('includeStats')?.trim() === 'true';
  const apiKey = env.AOE4WORLD_API_KEY?.trim() || '';

  if (!profileIdRaw) {
    return errorResponse({ type: 'bad_request', message: 'profileId is required.' }, 400);
  }

  const profileId = Number(profileIdRaw);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return errorResponse({ type: 'bad_request', message: 'profileId must be a positive number.' }, 400);
  }

  const page = url.searchParams.get('page')?.trim() || '';
  const limit = url.searchParams.get('limit')?.trim() || '';
  const since = url.searchParams.get('since')?.trim() || '';
  const opponentProfileId = url.searchParams.get('opponentProfileId')?.trim() || '';
  const leaderboardRaw = url.searchParams.get('leaderboard')?.trim() || '';
  const leaderboard = normalizeLeaderboard(leaderboardRaw);
  if (leaderboardRaw && !leaderboard) {
    return errorResponse({ type: 'bad_request', message: 'Invalid leaderboard key.' }, 400);
  }

  let path = `/players/${profileId}/games`;
  if (last) {
    path = `/players/${profileId}/games/last`;
  } else if (gameIdRaw) {
    const gameId = Number(gameIdRaw);
    if (!Number.isFinite(gameId) || gameId <= 0) {
      return errorResponse({ type: 'bad_request', message: 'gameId must be a positive number.' }, 400);
    }
    path = `/players/${profileId}/games/${gameId}`;
  }

  const targetUrl = buildApiUrl(path, {
    page: !last && !gameIdRaw ? page || undefined : undefined,
    limit: !last && !gameIdRaw ? limit || undefined : undefined,
    leaderboard: !last && !gameIdRaw ? leaderboard || undefined : undefined,
    since: !last && !gameIdRaw ? since || undefined : undefined,
    opponent_profile_id: !last && !gameIdRaw ? opponentProfileId || undefined : undefined,
    include_alts: includeAlts ? 'true' : undefined,
    include_stats: includeStats ? 'true' : undefined,
    api_key: apiKey || undefined,
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
