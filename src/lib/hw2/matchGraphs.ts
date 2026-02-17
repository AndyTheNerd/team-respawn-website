import type { TimelineEntry, PlayerInfo } from './types';
import { state } from './state';
import { formatMatchClock } from './dataProcessing';
import { ensureChartJs, destroyChart, chartInstances } from './chartManager';
import { getMatchResult } from '../../utils/haloApi';
import { fetchMatchEventsPayload, buildEventEntries } from './matchEventProcessing';

function renderUnitsChart(Chart: any, matchId: string, matchResult: any) {
  const canvasEl = document.getElementById(`chart-units-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-units"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (!canvasEl) return;

  const playersRaw = matchResult?.Players;
  const players = Array.isArray(playersRaw)
    ? playersRaw
    : (playersRaw && typeof playersRaw === 'object')
      ? Object.values(playersRaw)
      : [];

  type UnitRow = { name: string; teamId: number; destroyed: number; lost: number };
  const rows: UnitRow[] = [];

  players.forEach((p: any) => {
    if (p.PlayerType === 3) return;
    const gamertag = p?.HumanPlayerId?.Gamertag
      || p?.Gamertag
      || (typeof p?.HumanPlayerId === 'string' ? p.HumanPlayerId : '')
      || 'Unknown';
    let destroyed = 0;
    let lost = 0;
    const unitStats = p?.UnitStats;
    if (unitStats && typeof unitStats === 'object') {
      Object.values(unitStats).forEach((u: any) => {
        destroyed += u?.TotalDestroyed || 0;
        lost += u?.TotalLost || 0;
      });
    }
    rows.push({ name: gamertag, teamId: p.TeamId ?? 0, destroyed, lost });
  });

  if (rows.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  rows.sort((a, b) => a.teamId - b.teamId);

  const labels = rows.map(r => r.name);
  const destroyedData = rows.map(r => r.destroyed);
  const lostData = rows.map(r => -r.lost);

  destroyChart(`chart-units-${matchId}`);
  const chart = new Chart(canvasEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Units Destroyed',
          data: destroyedData,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Units Lost',
          data: lostData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 11 } },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const value = Math.abs(context.raw);
              return `${context.dataset.label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: {
            color: '#94a3b8',
            callback: (value: any) => Math.abs(Number(value)),
          },
          title: { display: true, text: 'Units', color: '#94a3b8' },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { color: '#e2e8f0', font: { size: 11 } },
        },
      },
    },
  });
  chartInstances.set(`chart-units-${matchId}`, chart);
}

function renderActivityChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  timeWindow?: TimeWindow
) {
  const canvasEl = document.getElementById(`chart-activity-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-activity"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (!canvasEl) return;

  if (entries.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const maxTimeMs = entries.reduce((max, e) => Math.max(max, e.timeMs), 0);
  const maxMinutes = Math.max(1, maxTimeMs / 60000);
  const boundedWindow = clampTimeWindow(timeWindow?.startMin ?? 0, timeWindow?.endMin ?? maxMinutes, maxMinutes);
  const bucketSizeMs = 60000;
  const bucketCount = Math.max(1, Math.ceil(maxTimeMs / bucketSizeMs));

  const playerBuckets = new Map<number, number[]>();
  const sorted = [...entries].sort((a, b) => a.timeMs - b.timeMs);

  sorted.forEach((entry) => {
    if (entry.playerIndex == null) return;
    if (!playerBuckets.has(entry.playerIndex)) {
      playerBuckets.set(entry.playerIndex, new Array(bucketCount).fill(0));
    }
    const bucketIdx = Math.min(Math.floor(entry.timeMs / bucketSizeMs), bucketCount - 1);
    playerBuckets.get(entry.playerIndex)![bucketIdx]++;
  });

  playerBuckets.forEach((buckets) => {
    for (let i = 1; i < buckets.length; i++) {
      buckets[i] += buckets[i - 1];
    }
  });

  const team1Colors = ['rgba(56, 189, 248, 0.9)', 'rgba(14, 165, 233, 0.9)', 'rgba(2, 132, 199, 0.9)'];
  const team2Colors = ['rgba(251, 113, 133, 0.9)', 'rgba(244, 63, 94, 0.9)', 'rgba(225, 29, 72, 0.9)'];
  let t1idx = 0, t2idx = 0;

  const datasets = [...playerBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([playerIndex, cumulativeBuckets]) => {
      const info = playersByIndex.get(playerIndex);
      const name = info?.name || `Player ${playerIndex}`;
      const teamId = info?.teamId;
      let color: string;
      if (teamId === 1) {
        color = team1Colors[t1idx % team1Colors.length];
        t1idx++;
      } else if (teamId === 2) {
        color = team2Colors[t2idx % team2Colors.length];
        t2idx++;
      } else {
        color = 'rgba(148, 163, 184, 0.7)';
      }

      return {
        label: name,
        data: cumulativeBuckets.map((value, idx) => ({ x: idx + 1, y: value })),
        borderColor: color,
        backgroundColor: color.replace(/[\d.]+\)$/, '0.1)'),
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      };
    });

  canvasEl.parentElement!.classList.remove('hidden');
  if (emptyEl) emptyEl.classList.add('hidden');

  destroyChart(`chart-activity-${matchId}`);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, pointStyle: 'line' },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const minuteValue = Number(items[0]?.parsed?.x);
              if (!Number.isFinite(minuteValue)) return '';
              return formatMatchClock(minuteValue * 60000);
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: boundedWindow.startMin,
          max: boundedWindow.endMin,
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxTicksLimit: 15,
            callback: (value: any) => {
              const minutes = Number(value);
              if (!Number.isFinite(minutes)) return '';
              if (minutes >= 60) {
                const hours = Math.floor(minutes / 60);
                const mins = Math.round(minutes % 60);
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
              }
              return `${Math.round(minutes)}m`;
            },
          },
          title: { display: true, text: 'Match Time', color: '#94a3b8' },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: { color: '#94a3b8', font: { size: 10 } },
          title: { display: true, text: 'Cumulative Actions', color: '#94a3b8' },
        },
      },
    },
  });
  chartInstances.set(`chart-activity-${matchId}`, chart);
}

type ResourcePoint = { x: number; y: number };
type ResourceSeries = {
  playerIndex: number;
  playerName: string;
  teamId: number | null;
  baseColor: string;
  supplyPoints: ResourcePoint[];
  energyPoints: ResourcePoint[];
};
type TimeWindow = { startMin: number; endMin: number };
const LEADER_POINT_XP_THRESHOLDS = [0, 600, 1300, 2000, 3000, 4000, 5000, 6000, 7000, 7900, 8900];

function clampTimeWindow(startMin: number, endMin: number, maxMinutes: number): TimeWindow {
  const safeMax = Math.max(1, Number.isFinite(maxMinutes) ? maxMinutes : 1);
  let start = Number.isFinite(startMin) ? startMin : 0;
  let end = Number.isFinite(endMin) ? endMin : safeMax;
  start = Math.min(Math.max(0, start), safeMax);
  end = Math.min(Math.max(0, end), safeMax);
  if (end <= start) {
    if (start >= safeMax) start = Math.max(0, safeMax - 1);
    end = Math.min(safeMax, start + 1);
  }
  return { startMin: start, endMin: end };
}

function getSelectedTimeWindow(matchId: string, maxMinutes: number): TimeWindow {
  const startEl = document.getElementById(`graph-time-start-${matchId}`) as HTMLInputElement | null;
  const endEl = document.getElementById(`graph-time-end-${matchId}`) as HTMLInputElement | null;
  const start = Number(startEl?.value ?? 0);
  const end = Number(endEl?.value ?? maxMinutes);
  return clampTimeWindow(start, end, maxMinutes);
}

function syncTimeWindowInputs(matchId: string, window: TimeWindow, maxMinutes: number) {
  const startEl = document.getElementById(`graph-time-start-${matchId}`) as HTMLInputElement | null;
  const endEl = document.getElementById(`graph-time-end-${matchId}`) as HTMLInputElement | null;
  const labelEl = document.getElementById(`graph-time-window-label-${matchId}`) as HTMLElement | null;
  if (startEl) {
    startEl.min = '0';
    startEl.max = String(Math.ceil(maxMinutes));
    startEl.value = String(Math.round(window.startMin));
  }
  if (endEl) {
    endEl.min = '0';
    endEl.max = String(Math.ceil(maxMinutes));
    endEl.value = String(Math.round(window.endMin));
  }
  if (labelEl) {
    labelEl.textContent = `${formatMatchClock(window.startMin * 60000)} to ${formatMatchClock(window.endMin * 60000)}`;
  }
}

function getLeaderPointsUnlocked(commandXp: number): number {
  if (!Number.isFinite(commandXp)) return 0;
  let unlocked = 0;
  LEADER_POINT_XP_THRESHOLDS.forEach((threshold) => {
    if (commandXp >= threshold) unlocked += 1;
  });
  return unlocked;
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^rgba\(([^)]+)\)$/i);
  if (!match) return color;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return color;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function downsamplePoints(points: ResourcePoint[], maxPoints: number): ResourcePoint[] {
  if (!Number.isFinite(maxPoints) || maxPoints <= 0 || points.length <= maxPoints) return points;
  if (maxPoints === 1) return [points[points.length - 1]];
  const result: ResourcePoint[] = [points[0]];
  const interior = maxPoints - 2;
  let lastIdx = 0;
  for (let i = 1; i <= interior; i++) {
    const idx = Math.round((i * (points.length - 1)) / (interior + 1));
    if (idx <= lastIdx || idx >= points.length - 1) continue;
    result.push(points[idx]);
    lastIdx = idx;
  }
  result.push(points[points.length - 1]);
  return result;
}

function resolveMaxPointsPerSeries(
  mode: string,
  longestSeriesLength: number,
  maxTimeMinutes: number
): number {
  if (mode === 'all') return Number.POSITIVE_INFINITY;
  if (mode !== 'auto') {
    const parsed = Number(mode);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (longestSeriesLength <= 180) return longestSeriesLength;
  if (maxTimeMinutes >= 120) return 160;
  if (maxTimeMinutes >= 75) return 200;
  if (maxTimeMinutes >= 45) return 240;
  return 300;
}

function buildIncomeRatePoints(points: ResourcePoint[]): ResourcePoint[] {
  if (!Array.isArray(points) || points.length < 2) return [];
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const rates: ResourcePoint[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const deltaMinutes = curr.x - prev.x;
    if (!Number.isFinite(deltaMinutes) || deltaMinutes <= 0) continue;
    const deltaValue = curr.y - prev.y;
    if (!Number.isFinite(deltaValue)) continue;
    // TotalSupply/TotalEnergy should be monotonic; clamp negative jitter to 0.
    const perMinute = Math.max(0, deltaValue / deltaMinutes);
    rates.push({ x: curr.x, y: perMinute });
  }
  return rates;
}

function renderResourcesChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  getTimeWindow?: () => TimeWindow,
  extraRenderTriggers: Array<HTMLElement | null> = []
) {
  const canvasEl = document.getElementById(`chart-resources-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-resources"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  const showSupplyEl = document.getElementById(`resource-show-supply-${matchId}`) as HTMLInputElement | null;
  const showPowerEl = document.getElementById(`resource-show-power-${matchId}`) as HTMLInputElement | null;
  const metricEl = document.getElementById(`resource-metric-${matchId}`) as HTMLSelectElement | null;
  const smoothingEl = document.getElementById(`resource-smoothing-${matchId}`) as HTMLSelectElement | null;
  const downsampleEl = document.getElementById(`resource-downsample-${matchId}`) as HTMLSelectElement | null;
  const downsampleHintEl = document.getElementById(`resource-downsample-hint-${matchId}`) as HTMLElement | null;
  if (!canvasEl) return;

  const resourceEntries = entries
    .filter((entry) => entry.kind === 'resource' && entry.playerIndex != null)
    .filter((entry) => {
      const hasSupply = Number.isFinite(Number(entry.supply));
      const hasEnergy = Number.isFinite(Number(entry.energy));
      return hasSupply || hasEnergy;
    });

  if (resourceEntries.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const sorted = [...resourceEntries].sort((a, b) => a.timeMs - b.timeMs);
  const supplyByPlayer = new Map<number, Array<{ x: number; y: number }>>();
  const energyByPlayer = new Map<number, Array<{ x: number; y: number }>>();

  sorted.forEach((entry) => {
    const playerIndex = entry.playerIndex!;
    const timeMinutes = entry.timeMs / 60000;
    const supply = Number(entry.supply);
    const energy = Number(entry.energy);

    if (Number.isFinite(supply)) {
      const list = supplyByPlayer.get(playerIndex) || [];
      list.push({ x: timeMinutes, y: supply });
      supplyByPlayer.set(playerIndex, list);
    }

    if (Number.isFinite(energy)) {
      const list = energyByPlayer.get(playerIndex) || [];
      list.push({ x: timeMinutes, y: energy });
      energyByPlayer.set(playerIndex, list);
    }
  });

  const playerIndices = [...new Set([...supplyByPlayer.keys(), ...energyByPlayer.keys()])].sort((a, b) => a - b);
  if (playerIndices.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const team1Colors = ['rgba(56, 189, 248, 0.9)', 'rgba(14, 165, 233, 0.9)', 'rgba(2, 132, 199, 0.9)'];
  const team2Colors = ['rgba(251, 113, 133, 0.9)', 'rgba(244, 63, 94, 0.9)', 'rgba(225, 29, 72, 0.9)'];
  let t1idx = 0;
  let t2idx = 0;

  const resolveBaseColor = (playerIndex: number) => {
    const teamId = playersByIndex.get(playerIndex)?.teamId;
    if (teamId === 1) {
      const color = team1Colors[t1idx % team1Colors.length];
      t1idx++;
      return color;
    }
    if (teamId === 2) {
      const color = team2Colors[t2idx % team2Colors.length];
      t2idx++;
      return color;
    }
    return 'rgba(148, 163, 184, 0.85)';
  };

  const resourceSeries: ResourceSeries[] = playerIndices.map((playerIndex) => {
    const info = playersByIndex.get(playerIndex);
    return {
      playerIndex,
      playerName: info?.name || `Player ${playerIndex}`,
      teamId: info?.teamId ?? null,
      baseColor: resolveBaseColor(playerIndex),
      supplyPoints: supplyByPlayer.get(playerIndex) || [],
      energyPoints: energyByPlayer.get(playerIndex) || [],
    };
  });

  const maxTimeMinutes = sorted.reduce((max, entry) => Math.max(max, entry.timeMs / 60000), 0);
  const longestSeriesLength = resourceSeries.reduce((max, series) => {
    return Math.max(max, series.supplyPoints.length, series.energyPoints.length);
  }, 0);

  const render = () => {
    const selectedWindow = getTimeWindow
      ? getTimeWindow()
      : clampTimeWindow(0, maxTimeMinutes || 1, maxTimeMinutes || 1);
    const showSupply = showSupplyEl?.checked ?? true;
    const showPower = showPowerEl?.checked ?? true;
    const metric = metricEl?.value === 'rate' ? 'rate' : 'total';
    const isRateMetric = metric === 'rate';
    const smoothing = Number(smoothingEl?.value ?? '0.25');
    const downsampleMode = downsampleEl?.value ?? 'auto';
    const maxPointsPerSeries = resolveMaxPointsPerSeries(downsampleMode, longestSeriesLength, maxTimeMinutes);

    if (downsampleHintEl) {
      downsampleHintEl.textContent = Number.isFinite(maxPointsPerSeries)
        ? `Up to ${maxPointsPerSeries} points per series`
        : 'All points per series';
    }

    const datasets = resourceSeries.flatMap((series) => {
      const rows: any[] = [];
      const supplySourcePoints = isRateMetric ? buildIncomeRatePoints(series.supplyPoints) : series.supplyPoints;
      const energySourcePoints = isRateMetric ? buildIncomeRatePoints(series.energyPoints) : series.energyPoints;
      const supplyVisiblePoints = supplySourcePoints.filter((point) => point.x >= selectedWindow.startMin && point.x <= selectedWindow.endMin);
      const energyVisiblePoints = energySourcePoints.filter((point) => point.x >= selectedWindow.startMin && point.x <= selectedWindow.endMin);
      if (showSupply && supplyVisiblePoints.length > 0) {
        rows.push({
          label: `${series.playerName} ${isRateMetric ? 'Supply Rate' : 'Supply'}`,
          data: downsamplePoints(supplyVisiblePoints, maxPointsPerSeries),
          borderColor: series.baseColor,
          backgroundColor: withAlpha(series.baseColor, 0.15),
          yAxisID: 'ySupply',
          tension: Number.isFinite(smoothing) ? smoothing : 0.25,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
        });
      }
      if (showPower && energyVisiblePoints.length > 0) {
        rows.push({
          label: `${series.playerName} ${isRateMetric ? 'Power Rate' : 'Power'}`,
          data: downsamplePoints(energyVisiblePoints, maxPointsPerSeries),
          borderColor: withAlpha(series.baseColor, 0.65),
          backgroundColor: 'transparent',
          yAxisID: 'yEnergy',
          borderDash: [6, 4],
          tension: Number.isFinite(smoothing) ? smoothing : 0.25,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
        });
      }
      return rows;
    });

    if (datasets.length === 0) {
      destroyChart(`chart-resources-${matchId}`);
      canvasEl.parentElement!.classList.add('hidden');
      if (emptyEl) {
        emptyEl.textContent = 'No visible series in this time window. Adjust graph window or enable Supply/Power.';
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    canvasEl.parentElement!.classList.remove('hidden');
    if (emptyEl) {
      emptyEl.textContent = 'No resource heartbeat data available.';
      emptyEl.classList.add('hidden');
    }

    destroyChart(`chart-resources-${matchId}`);
    const chart = new Chart(canvasEl, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, pointStyle: 'line' },
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1,
            callbacks: {
              title: (items: any[]) => {
                if (!items.length) return '';
                const minuteValue = Number(items[0]?.parsed?.x);
                if (!Number.isFinite(minuteValue)) return '';
                return formatMatchClock(minuteValue * 60000);
              },
              label: (context: any) => {
                const value = Number(context?.parsed?.y);
                const suffix = isRateMetric ? ' / min' : '';
                if (!Number.isFinite(value)) return context.dataset.label;
                const display = isRateMetric ? value.toFixed(1) : Math.round(value).toString();
                return `${context.dataset.label}: ${display}${suffix}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: selectedWindow.startMin,
            max: selectedWindow.endMin,
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (value: any) => {
                const minutes = Number(value);
                if (!Number.isFinite(minutes)) return '';
                if (minutes >= 60) {
                  const hours = Math.floor(minutes / 60);
                  const mins = Math.round(minutes % 60);
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                }
                return `${Math.round(minutes)}m`;
              },
            },
            title: { display: true, text: 'Match Time', color: '#94a3b8' },
          },
          ySupply: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            ticks: { color: '#94a3b8', font: { size: 10 } },
            title: { display: true, text: isRateMetric ? 'Supply / min' : 'Supply', color: '#94a3b8' },
          },
          yEnergy: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: '#94a3b8', font: { size: 10 } },
            title: { display: true, text: isRateMetric ? 'Power / min' : 'Power', color: '#94a3b8' },
          },
        },
      },
    });
    chartInstances.set(`chart-resources-${matchId}`, chart);
  };

  [...[showSupplyEl, showPowerEl, metricEl, smoothingEl, downsampleEl], ...extraRenderTriggers].forEach((el) => {
    if (!el) return;
    el.addEventListener('change', render);
    if (el instanceof HTMLInputElement && (el.type === 'number' || el.type === 'range')) {
      el.addEventListener('input', render);
    }
  });

  render();
}

function renderPopulationChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  getTimeWindow?: () => TimeWindow,
  extraRenderTriggers: Array<HTMLElement | null> = []
) {
  const canvasEl = document.getElementById(`chart-population-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-population"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  const showPopulationEl = document.getElementById(`population-show-population-${matchId}`) as HTMLInputElement | null;
  const showCapEl = document.getElementById(`population-show-cap-${matchId}`) as HTMLInputElement | null;
  const smoothingEl = document.getElementById(`population-smoothing-${matchId}`) as HTMLSelectElement | null;
  const downsampleEl = document.getElementById(`population-downsample-${matchId}`) as HTMLSelectElement | null;
  const downsampleHintEl = document.getElementById(`population-downsample-hint-${matchId}`) as HTMLElement | null;
  if (!canvasEl) return;

  const resourceEntries = entries
    .filter((entry) => entry.kind === 'resource' && entry.playerIndex != null)
    .filter((entry) => {
      const hasPopulation = Number.isFinite(Number(entry.population));
      const hasPopulationCap = Number.isFinite(Number(entry.populationCap));
      return hasPopulation || hasPopulationCap;
    });

  if (resourceEntries.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const sorted = [...resourceEntries].sort((a, b) => a.timeMs - b.timeMs);
  const populationByPlayer = new Map<number, ResourcePoint[]>();
  const populationCapByPlayer = new Map<number, ResourcePoint[]>();

  sorted.forEach((entry) => {
    const playerIndex = entry.playerIndex!;
    const timeMinutes = entry.timeMs / 60000;
    const population = Number(entry.population);
    const populationCap = Number(entry.populationCap);

    if (Number.isFinite(population)) {
      const list = populationByPlayer.get(playerIndex) || [];
      list.push({ x: timeMinutes, y: population });
      populationByPlayer.set(playerIndex, list);
    }
    if (Number.isFinite(populationCap)) {
      const list = populationCapByPlayer.get(playerIndex) || [];
      list.push({ x: timeMinutes, y: populationCap });
      populationCapByPlayer.set(playerIndex, list);
    }
  });

  const playerIndices = [...new Set([...populationByPlayer.keys(), ...populationCapByPlayer.keys()])].sort((a, b) => a - b);
  if (playerIndices.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const team1Colors = ['rgba(56, 189, 248, 0.9)', 'rgba(14, 165, 233, 0.9)', 'rgba(2, 132, 199, 0.9)'];
  const team2Colors = ['rgba(251, 113, 133, 0.9)', 'rgba(244, 63, 94, 0.9)', 'rgba(225, 29, 72, 0.9)'];
  let t1idx = 0;
  let t2idx = 0;

  const resolveBaseColor = (playerIndex: number) => {
    const teamId = playersByIndex.get(playerIndex)?.teamId;
    if (teamId === 1) {
      const color = team1Colors[t1idx % team1Colors.length];
      t1idx++;
      return color;
    }
    if (teamId === 2) {
      const color = team2Colors[t2idx % team2Colors.length];
      t2idx++;
      return color;
    }
    return 'rgba(148, 163, 184, 0.85)';
  };

  const populationSeries = playerIndices.map((playerIndex) => {
    const info = playersByIndex.get(playerIndex);
    return {
      playerName: info?.name || `Player ${playerIndex}`,
      baseColor: resolveBaseColor(playerIndex),
      populationPoints: populationByPlayer.get(playerIndex) || [],
      populationCapPoints: populationCapByPlayer.get(playerIndex) || [],
    };
  });

  const maxTimeMinutes = sorted.reduce((max, entry) => Math.max(max, entry.timeMs / 60000), 0);
  const longestSeriesLength = populationSeries.reduce((max, series) => {
    return Math.max(max, series.populationPoints.length, series.populationCapPoints.length);
  }, 0);

  const render = () => {
    const selectedWindow = getTimeWindow
      ? getTimeWindow()
      : clampTimeWindow(0, maxTimeMinutes || 1, maxTimeMinutes || 1);
    const showPopulation = showPopulationEl?.checked ?? true;
    const showCap = showCapEl?.checked ?? true;
    const smoothing = Number(smoothingEl?.value ?? '0.25');
    const downsampleMode = downsampleEl?.value ?? 'auto';
    const maxPointsPerSeries = resolveMaxPointsPerSeries(downsampleMode, longestSeriesLength, maxTimeMinutes);

    if (downsampleHintEl) {
      downsampleHintEl.textContent = Number.isFinite(maxPointsPerSeries)
        ? `Up to ${maxPointsPerSeries} points per series`
        : 'All points per series';
    }

    const datasets = populationSeries.flatMap((series) => {
      const rows: any[] = [];
      const populationVisible = series.populationPoints.filter((point) => point.x >= selectedWindow.startMin && point.x <= selectedWindow.endMin);
      const populationCapVisible = series.populationCapPoints.filter((point) => point.x >= selectedWindow.startMin && point.x <= selectedWindow.endMin);

      if (showPopulation && populationVisible.length > 0) {
        rows.push({
          label: `${series.playerName} Population`,
          data: downsamplePoints(populationVisible, maxPointsPerSeries),
          borderColor: series.baseColor,
          backgroundColor: withAlpha(series.baseColor, 0.15),
          yAxisID: 'yPopulation',
          tension: Number.isFinite(smoothing) ? smoothing : 0.25,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
        });
      }

      if (showCap && populationCapVisible.length > 0) {
        rows.push({
          label: `${series.playerName} Population Cap`,
          data: downsamplePoints(populationCapVisible, maxPointsPerSeries),
          borderColor: withAlpha(series.baseColor, 0.65),
          backgroundColor: 'transparent',
          yAxisID: 'yPopulation',
          borderDash: [6, 4],
          tension: Number.isFinite(smoothing) ? smoothing : 0.25,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
        });
      }

      return rows;
    });

    if (datasets.length === 0) {
      destroyChart(`chart-population-${matchId}`);
      canvasEl.parentElement!.classList.add('hidden');
      if (emptyEl) {
        emptyEl.textContent = 'No visible population series in this time window.';
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    canvasEl.parentElement!.classList.remove('hidden');
    if (emptyEl) {
      emptyEl.textContent = 'No population heartbeat data available.';
      emptyEl.classList.add('hidden');
    }

    destroyChart(`chart-population-${matchId}`);
    const chart = new Chart(canvasEl, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, pointStyle: 'line' },
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            borderWidth: 1,
            callbacks: {
              title: (items: any[]) => {
                if (!items.length) return '';
                const minuteValue = Number(items[0]?.parsed?.x);
                if (!Number.isFinite(minuteValue)) return '';
                return formatMatchClock(minuteValue * 60000);
              },
              label: (context: any) => {
                const value = Number(context?.parsed?.y);
                if (!Number.isFinite(value)) return context.dataset.label;
                return `${context.dataset.label}: ${Math.round(value)}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: selectedWindow.startMin,
            max: selectedWindow.endMin,
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (value: any) => {
                const minutes = Number(value);
                if (!Number.isFinite(minutes)) return '';
                if (minutes >= 60) {
                  const hours = Math.floor(minutes / 60);
                  const mins = Math.round(minutes % 60);
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                }
                return `${Math.round(minutes)}m`;
              },
            },
            title: { display: true, text: 'Match Time', color: '#94a3b8' },
          },
          yPopulation: {
            type: 'linear',
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            ticks: { color: '#94a3b8', font: { size: 10 } },
            title: { display: true, text: 'Population', color: '#94a3b8' },
          },
        },
      },
    });
    chartInstances.set(`chart-population-${matchId}`, chart);
  };

  [...[showPopulationEl, showCapEl, smoothingEl, downsampleEl], ...extraRenderTriggers].forEach((el) => {
    if (!el) return;
    el.addEventListener('change', render);
    if (el instanceof HTMLInputElement && (el.type === 'number' || el.type === 'range')) {
      el.addEventListener('input', render);
    }
  });

  render();
}

function renderLeaderPointsChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  timeWindow?: TimeWindow
) {
  const canvasEl = document.getElementById(`chart-leaderpoints-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-leaderpoints"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (!canvasEl) return;

  const resourceEntries = entries
    .filter((entry) => entry.kind === 'resource' && entry.playerIndex != null)
    .filter((entry) => Number.isFinite(Number(entry.commandXp)));

  if (resourceEntries.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const sorted = [...resourceEntries].sort((a, b) => a.timeMs - b.timeMs);
  const commandXpByPlayer = new Map<number, ResourcePoint[]>();

  sorted.forEach((entry) => {
    const playerIndex = entry.playerIndex!;
    const timeMinutes = entry.timeMs / 60000;
    const commandXp = Number(entry.commandXp);
    if (!Number.isFinite(commandXp)) return;
    const list = commandXpByPlayer.get(playerIndex) || [];
    list.push({ x: timeMinutes, y: commandXp });
    commandXpByPlayer.set(playerIndex, list);
  });

  const playerIndices = [...commandXpByPlayer.keys()].sort((a, b) => a - b);
  if (playerIndices.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const team1Colors = ['rgba(56, 189, 248, 0.9)', 'rgba(14, 165, 233, 0.9)', 'rgba(2, 132, 199, 0.9)'];
  const team2Colors = ['rgba(251, 113, 133, 0.9)', 'rgba(244, 63, 94, 0.9)', 'rgba(225, 29, 72, 0.9)'];
  let t1idx = 0;
  let t2idx = 0;

  const resolveBaseColor = (playerIndex: number) => {
    const teamId = playersByIndex.get(playerIndex)?.teamId;
    if (teamId === 1) {
      const color = team1Colors[t1idx % team1Colors.length];
      t1idx++;
      return color;
    }
    if (teamId === 2) {
      const color = team2Colors[t2idx % team2Colors.length];
      t2idx++;
      return color;
    }
    return 'rgba(148, 163, 184, 0.85)';
  };

  const xpSeries = playerIndices.map((playerIndex) => {
    const info = playersByIndex.get(playerIndex);
    return {
      playerName: info?.name || `Player ${playerIndex}`,
      baseColor: resolveBaseColor(playerIndex),
      points: commandXpByPlayer.get(playerIndex) || [],
    };
  });

  const maxTimeMinutes = sorted.reduce((max, entry) => Math.max(max, entry.timeMs / 60000), 0);
  const boundedWindow = clampTimeWindow(timeWindow?.startMin ?? 0, timeWindow?.endMin ?? (maxTimeMinutes || 1), maxTimeMinutes || 1);
  const longestSeriesLength = xpSeries.reduce((max, series) => Math.max(max, series.points.length), 0);
  const maxPointsPerSeries = resolveMaxPointsPerSeries('auto', longestSeriesLength, maxTimeMinutes);
  const maxSeriesXp = xpSeries.reduce((max, series) => {
    const visiblePoints = series.points.filter((point) => point.x >= boundedWindow.startMin && point.x <= boundedWindow.endMin);
    const seriesMax = visiblePoints.reduce((pointMax, point) => Math.max(pointMax, point.y), 0);
    return Math.max(max, seriesMax);
  }, 0);
  const thresholdCeiling = LEADER_POINT_XP_THRESHOLDS[LEADER_POINT_XP_THRESHOLDS.length - 1] || 0;
  const chartMaxXp = Math.max(maxSeriesXp, thresholdCeiling);
  const chartMaxTime = boundedWindow.endMin;

  const playerDatasets = xpSeries.map((series) => ({
    label: series.playerName,
    data: downsamplePoints(
      series.points.filter((point) => point.x >= boundedWindow.startMin && point.x <= boundedWindow.endMin),
      maxPointsPerSeries
    ),
    borderColor: series.baseColor,
    backgroundColor: withAlpha(series.baseColor, 0.12),
    tension: 0.2,
    pointRadius: 0,
    pointHoverRadius: 3,
    borderWidth: 2,
    fill: false,
  })).filter((dataset) => Array.isArray(dataset.data) && dataset.data.length > 0);

  if (playerDatasets.length === 0) {
    destroyChart(`chart-leaderpoints-${matchId}`);
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) {
      emptyEl.textContent = 'No leader point heartbeat data in this time window.';
      emptyEl.classList.remove('hidden');
    }
    return;
  }

  const thresholdDatasets = LEADER_POINT_XP_THRESHOLDS.map((threshold, idx) => ({
    label: `Leader Point ${idx + 1} Unlock`,
    data: [{ x: boundedWindow.startMin, y: threshold }, { x: chartMaxTime, y: threshold }],
    borderColor: withAlpha('rgba(148, 163, 184, 0.75)', threshold === 0 ? 0.45 : 0.28),
    borderDash: [5, 4],
    borderWidth: 1,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0,
    fill: false,
    isThresholdGuide: true,
  }));

  canvasEl.parentElement!.classList.remove('hidden');
  if (emptyEl) {
    emptyEl.textContent = 'No leader point heartbeat data available.';
    emptyEl.classList.add('hidden');
  }

  destroyChart(`chart-leaderpoints-${matchId}`);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: { datasets: [...playerDatasets, ...thresholdDatasets] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { size: 10 },
            usePointStyle: true,
            pointStyle: 'line',
            filter: (item: any, data: any) => {
              const dataset = data?.datasets?.[item?.datasetIndex];
              return !dataset?.isThresholdGuide;
            },
          },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          filter: (item: any) => !item?.dataset?.isThresholdGuide,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const minuteValue = Number(items[0]?.parsed?.x);
              if (!Number.isFinite(minuteValue)) return '';
              return formatMatchClock(minuteValue * 60000);
            },
            label: (context: any) => {
              const value = Number(context?.parsed?.y);
              if (!Number.isFinite(value)) return context.dataset.label;
              const roundedXp = Math.round(value);
              const unlocked = getLeaderPointsUnlocked(roundedXp);
              return `${context.dataset.label}: ${roundedXp} XP (LP ${unlocked})`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: boundedWindow.startMin,
          max: chartMaxTime,
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: (value: any) => {
              const minutes = Number(value);
              if (!Number.isFinite(minutes)) return '';
              if (minutes >= 60) {
                const hours = Math.floor(minutes / 60);
                const mins = Math.round(minutes % 60);
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
              }
              return `${Math.round(minutes)}m`;
            },
          },
          title: { display: true, text: 'Match Time', color: '#94a3b8' },
        },
        y: {
          type: 'linear',
          min: 0,
          max: chartMaxXp,
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: { color: '#94a3b8', font: { size: 10 } },
          title: { display: true, text: 'Command XP', color: '#94a3b8' },
        },
      },
    },
  });
  chartInstances.set(`chart-leaderpoints-${matchId}`, chart);
}

function renderBuildOrderChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>,
  timeWindow?: TimeWindow
) {
  const canvasEl = document.getElementById(`chart-buildorder-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-buildorder"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (!canvasEl) return;

  const buildKinds = new Set(['building', 'unit', 'upgrade', 'unit_upgrade', 'power']);
  const allBuildEntries = entries.filter(e => e.playerIndex != null && buildKinds.has(e.kind));
  const maxTimeMinutes = allBuildEntries.reduce((max, e) => Math.max(max, e.timeMs / 60000), 0);
  const boundedWindow = clampTimeWindow(timeWindow?.startMin ?? 0, timeWindow?.endMin ?? (maxTimeMinutes || 1), maxTimeMinutes || 1);
  const buildEntries = allBuildEntries.filter((entry) => {
    const minute = entry.timeMs / 60000;
    return minute >= boundedWindow.startMin && minute <= boundedWindow.endMin;
  });

  if (buildEntries.length === 0) {
    destroyChart(`chart-buildorder-${matchId}`);
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) {
      emptyEl.textContent = 'No build data in this time window.';
      emptyEl.classList.remove('hidden');
    }
    return;
  }

  canvasEl.parentElement!.classList.remove('hidden');
  if (emptyEl) emptyEl.classList.add('hidden');

  const playerIndices = [...new Set(buildEntries.map(e => e.playerIndex!))].sort((a, b) => a - b);
  const playerRowMap = new Map<number, number>();
  const playerLabels: string[] = [];
  playerIndices.forEach((idx, row) => {
    playerRowMap.set(idx, row);
    const info = playersByIndex.get(idx);
    playerLabels.push(info?.name || `Player ${idx}`);
  });

  const kindColorMap: Record<string, string> = {
    building:     'rgba(52, 211, 153, 0.8)',
    upgrade:      'rgba(251, 146, 60, 0.8)',
    unit:         'rgba(56, 189, 248, 0.8)',
    unit_upgrade: 'rgba(45, 212, 191, 0.8)',
    power:        'rgba(251, 191, 36, 0.8)',
  };

  const kindLabelMap: Record<string, string> = {
    building: 'Building',
    upgrade: 'Upgrade',
    unit: 'Unit',
    unit_upgrade: 'Tech',
    power: 'Power',
  };

  const dataByKind = new Map<string, Array<{ x: number; y: number; label: string }>>();

  buildEntries.forEach((entry) => {
    const row = playerRowMap.get(entry.playerIndex!);
    if (row == null) return;
    const kind = entry.kind;
    if (!dataByKind.has(kind)) dataByKind.set(kind, []);
    dataByKind.get(kind)!.push({
      x: entry.timeMs / 60000,
      y: row,
      label: entry.label,
    });
  });

  const datasets = [...dataByKind.entries()].map(([kind, points]) => ({
    label: kindLabelMap[kind] || kind,
    data: points,
    backgroundColor: kindColorMap[kind] || 'rgba(148, 163, 184, 0.6)',
    borderColor: (kindColorMap[kind] || 'rgba(148, 163, 184, 0.6)').replace(/[\d.]+\)$/, '1)'),
    borderWidth: 1,
    pointRadius: 4,
    pointHoverRadius: 6,
  }));

  const dynamicHeight = Math.max(200, playerLabels.length * 50);
  canvasEl.parentElement!.style.height = `${dynamicHeight}px`;

  destroyChart(`chart-buildorder-${matchId}`);
  const chart = new Chart(canvasEl, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const pt = items[0].raw;
              const playerName = playerLabels[pt.y] || '';
              const time = formatMatchClock(pt.x * 60000);
              return `${playerName} @ ${time}`;
            },
            label: (context: any) => context.raw.label || '',
          },
        },
      },
      scales: {
        x: {
          min: boundedWindow.startMin,
          max: boundedWindow.endMin,
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: (value: any) => `${Math.round(Number(value))}m`,
          },
          title: { display: true, text: 'Match Time (minutes)', color: '#94a3b8' },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#e2e8f0',
            font: { size: 10 },
            callback: (_: any, index: number) => playerLabels[index] || '',
            stepSize: 1,
          },
          min: -0.5,
          max: playerLabels.length - 0.5,
          reverse: false,
        },
      },
    },
  });
  chartInstances.set(`chart-buildorder-${matchId}`, chart);
}

export async function loadMatchGraphs(matchId: string, graphsEl: HTMLElement) {
  if (graphsEl.getAttribute('data-loading') === 'true') return;
  graphsEl.setAttribute('data-loading', 'true');
  graphsEl.innerHTML = `
    <div class="space-y-3 animate-pulse">
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
      <div class="h-48 bg-slate-700/50 rounded"></div>
    </div>
  `;

  const [eventResult, matchResultData] = await Promise.all([
    fetchMatchEventsPayload(matchId),
    (async () => {
      const cached = state.matchResultCache.get(matchId);
      if (cached) return cached;
      const result = await getMatchResult(matchId);
      if (result.ok) {
        state.matchResultCache.set(matchId, result.data);
        return result.data;
      }
      return null;
    })(),
  ]);

  let Chart: any;
  try {
    Chart = await ensureChartJs();
  } catch {
    graphsEl.removeAttribute('data-loading');
    graphsEl.innerHTML = `<div class="text-sm text-red-300 py-2">Unable to load chart library.</div>`;
    return;
  }

  graphsEl.innerHTML = `
    <div class="space-y-6">
      <div id="graph-units-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <h4 class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Units Destroyed vs Lost</h4>
        <div class="relative" style="height: 240px;">
          <canvas id="chart-units-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No unit data available.</div>
      </div>
      <div id="graph-timewindow-${matchId}" class="sticky top-3 z-20 rounded-lg border border-slate-700/50 bg-slate-900/85 backdrop-blur-sm p-3">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 class="text-[10px] uppercase tracking-wider text-gray-400">Graph Time Window</h4>
          <span id="graph-time-window-label-${matchId}" class="text-[10px] uppercase tracking-wider text-gray-500"></span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Preset</span>
            <select id="graph-time-preset-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="full" selected>Full Match</option>
              <option value="opening30">Opening 30m</option>
              <option value="opening60">Opening 60m</option>
              <option value="last30">Last 30m</option>
              <option value="last60">Last 60m</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Start (min)</span>
            <input id="graph-time-start-${matchId}" type="number" min="0" step="1" value="0" class="ml-auto w-20 rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200" />
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">End (min)</span>
            <input id="graph-time-end-${matchId}" type="number" min="1" step="1" value="60" class="ml-auto w-20 rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200" />
          </label>
        </div>
        <p class="text-[10px] uppercase tracking-wider text-gray-500 mt-2">Applies to Resources, Population, Leader Points, Build Order, and Activity graphs.</p>
      </div>
      <div id="graph-resources-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 class="text-[10px] uppercase tracking-wider text-gray-400">Resources Over Time</h4>
          <div class="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider text-gray-500">
            <span class="inline-flex items-center gap-2">
              <span class="inline-block w-5 border-t-2 border-cyan-300"></span>
              Supply
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="inline-block w-5 border-t-2 border-cyan-300 border-dashed"></span>
              Power
            </span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3 text-xs">
          <label class="inline-flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <input id="resource-show-supply-${matchId}" type="checkbox" checked class="accent-cyan-400" />
            <span>Show Supply</span>
          </label>
          <label class="inline-flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <input id="resource-show-power-${matchId}" type="checkbox" checked class="accent-cyan-400" />
            <span>Show Power</span>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Metric</span>
            <select id="resource-metric-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="total" selected>Total</option>
              <option value="rate">Income Rate</option>
            </select>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Smoothing</span>
            <select id="resource-smoothing-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="0">Off</option>
              <option value="0.15">Low</option>
              <option value="0.25" selected>Medium</option>
              <option value="0.4">High</option>
            </select>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Downsample</span>
            <select id="resource-downsample-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="auto" selected>Auto</option>
              <option value="300">300</option>
              <option value="240">240</option>
              <option value="180">180</option>
              <option value="120">120</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>
        <p id="resource-downsample-hint-${matchId}" class="text-[10px] uppercase tracking-wider text-gray-500 mb-2"></p>
        <div class="relative" style="height: 260px;">
          <canvas id="chart-resources-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No resource heartbeat data available.</div>
      </div>
      <div id="graph-population-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 class="text-[10px] uppercase tracking-wider text-gray-400">Population Over Time</h4>
          <div class="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider text-gray-500">
            <span class="inline-flex items-center gap-2">
              <span class="inline-block w-5 border-t-2 border-cyan-300"></span>
              Population
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="inline-block w-5 border-t-2 border-cyan-300 border-dashed"></span>
              Population Cap
            </span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3 text-xs">
          <label class="inline-flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <input id="population-show-population-${matchId}" type="checkbox" checked class="accent-cyan-400" />
            <span>Show Population</span>
          </label>
          <label class="inline-flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <input id="population-show-cap-${matchId}" type="checkbox" checked class="accent-cyan-400" />
            <span>Show Cap</span>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Smoothing</span>
            <select id="population-smoothing-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="0">Off</option>
              <option value="0.15">Low</option>
              <option value="0.25" selected>Medium</option>
              <option value="0.4">High</option>
            </select>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-gray-300">
            <span class="text-[10px] uppercase tracking-wider text-gray-500">Downsample</span>
            <select id="population-downsample-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
              <option value="auto" selected>Auto</option>
              <option value="300">300</option>
              <option value="240">240</option>
              <option value="180">180</option>
              <option value="120">120</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>
        <p id="population-downsample-hint-${matchId}" class="text-[10px] uppercase tracking-wider text-gray-500 mb-2"></p>
        <div class="relative" style="height: 260px;">
          <canvas id="chart-population-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No population heartbeat data available.</div>
      </div>
      <div id="graph-leaderpoints-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 class="text-[10px] uppercase tracking-wider text-gray-400">Leader Point Progression</h4>
          <span class="text-[10px] uppercase tracking-wider text-gray-500">Unlock XP: 0, 600, 1300, 2000, 3000, 4000, 5000, 6000, 7000, 7900, 8900</span>
        </div>
        <div class="relative" style="height: 260px;">
          <canvas id="chart-leaderpoints-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No leader point heartbeat data available.</div>
      </div>
      <div id="graph-buildorder-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <h4 class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Build Order Timeline</h4>
        <div class="relative" style="height: 200px;">
          <canvas id="chart-buildorder-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No build data available.</div>
      </div>
      <div id="graph-activity-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <h4 class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Activity Over Time</h4>
        <div class="relative" style="height: 240px;">
          <canvas id="chart-activity-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No event data available.</div>
      </div>
    </div>
  `;

  renderUnitsChart(Chart, matchId, matchResultData);

  if (eventResult.ok) {
    const { entries, playersByIndex } = await buildEventEntries(eventResult.data);
    const filteredEntries = entries.filter((entry) => {
      if (entry.playerIndex == null) return true;
      const info = playersByIndex.get(entry.playerIndex);
      return info?.playerType !== 3;
    });
    const maxTimelineMinutes = Math.max(1, filteredEntries.reduce((max, entry) => Math.max(max, entry.timeMs / 60000), 0));
    const presetEl = document.getElementById(`graph-time-preset-${matchId}`) as HTMLSelectElement | null;
    const startEl = document.getElementById(`graph-time-start-${matchId}`) as HTMLInputElement | null;
    const endEl = document.getElementById(`graph-time-end-${matchId}`) as HTMLInputElement | null;

    const applyPreset = (preset: string): TimeWindow => {
      switch (preset) {
        case 'opening30':
          return clampTimeWindow(0, Math.min(30, maxTimelineMinutes), maxTimelineMinutes);
        case 'opening60':
          return clampTimeWindow(0, Math.min(60, maxTimelineMinutes), maxTimelineMinutes);
        case 'last30':
          return clampTimeWindow(Math.max(0, maxTimelineMinutes - 30), maxTimelineMinutes, maxTimelineMinutes);
        case 'last60':
          return clampTimeWindow(Math.max(0, maxTimelineMinutes - 60), maxTimelineMinutes, maxTimelineMinutes);
        case 'full':
        default:
          return clampTimeWindow(0, maxTimelineMinutes, maxTimelineMinutes);
      }
    };

    const readAndSyncWindow = () => {
      const bounded = getSelectedTimeWindow(matchId, maxTimelineMinutes);
      syncTimeWindowInputs(matchId, bounded, maxTimelineMinutes);
      return bounded;
    };

    const renderTimeSeriesCharts = () => {
      const selectedWindow = readAndSyncWindow();
      renderActivityChart(Chart, matchId, filteredEntries, playersByIndex, selectedWindow);
      renderLeaderPointsChart(Chart, matchId, filteredEntries, playersByIndex, selectedWindow);
      renderBuildOrderChart(Chart, matchId, filteredEntries, playersByIndex, selectedWindow);
    };

    const initialWindow = applyPreset('full');
    syncTimeWindowInputs(matchId, initialWindow, maxTimelineMinutes);
    if (presetEl) presetEl.value = 'full';

    if (presetEl) {
      presetEl.addEventListener('change', () => {
        if (presetEl.value === 'custom') {
          renderTimeSeriesCharts();
          return;
        }
        const presetWindow = applyPreset(presetEl.value);
        syncTimeWindowInputs(matchId, presetWindow, maxTimelineMinutes);
        renderTimeSeriesCharts();
      });
    }

    const handleCustomWindowInput = () => {
      if (presetEl) presetEl.value = 'custom';
      renderTimeSeriesCharts();
    };

    [startEl, endEl].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', handleCustomWindowInput);
      el.addEventListener('change', handleCustomWindowInput);
    });

    renderResourcesChart(Chart, matchId, filteredEntries, playersByIndex, readAndSyncWindow, [presetEl, startEl, endEl]);
    renderPopulationChart(Chart, matchId, filteredEntries, playersByIndex, readAndSyncWindow, [presetEl, startEl, endEl]);
    renderTimeSeriesCharts();
  } else {
    const activityEmpty = graphsEl.querySelector(`#graph-activity-${matchId} .chart-empty`) as HTMLElement | null;
    const resourceEmpty = graphsEl.querySelector(`#graph-resources-${matchId} .chart-empty`) as HTMLElement | null;
    const populationEmpty = graphsEl.querySelector(`#graph-population-${matchId} .chart-empty`) as HTMLElement | null;
    const leaderPointsEmpty = graphsEl.querySelector(`#graph-leaderpoints-${matchId} .chart-empty`) as HTMLElement | null;
    const buildEmpty = graphsEl.querySelector(`#graph-buildorder-${matchId} .chart-empty`) as HTMLElement | null;
    const timeWindowSection = document.getElementById(`graph-timewindow-${matchId}`) as HTMLElement | null;
    const activityCanvas = document.getElementById(`chart-activity-${matchId}`)?.parentElement;
    const resourceCanvas = document.getElementById(`chart-resources-${matchId}`)?.parentElement;
    const populationCanvas = document.getElementById(`chart-population-${matchId}`)?.parentElement;
    const leaderPointsCanvas = document.getElementById(`chart-leaderpoints-${matchId}`)?.parentElement;
    const buildCanvas = document.getElementById(`chart-buildorder-${matchId}`)?.parentElement;
    if (timeWindowSection) timeWindowSection.classList.add('hidden');
    if (activityCanvas) activityCanvas.classList.add('hidden');
    if (resourceCanvas) resourceCanvas.classList.add('hidden');
    if (populationCanvas) populationCanvas.classList.add('hidden');
    if (leaderPointsCanvas) leaderPointsCanvas.classList.add('hidden');
    if (buildCanvas) buildCanvas.classList.add('hidden');
    if (activityEmpty) activityEmpty.classList.remove('hidden');
    if (resourceEmpty) resourceEmpty.classList.remove('hidden');
    if (populationEmpty) populationEmpty.classList.remove('hidden');
    if (leaderPointsEmpty) leaderPointsEmpty.classList.remove('hidden');
    if (buildEmpty) buildEmpty.classList.remove('hidden');
  }

  graphsEl.removeAttribute('data-loading');
  graphsEl.setAttribute('data-loaded', 'true');
}
