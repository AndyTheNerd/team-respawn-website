type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type Env = {
  DB?: D1Database;
};

type MapDurationRow = { map_id: string; cnt: number; median_seconds: number | null };
type MedianUnitsRow = { median_units_destroyed: number | null; median_units_lost: number | null };
type MedianPowersRow = { median_powers: number | null };
type WeeklyTopSearchRow = { gamertag: string; search_count: number };
type WeeklyMatchSumRow = { weekly_match_sum: number | null };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function tryFirst<T>(stmt: D1PreparedStatement): Promise<T | null> {
  try {
    return await stmt.first<T>();
  } catch {
    return null;
  }
}

async function tryAll<T>(stmt: D1PreparedStatement): Promise<T[]> {
  try {
    const result = await stmt.all<T>();
    return result.results;
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return jsonResponse({ error: 'DB not available' }, 503);
  }

  const db = env.DB;

  const [
    totalMatches,
    totalPlayers,
    avgDuration,
    medianUnits,
    medianPowers,
    mapDurationStats,
    weeklyTopSearch,
    weeklyMatchSum,
  ] = await Promise.all([
    tryFirst<{ total: number }>(
      db.prepare('SELECT COUNT(*) AS total FROM matches')
    ),
    tryFirst<{ total: number }>(
      db.prepare('SELECT COUNT(*) AS total FROM players')
    ),
    tryFirst<{ avg_seconds: number | null }>(
      db.prepare('SELECT AVG(duration_seconds) AS avg_seconds FROM matches WHERE duration_seconds > 0')
    ),
    tryFirst<MedianUnitsRow>(
      db.prepare(
        `SELECT
          (SELECT units_destroyed FROM match_players
           WHERE is_human = 1 AND units_destroyed IS NOT NULL
           ORDER BY units_destroyed
           LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM match_players WHERE is_human = 1 AND units_destroyed IS NOT NULL)
          ) AS median_units_destroyed,
          (SELECT units_lost FROM match_players
           WHERE is_human = 1 AND units_lost IS NOT NULL
           ORDER BY units_lost
           LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM match_players WHERE is_human = 1 AND units_lost IS NOT NULL)
          ) AS median_units_lost`
      )
    ),
    // Median leader powers used per player per match
    tryFirst<MedianPowersRow>(
      db.prepare(
        `SELECT leader_powers_used AS median_powers
         FROM match_players
         WHERE is_human = 1 AND leader_powers_used IS NOT NULL
         ORDER BY leader_powers_used
         LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM match_players WHERE is_human = 1 AND leader_powers_used IS NOT NULL)`
      )
    ),
    // Median match duration per map, excluding firefight maps (FF_ prefix)
    tryAll<MapDurationRow>(
      db.prepare(
        `SELECT map_id, COUNT(*) AS cnt,
           (SELECT duration_seconds FROM matches m2
            WHERE m2.map_id = m.map_id AND m2.duration_seconds > 0
            ORDER BY m2.duration_seconds
            LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM matches m3 WHERE m3.map_id = m.map_id AND m3.duration_seconds > 0)
           ) AS median_seconds
         FROM matches m
         WHERE map_id IS NOT NULL
           AND map_id NOT LIKE '%FF_%'
           AND duration_seconds > 0
         GROUP BY map_id
         ORDER BY cnt DESC`
      )
    ),
    tryFirst<WeeklyTopSearchRow>(
      db.prepare(
        `SELECT p.gamertag AS gamertag, COUNT(*) AS search_count
         FROM search_events se
         JOIN players p ON p.player_id = se.player_id
         WHERE datetime(se.searched_at) >= datetime('now', '-7 days')
         GROUP BY se.player_id, p.gamertag
         ORDER BY search_count DESC, p.gamertag ASC
         LIMIT 1`
      )
    ),
    tryFirst<WeeklyMatchSumRow>(
      db.prepare(
        `SELECT COALESCE(SUM(match_count), 0) AS weekly_match_sum
         FROM search_events
         WHERE datetime(searched_at) >= datetime('now', '-7 days')`
      )
    ),
  ]);

  return jsonResponse({
    totalMatches: totalMatches?.total ?? 0,
    totalPlayers: totalPlayers?.total ?? 0,
    avgDurationSeconds: avgDuration?.avg_seconds ?? null,
    medianUnitsDestroyed: medianUnits?.median_units_destroyed ?? null,
    medianUnitsLost: medianUnits?.median_units_lost ?? null,
    medianPowersPerPlayer: medianPowers?.median_powers ?? null,
    mapDurationStats,
    weeklyMostSearchedGamertag: weeklyTopSearch?.gamertag ?? null,
    weeklyMostSearchedCount: weeklyTopSearch?.search_count ?? 0,
    weeklyMatchesAnalyzed: weeklyMatchSum?.weekly_match_sum ?? 0,
  });
};
