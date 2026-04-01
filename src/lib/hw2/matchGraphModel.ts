import type { TimelineEntry, PlayerInfo } from './types';

export type GraphWindow = {
  startMin: number;
  endMin: number;
};

export type TeamBucketMetrics = {
  supply: number;
  power: number;
  supplyRate: number;
  powerRate: number;
  population: number;
  populationCap: number;
  commandXp: number;
  cumulativeDeaths: number;
  deathsInBucket: number;
};

export type TeamAggregatePoint = {
  timeMin: number;
  team1: TeamBucketMetrics;
  team2: TeamBucketMetrics;
};

export type PlayerBucketPoint = {
  timeMin: number;
  supply: number;
  power: number;
  supplyRate: number;
  powerRate: number;
  population: number;
  populationCap: number;
  commandXp: number;
  cumulativeDeaths: number;
  deathsInBucket: number;
};

export type PlayerGraphSeries = {
  playerIndex: number;
  playerName: string;
  teamId: 1 | 2 | null;
  points: PlayerBucketPoint[];
};

export type MomentumPoint = {
  timeMin: number;
  score: number;
  leaderTeam: 1 | 2 | null;
  components: {
    supply: number;
    power: number;
    population: number;
    commandXp: number;
  };
};

export type SwingMarker = {
  timeMin: number;
  score: number;
  leaderTeam: 1 | 2;
  label: string;
  magnitude: number;
};

export type TimelineAnnotationLane = 'tech' | 'powers' | 'population' | 'deaths';

export type TimelineAnnotation = {
  timeMin: number;
  lane: TimelineAnnotationLane;
  teamId: 1 | 2 | null;
  label: string;
  shortLabel: string;
  detail?: string;
};

export type MatchGraphModel = {
  maxTimeMin: number;
  playerSeries: PlayerGraphSeries[];
  teamAggregates: TeamAggregatePoint[];
  momentum: MomentumPoint[];
  swingMarkers: SwingMarker[];
  decisiveSwing: SwingMarker | null;
  annotations: TimelineAnnotation[];
};

type ResourceSnapshot = {
  timeMin: number;
  supply: number | null;
  power: number | null;
  population: number | null;
  populationCap: number | null;
  commandXp: number | null;
};

const BUCKET_SIZE_MIN = 0.5;

function normalizeTeamMap(playersByIndex: Map<number, PlayerInfo>): Map<number, 1 | 2 | null> {
  const distinctTeamIds = [...new Set(
    [...playersByIndex.entries()]
      .filter(([, info]) => info.playerType !== 3)
      .map(([, info]) => info.teamId)
      .filter((teamId): teamId is number => typeof teamId === 'number')
  )].sort((a, b) => a - b);

  const teamLookup = new Map<number, 1 | 2>();
  distinctTeamIds.slice(0, 2).forEach((teamId, index) => {
    teamLookup.set(teamId, index === 0 ? 1 : 2);
  });

  const normalized = new Map<number, 1 | 2 | null>();
  playersByIndex.forEach((info, playerIndex) => {
    if (info.playerType === 3) {
      normalized.set(playerIndex, null);
      return;
    }
    normalized.set(playerIndex, teamLookup.get(info.teamId ?? -1) ?? null);
  });
  return normalized;
}

function buildBuckets(maxTimeMin: number): number[] {
  const safeMax = Math.max(BUCKET_SIZE_MIN, Number.isFinite(maxTimeMin) ? maxTimeMin : BUCKET_SIZE_MIN);
  const bucketCount = Math.max(1, Math.ceil(safeMax / BUCKET_SIZE_MIN));
  return Array.from({ length: bucketCount + 1 }, (_unused, index) => Number((index * BUCKET_SIZE_MIN).toFixed(2)));
}

function clampNormalizedDiff(team1Value: number, team2Value: number): number {
  const denominator = Math.max(Math.abs(team1Value), Math.abs(team2Value), 1);
  const raw = (team1Value - team2Value) / denominator;
  return Math.max(-1, Math.min(1, raw));
}

function rollingAverage(values: number[], windowSize: number): number[] {
  return values.map((_value, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const subset = values.slice(start, index + 1);
    if (subset.length === 0) return 0;
    return subset.reduce((sum, item) => sum + item, 0) / subset.length;
  });
}

function getLatestSnapshot(points: ResourceSnapshot[], timeMin: number): ResourceSnapshot | null {
  if (!points.length) return null;
  let latest: ResourceSnapshot | null = null;
  for (const point of points) {
    if (point.timeMin > timeMin) break;
    latest = point;
  }
  return latest;
}

function buildDeathsPerBucket(entries: TimelineEntry[], buckets: number[], normalizedTeams: Map<number, 1 | 2 | null>) {
  const deathsByPlayer = new Map<number, number[]>();
  const bucketIntervals = Math.max(0, buckets.length - 1);
  entries
    .filter((entry) => entry.kind === 'death' && entry.playerIndex != null)
    .forEach((entry) => {
      const playerIndex = entry.playerIndex!;
      if ((normalizedTeams.get(playerIndex) ?? null) == null) return;
      const bucketIndex = Math.min(bucketIntervals - 1, Math.max(0, Math.floor(entry.timeMs / 60000 / BUCKET_SIZE_MIN)));
      if (bucketIndex < 0) return;
      if (!deathsByPlayer.has(playerIndex)) deathsByPlayer.set(playerIndex, new Array(bucketIntervals).fill(0));
      deathsByPlayer.get(playerIndex)![bucketIndex] += 1;
    });
  return deathsByPlayer;
}

function buildPlayerSeries(
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  normalizedTeams: Map<number, 1 | 2 | null>,
  buckets: number[]
): PlayerGraphSeries[] {
  const snapshotsByPlayer = new Map<number, ResourceSnapshot[]>();

  entries
    .filter((entry) => entry.kind === 'resource' && entry.playerIndex != null)
    .forEach((entry) => {
      const playerIndex = entry.playerIndex!;
      if ((normalizedTeams.get(playerIndex) ?? null) == null) return;
      const snapshots = snapshotsByPlayer.get(playerIndex) || [];
      snapshots.push({
        timeMin: entry.timeMs / 60000,
        supply: Number.isFinite(Number(entry.supply)) ? Number(entry.supply) : null,
        power: Number.isFinite(Number(entry.energy)) ? Number(entry.energy) : null,
        population: Number.isFinite(Number(entry.population)) ? Number(entry.population) : null,
        populationCap: Number.isFinite(Number(entry.populationCap)) ? Number(entry.populationCap) : null,
        commandXp: Number.isFinite(Number(entry.commandXp)) ? Number(entry.commandXp) : null,
      });
      snapshotsByPlayer.set(playerIndex, snapshots);
    });

  snapshotsByPlayer.forEach((points) => points.sort((a, b) => a.timeMin - b.timeMin));
  const deathsByPlayer = buildDeathsPerBucket(entries, buckets, normalizedTeams);

  return [...snapshotsByPlayer.entries()]
    .map(([playerIndex, snapshots]) => {
      const info = playersByIndex.get(playerIndex);
      const deathBuckets = deathsByPlayer.get(playerIndex) || new Array(Math.max(0, buckets.length - 1)).fill(0);
      let previousSupply = 0;
      let previousPower = 0;
      let previousDeaths = 0;

      const points = buckets.map((timeMin, index) => {
        const snapshot = getLatestSnapshot(snapshots, timeMin);
        const supply = snapshot?.supply ?? previousSupply;
        const power = snapshot?.power ?? previousPower;
        const population = snapshot?.population ?? 0;
        const populationCap = snapshot?.populationCap ?? 0;
        const commandXp = snapshot?.commandXp ?? 0;

        const supplyRate = index === 0 ? 0 : Math.max(0, (supply - previousSupply) / BUCKET_SIZE_MIN);
        const powerRate = index === 0 ? 0 : Math.max(0, (power - previousPower) / BUCKET_SIZE_MIN);
        const deathsInBucket = index === 0 ? 0 : (deathBuckets[index - 1] || 0);
        const cumulativeDeaths = previousDeaths + deathsInBucket;

        previousSupply = supply;
        previousPower = power;
        previousDeaths = cumulativeDeaths;

        return {
          timeMin,
          supply,
          power,
          supplyRate,
          powerRate,
          population,
          populationCap,
          commandXp,
          cumulativeDeaths,
          deathsInBucket,
        };
      });

      return {
        playerIndex,
        playerName: info?.name || `Player ${playerIndex}`,
        teamId: normalizedTeams.get(playerIndex) ?? null,
        points,
      };
    })
    .sort((a, b) => {
      const teamA = a.teamId ?? 99;
      const teamB = b.teamId ?? 99;
      if (teamA !== teamB) return teamA - teamB;
      return a.playerName.localeCompare(b.playerName);
    });
}

function emptyMetrics(): TeamBucketMetrics {
  return {
    supply: 0,
    power: 0,
    supplyRate: 0,
    powerRate: 0,
    population: 0,
    populationCap: 0,
    commandXp: 0,
    cumulativeDeaths: 0,
    deathsInBucket: 0,
  };
}

function buildTeamAggregates(playerSeries: PlayerGraphSeries[], buckets: number[]): TeamAggregatePoint[] {
  return buckets.map((_timeMin, index) => {
    const team1 = emptyMetrics();
    const team2 = emptyMetrics();

    playerSeries.forEach((series) => {
      const point = series.points[index];
      if (!point) return;
      const target = series.teamId === 1 ? team1 : series.teamId === 2 ? team2 : null;
      if (!target) return;
      target.supply += point.supply;
      target.power += point.power;
      target.supplyRate += point.supplyRate;
      target.powerRate += point.powerRate;
      target.population += point.population;
      target.populationCap += point.populationCap;
      target.commandXp += point.commandXp;
      target.cumulativeDeaths += point.cumulativeDeaths;
      target.deathsInBucket += point.deathsInBucket;
    });

    return {
      timeMin: buckets[index],
      team1,
      team2,
    };
  });
}

function buildMomentum(teamAggregates: TeamAggregatePoint[]): MomentumPoint[] {
  const rawScores = teamAggregates.map((point) => {
    const supply = clampNormalizedDiff(point.team1.supplyRate, point.team2.supplyRate);
    const power = clampNormalizedDiff(point.team1.powerRate, point.team2.powerRate);
    const population = clampNormalizedDiff(point.team1.population, point.team2.population);
    const commandXp = clampNormalizedDiff(point.team1.commandXp, point.team2.commandXp);
    const score = ((supply * 0.35) + (power * 0.25) + (population * 0.25) + (commandXp * 0.15)) * 100;
    return {
      timeMin: point.timeMin,
      components: { supply, power, population, commandXp },
      rawScore: Math.max(-100, Math.min(100, score)),
    };
  });

  const smoothed = rollingAverage(rawScores.map((point) => point.rawScore), 3);

  return rawScores.map((point, index) => {
    const score = Number(smoothed[index].toFixed(2));
    return {
      timeMin: point.timeMin,
      score,
      leaderTeam: score > 0 ? 1 : score < 0 ? 2 : null,
      components: point.components,
    };
  });
}

function buildSwingMarkers(momentum: MomentumPoint[]): { swingMarkers: SwingMarker[]; decisiveSwing: SwingMarker | null } {
  const swingMarkers: SwingMarker[] = [];

  let previousLeader: 1 | 2 | null = null;
  for (let index = 0; index < momentum.length; index++) {
    const point = momentum[index];
    const currentLeader = point.leaderTeam;
    if (!currentLeader || currentLeader === previousLeader) {
      if (currentLeader) previousLeader = currentLeader;
      continue;
    }

    const nextPoint = momentum[index + 1];
    if (!nextPoint || nextPoint.leaderTeam !== currentLeader) continue;

    swingMarkers.push({
      timeMin: point.timeMin,
      score: point.score,
      leaderTeam: currentLeader,
      label: `${currentLeader === 1 ? 'Team 1' : 'Team 2'} swing`,
      magnitude: Math.abs(point.score),
    });
    previousLeader = currentLeader;
  }

  const decisiveSwing = swingMarkers
    .filter((marker) => marker.timeMin >= 5)
    .sort((a, b) => b.magnitude - a.magnitude)[0] || null;

  return { swingMarkers, decisiveSwing };
}

function abbreviateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(0, maxLength - 1))}…`;
}

function buildPowerAnnotations(entries: TimelineEntry[], normalizedTeams: Map<number, 1 | 2 | null>): TimelineAnnotation[] {
  const seen = new Set<string>();
  const countsByTeam = new Map<1 | 2, number>();

  return entries
    .filter((entry) => entry.kind === 'power' && entry.playerIndex != null)
    .sort((a, b) => a.timeMs - b.timeMs)
    .flatMap((entry) => {
      const teamId = normalizedTeams.get(entry.playerIndex!) ?? null;
      if (!teamId) return [];
      const key = `${teamId}:${entry.label}`;
      if (seen.has(key)) return [];
      const currentCount = countsByTeam.get(teamId) || 0;
      if (currentCount >= 2) return [];
      seen.add(key);
      countsByTeam.set(teamId, currentCount + 1);
      const cleaned = entry.label.replace(/^Cast\s+/i, '');
      return [{
        timeMin: entry.timeMs / 60000,
        lane: 'powers' as const,
        teamId,
        label: `${teamId === 1 ? 'Team 1' : 'Team 2'}: ${cleaned}`,
        shortLabel: abbreviateLabel(cleaned, 12),
      }];
    });
}

function buildTechAnnotations(entries: TimelineEntry[], normalizedTeams: Map<number, 1 | 2 | null>): TimelineAnnotation[] {
  const found = new Set<string>();
  const annotations: TimelineAnnotation[] = [];

  entries
    .filter((entry) => entry.kind === 'upgrade' && entry.techTier != null && entry.playerIndex != null)
    .sort((a, b) => a.timeMs - b.timeMs)
    .forEach((entry) => {
      const teamId = normalizedTeams.get(entry.playerIndex!) ?? null;
      if (!teamId || !entry.techTier) return;
      const key = `${teamId}:${entry.techTier}`;
      if (found.has(key)) return;
      found.add(key);
      annotations.push({
        timeMin: entry.timeMs / 60000,
        lane: 'tech',
        teamId,
        label: `${teamId === 1 ? 'Team 1' : 'Team 2'} first T${entry.techTier}`,
        shortLabel: `T${entry.techTier}`,
      });
    });

  return annotations;
}

function buildPopulationAnnotations(teamAggregates: TeamAggregatePoint[]): TimelineAnnotation[] {
  const team1Peak = teamAggregates.reduce((peak, point) => point.team1.population > peak.team1.population ? point : peak, teamAggregates[0]);
  const team2Peak = teamAggregates.reduce((peak, point) => point.team2.population > peak.team2.population ? point : peak, teamAggregates[0]);

  return [team1Peak, team2Peak].flatMap((point, index) => {
    if (!point) return [];
    const teamId = index === 0 ? 1 : 2;
    const population = teamId === 1 ? point.team1.population : point.team2.population;
    if (population <= 0) return [];
    return [{
      timeMin: point.timeMin,
      lane: 'population' as const,
      teamId,
      label: `${teamId === 1 ? 'Team 1' : 'Team 2'} peak pop ${Math.round(population)}`,
      shortLabel: `Peak ${Math.round(population)}`,
    }];
  });
}

function buildDeathSpikeAnnotations(teamAggregates: TeamAggregatePoint[]): TimelineAnnotation[] {
  if (!teamAggregates.length) return [];
  const windowSize = 4;

  const buildSpike = (teamId: 1 | 2) => {
    let best = { value: 0, timeMin: 0 };
    for (let index = 0; index < teamAggregates.length; index++) {
      const slice = teamAggregates.slice(index, index + windowSize);
      const value = slice.reduce((sum, point) => {
        const deaths = teamId === 1 ? point.team1.deathsInBucket : point.team2.deathsInBucket;
        return sum + deaths;
      }, 0);
      if (value > best.value) {
        best = { value, timeMin: teamAggregates[index]?.timeMin ?? 0 };
      }
    }
    if (best.value <= 0) return null;
    return {
      timeMin: best.timeMin,
      lane: 'deaths' as const,
      teamId,
      label: `${teamId === 1 ? 'Team 1' : 'Team 2'} death spike (${best.value})`,
      shortLabel: `Spike ${best.value}`,
    };
  };

  return [buildSpike(1), buildSpike(2)].filter((annotation): annotation is TimelineAnnotation => Boolean(annotation));
}

export function buildMatchGraphModel(
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>
): MatchGraphModel {
  const normalizedTeams = normalizeTeamMap(playersByIndex);
  const relevantEntries = entries.filter((entry) => entry.playerIndex == null || (normalizedTeams.get(entry.playerIndex) ?? null) != null);
  const maxTimeMin = Math.max(BUCKET_SIZE_MIN, relevantEntries.reduce((max, entry) => Math.max(max, entry.timeMs / 60000), 0));
  const buckets = buildBuckets(maxTimeMin);
  const playerSeries = buildPlayerSeries(relevantEntries, playersByIndex, normalizedTeams, buckets);
  const teamAggregates = buildTeamAggregates(playerSeries, buckets);
  const momentum = buildMomentum(teamAggregates);
  const { swingMarkers, decisiveSwing } = buildSwingMarkers(momentum);
  const annotations = [
    ...buildTechAnnotations(relevantEntries, normalizedTeams),
    ...buildPowerAnnotations(relevantEntries, normalizedTeams),
    ...buildPopulationAnnotations(teamAggregates),
    ...buildDeathSpikeAnnotations(teamAggregates),
  ].sort((a, b) => a.timeMin - b.timeMin);

  return {
    maxTimeMin,
    playerSeries,
    teamAggregates,
    momentum,
    swingMarkers,
    decisiveSwing,
    annotations,
  };
}

export function clampGraphWindow(startMin: number, endMin: number, maxMinutes: number): GraphWindow {
  const safeMax = Math.max(BUCKET_SIZE_MIN, Number.isFinite(maxMinutes) ? maxMinutes : BUCKET_SIZE_MIN);
  let start = Number.isFinite(startMin) ? startMin : 0;
  let end = Number.isFinite(endMin) ? endMin : safeMax;
  start = Math.min(Math.max(0, start), safeMax);
  end = Math.min(Math.max(BUCKET_SIZE_MIN, end), safeMax);
  if (end <= start) {
    end = Math.min(safeMax, start + BUCKET_SIZE_MIN);
  }
  return { startMin: Number(start.toFixed(2)), endMin: Number(end.toFixed(2)) };
}

export function getPhaseWindow(phase: 'full' | 'opening' | 'midgame' | 'late' | 'custom', maxMinutes: number): GraphWindow {
  switch (phase) {
    case 'opening':
      return clampGraphWindow(0, Math.min(8, maxMinutes), maxMinutes);
    case 'midgame':
      return clampGraphWindow(Math.min(8, maxMinutes), Math.min(18, maxMinutes), maxMinutes);
    case 'late':
      return clampGraphWindow(Math.min(18, maxMinutes), maxMinutes, maxMinutes);
    case 'custom':
    case 'full':
    default:
      return clampGraphWindow(0, maxMinutes, maxMinutes);
  }
}

export function filterPointsForWindow<T extends { timeMin: number }>(points: T[], window: GraphWindow): T[] {
  return points.filter((point) => point.timeMin >= window.startMin && point.timeMin <= window.endMin);
}
