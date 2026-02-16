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
  playersByIndex: Map<number, PlayerInfo>
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

  const labels = Array.from({ length: bucketCount }, (_, i) => {
    const minutes = i + 1;
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? `${minutes % 60}m` : ''}`;
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
        data: cumulativeBuckets,
        borderColor: color,
        backgroundColor: color.replace(/[\d.]+\)$/, '0.1)'),
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      };
    });

  destroyChart(`chart-activity-${matchId}`);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: { labels, datasets },
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
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 15 },
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

function renderBuildOrderChart(
  Chart: any,
  matchId: string,
  entries: TimelineEntry[],
  playersByIndex: Map<number, PlayerInfo>
) {
  const canvasEl = document.getElementById(`chart-buildorder-${matchId}`) as HTMLCanvasElement | null;
  const wrapperEl = canvasEl?.closest('[id^="graph-buildorder"]');
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (!canvasEl) return;

  const buildKinds = new Set(['building', 'unit', 'upgrade', 'unit_upgrade', 'power']);
  const buildEntries = entries.filter(e => e.playerIndex != null && buildKinds.has(e.kind));

  if (buildEntries.length === 0) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

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
      <div id="graph-activity-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <h4 class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Activity Over Time</h4>
        <div class="relative" style="height: 240px;">
          <canvas id="chart-activity-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No event data available.</div>
      </div>
      <div id="graph-buildorder-${matchId}" class="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
        <h4 class="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Build Order Timeline</h4>
        <div class="relative" style="height: 200px;">
          <canvas id="chart-buildorder-${matchId}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-xs text-gray-500">No build data available.</div>
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
    renderActivityChart(Chart, matchId, filteredEntries, playersByIndex);
    renderBuildOrderChart(Chart, matchId, filteredEntries, playersByIndex);
  } else {
    const activityEmpty = graphsEl.querySelector(`#graph-activity-${matchId} .chart-empty`) as HTMLElement | null;
    const buildEmpty = graphsEl.querySelector(`#graph-buildorder-${matchId} .chart-empty`) as HTMLElement | null;
    const activityCanvas = document.getElementById(`chart-activity-${matchId}`)?.parentElement;
    const buildCanvas = document.getElementById(`chart-buildorder-${matchId}`)?.parentElement;
    if (activityCanvas) activityCanvas.classList.add('hidden');
    if (buildCanvas) buildCanvas.classList.add('hidden');
    if (activityEmpty) activityEmpty.classList.remove('hidden');
    if (buildEmpty) buildEmpty.classList.remove('hidden');
  }

  graphsEl.removeAttribute('data-loading');
  graphsEl.setAttribute('data-loaded', 'true');
}
