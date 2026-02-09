import { errorResponse, fetchWithKeyFallback, HALO_ENDPOINTS, jsonResponse, statusFromError } from './_shared';

type Env = {
  DB?: {
    prepare: (query: string) => { bind: (...args: unknown[]) => unknown };
    batch: (statements: unknown[]) => Promise<unknown>;
  };
  HW2_API_KEY_1?: string;
  HW2_API_KEY_2?: string;
  HW2_API_KEY_3?: string;
  STORE_RAW_MATCHES?: string;
};

type MatchPlayerDetail = {
  TeamId?: number;
  LeaderId?: number;
  MatchOutcome?: number;
  IsHuman?: boolean;
  Gamertag?: string;
  HumanPlayerId?: { Gamertag?: string } | string;
  ComputerPlayerId?: number;
  UnitStats?: Record<string, { TotalDestroyed?: number; TotalLost?: number }>;
  LeaderPowerStats?: Record<string, number | { TimesCast?: number; TotalPlays?: number }>;
  PlayerIndex?: number;
};

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function getPlayerName(player: MatchPlayerDetail): string {
  const humanId =
    (typeof player?.HumanPlayerId === 'string' && player.HumanPlayerId) ||
    (typeof player?.HumanPlayerId === 'object' && player.HumanPlayerId?.Gamertag) ||
    player?.Gamertag;
  if (humanId) return String(humanId);
  if (player?.IsHuman === false && player?.ComputerPlayerId != null) {
    return `AI ${player.ComputerPlayerId}`;
  }
  if (player?.IsHuman === false) return 'AI';
  return 'Unknown';
}

function getPlayerId(player: MatchPlayerDetail): string | null {
  const humanId =
    (typeof player?.HumanPlayerId === 'string' && player.HumanPlayerId) ||
    (typeof player?.HumanPlayerId === 'object' && player.HumanPlayerId?.Gamertag) ||
    player?.Gamertag;
  if (!humanId) return null;
  return normalizePlayerId(String(humanId));
}

function getPlayerKey(player: MatchPlayerDetail, index: number): string {
  const humanId = getPlayerId(player);
  if (humanId) return humanId;
  if (player?.ComputerPlayerId != null) return `ai:${player.ComputerPlayerId}`;
  if (player?.TeamId != null) return `ai:${player.TeamId}:${index}`;
  return `ai:${index}`;
}

function sumUnitStats(unitStats?: MatchPlayerDetail['UnitStats']) {
  let destroyed = 0;
  let lost = 0;
  if (unitStats && typeof unitStats === 'object') {
    Object.values(unitStats).forEach((unit) => {
      destroyed += unit?.TotalDestroyed || 0;
      lost += unit?.TotalLost || 0;
    });
  }
  return { destroyed, lost };
}

function extractLeaderPowers(stats?: MatchPlayerDetail['LeaderPowerStats']) {
  const entries: Array<{ powerId: string; times: number }> = [];
  if (!stats || typeof stats !== 'object') return entries;
  Object.entries(stats).forEach(([powerId, value]) => {
    const times = typeof value === 'number'
      ? value
      : (value?.TimesCast ?? value?.TotalPlays ?? 0);
    if (times > 0) {
      entries.push({ powerId, times });
    }
  });
  entries.sort((a, b) => b.times - a.times);
  return entries;
}

async function storeMatchDetail(
  db: Env['DB'],
  matchId: string,
  payload: { Players?: MatchPlayerDetail[] } & Record<string, unknown>,
  storeRaw: boolean
) {
  if (!db) return;
  const now = new Date().toISOString();
  const statements: unknown[] = [];

  statements.push(
    db.prepare(
      `INSERT INTO matches (match_id, ingested_at)
       VALUES (?, ?)
       ON CONFLICT(match_id) DO UPDATE SET
         ingested_at = excluded.ingested_at`
    ).bind(matchId, now)
  );

  if (storeRaw) {
    statements.push(
      db.prepare(
        `INSERT INTO raw_match_payloads (match_id, payload_json, fetched_at)
         VALUES (?, ?, ?)
         ON CONFLICT(match_id) DO UPDATE SET
           payload_json = excluded.payload_json,
           fetched_at = excluded.fetched_at`
      ).bind(matchId, JSON.stringify(payload), now)
    );
  }

  const playersRaw = payload?.Players;
  const players = Array.isArray(playersRaw)
    ? playersRaw
    : (playersRaw && typeof playersRaw === 'object')
      ? Object.values(playersRaw)
      : [];

  const teamTotals = new Map<number, { destroyed: number; lost: number; powers: number }>();

  players.forEach((player, index) => {
    const teamId = player?.TeamId;
    const leaderId = player?.LeaderId ?? null;
    const outcome = player?.MatchOutcome ?? null;
    const playerId = getPlayerId(player);
    const playerName = getPlayerName(player);
    const playerKey = getPlayerKey(player, index);
    const isHuman = playerId ? 1 : 0;
    const { destroyed, lost } = sumUnitStats(player?.UnitStats);
    const powerEntries = extractLeaderPowers(player?.LeaderPowerStats);
    const powerCount = powerEntries.reduce((sum, entry) => sum + entry.times, 0);

    if (playerId) {
      statements.push(
        db.prepare(
          `INSERT INTO players (player_id, gamertag, last_seen_at)
           VALUES (?, ?, ?)
           ON CONFLICT(player_id) DO UPDATE SET
             gamertag = excluded.gamertag,
             last_seen_at = excluded.last_seen_at`
        ).bind(playerId, playerName, now)
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
           units_destroyed = COALESCE(excluded.units_destroyed, match_players.units_destroyed),
           units_lost = COALESCE(excluded.units_lost, match_players.units_lost),
           leader_powers_used = COALESCE(excluded.leader_powers_used, match_players.leader_powers_used),
           player_index = COALESCE(excluded.player_index, match_players.player_index)`
      ).bind(
        matchId,
        playerKey,
        playerId,
        playerName,
        isHuman,
        teamId ?? null,
        leaderId,
        outcome,
        destroyed,
        lost,
        powerCount,
        player?.PlayerIndex ?? index
      )
    );

    powerEntries.forEach((entry) => {
      statements.push(
        db.prepare(
          `INSERT INTO player_leader_powers (match_id, player_key, power_id, times_cast)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(match_id, player_key, power_id) DO UPDATE SET
             times_cast = excluded.times_cast`
        ).bind(matchId, playerKey, entry.powerId, entry.times)
      );
    });

    if (typeof teamId === 'number') {
      const existing = teamTotals.get(teamId) || { destroyed: 0, lost: 0, powers: 0 };
      existing.destroyed += destroyed;
      existing.lost += lost;
      existing.powers += powerCount;
      teamTotals.set(teamId, existing);
    }
  });

  teamTotals.forEach((totals, teamId) => {
    statements.push(
      db.prepare(
        `INSERT INTO match_teams (
           match_id,
           team_id,
           outcome,
           units_destroyed,
           units_lost,
           leader_powers_used
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(match_id, team_id) DO UPDATE SET
           outcome = COALESCE(excluded.outcome, match_teams.outcome),
           units_destroyed = COALESCE(excluded.units_destroyed, match_teams.units_destroyed),
           units_lost = COALESCE(excluded.units_lost, match_teams.units_lost),
           leader_powers_used = COALESCE(excluded.leader_powers_used, match_teams.leader_powers_used)`
      ).bind(
        matchId,
        teamId,
        null,
        totals.destroyed,
        totals.lost,
        totals.powers
      )
    );
  });

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse(
      { type: 'unknown', message: 'Database not configured. Bind D1 as DB.' },
      500
    );
  }

  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId') || '';
  if (!matchId) {
    return errorResponse({ type: 'unknown', message: 'matchId is required.' }, 400);
  }

  const apiKeys = [env.HW2_API_KEY_1, env.HW2_API_KEY_2, env.HW2_API_KEY_3].filter(
    (key): key is string => Boolean(key)
  );

  const encoded = encodeURIComponent(matchId);
  const urlMatch = `${HALO_ENDPOINTS.HALO_API_URL}/matches/${encoded}`;
  const result = await fetchWithKeyFallback<any>(urlMatch, apiKeys);
  if (!result.ok) {
    return errorResponse(result.error, statusFromError(result.error));
  }

  const storeRaw = env.STORE_RAW_MATCHES === '1';
  await storeMatchDetail(env.DB, matchId, result.data, storeRaw);

  return jsonResponse(result.data);
};
