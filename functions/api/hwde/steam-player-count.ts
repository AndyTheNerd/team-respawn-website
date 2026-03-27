const STEAM_APP_ID = 459220;
const STEAM_APP_NAME = 'Halo Wars: Definitive Edition';
const STEAM_API_URL =
  `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${STEAM_APP_ID}`;
const DAILY_HIGH_TIMEZONE = 'America/New_York';
const RAW_SAMPLE_RETENTION_DAYS = 30;

type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
};

type DailySummaryRow = {
  peak_players: number;
  peak_sampled_at: string;
  sample_count: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function getDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return [year, month, day].filter(Boolean).join('-');
}

async function persistSample(db: D1Database, fetchedAt: string, sampleDay: string, currentPlayers: number) {
  const cutoff = daysAgoIso(RAW_SAMPLE_RETENTION_DAYS);

  await db.batch([
    db.prepare(
      `INSERT INTO hwde_steam_player_samples (sampled_at, sample_day, current_players)
       VALUES (?, ?, ?)`
    ).bind(fetchedAt, sampleDay, currentPlayers),
    db.prepare(
      `INSERT INTO hwde_steam_daily_summary (
         sample_day,
         peak_players,
         peak_sampled_at,
         last_sampled_at,
         sample_count
       )
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(sample_day) DO UPDATE SET
         peak_players = CASE
           WHEN excluded.peak_players > peak_players THEN excluded.peak_players
           ELSE peak_players
         END,
         peak_sampled_at = CASE
           WHEN excluded.peak_players > peak_players THEN excluded.peak_sampled_at
           ELSE peak_sampled_at
         END,
         last_sampled_at = excluded.last_sampled_at,
         sample_count = sample_count + 1`
    ).bind(sampleDay, currentPlayers, fetchedAt, fetchedAt),
    db.prepare(
      'DELETE FROM hwde_steam_player_samples WHERE sampled_at < ?'
    ).bind(cutoff),
  ]);
}

async function loadDailySummary(db: D1Database, sampleDay: string) {
  return db.prepare(
    `SELECT peak_players, peak_sampled_at, sample_count
     FROM hwde_steam_daily_summary
     WHERE sample_day = ?`
  ).bind(sampleDay).first<DailySummaryRow>();
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
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

    const fetchedAt = new Date().toISOString();
    const sampleDay = getDateKey(new Date(fetchedAt), DAILY_HIGH_TIMEZONE);
    let dailySummary: DailySummaryRow | null = null;

    if (env.DB) {
      try {
        await persistSample(env.DB, fetchedAt, sampleDay, currentPlayers);
        dailySummary = await loadDailySummary(env.DB, sampleDay);
      } catch {
        dailySummary = null;
      }
    }

    return jsonResponse({
      appId: STEAM_APP_ID,
      appName: STEAM_APP_NAME,
      currentPlayers,
      fetchedAt,
      source: {
        name: 'Steam Web API',
        endpoint: 'ISteamUserStats/GetNumberOfCurrentPlayers',
      },
      dailyHigh: {
        value: typeof dailySummary?.peak_players === 'number' ? dailySummary.peak_players : null,
        sampledAt: dailySummary?.peak_sampled_at ?? null,
        sampleCount: typeof dailySummary?.sample_count === 'number' ? dailySummary.sample_count : 0,
        day: sampleDay,
        timezone: DAILY_HIGH_TIMEZONE,
        methodology: 'Highest Team Respawn sample stored today.',
      },
      limitations: [
        'This reports live Steam concurrency, not live matchmaking population.',
        'Players outside Steam are not counted.',
        'Daily high is based on Team Respawn sampling, not an official Steam daily peak feed.',
        'This endpoint does not provide playlist-level or per-player data.',
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
