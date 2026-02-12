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
  STORE_RAW_EVENTS?: string;
};

type PlayerInfo = {
  teamId: number | null;
  playerType: number | null;
};

type BuildOrderEntry = {
  time_ms: number;
  kind: 'building' | 'upgrade' | 'unit' | 'unit_upgrade';
  object_id?: string;
  instance_id?: number;
};

type SummaryRow = {
  playerIndex: number;
  teamId: number | null;
  unitsTrained: number;
  buildingsCompleted: number;
  buildingUpgrades: number;
  unitUpgrades: number;
  leaderPowersCast: number;
  veterancyPromotions: number;
  buildOrder: BuildOrderEntry[];
  firstEventMs: number | null;
  lastEventMs: number | null;
};

type CachedEventRow = {
  payload_json: string;
  fetched_at: string;
  is_complete: number | null;
};

function shouldUseCache(errorType: string): boolean {
  return errorType === 'rate_limit' || errorType === 'network' || errorType === 'auth';
}

async function loadCachedEvents(db: D1Database, matchId: string) {
  const row = await db.prepare(
    'SELECT payload_json, fetched_at, is_complete FROM raw_event_payloads WHERE match_id = ?'
  ).bind(matchId).first<CachedEventRow>();
  if (!row?.payload_json) return null;
  try {
    const payload = JSON.parse(row.payload_json);
    return { payload, fetchedAt: row.fetched_at, isComplete: row.is_complete };
  } catch {
    return null;
  }
}

function getOrInitSummary(map: Map<number, SummaryRow>, playerIndex: number, teamId: number | null): SummaryRow {
  const existing = map.get(playerIndex);
  if (existing) return existing;
  const row: SummaryRow = {
    playerIndex,
    teamId,
    unitsTrained: 0,
    buildingsCompleted: 0,
    buildingUpgrades: 0,
    unitUpgrades: 0,
    leaderPowersCast: 0,
    veterancyPromotions: 0,
    buildOrder: [],
    firstEventMs: null,
    lastEventMs: null,
  };
  map.set(playerIndex, row);
  return row;
}

function updateEventWindow(row: SummaryRow, timeMs: number) {
  row.firstEventMs = row.firstEventMs == null ? timeMs : Math.min(row.firstEventMs, timeMs);
  row.lastEventMs = row.lastEventMs == null ? timeMs : Math.max(row.lastEventMs, timeMs);
}

async function storeMatchEvents(
  db: Env['DB'],
  matchId: string,
  payload: any,
  storeRaw: boolean
) {
  if (!db) return;
  const now = new Date().toISOString();
  const statements: unknown[] = [];

  const isComplete = payload?.IsCompleteSetOfEvents === true ? 1 : 0;
  if (storeRaw) {
    statements.push(
      db.prepare(
        `INSERT INTO raw_event_payloads (match_id, payload_json, is_complete, fetched_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(match_id) DO UPDATE SET
           payload_json = excluded.payload_json,
           is_complete = excluded.is_complete,
           fetched_at = excluded.fetched_at`
      ).bind(matchId, JSON.stringify(payload), isComplete, now)
    );
  }

  const events = Array.isArray(payload?.GameEvents) ? payload.GameEvents : [];
  const playersByIndex = new Map<number, PlayerInfo>();
  events.forEach((event: any) => {
    if (event?.EventName !== 'PlayerJoinedMatch') return;
    const index = event?.PlayerIndex;
    if (typeof index !== 'number') return;
    const teamId = typeof event?.TeamId === 'number' ? event.TeamId : null;
    const playerType = typeof event?.PlayerType === 'number' ? event.PlayerType : null;
    playersByIndex.set(index, { teamId, playerType });
  });

  const summaries = new Map<number, SummaryRow>();
  const buildOrderKinds = new Set<BuildOrderEntry['kind']>(['building', 'upgrade', 'unit', 'unit_upgrade']);
  const buildOrderLimit = 8;
  const buildingInstanceMap = new Map<number, string>();

  events.forEach((event: any) => {
    const instanceId = event?.InstanceId;
    if (typeof instanceId === 'number' && event?.EventName === 'BuildingConstructionQueued' && event?.BuildingId) {
      buildingInstanceMap.set(instanceId, String(event.BuildingId));
    }

    const timeMs = event?.TimeSinceStartMilliseconds;
    if (typeof timeMs !== 'number') return;
    const playerIndex = typeof event?.PlayerIndex === 'number' ? event.PlayerIndex : null;
    if (playerIndex == null) return;
    const playerInfo = playersByIndex.get(playerIndex);
    const teamId = playerInfo?.teamId ?? null;

    const row = getOrInitSummary(summaries, playerIndex, teamId);
    updateEventWindow(row, timeMs);

    if (event?.EventName === 'BuildingConstructionCompleted') {
      row.buildingsCompleted += 1;
      if (buildOrderKinds.has('building') && row.buildOrder.length < buildOrderLimit) {
        const buildingId = buildingInstanceMap.get(event?.InstanceId) || event?.BuildingId;
        row.buildOrder.push({
          time_ms: timeMs,
          kind: 'building',
          object_id: buildingId ? String(buildingId) : undefined,
          instance_id: typeof event?.InstanceId === 'number' ? event.InstanceId : undefined,
        });
      }
    }

    if (event?.EventName === 'BuildingUpgraded') {
      row.buildingUpgrades += 1;
      const nextId = event?.NewBuildingId ? String(event.NewBuildingId) : '';
      if (typeof instanceId === 'number' && nextId) {
        buildingInstanceMap.set(instanceId, nextId);
      }
      if (buildOrderKinds.has('upgrade') && row.buildOrder.length < buildOrderLimit) {
        row.buildOrder.push({
          time_ms: timeMs,
          kind: 'upgrade',
          object_id: nextId || undefined,
          instance_id: typeof instanceId === 'number' ? instanceId : undefined,
        });
      }
    }

    if (event?.EventName === 'UnitTrained') {
      row.unitsTrained += 1;
      if (buildOrderKinds.has('unit') && row.buildOrder.length < buildOrderLimit) {
        const squadId = event?.SquadId;
        row.buildOrder.push({
          time_ms: timeMs,
          kind: 'unit',
          object_id: squadId ? String(squadId) : undefined,
          instance_id: typeof event?.InstanceId === 'number' ? event.InstanceId : undefined,
        });
      }
    }

    if (event?.EventName === 'TechResearched') {
      row.unitUpgrades += 1;
      if (buildOrderKinds.has('unit_upgrade') && row.buildOrder.length < buildOrderLimit) {
        const techId = event?.TechId;
        row.buildOrder.push({
          time_ms: timeMs,
          kind: 'unit_upgrade',
          object_id: techId ? String(techId) : undefined,
          instance_id: typeof event?.ResearcherInstanceId === 'number' ? event.ResearcherInstanceId : undefined,
        });
      }
    }

    if (event?.EventName === 'LeaderPowerCast') {
      row.leaderPowersCast += 1;
    }

    if (event?.EventName === 'UnitPromoted') {
      row.veterancyPromotions += 1;
    }
  });

  playersByIndex.forEach((info, index) => {
    if (info.playerType === 3) return;
    if (!summaries.has(index)) {
      summaries.set(index, {
        playerIndex: index,
        teamId: info.teamId,
        unitsTrained: 0,
        buildingsCompleted: 0,
        buildingUpgrades: 0,
        unitUpgrades: 0,
        leaderPowersCast: 0,
        veterancyPromotions: 0,
        buildOrder: [],
        firstEventMs: null,
        lastEventMs: null,
      });
    }
  });

  summaries.forEach((row) => {
    statements.push(
      db.prepare(
        `INSERT INTO match_event_summaries (
           match_id,
           player_index,
           team_id,
           units_trained,
           buildings_completed,
           building_upgrades,
           unit_upgrades,
           leader_powers_cast,
           veterancy_promotions,
           build_order_json,
           first_event_ms,
           last_event_ms,
           ingested_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(match_id, player_index) DO UPDATE SET
           team_id = COALESCE(excluded.team_id, match_event_summaries.team_id),
           units_trained = excluded.units_trained,
           buildings_completed = excluded.buildings_completed,
           building_upgrades = excluded.building_upgrades,
           unit_upgrades = excluded.unit_upgrades,
           leader_powers_cast = excluded.leader_powers_cast,
           veterancy_promotions = excluded.veterancy_promotions,
           build_order_json = excluded.build_order_json,
           first_event_ms = excluded.first_event_ms,
           last_event_ms = excluded.last_event_ms,
           ingested_at = excluded.ingested_at`
      ).bind(
        matchId,
        row.playerIndex,
        row.teamId,
        row.unitsTrained,
        row.buildingsCompleted,
        row.buildingUpgrades,
        row.unitUpgrades,
        row.leaderPowersCast,
        row.veterancyPromotions,
        row.buildOrder.length ? JSON.stringify(row.buildOrder) : null,
        row.firstEventMs,
        row.lastEventMs,
        now
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
  const urlEvents = `${HALO_ENDPOINTS.SUMMARY_API_URL}/matches/${encoded}/events`;
  const result = await fetchWithKeyFallback<any>(urlEvents, apiKeys);
  if (!result.ok) {
    if (env.DB && shouldUseCache(result.error.type)) {
      const cached = await loadCachedEvents(env.DB, matchId);
      if (cached?.payload) {
        return jsonResponse({
          ...cached.payload,
          _meta: { cached: true, fetchedAt: cached.fetchedAt, reason: result.error.type },
        });
      }
    }
    return errorResponse(result.error, statusFromError(result.error));
  }

  const storeRaw = env.STORE_RAW_EVENTS === '1';
  await storeMatchEvents(env.DB, matchId, result.data, storeRaw);

  return jsonResponse({ ...result.data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
};
