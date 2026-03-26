const STEAM_APP_ID = 459220;
const STEAM_APP_NAME = 'Halo Wars: Definitive Edition';
const STEAM_API_URL =
  `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${STEAM_APP_ID}`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}

export const onRequestGet: PagesFunction = async () => {
  try {
    const response = await fetch(STEAM_API_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return jsonResponse(
        {
          error: 'Steam did not return a valid player count response.',
          appId: STEAM_APP_ID,
          appName: STEAM_APP_NAME,
          source: 'steam',
          fetchedAt: new Date().toISOString(),
        },
        502
      );
    }

    const data = await response.json().catch(() => null);
    const currentPlayers = data?.response?.player_count;

    if (typeof currentPlayers !== 'number' || Number.isNaN(currentPlayers)) {
      return jsonResponse(
        {
          error: 'Steam returned an unexpected payload.',
          appId: STEAM_APP_ID,
          appName: STEAM_APP_NAME,
          source: 'steam',
          fetchedAt: new Date().toISOString(),
        },
        502
      );
    }

    return jsonResponse({
      appId: STEAM_APP_ID,
      appName: STEAM_APP_NAME,
      currentPlayers,
      fetchedAt: new Date().toISOString(),
      source: {
        name: 'Steam Web API',
        endpoint: 'ISteamUserStats/GetNumberOfCurrentPlayers',
      },
      limitations: [
        'This is Steam concurrency, not matchmaking population.',
        'Players offline from Steam are not counted.',
        'This endpoint does not provide historical or per-playlist data.',
      ],
    });
  } catch {
    return jsonResponse(
      {
        error: 'Unable to reach Steam.',
        appId: STEAM_APP_ID,
        appName: STEAM_APP_NAME,
        source: 'steam',
        fetchedAt: new Date().toISOString(),
      },
      502
    );
  }
};
