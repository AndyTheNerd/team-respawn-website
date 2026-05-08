import { errorResponse, fetchWithKeyFallback, HALO_ENDPOINTS, jsonResponse, statusFromError } from './_shared';
import { patchMatchSummaryResultsWithResolvedLeaders, syncResolvedLeadersForMatches } from './_shared/leaderCache';

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
  HW2_API_KEY_1?: string;
  HW2_API_KEY_2?: string;
  HW2_API_KEY_3?: string;
};

type MatchSummary = {
  MatchId?: string;
  MatchType?: number;
  GameMode?: number;
  SeasonId?: string;
  PlaylistId?: string;
  MapId?: string;
  MatchStartDate?: { ISO8601Date?: string };
  PlayerMatchDuration?: string;
  PlayerIndex?: number;
  TeamId?: number;
  LeaderId?: number;
  Players?: Array<{
    HumanPlayerId?: { Gamertag?: string } | string;
    Gamertag?: string;
    PlayerId?: string;
    PlayerType?: number;
    TeamId?: number;
    LeaderId?: number;
    MatchOutcome?: number;
    PlayerIndex?: number;
  }>;
};

function patchPlayerSummaryResultsForPlayer(
  results: MatchSummary[],
  playerId: string,
  resolvedByPlayer: Map<string, number | null>
) {
  let changed = false;

  results.forEach((match) => {
    const matchId = match?.MatchId || '';
    if (!matchId) return;
    const resolvedLeaderId = resolvedByPlayer.get(`${matchId}::${playerId}`);
    if (resolvedLeaderId == null || match.LeaderId === resolvedLeaderId) return;
    match.LeaderId = resolvedLeaderId;
    changed = true;
  });

  return changed;
}

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function formatDurationIso(totalSeconds: number | null): string | null {
  if (totalSeconds == null || totalSeconds <= 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes > 0) parts.push(`${minutes}M`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}S`);
  return `PT${parts.join('')}`;
}

function shouldUseCache(errorType: string): boolean {
  return errorType === 'rate_limit' || errorType === 'network' || errorType === 'auth';
}

const MATCHES_API_PAGE_SIZE = 25;

type CompactMatchesCacheRow = {
  payload_json: string;
  fetched_at: string;
};

type CachedMatchRow = {
  match_id: string;
  match_type: number | null;
  game_mode: number | null;
  season_id: string | null;
  playlist_id: string | null;
  map_id: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  ingested_at: string | null;
};

type CachedPlayerRow = {
  match_id: string;
  player_name: string | null;
  is_human: number | null;
  team_id: number | null;
  leader_id: number | null;
  raw_leader_id: number | null;
  resolved_leader_id: number | null;
  outcome: number | null;
  player_index: number | null;
};

async function loadCompactCachedMatches(db: D1Database, gamertag: string, count: number) {
  try {
    const row = await db.prepare(
      'SELECT payload_json, fetched_at FROM player_matches_cache WHERE player_id = ?'
    ).bind(normalizePlayerId(gamertag)).first<CompactMatchesCacheRow>();

    if (!row?.payload_json) return null;

    const parsed = JSON.parse(row.payload_json);
    const basePayload =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    const allResults = Array.isArray(basePayload.Results)
      ? (basePayload.Results as MatchSummary[])
      : [];
    const matchIds = allResults.map((match) => match?.MatchId || '').filter(Boolean);
    const playerId = normalizePlayerId(gamertag);
    const resolvedByPlayer = await syncResolvedLeadersForMatches(db, matchIds);
    const changed =
      patchPlayerSummaryResultsForPlayer(allResults, playerId, resolvedByPlayer) ||
      patchMatchSummaryResultsWithResolvedLeaders(allResults, resolvedByPlayer);
    const results = allResults.slice(0, count);

    if (changed) {
      await db.batch([
        db.prepare(
          `UPDATE player_matches_cache
           SET payload_json = ?
           WHERE player_id = ?`
        ).bind(JSON.stringify({ ...basePayload, Results: allResults }), playerId),
      ]);
    }

    return {
      payload: {
        ...basePayload,
        Results: results,
        _meta: { cached: true, fetchedAt: row.fetched_at },
      },
      fetchedAt: row.fetched_at,
    };
  } catch {
    return null;
  }
}

async function loadLegacyCachedMatches(db: D1Database, gamertag: string, count: number) {
  const playerId = normalizePlayerId(gamertag);
  const matchRowsResult = await db.prepare(
    `SELECT
       m.match_id,
       m.match_type,
       m.game_mode,
       m.season_id,
       m.playlist_id,
       m.map_id,
       m.started_at,
       m.duration_seconds,
       m.ingested_at
     FROM match_players mp
     JOIN matches m ON m.match_id = mp.match_id
     WHERE mp.player_id = ?
     ORDER BY m.started_at DESC
     LIMIT ?`
  ).bind(playerId, count).all<CachedMatchRow>();

  const matchRows = matchRowsResult?.results || [];
  if (matchRows.length === 0) return null;

  const matchIds = matchRows.map((row) => row.match_id);
  await syncResolvedLeadersForMatches(db, matchIds);
  const placeholders = matchIds.map(() => '?').join(', ');
  const playerRowsResult = await db.prepare(
    `SELECT match_id, player_name, is_human, team_id, leader_id, raw_leader_id, resolved_leader_id, outcome, player_index
     FROM match_players
     WHERE match_id IN (${placeholders})`
  ).bind(...matchIds).all<CachedPlayerRow>();
  const playerRows = playerRowsResult?.results || [];

  const playersByMatch = new Map<string, MatchSummary['Players']>();
  playerRows.forEach((row) => {
    const list = playersByMatch.get(row.match_id) || [];
    const isHuman = row.is_human === 1;
    const name = row.player_name || '';
    list.push({
      HumanPlayerId: isHuman ? { Gamertag: name } : undefined,
      Gamertag: isHuman ? name : undefined,
      PlayerId: isHuman ? name : undefined,
      PlayerType: isHuman ? 0 : 3,
      TeamId: row.team_id ?? undefined,
      LeaderId: row.resolved_leader_id ?? row.leader_id ?? row.raw_leader_id ?? undefined,
      MatchOutcome: row.outcome ?? undefined,
      PlayerIndex: row.player_index ?? undefined,
    });
    playersByMatch.set(row.match_id, list);
  });

  let latestIngested = '';
  const results: MatchSummary[] = matchRows.map((row) => {
    if (row.ingested_at && row.ingested_at > latestIngested) {
      latestIngested = row.ingested_at;
    }
    return {
      MatchId: row.match_id,
      MatchType: row.match_type ?? undefined,
      GameMode: row.game_mode ?? undefined,
      SeasonId: row.season_id ?? undefined,
      PlaylistId: row.playlist_id ?? undefined,
      MapId: row.map_id ?? undefined,
      MatchStartDate: row.started_at ? { ISO8601Date: row.started_at } : undefined,
      PlayerMatchDuration: formatDurationIso(row.duration_seconds),
      Players: playersByMatch.get(row.match_id) || [],
    };
  });

  return {
    payload: { Results: results, _meta: { cached: true, fetchedAt: latestIngested || null } },
    fetchedAt: latestIngested || null,
  };
}

async function loadCachedMatches(db: D1Database, gamertag: string, count: number) {
  const compact = await loadCompactCachedMatches(db, gamertag, count);
  if (compact) return compact;
  return loadLegacyCachedMatches(db, gamertag, count);
}

async function fetchMatchesBatched(gamertag: string, count: number, apiKeys: string[]) {
  const encoded = encodeURIComponent(gamertag);
  const collected: MatchSummary[] = [];
  let start = 0;

  while (collected.length < count) {
    const remaining = count - collected.length;
    const batchCount = Math.min(remaining, MATCHES_API_PAGE_SIZE);
    const url = `${HALO_ENDPOINTS.HALO_API_URL}/players/${encoded}/matches?start=${start}&count=${batchCount}`;
    const batchResult = await fetchWithKeyFallback<{ Results: MatchSummary[] }>(url, apiKeys);

    if (!batchResult.ok) {
      if (collected.length > 0) break;
      return batchResult;
    }

    const batchMatches = Array.isArray(batchResult.data?.Results) ? batchResult.data.Results : [];
    if (batchMatches.length === 0) break;

    collected.push(...batchMatches);
    if (batchMatches.length < batchCount) break;
    start += batchMatches.length;
  }

  return { ok: true as const, data: { Results: collected.slice(0, count) } };
}

/** Log a profile lookup for /api/hw2/recent-searches (independent of match cache writes). */
async function recordCommunitySearch(db: Env['DB'], gamertag: string, matchCount: number) {
  if (!db) return;
  const now = new Date().toISOString();
  const playerId = normalizePlayerId(gamertag);
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO players (player_id, gamertag, last_seen_at)
         VALUES (?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           last_seen_at = excluded.last_seen_at`
      ).bind(playerId, gamertag, now),
      db.prepare(
        `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), playerId, now, matchCount),
    ]);
  } catch (err) {
    console.error('[matches] recordCommunitySearch failed:', err);
  }
}

async function storeMatchSummaries(db: Env['DB'], gamertag: string, matches: MatchSummary[]) {
  if (!db || matches.length === 0) return;
  const now = new Date().toISOString();
  const playerId = normalizePlayerId(gamertag);
  const matchIds = matches.map((match) => match?.MatchId || '').filter(Boolean);
  const resolvedByPlayer = await syncResolvedLeadersForMatches(db, matchIds);
  patchPlayerSummaryResultsForPlayer(matches, playerId, resolvedByPlayer);
  patchMatchSummaryResultsWithResolvedLeaders(matches, resolvedByPlayer);

  try {
    await db.batch([
      db.prepare(
        `INSERT INTO player_matches_cache (player_id, gamertag, payload_json, fetched_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           payload_json = excluded.payload_json,
           fetched_at = excluded.fetched_at`
      ).bind(playerId, gamertag, JSON.stringify({ Results: matches }), now),
      db.prepare(
        `INSERT INTO players (player_id, gamertag, last_seen_at)
         VALUES (?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           last_seen_at = excluded.last_seen_at`
      ).bind(playerId, gamertag, now),
      db.prepare(
        `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), playerId, now, matches.length),
    ]);
  } catch (cacheErr) {
    console.error('[matches] player_matches_cache write failed; D1 will be stale:', cacheErr);
    await db.batch([
      db.prepare(
        `INSERT INTO players (player_id, gamertag, last_seen_at)
         VALUES (?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           gamertag = excluded.gamertag,
           last_seen_at = excluded.last_seen_at`
      ).bind(playerId, gamertag, now),
      db.prepare(
        `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), playerId, now, matches.length),
    ]);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  let payload: { gamertag?: string; count?: number } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const gamertag = payload?.gamertag?.trim() || '';
  const count = Math.min(Math.max(Number(payload?.count ?? 10), 1), 100);
  if (!gamertag) {
    return errorResponse({ type: 'unknown', message: 'Gamertag is required.' }, 400);
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );
  const result = await fetchMatchesBatched(gamertag, count, apiKeys);
  if (!result.ok) {
    if (shouldUseCache(result.error.type)) {
      const cached = await loadCachedMatches(env.DB, gamertag, count);
      if (cached?.payload) {
        const payload = cached.payload as { Results?: unknown[] };
        const matchCount = Array.isArray(payload.Results) ? payload.Results.length : 0;
        await recordCommunitySearch(env.DB, gamertag, matchCount);
        return jsonResponse({
          ...(cached.payload as Record<string, unknown>),
          _meta: { ...(cached.payload as any)?._meta, reason: result.error.type },
        });
      }
    }
    return errorResponse(result.error, statusFromError(result.error));
  }

  const matches = Array.isArray(result.data?.Results) ? result.data.Results : [];
  await storeMatchSummaries(env.DB, gamertag, matches);
  if (matches.length === 0) {
    await recordCommunitySearch(env.DB, gamertag, 0);
  }

  return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
};
