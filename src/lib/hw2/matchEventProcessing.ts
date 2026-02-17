import type { TimelineEntry, PlayerInfo } from './types';
import { state } from './state';
import { ensureLeaderPowerMap, ensureGameObjectMap, ensureTechMap, getLeaderPowerDisplayName, getGameObjectDisplayName, getTechDisplayName } from './apiCache';
import { detectTechTierFromBuildingUpgrade } from './dataProcessing';
import { getMatchEvents } from '../../utils/haloApi';

export async function fetchMatchEventsPayload(matchId: string) {
  const cached = state.matchEventsCache.get(matchId);
  if (cached) {
    return { ok: true as const, data: cached };
  }
  const result = await getMatchEvents(matchId);
  if (result.ok) {
    state.matchEventsCache.set(matchId, result.data);
  }
  return result;
}

export async function buildEventEntries(payload: any): Promise<{
  entries: TimelineEntry[];
  playersByIndex: Map<number, PlayerInfo>;
  isCompleteSet: boolean | undefined;
}> {
  const eventsRaw = payload?.GameEvents;
  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const isCompleteSet = payload?.IsCompleteSetOfEvents;

  const playersByIndex = new Map<number, PlayerInfo>();
  events.forEach((event: any) => {
    if (event?.EventName !== 'PlayerJoinedMatch') return;
    const index = event?.PlayerIndex;
    if (typeof index !== 'number') return;
    const humanId = event?.HumanPlayerId;
    const name =
      (typeof humanId === 'string' && humanId) ||
      (typeof humanId === 'object' && humanId?.Gamertag) ||
      (event?.PlayerType === 2 && event?.ComputerPlayerId != null ? `AI ${event.ComputerPlayerId}` : '') ||
      (event?.PlayerType === 3 ? 'NPC' : '') ||
      'Unknown';
    const teamId = typeof event?.TeamId === 'number' ? event.TeamId : null;
    const playerType = typeof event?.PlayerType === 'number' ? event.PlayerType : null;
    const leaderRaw = event?.LeaderId ?? event?.Leader ?? event?.LeaderType;
    const leaderId = (() => {
      if (typeof leaderRaw === 'number') return leaderRaw;
      if (typeof leaderRaw === 'string' && leaderRaw.trim() !== '') {
        const parsed = Number(leaderRaw);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })();
    playersByIndex.set(index, { name, teamId, playerType, leaderId });
  });

  const [leaderPowerMap, gameObjectMap, techMap] = await Promise.all([
    ensureLeaderPowerMap(),
    ensureGameObjectMap(),
    ensureTechMap(),
  ]);

  const buildingInstanceMap = new Map<number, string>();
  const entries: TimelineEntry[] = [];
  const resolveBuildingInstanceName = (instanceId?: number) => {
    if (typeof instanceId !== 'number') return '';
    const buildingId = buildingInstanceMap.get(instanceId);
    if (!buildingId) return `Instance ${instanceId}`;
    const buildingName = getGameObjectDisplayName(buildingId, gameObjectMap);
    return buildingName ? `${buildingName} (Instance ${instanceId})` : `Instance ${instanceId}`;
  };

  events.forEach((event: any) => {
    const instanceId = event?.InstanceId;
    if (typeof instanceId === 'number') {
      if (event?.EventName === 'BuildingConstructionQueued' && event?.BuildingId) {
        buildingInstanceMap.set(instanceId, String(event.BuildingId));
      }
    }

    const timeMs = event?.TimeSinceStartMilliseconds;
    if (typeof timeMs !== 'number') return;
    const playerIndex = typeof event?.PlayerIndex === 'number' ? event.PlayerIndex : null;
    const playerInfo = playerIndex != null ? playersByIndex.get(playerIndex) : null;
    const playerName = playerInfo?.name || (playerIndex != null ? `Player ${playerIndex}` : 'Unknown');
    const teamId = playerInfo?.teamId ?? null;

    if (event?.EventName === 'BuildingConstructionCompleted') {
      const buildingId = buildingInstanceMap.get(event?.InstanceId) || event?.BuildingId;
      const buildingName = buildingId ? getGameObjectDisplayName(String(buildingId), gameObjectMap) : 'Unknown Building';
      const detail = buildingId ? `ID: ${buildingId}` : (event?.InstanceId != null ? `Instance ${event.InstanceId}` : '');
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Completed ${buildingName}`,
        kind: 'building',
        detail: detail || undefined,
      });
    }

    if (event?.EventName === 'BuildingUpgraded') {
      const currentId = typeof instanceId === 'number' ? buildingInstanceMap.get(instanceId) : undefined;
      const nextId = event?.NewBuildingId ? String(event.NewBuildingId) : '';
      const fromName = currentId ? getGameObjectDisplayName(currentId, gameObjectMap) : '';
      const toName = nextId ? getGameObjectDisplayName(nextId, gameObjectMap) : 'Unknown Building';
      const label = fromName ? `Upgraded ${fromName} -> ${toName}` : `Upgraded to ${toName}`;
      const detail = nextId ? `ID: ${nextId}` : (event?.InstanceId != null ? `Instance ${event.InstanceId}` : '');
      const techTier = detectTechTierFromBuildingUpgrade(nextId, toName);
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label,
        kind: 'upgrade',
        detail: detail || undefined,
        techTier: techTier || undefined,
      });
      if (typeof instanceId === 'number' && nextId) {
        buildingInstanceMap.set(instanceId, nextId);
      }
    }

    if (event?.EventName === 'UnitTrained') {
      const squadId = event?.SquadId;
      const unitName = squadId ? getGameObjectDisplayName(String(squadId), gameObjectMap) : 'Unknown Unit';
      const detailBits = [];
      if (event?.IsClone) detailBits.push('Clone');
      if (event?.ProvidedByScenario) detailBits.push('Scenario');
      if (event?.CreatorInstanceId) {
        const source = resolveBuildingInstanceName(event.CreatorInstanceId);
        detailBits.push(`From ${source || `Instance ${event.CreatorInstanceId}`}`);
      }
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Trained ${unitName}`,
        kind: 'unit',
        detail: detailBits.length ? detailBits.join(' | ') : undefined,
      });
    }

    if (event?.EventName === 'UnitPromoted') {
      const squadId = event?.SquadId;
      const unitName = squadId ? getGameObjectDisplayName(String(squadId), gameObjectMap) : 'Unknown Unit';
      const detail = event?.InstanceId != null ? `Instance ${event.InstanceId}` : '';
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Veterancy: ${unitName}`,
        kind: 'veterancy',
        detail: detail || undefined,
      });
    }

    if (event?.EventName === 'TechResearched') {
      const techId = event?.TechId;
      const techName = techId ? getTechDisplayName(String(techId), techMap) : 'Unknown Tech';
      const detailBits = [];
      if (event?.SupplyCost) detailBits.push(`Supply ${event.SupplyCost}`);
      if (event?.EnergyCost) detailBits.push(`Energy ${event.EnergyCost}`);
      if (event?.ResearcherInstanceId) {
        const source = resolveBuildingInstanceName(event.ResearcherInstanceId);
        detailBits.push(`From ${source || `Instance ${event.ResearcherInstanceId}`}`);
      }
      if (event?.ProvidedByScenario) detailBits.push('Scenario');
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Researched ${techName}`,
        kind: 'unit_upgrade',
        detail: detailBits.length ? detailBits.join(' | ') : undefined,
      });
    }

    if (event?.EventName === 'LeaderPowerCast') {
      const powerId = event?.PowerId;
      const powerName = powerId ? getLeaderPowerDisplayName(String(powerId), leaderPowerMap) : 'Unknown Power';
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Cast ${powerName}`,
        kind: 'power',
      });
    }

    // Enhanced event handlers (Didact integration)
    if (event?.EventName === 'Death') {
      const victimId = event?.VictimObjectTypeId;
      const victimName = victimId ? getGameObjectDisplayName(String(victimId), gameObjectMap) : 'Unit';
      const killerId = event?.KillerObjectTypeId;
      const killerName = killerId ? getGameObjectDisplayName(String(killerId), gameObjectMap) : '';
      const detail = killerName ? `Killed by ${killerName}` : undefined;
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Lost ${victimName}`,
        kind: 'death',
        detail,
      });
    }

    if (event?.EventName === 'BuildingRecycled') {
      const buildingId = event?.BuildingId;
      const buildingName = buildingId ? getGameObjectDisplayName(String(buildingId), gameObjectMap) : 'Building';
      const detailBits = [];
      if (event?.SupplyEarned) detailBits.push(`+${event.SupplyEarned} Supply`);
      if (event?.EnergyEarned) detailBits.push(`+${event.EnergyEarned} Energy`);
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: `Recycled ${buildingName}`,
        kind: 'recycle',
        detail: detailBits.length ? detailBits.join(' | ') : undefined,
      });
    }

    if (event?.EventName === 'ResourceHeartbeat') {
      entries.push({
        timeMs,
        playerIndex,
        playerName,
        teamId,
        label: 'Resource Snapshot',
        kind: 'resource',
        supply: event?.Supply ?? event?.TotalSupply,
        energy: event?.Energy ?? event?.TotalEnergy,
      });
    }
  });

  return { entries, playersByIndex, isCompleteSet };
}
