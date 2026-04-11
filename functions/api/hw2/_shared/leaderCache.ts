import { resolvePlayerLeaderId, type LeaderResolutionConfidence, type LeaderResolutionSource } from '../../../../src/lib/hw2/leaderResolution';

export type D1PreparedStatement = {
  bind: (...args: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: unknown[]) => Promise<unknown>;
};

type LeaderPowerStats = Record<string, number | { TimesCast?: number; TotalPlays?: number }>;

type StoredMatchPlayerRow = {
  match_id: string;
  player_key: string;
  leader_id: number | null;
  raw_leader_id: number | null;
  resolved_leader_id: number | null;
  leader_resolution_source: string | null;
  leader_resolution_confidence: string | null;
  leader_resolution_reason: string | null;
};

type StoredLeaderPowerRow = {
  match_id: string;
  player_key: string;
  power_id: string;
  times_cast: number;
};

type PlayerIdentity = {
  HumanPlayerId?: { Gamertag?: string } | string;
  Gamertag?: string;
  IsHuman?: boolean;
  PlayerType?: number;
  PlayerIndex?: number;
  ComputerPlayerId?: number;
  TeamId?: number;
  LeaderId?: number | null;
};

type MatchSummary = {
  MatchId?: string;
  Players?: PlayerIdentity[];
};

function parseLeaderId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePlayerId(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

function getHumanPlayerName(player: PlayerIdentity): string | null {
  const humanId =
    (typeof player?.HumanPlayerId === 'string' && player.HumanPlayerId) ||
    (typeof player?.HumanPlayerId === 'object' && player.HumanPlayerId?.Gamertag) ||
    player?.Gamertag;
  return humanId ? String(humanId) : null;
}

function resolveIsHuman(player: PlayerIdentity): boolean {
  if (typeof player?.IsHuman === 'boolean') return player.IsHuman;
  if (player?.PlayerType === 2 || player?.PlayerType === 3) return false;
  if (player?.PlayerType === 0 || player?.PlayerType === 1) return true;
  return getHumanPlayerName(player) != null;
}

function getPlayerKey(player: PlayerIdentity, index: number): string {
  if (resolveIsHuman(player)) {
    const humanId = getHumanPlayerName(player);
    if (humanId) return normalizePlayerId(humanId);
  }
  if (player?.ComputerPlayerId != null) return `ai:${player.ComputerPlayerId}`;
  if (player?.TeamId != null) return `ai:${player.TeamId}:${index}`;
  return `ai:${index}`;
}

function getLeaderState(row: StoredMatchPlayerRow) {
  return {
    rawLeaderId: parseLeaderId(row.raw_leader_id ?? row.leader_id),
    resolvedLeaderId: parseLeaderId(row.resolved_leader_id ?? row.leader_id ?? row.raw_leader_id),
    source: row.leader_resolution_source ?? null,
    confidence: row.leader_resolution_confidence ?? null,
    reason: row.leader_resolution_reason ?? null,
  };
}

function buildLeaderPowerStats(powerRows: StoredLeaderPowerRow[]) {
  const powerStatsByPlayer = new Map<string, LeaderPowerStats>();
  powerRows.forEach((row) => {
    const key = `${row.match_id}::${row.player_key}`;
    const stats = powerStatsByPlayer.get(key) || {};
    stats[row.power_id] = row.times_cast;
    powerStatsByPlayer.set(key, stats);
  });
  return powerStatsByPlayer;
}

function isLeaderResolutionSource(value: string | null): value is LeaderResolutionSource {
  return value === 'power-signature' || value === 'event' || value === 'raw' || value === 'unknown';
}

function isLeaderResolutionConfidence(value: string | null): value is LeaderResolutionConfidence {
  return value === 'high' || value === 'medium' || value === 'low' || value === 'none';
}

export async function syncResolvedLeadersForMatches(db: D1Database, matchIds: string[]) {
  const uniqueMatchIds = [...new Set(matchIds.filter(Boolean))];
  const resolvedByPlayer = new Map<string, number | null>();

  if (uniqueMatchIds.length === 0) {
    return resolvedByPlayer;
  }

  const placeholders = uniqueMatchIds.map(() => '?').join(', ');
  const playerRowsResult = await db.prepare(
    `SELECT
       match_id,
       player_key,
       leader_id,
       raw_leader_id,
       resolved_leader_id,
       leader_resolution_source,
       leader_resolution_confidence,
       leader_resolution_reason
     FROM match_players
     WHERE match_id IN (${placeholders})`
  ).bind(...uniqueMatchIds).all<StoredMatchPlayerRow>();

  const playerRows = playerRowsResult?.results || [];
  if (playerRows.length === 0) {
    return resolvedByPlayer;
  }

  const powerRowsResult = await db.prepare(
    `SELECT match_id, player_key, power_id, times_cast
     FROM player_leader_powers
     WHERE match_id IN (${placeholders})`
  ).bind(...uniqueMatchIds).all<StoredLeaderPowerRow>();

  const powerStatsByPlayer = buildLeaderPowerStats(powerRowsResult?.results || []);
  const statements: unknown[] = [];

  playerRows.forEach((row) => {
    const playerRef = `${row.match_id}::${row.player_key}`;
    const current = getLeaderState(row);
    const resolution = resolvePlayerLeaderId({
      rawLeaderId: current.rawLeaderId,
      leaderPowerStats: powerStatsByPlayer.get(playerRef),
    });
    const resolvedLeaderId = resolution.resolvedLeaderId ?? current.rawLeaderId;
    resolvedByPlayer.set(playerRef, resolvedLeaderId);

    const nextSource = resolution.source;
    const nextConfidence = resolution.confidence;
    const nextReason = resolution.reason;

    if (
      current.rawLeaderId === resolution.rawLeaderId &&
      current.resolvedLeaderId === resolvedLeaderId &&
      current.source === nextSource &&
      current.confidence === nextConfidence &&
      current.reason === nextReason &&
      row.leader_id === resolvedLeaderId
    ) {
      return;
    }

    statements.push(
      db.prepare(
        `UPDATE match_players
         SET raw_leader_id = ?,
             resolved_leader_id = ?,
             leader_id = ?,
             leader_resolution_source = ?,
             leader_resolution_confidence = ?,
             leader_resolution_reason = ?
         WHERE match_id = ? AND player_key = ?`
      ).bind(
        resolution.rawLeaderId,
        resolvedLeaderId,
        resolvedLeaderId,
        nextSource,
        nextConfidence,
        nextReason,
        row.match_id,
        row.player_key
      )
    );
  });

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return resolvedByPlayer;
}

export function patchMatchPayloadWithResolvedLeaders(
  matchId: string,
  payload: { Players?: PlayerIdentity[] | Record<string, PlayerIdentity> } & Record<string, unknown>,
  resolvedByPlayer: Map<string, number | null>
) {
  const playersRaw = payload?.Players;
  const players = Array.isArray(playersRaw)
    ? playersRaw
    : (playersRaw && typeof playersRaw === 'object')
      ? Object.values(playersRaw)
      : [];

  let changed = false;
  players.forEach((player, index) => {
    const resolvedLeaderId = resolvedByPlayer.get(`${matchId}::${getPlayerKey(player, index)}`);
    if (resolvedLeaderId == null || player.LeaderId === resolvedLeaderId) return;
    player.LeaderId = resolvedLeaderId;
    changed = true;
  });

  return changed;
}

export function patchMatchSummaryResultsWithResolvedLeaders(
  results: MatchSummary[],
  resolvedByPlayer: Map<string, number | null>
) {
  let changed = false;

  results.forEach((match) => {
    const matchId = match?.MatchId || '';
    if (!matchId || !Array.isArray(match?.Players)) return;

    match.Players.forEach((player, index) => {
      const resolvedLeaderId = resolvedByPlayer.get(`${matchId}::${getPlayerKey(player, index)}`);
      if (resolvedLeaderId == null || player.LeaderId === resolvedLeaderId) return;
      player.LeaderId = resolvedLeaderId;
      changed = true;
    });
  });

  return changed;
}

export function getStoredResolvedLeaderId(row: {
  leader_id?: number | null;
  raw_leader_id?: number | null;
  resolved_leader_id?: number | null;
  leader_resolution_source?: string | null;
  leader_resolution_confidence?: string | null;
}) {
  const source = isLeaderResolutionSource(row.leader_resolution_source ?? null)
    ? row.leader_resolution_source
    : null;
  const confidence = isLeaderResolutionConfidence(row.leader_resolution_confidence ?? null)
    ? row.leader_resolution_confidence
    : null;
  const resolvedLeaderId = parseLeaderId(row.resolved_leader_id ?? row.leader_id ?? row.raw_leader_id);
  return { resolvedLeaderId, source, confidence };
}
