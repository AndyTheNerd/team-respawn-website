import { errorResponse, fetchWithKeyFallback, HALO_ENDPOINTS, jsonResponse, statusFromError } from './_shared';

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
  Players?: Array<{
    HumanPlayerId?: string;
    PlayerType?: number;
    TeamId?: number;
    LeaderId?: number;
    MatchOutcome?: number;
  }>;
};

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function parseDurationSeconds(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  const seconds = match[3] ? Number(match[3]) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return Math.round(hours * 3600 + minutes * 60 + seconds);
}

function computeTeamSize(players?: MatchSummary['Players']): number | null {
  if (!Array.isArray(players) || players.length === 0) return null;
  const counts = new Map<number, number>();
  players.forEach((player) => {
    const teamId = player?.TeamId;
    if (typeof teamId !== 'number') return;
    counts.set(teamId, (counts.get(teamId) || 0) + 1);
  });
  if (counts.size === 0) return null;
  return Math.max(...counts.values());
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
  outcome: number | null;
  player_index: number | null;
};

async function loadCachedMatches(db: D1Database, gamertag: string, count: number) {
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
  const placeholders = matchIds.map(() => '?').join(', ');
  const playerRowsResult = await db.prepare(
    `SELECT match_id, player_name, is_human, team_id, leader_id, outcome, player_index
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
      LeaderId: row.leader_id ?? undefined,
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

async function storeMatchSummaries(db: Env['DB'], gamertag: string, matches: MatchSummary[]) {
  if (!db || matches.length === 0) return;
  const now = new Date().toISOString();
  const playerId = normalizePlayerId(gamertag);
  const statements: unknown[] = [];

  statements.push(
    db.prepare(
      `INSERT INTO players (player_id, gamertag, last_seen_at)
       VALUES (?, ?, ?)
       ON CONFLICT(player_id) DO UPDATE SET
         gamertag = excluded.gamertag,
         last_seen_at = excluded.last_seen_at`
    ).bind(playerId, gamertag, now)
  );

  statements.push(
    db.prepare(
      `INSERT INTO search_events (search_id, player_id, searched_at, match_count)
       VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), playerId, now, matches.length)
  );

  matches.forEach((match) => {
    const matchId = match?.MatchId ? String(match.MatchId) : '';
    if (!matchId) return;

    const startedAt = match?.MatchStartDate?.ISO8601Date || null;
    const durationSeconds = parseDurationSeconds(match?.PlayerMatchDuration);
    const teamSize = computeTeamSize(match?.Players);

    statements.push(
      db.prepare(
        `INSERT INTO matches (
           match_id,
           match_type,
           game_mode,
           season_id,
           playlist_id,
           map_id,
           started_at,
           duration_seconds,
           team_size,
           ingested_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(match_id) DO UPDATE SET
           match_type = COALESCE(excluded.match_type, matches.match_type),
           game_mode = COALESCE(excluded.game_mode, matches.game_mode),
           season_id = COALESCE(excluded.season_id, matches.season_id),
           playlist_id = COALESCE(excluded.playlist_id, matches.playlist_id),
           map_id = COALESCE(excluded.map_id, matches.map_id),
           started_at = COALESCE(excluded.started_at, matches.started_at),
           duration_seconds = COALESCE(excluded.duration_seconds, matches.duration_seconds),
           team_size = COALESCE(excluded.team_size, matches.team_size),
           ingested_at = excluded.ingested_at`
      ).bind(
        matchId,
        match?.MatchType ?? null,
        match?.GameMode ?? null,
        match?.SeasonId ?? null,
        match?.PlaylistId ?? null,
        match?.MapId ?? null,
        startedAt,
        durationSeconds,
        teamSize,
        now
      )
    );

    const players = Array.isArray(match?.Players) ? match.Players : [];
    players.forEach((player, index) => {
      const humanId = typeof player?.HumanPlayerId === 'string' ? player.HumanPlayerId : null;
      const playerName = humanId || (player?.PlayerType === 3 ? 'AI' : 'Unknown');
      const playerKey = humanId ? humanId.toLowerCase() : `ai:${player?.TeamId ?? 'unknown'}:${index}`;
      const isHuman = humanId ? 1 : 0;

      if (humanId) {
        const normalized = normalizePlayerId(humanId);
        statements.push(
          db.prepare(
            `INSERT INTO players (player_id, gamertag, last_seen_at)
             VALUES (?, ?, ?)
             ON CONFLICT(player_id) DO UPDATE SET
               gamertag = excluded.gamertag,
               last_seen_at = excluded.last_seen_at`
          ).bind(normalized, humanId, now)
        );
      }

      statements.push(
        db.prepare(
          `INSERT INTO match_players (
             match_id,
             player_key,
             player_id,
             player_name,
             is_human,
             team_id,
             leader_id,
             outcome,
             units_destroyed,
             units_lost,
             leader_powers_used,
             player_index
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(match_id, player_key) DO UPDATE SET
             player_id = COALESCE(excluded.player_id, match_players.player_id),
             player_name = COALESCE(excluded.player_name, match_players.player_name),
             is_human = COALESCE(excluded.is_human, match_players.is_human),
             team_id = COALESCE(excluded.team_id, match_players.team_id),
             leader_id = COALESCE(excluded.leader_id, match_players.leader_id),
             outcome = COALESCE(excluded.outcome, match_players.outcome),
             units_destroyed = COALESCE(match_players.units_destroyed, excluded.units_destroyed),
             units_lost = COALESCE(match_players.units_lost, excluded.units_lost),
             leader_powers_used = COALESCE(match_players.leader_powers_used, excluded.leader_powers_used),
             player_index = COALESCE(excluded.player_index, match_players.player_index)`
        ).bind(
          matchId,
          playerKey,
          humanId ? normalizePlayerId(humanId) : null,
          playerName,
          isHuman,
          player?.TeamId ?? null,
          player?.LeaderId ?? null,
          player?.MatchOutcome ?? null,
          null,
          null,
          null,
          index
        )
      );
    });
  });

  if (statements.length > 0) {
    await db.batch(statements);
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

  return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
};
