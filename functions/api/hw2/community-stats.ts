type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

type Env = {
  DB?: D1Database;
};

type MapDurationRow = { map_id: string; cnt: number; median_seconds: number | null };
type MedianUnitsRow = { median_units_destroyed: number | null; median_units_lost: number | null };
type MedianPowersRow = { median_powers: number | null };
type LeaderMapRow = {
  playlist_id: string | null;
  leader_id: number | null;
  map_id: string | null;
  picks: number;
  wins: number;
};
type MatchupRow = {
  playlist_id: string | null;
  leader_id: number | null;
  opponent_leader_id: number | null;
  matches: number;
  wins: number;
};
type MapPlaylistRow = {
  playlist_id: string | null;
  map_id: string | null;
  matches: number;
};
type LeaderPowerRow = {
  playlist_id: string | null;
  leader_id: number | null;
  power_id: string | null;
  casts: number;
  player_uses: number;
  matches_using_power: number;
};
type ActivityRow = { dow: number; hour: number; count: number };
type SearchRow = { gamertag: string; last_searched: string };
type SearchCountRow = { gamertag: string; searches: number };
type SearchRisingRow = { gamertag: string; recent_searches: number; previous_searches: number; delta: number };
type OpeningSourceRow = {
  playlist_id: string | null;
  build_order_json: string | null;
};
type RawEventRow = {
  match_id: string;
  playlist_id: string | null;
  payload_json: string;
};

type BuildOrderEntry = {
  time_ms: number;
  kind: 'building' | 'upgrade' | 'unit' | 'unit_upgrade';
  object_id?: string;
  instance_id?: number;
};

type OpeningAggregateRow = {
  playlist_id: string | null;
  milestone: string;
  bucket_minute: number;
  count: number;
};

type ResourceAggregateRow = {
  playlist_id: string | null;
  minute_bucket: number;
  avg_supply: number | null;
  avg_energy: number | null;
  avg_population: number | null;
  avg_population_cap: number | null;
  sample_count: number;
};

const SEARCH_RECENT_LIMIT = 12;
const SEARCH_TREND_LIMIT = 8;
const MAX_RESOURCE_BUCKET = 20;
const RESOURCE_BUCKET_MINUTES = 2;
const MAX_OPENING_BUCKET = 10;

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

function safeNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizePlaylistId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeObjectId(value: string | undefined): string {
  return String(value || '').toLowerCase();
}

function detectTechTierFromBuildingUpgrade(objectId: string | undefined): 2 | 3 | null {
  const id = normalizeObjectId(objectId);
  if (!id) return null;
  const looksLikeMainBase = id.includes('bldg_command') || id.includes('bldg_builder');
  if (!looksLikeMainBase) return null;
  if (/(?:_0?3)$/.test(id)) return 2;
  if (/(?:_0?4)$/.test(id)) return 3;
  return null;
}

function classifyOpeningMilestone(entry: BuildOrderEntry): string | null {
  if (entry.kind === 'unit') return 'first_unit';
  if (entry.kind === 'upgrade') {
    const techTier = detectTechTierFromBuildingUpgrade(entry.object_id);
    if (techTier === 2) return 'tech2';
    if (techTier === 3) return 'tech3';
    return null;
  }

  if (entry.kind !== 'building') return null;

  const id = normalizeObjectId(entry.object_id);
  if (!id) return null;
  if (id.includes('supplypad') || id.includes('supplydepot')) return 'eco';
  if (id.includes('reactor')) return 'generator';
  if (id.includes('barracks') || id.includes('temple')) return 'barracks';
  if (id.includes('vehicledepot') || id.includes('lightfactory') || id.includes('heavyfactory')) return 'vehicle';
  if (id.includes('airpad')) return 'air';
  return null;
}

function openingMinuteBucket(timeMs: number): number {
  const minute = Math.max(0, Math.floor(timeMs / 60_000));
  return Math.min(MAX_OPENING_BUCKET, minute);
}

function resourceMinuteBucket(timeMs: number): number {
  const bucket = Math.floor(Math.max(0, timeMs) / (RESOURCE_BUCKET_MINUTES * 60_000)) * RESOURCE_BUCKET_MINUTES;
  return Math.min(MAX_RESOURCE_BUCKET, bucket);
}

function aggregateOpeningTimings(rows: OpeningSourceRow[]): OpeningAggregateRow[] {
  const aggregate = new Map<string, number>();

  rows.forEach((row) => {
    if (!row.build_order_json) return;

    let buildOrder: BuildOrderEntry[];
    try {
      const parsed = JSON.parse(row.build_order_json);
      if (!Array.isArray(parsed)) return;
      buildOrder = parsed as BuildOrderEntry[];
    } catch {
      return;
    }

    const firstByMilestone = new Map<string, number>();
    buildOrder
      .filter((entry) => entry && typeof entry.time_ms === 'number')
      .sort((a, b) => a.time_ms - b.time_ms)
      .forEach((entry) => {
        const milestone = classifyOpeningMilestone(entry);
        if (!milestone || firstByMilestone.has(milestone)) return;
        firstByMilestone.set(milestone, openingMinuteBucket(entry.time_ms));
      });

    firstByMilestone.forEach((bucketMinute, milestone) => {
      const playlistId = normalizePlaylistId(row.playlist_id) || 'unknown';
      const key = `${playlistId}::${milestone}::${bucketMinute}`;
      aggregate.set(key, (aggregate.get(key) || 0) + 1);
    });
  });

  return [...aggregate.entries()]
    .map(([key, count]) => {
      const [playlist_id, milestone, bucket] = key.split('::');
      return {
        playlist_id: playlist_id === 'unknown' ? null : playlist_id,
        milestone,
        bucket_minute: Number(bucket),
        count,
      };
    })
    .sort((a, b) => {
      if ((a.playlist_id || '') !== (b.playlist_id || '')) {
        return (a.playlist_id || '').localeCompare(b.playlist_id || '');
      }
      if (a.milestone !== b.milestone) return a.milestone.localeCompare(b.milestone);
      return a.bucket_minute - b.bucket_minute;
    });
}

function aggregateResourceBuckets(rows: RawEventRow[]): ResourceAggregateRow[] {
  type ResourceAccumulator = {
    supplySum: number;
    supplyCount: number;
    energySum: number;
    energyCount: number;
    populationSum: number;
    populationCount: number;
    populationCapSum: number;
    populationCapCount: number;
    sampleCount: number;
  };

  const aggregate = new Map<string, ResourceAccumulator>();

  rows.forEach((row) => {
    let payload: any;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      return;
    }

    const events = Array.isArray(payload?.GameEvents) ? payload.GameEvents : [];
    if (events.length === 0) return;

    const localBuckets = new Map<string, {
      supply: number | null;
      energy: number | null;
      population: number | null;
      populationCap: number | null;
    }>();

    const addLocalSample = (playerIndex: number | string | null | undefined, timeMs: number, resource: any) => {
      const bucket = resourceMinuteBucket(timeMs);
      const key = `${playerIndex ?? 'unknown'}::${bucket}`;
      if (localBuckets.has(key)) return;

      const supply = safeNumber(resource?.Supply ?? resource?.TotalSupply);
      const energy = safeNumber(resource?.Energy ?? resource?.TotalEnergy);
      const population = safeNumber(resource?.Population);
      const populationCap = safeNumber(resource?.PopulationCap);

      if (supply == null && energy == null && population == null && populationCap == null) return;

      localBuckets.set(key, { supply, energy, population, populationCap });
    };

    events.forEach((event: any) => {
      if (event?.EventName !== 'ResourceHeartbeat') return;
      const timeMs = safeNumber(event?.TimeSinceStartMilliseconds);
      if (timeMs == null) return;

      const resources = event?.PlayerResources;
      if (resources && typeof resources === 'object' && !Array.isArray(resources)) {
        Object.entries(resources).forEach(([playerIndex, resource]) => {
          addLocalSample(playerIndex, timeMs, resource);
        });
        return;
      }

      addLocalSample(event?.PlayerIndex, timeMs, event);
    });

    localBuckets.forEach((sample, localKey) => {
      const bucket = Number(localKey.split('::')[1]);
      const playlistId = normalizePlaylistId(row.playlist_id) || 'unknown';
      const key = `${playlistId}::${bucket}`;
      const current = aggregate.get(key) || {
        supplySum: 0,
        supplyCount: 0,
        energySum: 0,
        energyCount: 0,
        populationSum: 0,
        populationCount: 0,
        populationCapSum: 0,
        populationCapCount: 0,
        sampleCount: 0,
      };

      if (sample.supply != null) {
        current.supplySum += sample.supply;
        current.supplyCount += 1;
      }
      if (sample.energy != null) {
        current.energySum += sample.energy;
        current.energyCount += 1;
      }
      if (sample.population != null) {
        current.populationSum += sample.population;
        current.populationCount += 1;
      }
      if (sample.populationCap != null) {
        current.populationCapSum += sample.populationCap;
        current.populationCapCount += 1;
      }
      current.sampleCount += 1;

      aggregate.set(key, current);
    });
  });

  return [...aggregate.entries()]
    .map(([key, value]) => {
      const [playlist_id, bucket] = key.split('::');
      return {
        playlist_id: playlist_id === 'unknown' ? null : playlist_id,
        minute_bucket: Number(bucket),
        avg_supply: value.supplyCount ? value.supplySum / value.supplyCount : null,
        avg_energy: value.energyCount ? value.energySum / value.energyCount : null,
        avg_population: value.populationCount ? value.populationSum / value.populationCount : null,
        avg_population_cap: value.populationCapCount ? value.populationCapSum / value.populationCapCount : null,
        sample_count: value.sampleCount,
      };
    })
    .sort((a, b) => {
      if ((a.playlist_id || '') !== (b.playlist_id || '')) {
        return (a.playlist_id || '').localeCompare(b.playlist_id || '');
      }
      return a.minute_bucket - b.minute_bucket;
    });
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
    leaderMapStats,
    leaderMatchupStats,
    mapPlaylistStats,
    leaderPowerStats,
    matchActivity,
    searchActivity,
    recentSearches,
    topSearches,
    risingSearches,
    openingSources,
    rawEventRows,
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
           LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM match_players WHERE is_human = 1 AND units_destroyed IS NOT NULL)
          ) AS median_units_destroyed,
          (SELECT units_lost FROM match_players
           WHERE is_human = 1 AND units_lost IS NOT NULL
           ORDER BY units_lost
           LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM match_players WHERE is_human = 1 AND units_lost IS NOT NULL)
          ) AS median_units_lost`
      )
    ),
    tryFirst<MedianPowersRow>(
      db.prepare(
        `SELECT leader_powers_used AS median_powers
         FROM match_players
         WHERE is_human = 1 AND leader_powers_used IS NOT NULL
         ORDER BY leader_powers_used
         LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM match_players WHERE is_human = 1 AND leader_powers_used IS NOT NULL)`
      )
    ),
    tryAll<MapDurationRow>(
      db.prepare(
        `SELECT map_id, COUNT(*) AS cnt,
           (SELECT duration_seconds FROM matches m2
            WHERE m2.map_id = m.map_id AND m2.duration_seconds > 0
            ORDER BY m2.duration_seconds
            LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM matches m3 WHERE m3.map_id = m.map_id AND m3.duration_seconds > 0)
           ) AS median_seconds
         FROM matches m
         WHERE map_id IS NOT NULL
           AND map_id NOT LIKE '%FF_%'
           AND duration_seconds > 0
         GROUP BY map_id
         ORDER BY cnt DESC`
      )
    ),
    tryAll<LeaderMapRow>(
      db.prepare(
        `SELECT m.playlist_id, mp.leader_id, m.map_id,
                COUNT(*) AS picks,
                SUM(CASE WHEN mp.outcome = 1 THEN 1 ELSE 0 END) AS wins
         FROM match_players mp
         JOIN matches m ON m.match_id = mp.match_id
         WHERE mp.is_human = 1
           AND mp.leader_id IS NOT NULL
           AND m.map_id IS NOT NULL
           AND m.map_id NOT LIKE '%FF_%'
         GROUP BY m.playlist_id, mp.leader_id, m.map_id`
      )
    ),
    tryAll<MatchupRow>(
      db.prepare(
        `SELECT m.playlist_id,
                a.leader_id AS leader_id,
                b.leader_id AS opponent_leader_id,
                COUNT(*) AS matches,
                SUM(CASE WHEN a.outcome = 1 THEN 1 ELSE 0 END) AS wins
         FROM matches m
         JOIN match_players a ON a.match_id = m.match_id
         JOIN match_players b ON b.match_id = m.match_id
         WHERE m.team_size = 1
           AND a.is_human = 1
           AND b.is_human = 1
           AND a.team_id IS NOT NULL
           AND b.team_id IS NOT NULL
           AND a.team_id != b.team_id
           AND a.leader_id IS NOT NULL
           AND b.leader_id IS NOT NULL
           AND a.player_key < b.player_key
         GROUP BY m.playlist_id, a.leader_id, b.leader_id
         UNION ALL
         SELECT m.playlist_id,
                b.leader_id AS leader_id,
                a.leader_id AS opponent_leader_id,
                COUNT(*) AS matches,
                SUM(CASE WHEN b.outcome = 1 THEN 1 ELSE 0 END) AS wins
         FROM matches m
         JOIN match_players a ON a.match_id = m.match_id
         JOIN match_players b ON b.match_id = m.match_id
         WHERE m.team_size = 1
           AND a.is_human = 1
           AND b.is_human = 1
           AND a.team_id IS NOT NULL
           AND b.team_id IS NOT NULL
           AND a.team_id != b.team_id
           AND a.leader_id IS NOT NULL
           AND b.leader_id IS NOT NULL
           AND a.player_key < b.player_key
         GROUP BY m.playlist_id, b.leader_id, a.leader_id`
      )
    ),
    tryAll<MapPlaylistRow>(
      db.prepare(
        `SELECT playlist_id, map_id, COUNT(*) AS matches
         FROM matches
         WHERE map_id IS NOT NULL
           AND map_id NOT LIKE '%FF_%'
         GROUP BY playlist_id, map_id`
      )
    ),
    tryAll<LeaderPowerRow>(
      db.prepare(
        `SELECT m.playlist_id,
                mp.leader_id,
                plp.power_id,
                SUM(plp.times_cast) AS casts,
                COUNT(*) AS player_uses,
                COUNT(DISTINCT plp.match_id) AS matches_using_power
         FROM player_leader_powers plp
         JOIN match_players mp
           ON mp.match_id = plp.match_id
          AND mp.player_key = plp.player_key
         JOIN matches m ON m.match_id = plp.match_id
         WHERE mp.is_human = 1
           AND mp.leader_id IS NOT NULL
           AND m.map_id IS NOT NULL
           AND m.map_id NOT LIKE '%FF_%'
         GROUP BY m.playlist_id, mp.leader_id, plp.power_id`
      )
    ),
    tryAll<ActivityRow>(
      db.prepare(
        `SELECT CAST(strftime('%w', started_at) AS INTEGER) AS dow,
                CAST(strftime('%H', started_at) AS INTEGER) AS hour,
                COUNT(*) AS count
         FROM matches
         WHERE started_at IS NOT NULL
         GROUP BY dow, hour`
      )
    ),
    tryAll<ActivityRow>(
      db.prepare(
        `SELECT CAST(strftime('%w', searched_at) AS INTEGER) AS dow,
                CAST(strftime('%H', searched_at) AS INTEGER) AS hour,
                COUNT(*) AS count
         FROM search_events
         WHERE searched_at IS NOT NULL
         GROUP BY dow, hour`
      )
    ),
    tryAll<SearchRow>(
      db.prepare(
        `SELECT p.gamertag, MAX(se.searched_at) AS last_searched
         FROM search_events se
         JOIN players p ON p.player_id = se.player_id
         GROUP BY p.player_id, p.gamertag
         ORDER BY last_searched DESC
         LIMIT ${SEARCH_RECENT_LIMIT}`
      )
    ),
    tryAll<SearchCountRow>(
      db.prepare(
        `SELECT p.gamertag, COUNT(*) AS searches
         FROM search_events se
         JOIN players p ON p.player_id = se.player_id
         WHERE se.searched_at >= datetime('now', '-7 day')
         GROUP BY p.player_id, p.gamertag
         ORDER BY searches DESC, p.gamertag ASC
         LIMIT ${SEARCH_TREND_LIMIT}`
      )
    ),
    tryAll<SearchRisingRow>(
      db.prepare(
        `WITH recent AS (
            SELECT player_id, COUNT(*) AS recent_searches
            FROM search_events
            WHERE searched_at >= datetime('now', '-7 day')
            GROUP BY player_id
          ),
          previous AS (
            SELECT player_id, COUNT(*) AS previous_searches
            FROM search_events
            WHERE searched_at >= datetime('now', '-14 day')
              AND searched_at < datetime('now', '-7 day')
            GROUP BY player_id
          )
         SELECT p.gamertag,
                COALESCE(r.recent_searches, 0) AS recent_searches,
                COALESCE(pr.previous_searches, 0) AS previous_searches,
                COALESCE(r.recent_searches, 0) - COALESCE(pr.previous_searches, 0) AS delta
         FROM players p
         JOIN recent r ON r.player_id = p.player_id
         LEFT JOIN previous pr ON pr.player_id = p.player_id
         ORDER BY delta DESC, recent_searches DESC, p.gamertag ASC
         LIMIT ${SEARCH_TREND_LIMIT}`
      )
    ),
    tryAll<OpeningSourceRow>(
      db.prepare(
        `SELECT m.playlist_id, mes.build_order_json
         FROM match_event_summaries mes
         JOIN matches m ON m.match_id = mes.match_id
         JOIN match_players mp
           ON mp.match_id = mes.match_id
          AND mp.player_index = mes.player_index
         WHERE mp.is_human = 1
           AND mes.build_order_json IS NOT NULL
           AND mes.build_order_json != ''
           AND m.map_id IS NOT NULL
           AND m.map_id NOT LIKE '%FF_%'`
      )
    ),
    tryAll<RawEventRow>(
      db.prepare(
        `SELECT rep.match_id, m.playlist_id, rep.payload_json
         FROM raw_event_payloads rep
         JOIN matches m ON m.match_id = rep.match_id
         WHERE rep.payload_json IS NOT NULL
           AND m.map_id IS NOT NULL
           AND m.map_id NOT LIKE '%FF_%'`
      )
    ),
  ]);

  const openingTimingStats = aggregateOpeningTimings(openingSources);
  const resourceBucketStats = aggregateResourceBuckets(rawEventRows);

  return jsonResponse({
    cacheOnly: true,
    totalMatches: totalMatches?.total ?? 0,
    totalPlayers: totalPlayers?.total ?? 0,
    avgDurationSeconds: avgDuration?.avg_seconds ?? null,
    medianUnitsDestroyed: medianUnits?.median_units_destroyed ?? null,
    medianUnitsLost: medianUnits?.median_units_lost ?? null,
    medianPowersPerPlayer: medianPowers?.median_powers ?? null,
    mapDurationStats,
    leaderMapStats,
    leaderMatchupStats,
    mapPlaylistStats,
    leaderPowerStats,
    matchActivity,
    searchActivity,
    recentSearches,
    topSearches,
    risingSearches,
    openingTimingStats,
    resourceBucketStats,
  });
};
