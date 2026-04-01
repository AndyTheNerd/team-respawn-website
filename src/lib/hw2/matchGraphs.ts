import { state } from './state';
import { formatMatchClock } from './dataProcessing';
import { ensureChartJs, destroyChart, chartInstances } from './chartManager';
import { getMatchResult } from '../../utils/haloApi';
import { fetchMatchEventsPayload, buildEventEntries } from './matchEventProcessing';
import {
  buildMatchGraphModel,
  clampGraphWindow,
  filterPointsForWindow,
  getPhaseWindow,
  type GraphWindow,
  type MatchGraphModel,
  type PlayerGraphSeries,
  type TimelineAnnotationLane,
} from './matchGraphModel';

type PhaseKey = 'full' | 'opening' | 'midgame' | 'late' | 'custom';
type EconomyMetric = 'supply' | 'power';
type GraphViewState = {
  phase: PhaseKey;
  window: GraphWindow;
  economyMetric: EconomyMetric;
  overlayPlayerIndex: number | null;
  hoverMinute: number | null;
  customEnabled: boolean;
};

type ContributionRow = {
  playerName: string;
  teamId: 1 | 2 | null;
  destroyed: number;
  lost: number;
  differential: number;
};

const TEAM_1_COLOR = 'rgba(56, 189, 248, 0.95)';
const TEAM_2_COLOR = 'rgba(251, 113, 133, 0.95)';
const TEAM_1_FILL = 'rgba(56, 189, 248, 0.18)';
const TEAM_2_FILL = 'rgba(251, 113, 133, 0.18)';
const OVERLAY_COLOR = 'rgba(250, 204, 21, 0.95)';
const GRID_COLOR = 'rgba(148, 163, 184, 0.08)';
const TICK_COLOR = '#94a3b8';
const TITLE_COLOR = '#cbd5e1';

const momentumBackgroundPlugin = {
  id: 'momentumBackground',
  beforeDraw(chart: any) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales?.y) return;
    const zeroPixel = scales.y.getPixelForValue(0);
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, Math.max(0, zeroPixel - chartArea.top));
    ctx.fillStyle = 'rgba(251, 113, 133, 0.04)';
    ctx.fillRect(chartArea.left, zeroPixel, chartArea.right - chartArea.left, Math.max(0, chartArea.bottom - zeroPixel));
    ctx.restore();
  },
};

const sharedCrosshairPlugin = {
  id: 'sharedCrosshair',
  afterDatasetsDraw(chart: any, _args: any, options: any) {
    const minute = options?.minute;
    if (!Number.isFinite(minute) || !chart?.chartArea || !chart?.scales?.x) return;
    const xPixel = chart.scales.x.getPixelForValue(minute);
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = options?.color || 'rgba(34, 211, 238, 0.55)';
    ctx.setLineDash(options?.dash || [5, 4]);
    ctx.beginPath();
    ctx.moveTo(xPixel, chartArea.top);
    ctx.lineTo(xPixel, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^rgba\(([^)]+)\)$/i);
  if (!match) return color;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return color;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function getChartIds(matchId: string) {
  return {
    momentum: `chart-momentum-${matchId}`,
    economy: `chart-economy-${matchId}`,
    army: `chart-army-${matchId}`,
    contribution: `chart-contribution-${matchId}`,
  };
}

function getPhaseLabel(phase: PhaseKey): string {
  switch (phase) {
    case 'opening':
      return 'Opening';
    case 'midgame':
      return 'Midgame';
    case 'late':
      return 'Late';
    case 'custom':
      return 'Custom';
    case 'full':
    default:
      return 'Full';
  }
}

function formatAxisMinutes(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(value)}m`;
}

function downsamplePoints<T extends { x: number }>(points: T[], maxPoints: number): T[] {
  if (!Number.isFinite(maxPoints) || maxPoints <= 0 || points.length <= maxPoints) return points;
  if (maxPoints === 1) return [points[points.length - 1]];
  const result: T[] = [points[0]];
  const interior = maxPoints - 2;
  let lastIndex = 0;
  for (let index = 1; index <= interior; index++) {
    const pointIndex = Math.round((index * (points.length - 1)) / (interior + 1));
    if (pointIndex <= lastIndex || pointIndex >= points.length - 1) continue;
    result.push(points[pointIndex]);
    lastIndex = pointIndex;
  }
  result.push(points[points.length - 1]);
  return result;
}

function resolveMaxPoints(maxTimeMin: number): number {
  if (maxTimeMin >= 120) return 180;
  if (maxTimeMin >= 75) return 220;
  if (maxTimeMin >= 45) return 260;
  return 320;
}

function getSharedPluginOptions(viewState: GraphViewState) {
  return {
    sharedCrosshair: {
      minute: viewState.hoverMinute,
      color: 'rgba(34, 211, 238, 0.45)',
      dash: [4, 4],
    },
  };
}

function buildContributionRows(matchResult: any): ContributionRow[] {
  const playersRaw = matchResult?.Players;
  const players = Array.isArray(playersRaw)
    ? playersRaw
    : (playersRaw && typeof playersRaw === 'object')
      ? Object.values(playersRaw)
      : [];

  const distinctTeamIds = [...new Set(
    players
      .filter((player: any) => player?.PlayerType !== 3)
      .map((player: any) => player?.TeamId)
      .filter((teamId: any) => typeof teamId === 'number')
  )].sort((a, b) => a - b);
  const teamLookup = new Map<number, 1 | 2>();
  distinctTeamIds.slice(0, 2).forEach((teamId, index) => {
    teamLookup.set(teamId, index === 0 ? 1 : 2);
  });

  return players
    .filter((player: any) => player?.PlayerType !== 3)
    .map((player: any) => {
      const gamertag = player?.HumanPlayerId?.Gamertag
        || player?.Gamertag
        || (typeof player?.HumanPlayerId === 'string' ? player.HumanPlayerId : '')
        || 'Unknown';
      let destroyed = 0;
      let lost = 0;
      const unitStats = player?.UnitStats;
      if (unitStats && typeof unitStats === 'object') {
        Object.values(unitStats).forEach((unit: any) => {
          destroyed += unit?.TotalDestroyed || 0;
          lost += unit?.TotalLost || 0;
        });
      }
      return {
        playerName: gamertag,
        teamId: teamLookup.get(player?.TeamId) ?? null,
        destroyed,
        lost,
        differential: destroyed - lost,
      };
    })
    .sort((a, b) => {
      const teamA = a.teamId ?? 99;
      const teamB = b.teamId ?? 99;
      if (teamA !== teamB) return teamA - teamB;
      return b.differential - a.differential;
    });
}

function setChartEmpty(wrapperId: string, canvasId: string, message: string, visible: boolean) {
  const wrapperEl = document.getElementById(wrapperId);
  const canvasWrapper = document.getElementById(canvasId)?.parentElement as HTMLElement | null;
  const emptyEl = wrapperEl?.querySelector('.chart-empty') as HTMLElement | null;
  if (canvasWrapper) canvasWrapper.classList.toggle('hidden', visible);
  if (emptyEl) {
    emptyEl.textContent = message;
    emptyEl.classList.toggle('hidden', !visible);
  }
}

function updateRangeBrush(matchId: string, viewState: GraphViewState, maxTimeMin: number) {
  const startEl = document.getElementById(`graph-brush-start-${matchId}`) as HTMLInputElement | null;
  const endEl = document.getElementById(`graph-brush-end-${matchId}`) as HTMLInputElement | null;
  const labelEl = document.getElementById(`graph-brush-label-${matchId}`) as HTMLElement | null;
  if (startEl) {
    startEl.min = '0';
    startEl.max = String(maxTimeMin);
    startEl.step = '0.5';
    startEl.value = String(viewState.window.startMin);
  }
  if (endEl) {
    endEl.min = '0.5';
    endEl.max = String(maxTimeMin);
    endEl.step = '0.5';
    endEl.value = String(viewState.window.endMin);
  }
  if (labelEl) {
    labelEl.textContent = `${formatMatchClock(viewState.window.startMin * 60000)} to ${formatMatchClock(viewState.window.endMin * 60000)}`;
  }
}

function updatePhaseButtons(matchId: string, viewState: GraphViewState) {
  document.querySelectorAll<HTMLButtonElement>(`#graph-phase-controls-${matchId} [data-phase]`).forEach((button) => {
    const phase = button.dataset.phase as PhaseKey | undefined;
    button.textContent = phase ? getPhaseLabel(phase) : 'Phase';
    const isActive = phase === viewState.phase;
    const isCustomLocked = phase === 'custom' && !viewState.customEnabled;
    button.className = `graph-chip rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
      isActive
        ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
        : 'border-slate-700/60 bg-slate-900/60 text-gray-400 hover:border-slate-500/70 hover:text-gray-200'
    } ${isCustomLocked ? 'opacity-50 cursor-not-allowed hover:border-slate-700/60 hover:text-gray-400' : ''}`;
    button.disabled = isCustomLocked;
  });
}

function updateEconomyButtons(matchId: string, viewState: GraphViewState) {
  document.querySelectorAll<HTMLButtonElement>(`#graph-economy-controls-${matchId} [data-economy-metric]`).forEach((button) => {
    const metric = button.dataset.economyMetric as EconomyMetric | undefined;
    button.textContent = metric === 'power' ? 'Power/min' : 'Supply/min';
    const isActive = metric === viewState.economyMetric;
    button.className = `rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
      isActive
        ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
        : 'border-slate-700/60 bg-slate-900/60 text-gray-400 hover:border-slate-500/70 hover:text-gray-200'
    }`;
  });
}

function updateHoverReadout(matchId: string, viewState: GraphViewState) {
  const hoverEl = document.getElementById(`graph-hover-readout-${matchId}`);
  if (!hoverEl) return;
  hoverEl.textContent = Number.isFinite(viewState.hoverMinute)
    ? `Hover ${formatMatchClock((viewState.hoverMinute || 0) * 60000)}`
    : `${getPhaseLabel(viewState.phase)} window`;
}

function updateRailHoverGuides(matchId: string, viewState: GraphViewState) {
  const guides = document.querySelectorAll<HTMLElement>(`#graph-event-rail-${matchId} .graph-rail-guide`);
  const span = Math.max(0.5, viewState.window.endMin - viewState.window.startMin);
  const hoverMinute = viewState.hoverMinute;
  guides.forEach((guide) => {
    if (!Number.isFinite(hoverMinute) || hoverMinute == null || hoverMinute < viewState.window.startMin || hoverMinute > viewState.window.endMin) {
      guide.classList.add('hidden');
      return;
    }
    const percent = ((hoverMinute - viewState.window.startMin) / span) * 100;
    guide.style.left = `${Math.max(0, Math.min(100, percent))}%`;
    guide.classList.remove('hidden');
  });
}

function redrawSyncedCharts(matchId: string, viewState: GraphViewState) {
  const chartIds = getChartIds(matchId);
  [chartIds.momentum, chartIds.economy, chartIds.army].forEach((chartId) => {
    const chart = chartInstances.get(chartId);
    if (!chart) return;
    chart.options.plugins = {
      ...(chart.options.plugins || {}),
      ...getSharedPluginOptions(viewState),
    };
    chart.draw();
  });
  updateHoverReadout(matchId, viewState);
  updateRailHoverGuides(matchId, viewState);
}

function bindSharedHover(matchId: string, viewState: GraphViewState) {
  const chartIds = getChartIds(matchId);
  [chartIds.momentum, chartIds.economy, chartIds.army].forEach((chartId) => {
    const canvasEl = document.getElementById(chartId) as HTMLCanvasElement | null;
    if (!canvasEl || canvasEl.dataset.hoverBound === 'true') return;
    canvasEl.dataset.hoverBound = 'true';

    canvasEl.addEventListener('mousemove', (event) => {
      const chart = chartInstances.get(chartId);
      const xScale = chart?.scales?.x;
      if (!chart || !xScale) return;
      const rect = canvasEl.getBoundingClientRect();
      const pixel = event.clientX - rect.left;
      const minute = xScale.getValueForPixel(pixel);
      if (!Number.isFinite(minute)) return;
      viewState.hoverMinute = Math.max(viewState.window.startMin, Math.min(viewState.window.endMin, Number(minute)));
      redrawSyncedCharts(matchId, viewState);
    });

    canvasEl.addEventListener('mouseleave', () => {
      viewState.hoverMinute = null;
      redrawSyncedCharts(matchId, viewState);
    });
  });
}

function renderContributionChart(Chart: any, matchId: string, rows: ContributionRow[]) {
  const canvasId = getChartIds(matchId).contribution;
  const wrapperId = `graph-contribution-${matchId}`;
  const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvasEl) return;

  if (rows.length === 0) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No contribution data available.', true);
    return;
  }

  setChartEmpty(wrapperId, canvasId, '', false);
  const labels = rows.map((row) => `${row.teamId ? `T${row.teamId}` : 'NA'} · ${row.playerName}`);

  destroyChart(canvasId);
  const chart = new Chart(canvasEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Destroyed',
          data: rows.map((row) => row.destroyed),
          backgroundColor: 'rgba(74, 222, 128, 0.7)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Lost',
          data: rows.map((row) => -row.lost),
          backgroundColor: 'rgba(248, 113, 113, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Differential',
          data: rows.map((row) => row.differential),
          backgroundColor: rows.map((row) => row.differential >= 0 ? 'rgba(34, 211, 238, 0.35)' : 'rgba(251, 191, 36, 0.35)'),
          borderColor: rows.map((row) => row.differential >= 0 ? 'rgba(34, 211, 238, 1)' : 'rgba(251, 191, 36, 1)'),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: TICK_COLOR, font: { size: 10 } },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${Math.abs(Number(context.raw))}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: {
            color: TICK_COLOR,
            callback: (value: any) => Math.abs(Number(value)),
          },
          title: { display: true, text: 'Units', color: TITLE_COLOR },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: '#e2e8f0', font: { size: 11 } },
        },
      },
    },
  });
  chartInstances.set(canvasId, chart);
}

function renderMomentumChart(Chart: any, matchId: string, model: MatchGraphModel, viewState: GraphViewState, hasHeartbeatData: boolean) {
  const canvasId = getChartIds(matchId).momentum;
  const wrapperId = `graph-momentum-${matchId}`;
  const badgeEl = document.getElementById(`graph-decisive-swing-${matchId}`);
  const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvasEl) return;

  if (!hasHeartbeatData) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No resource heartbeat data available for team momentum.', true);
    if (badgeEl) badgeEl.textContent = 'Heartbeat data unavailable';
    return;
  }

  const momentumPoints = downsamplePoints(
    filterPointsForWindow(model.momentum, viewState.window).map((point) => ({
      x: point.timeMin,
      y: point.score,
      components: point.components,
      leaderTeam: point.leaderTeam,
    })),
    resolveMaxPoints(model.maxTimeMin)
  );
  const swingMarkers = filterPointsForWindow(model.swingMarkers, viewState.window).map((point) => ({
    x: point.timeMin,
    y: point.score,
    leaderTeam: point.leaderTeam,
    label: point.label,
    magnitude: point.magnitude,
  }));

  if (momentumPoints.length === 0) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No momentum data in this phase.', true);
    if (badgeEl) badgeEl.textContent = 'No decisive swing in view';
    return;
  }

  const decisiveSwing = filterPointsForWindow(model.swingMarkers, viewState.window)
    .filter((point) => point.timeMin >= 5)
    .sort((a, b) => b.magnitude - a.magnitude)[0] || model.decisiveSwing;

  if (badgeEl) {
    badgeEl.textContent = decisiveSwing
      ? `Decisive swing: ${decisiveSwing.leaderTeam === 1 ? 'Team 1' : 'Team 2'} at ${formatMatchClock(decisiveSwing.timeMin * 60000)}`
      : 'No decisive swing identified';
  }

  setChartEmpty(wrapperId, canvasId, '', false);
  destroyChart(canvasId);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Team 1 Edge Fill',
          data: momentumPoints.map((point) => ({ x: point.x, y: Math.max(point.y, 0) })),
          borderWidth: 0,
          pointRadius: 0,
          fill: 'origin',
          backgroundColor: TEAM_1_FILL,
          isGuide: true,
        },
        {
          label: 'Team 2 Edge Fill',
          data: momentumPoints.map((point) => ({ x: point.x, y: Math.min(point.y, 0) })),
          borderWidth: 0,
          pointRadius: 0,
          fill: 'origin',
          backgroundColor: TEAM_2_FILL,
          isGuide: true,
        },
        {
          label: 'Momentum Score',
          data: momentumPoints,
          borderColor: 'rgba(226, 232, 240, 0.95)',
          backgroundColor: 'rgba(226, 232, 240, 0.12)',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2.5,
        },
        {
          type: 'scatter',
          label: 'Swing Marker',
          data: swingMarkers,
          pointRadius: 5,
          pointHoverRadius: 6,
          pointStyle: 'triangle',
          borderWidth: 1.5,
          backgroundColor: swingMarkers.map((point) => point.leaderTeam === 1 ? TEAM_1_COLOR : TEAM_2_COLOR),
          borderColor: swingMarkers.map((point) => point.leaderTeam === 1 ? withAlpha(TEAM_1_COLOR, 1) : withAlpha(TEAM_2_COLOR, 1)),
        },
      ],
    },
    plugins: [momentumBackgroundPlugin, sharedCrosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: TICK_COLOR,
            font: { size: 10 },
            filter: (item: any, data: any) => !data?.datasets?.[item?.datasetIndex]?.isGuide,
          },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          filter: (item: any) => !item?.dataset?.isGuide,
          callbacks: {
            title: (items: any[]) => {
              const minute = Number(items?.[0]?.parsed?.x);
              return Number.isFinite(minute) ? formatMatchClock(minute * 60000) : '';
            },
            label: (context: any) => {
              const score = Number(context?.parsed?.y);
              if (context.dataset.label === 'Swing Marker') {
                return `${context.raw.label}: ${Math.round(Math.abs(score))}`;
              }
              const edgeLabel = score > 0 ? 'Team 1 edge' : score < 0 ? 'Team 2 edge' : 'Even';
              return `Momentum score: ${Math.round(score)} (${edgeLabel})`;
            },
            afterBody: (items: any[]) => {
              const point = items?.[0]?.raw;
              const components = point?.components;
              if (!components) return [];
              return [
                `Supply pace: ${Math.round(components.supply * 100)}%`,
                `Power pace: ${Math.round(components.power * 100)}%`,
                `Population: ${Math.round(components.population * 100)}%`,
                `Command XP: ${Math.round(components.commandXp * 100)}%`,
              ];
            },
          },
        },
        ...getSharedPluginOptions(viewState),
      },
      scales: {
        x: {
          type: 'linear',
          min: viewState.window.startMin,
          max: viewState.window.endMin,
          grid: { color: GRID_COLOR },
          ticks: {
            color: TICK_COLOR,
            font: { size: 10 },
            callback: (value: any) => formatAxisMinutes(Number(value)),
          },
          title: { display: true, text: 'Match Time', color: TITLE_COLOR },
        },
        y: {
          min: -100,
          max: 100,
          grid: { color: GRID_COLOR },
          ticks: {
            color: TICK_COLOR,
            callback: (value: any) => `${Math.abs(Number(value))}`,
          },
          title: { display: true, text: 'Composite Edge', color: TITLE_COLOR },
        },
      },
    },
  });
  chartInstances.set(canvasId, chart);
}

function findOverlayPlayer(model: MatchGraphModel, overlayPlayerIndex: number | null): PlayerGraphSeries | null {
  if (overlayPlayerIndex == null) return null;
  return model.playerSeries.find((series) => series.playerIndex === overlayPlayerIndex) || null;
}

function renderEconomyChart(Chart: any, matchId: string, model: MatchGraphModel, viewState: GraphViewState, hasHeartbeatData: boolean) {
  const canvasId = getChartIds(matchId).economy;
  const wrapperId = `graph-economy-${matchId}`;
  const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvasEl) return;

  if (!hasHeartbeatData) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No economy heartbeat data available.', true);
    return;
  }

  const visibleAggregates = downsamplePoints(filterPointsForWindow(model.teamAggregates, viewState.window).map((point) => ({
    x: point.timeMin,
    team1: viewState.economyMetric === 'supply' ? point.team1.supplyRate : point.team1.powerRate,
    team2: viewState.economyMetric === 'supply' ? point.team2.supplyRate : point.team2.powerRate,
  })), resolveMaxPoints(model.maxTimeMin));

  if (!visibleAggregates.length) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No economy data in this phase.', true);
    return;
  }

  const overlayPlayer = findOverlayPlayer(model, viewState.overlayPlayerIndex);
  const overlayData = overlayPlayer
    ? downsamplePoints(filterPointsForWindow(overlayPlayer.points, viewState.window).map((point) => ({
        x: point.timeMin,
        y: viewState.economyMetric === 'supply' ? point.supplyRate : point.powerRate,
      })), resolveMaxPoints(model.maxTimeMin))
    : [];

  setChartEmpty(wrapperId, canvasId, '', false);
  destroyChart(canvasId);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Team 1',
          data: visibleAggregates.map((point) => ({ x: point.x, y: point.team1 })),
          borderColor: TEAM_1_COLOR,
          backgroundColor: TEAM_1_FILL,
          tension: 0.18,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2.5,
        },
        {
          label: 'Team 2',
          data: visibleAggregates.map((point) => ({ x: point.x, y: point.team2 })),
          borderColor: TEAM_2_COLOR,
          backgroundColor: TEAM_2_FILL,
          tension: 0.18,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2.5,
        },
        ...(overlayPlayer && overlayData.length
          ? [{
              label: `${overlayPlayer.playerName} Overlay`,
              data: overlayData,
              borderColor: OVERLAY_COLOR,
              backgroundColor: 'transparent',
              borderDash: [6, 4],
              tension: 0.18,
              pointRadius: 0,
              pointHoverRadius: 3,
              borderWidth: 2,
            }]
          : []),
      ],
    },
    plugins: [sharedCrosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: TICK_COLOR, font: { size: 10 }, usePointStyle: true, pointStyle: 'line' },
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
              const minute = Number(items?.[0]?.parsed?.x);
              return Number.isFinite(minute) ? formatMatchClock(minute * 60000) : '';
            },
            label: (context: any) => {
              const value = Number(context?.parsed?.y);
              const suffix = viewState.economyMetric === 'supply' ? 'supply/min' : 'power/min';
              return `${context.dataset.label}: ${value.toFixed(1)} ${suffix}`;
            },
          },
        },
        ...getSharedPluginOptions(viewState),
      },
      scales: {
        x: {
          type: 'linear',
          min: viewState.window.startMin,
          max: viewState.window.endMin,
          grid: { color: GRID_COLOR },
          ticks: {
            color: TICK_COLOR,
            font: { size: 10 },
            callback: (value: any) => formatAxisMinutes(Number(value)),
          },
          title: { display: true, text: 'Match Time', color: TITLE_COLOR },
        },
        y: {
          beginAtZero: true,
          grid: { color: GRID_COLOR },
          ticks: { color: TICK_COLOR, font: { size: 10 } },
          title: {
            display: true,
            text: viewState.economyMetric === 'supply' ? 'Supply / min' : 'Power / min',
            color: TITLE_COLOR,
          },
        },
      },
    },
  });
  chartInstances.set(canvasId, chart);
}

function renderArmyChart(Chart: any, matchId: string, model: MatchGraphModel, viewState: GraphViewState, hasHeartbeatData: boolean) {
  const canvasId = getChartIds(matchId).army;
  const wrapperId = `graph-army-${matchId}`;
  const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvasEl) return;

  if (!hasHeartbeatData) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No army-pressure heartbeat data available.', true);
    return;
  }

  const visibleAggregates = downsamplePoints(filterPointsForWindow(model.teamAggregates, viewState.window).map((point) => ({
    x: point.timeMin,
    team1Population: point.team1.population,
    team2Population: point.team2.population,
    deathDifferential: point.team2.cumulativeDeaths - point.team1.cumulativeDeaths,
  })), resolveMaxPoints(model.maxTimeMin));

  if (!visibleAggregates.length) {
    destroyChart(canvasId);
    setChartEmpty(wrapperId, canvasId, 'No army-pressure data in this phase.', true);
    return;
  }

  const overlayPlayer = findOverlayPlayer(model, viewState.overlayPlayerIndex);
  const overlayData = overlayPlayer
    ? downsamplePoints(filterPointsForWindow(overlayPlayer.points, viewState.window).map((point) => ({
        x: point.timeMin,
        y: point.population,
      })), resolveMaxPoints(model.maxTimeMin))
    : [];

  setChartEmpty(wrapperId, canvasId, '', false);
  destroyChart(canvasId);
  const chart = new Chart(canvasEl, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Team 1 Population',
          data: visibleAggregates.map((point) => ({ x: point.x, y: point.team1Population })),
          borderColor: TEAM_1_COLOR,
          backgroundColor: TEAM_1_FILL,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.18,
          borderWidth: 2.5,
          yAxisID: 'yPopulation',
        },
        {
          label: 'Team 2 Population',
          data: visibleAggregates.map((point) => ({ x: point.x, y: point.team2Population })),
          borderColor: TEAM_2_COLOR,
          backgroundColor: TEAM_2_FILL,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.18,
          borderWidth: 2.5,
          yAxisID: 'yPopulation',
        },
        {
          label: 'Death Differential',
          data: visibleAggregates.map((point) => ({ x: point.x, y: point.deathDifferential })),
          borderColor: 'rgba(251, 191, 36, 0.95)',
          backgroundColor: 'rgba(251, 191, 36, 0.12)',
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.15,
          borderDash: [5, 4],
          borderWidth: 2,
          yAxisID: 'yDeaths',
        },
        ...(overlayPlayer && overlayData.length
          ? [{
              label: `${overlayPlayer.playerName} Population`,
              data: overlayData,
              borderColor: OVERLAY_COLOR,
              backgroundColor: 'transparent',
              borderDash: [6, 4],
              pointRadius: 0,
              pointHoverRadius: 3,
              tension: 0.18,
              borderWidth: 2,
              yAxisID: 'yPopulation',
            }]
          : []),
      ],
    },
    plugins: [sharedCrosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: TICK_COLOR, font: { size: 10 }, usePointStyle: true, pointStyle: 'line' },
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
              const minute = Number(items?.[0]?.parsed?.x);
              return Number.isFinite(minute) ? formatMatchClock(minute * 60000) : '';
            },
            label: (context: any) => {
              const value = Number(context?.parsed?.y);
              if (context.dataset.yAxisID === 'yDeaths') {
                const edgeLabel = value > 0 ? 'Team 1 edge' : value < 0 ? 'Team 2 edge' : 'Even';
                return `${context.dataset.label}: ${Math.round(value)} (${edgeLabel})`;
              }
              return `${context.dataset.label}: ${Math.round(value)}`;
            },
          },
        },
        ...getSharedPluginOptions(viewState),
      },
      scales: {
        x: {
          type: 'linear',
          min: viewState.window.startMin,
          max: viewState.window.endMin,
          grid: { color: GRID_COLOR },
          ticks: {
            color: TICK_COLOR,
            font: { size: 10 },
            callback: (value: any) => formatAxisMinutes(Number(value)),
          },
          title: { display: true, text: 'Match Time', color: TITLE_COLOR },
        },
        yPopulation: {
          beginAtZero: true,
          grid: { color: GRID_COLOR },
          ticks: { color: TICK_COLOR, font: { size: 10 } },
          title: { display: true, text: 'Population', color: TITLE_COLOR },
        },
        yDeaths: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: TICK_COLOR, font: { size: 10 } },
          title: { display: true, text: 'Death Differential', color: TITLE_COLOR },
        },
      },
    },
  });
  chartInstances.set(canvasId, chart);
}

function renderEventRail(matchId: string, model: MatchGraphModel, viewState: GraphViewState, isCompleteSet: boolean | undefined) {
  const containerEl = document.getElementById(`graph-event-rail-${matchId}`);
  if (!containerEl) return;

  const annotations = filterPointsForWindow(model.annotations, viewState.window);
  const span = Math.max(0.5, viewState.window.endMin - viewState.window.startMin);
  const laneTitles: Array<{ key: TimelineAnnotationLane; label: string }> = [
    { key: 'tech', label: 'Tech' },
    { key: 'powers', label: 'Powers' },
    { key: 'population', label: 'Peak Pop' },
    { key: 'deaths', label: 'Spikes' },
  ];

  if (!annotations.length) {
    containerEl.innerHTML = `
      <div class="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3 text-sm text-gray-400">
        No milestone markers available in this phase.
        ${isCompleteSet === false ? '<span class="block mt-2 text-[11px] uppercase tracking-wider text-amber-300">Event feed incomplete</span>' : ''}
      </div>
    `;
    return;
  }

  containerEl.innerHTML = `
    <div class="space-y-3">
      ${isCompleteSet === false ? '<div class="text-[11px] uppercase tracking-wider text-amber-300">Event feed incomplete</div>' : ''}
      ${laneTitles.map((lane) => {
        const laneAnnotations = annotations.filter((annotation) => annotation.lane === lane.key);
        return `
          <div class="grid grid-cols-[72px_1fr] items-center gap-3">
            <div class="text-[10px] uppercase tracking-wider text-gray-500">${lane.label}</div>
            <div class="relative h-9 overflow-hidden rounded-lg border border-slate-700/40 bg-slate-900/55">
              <div class="graph-rail-guide pointer-events-none absolute inset-y-0 hidden w-px bg-cyan-300/45"></div>
              ${laneAnnotations.map((annotation) => {
                const percent = ((annotation.timeMin - viewState.window.startMin) / span) * 100;
                const teamClass = annotation.teamId === 1
                  ? 'border-cyan-300/70 bg-cyan-400/15 text-cyan-100'
                  : annotation.teamId === 2
                    ? 'border-rose-300/70 bg-rose-400/15 text-rose-100'
                    : 'border-slate-500/70 bg-slate-700/40 text-gray-100';
                return `
                  <div
                    class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${teamClass}"
                    style="left: ${Math.max(0, Math.min(100, percent))}%;"
                    title="${annotation.label}"
                  >
                    ${annotation.shortLabel}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  updateRailHoverGuides(matchId, viewState);
}

function attachControls(
  matchId: string,
  model: MatchGraphModel,
  viewState: GraphViewState,
  rerender: () => void
) {
  document.querySelectorAll<HTMLButtonElement>(`#graph-phase-controls-${matchId} [data-phase]`).forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const phase = button.dataset.phase as PhaseKey | undefined;
      if (!phase) return;
      if (phase === 'custom' && !viewState.customEnabled) return;
      viewState.phase = phase;
      if (phase !== 'custom') {
        viewState.window = getPhaseWindow(phase, model.maxTimeMin);
      }
      updatePhaseButtons(matchId, viewState);
      updateRangeBrush(matchId, viewState, model.maxTimeMin);
      rerender();
    });
  });

  document.querySelectorAll<HTMLButtonElement>(`#graph-economy-controls-${matchId} [data-economy-metric]`).forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const metric = button.dataset.economyMetric as EconomyMetric | undefined;
      if (!metric) return;
      viewState.economyMetric = metric;
      updateEconomyButtons(matchId, viewState);
      rerender();
    });
  });

  const overlayEl = document.getElementById(`graph-player-overlay-${matchId}`) as HTMLSelectElement | null;
  if (overlayEl && overlayEl.dataset.bound !== 'true') {
    overlayEl.dataset.bound = 'true';
    overlayEl.addEventListener('change', () => {
      const nextValue = Number(overlayEl.value);
      viewState.overlayPlayerIndex = Number.isFinite(nextValue) ? nextValue : null;
      rerender();
    });
  }

  const startEl = document.getElementById(`graph-brush-start-${matchId}`) as HTMLInputElement | null;
  const endEl = document.getElementById(`graph-brush-end-${matchId}`) as HTMLInputElement | null;
  const handleBrushChange = () => {
    const start = Number(startEl?.value ?? viewState.window.startMin);
    const end = Number(endEl?.value ?? viewState.window.endMin);
    viewState.customEnabled = true;
    viewState.phase = 'custom';
    viewState.window = clampGraphWindow(start, end, model.maxTimeMin);
    updatePhaseButtons(matchId, viewState);
    updateRangeBrush(matchId, viewState, model.maxTimeMin);
    rerender();
  };

  [startEl, endEl].forEach((input) => {
    if (!input || input.dataset.bound === 'true') return;
    input.dataset.bound = 'true';
    input.addEventListener('input', handleBrushChange);
    input.addEventListener('change', handleBrushChange);
  });
}

function renderGraphDashboard(
  Chart: any,
  matchId: string,
  model: MatchGraphModel,
  contributions: ContributionRow[],
  options: { hasHeartbeatData: boolean; isCompleteSet: boolean | undefined; }
) {
  const viewState: GraphViewState = {
    phase: 'full',
    window: getPhaseWindow('full', model.maxTimeMin),
    economyMetric: 'supply',
    overlayPlayerIndex: null,
    hoverMinute: null,
    customEnabled: false,
  };

  const rerender = () => {
    renderMomentumChart(Chart, matchId, model, viewState, options.hasHeartbeatData);
    renderEconomyChart(Chart, matchId, model, viewState, options.hasHeartbeatData);
    renderArmyChart(Chart, matchId, model, viewState, options.hasHeartbeatData);
    renderEventRail(matchId, model, viewState, options.isCompleteSet);
    renderContributionChart(Chart, matchId, contributions);
    redrawSyncedCharts(matchId, viewState);
  };

  updatePhaseButtons(matchId, viewState);
  updateEconomyButtons(matchId, viewState);
  updateRangeBrush(matchId, viewState, model.maxTimeMin);
  updateHoverReadout(matchId, viewState);
  bindSharedHover(matchId, viewState);
  attachControls(matchId, model, viewState, rerender);
  rerender();
}

export async function loadMatchGraphs(matchId: string, graphsEl: HTMLElement) {
  if (graphsEl.getAttribute('data-loading') === 'true') return;
  graphsEl.setAttribute('data-loading', 'true');
  graphsEl.innerHTML = `
    <div class="space-y-3 animate-pulse">
      <div class="h-56 rounded-xl bg-slate-700/40"></div>
      <div class="h-44 rounded-xl bg-slate-700/40"></div>
      <div class="h-44 rounded-xl bg-slate-700/40"></div>
      <div class="h-36 rounded-xl bg-slate-700/40"></div>
      <div class="h-56 rounded-xl bg-slate-700/40"></div>
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

  const chartIds = getChartIds(matchId);
  graphsEl.innerHTML = `
    <div class="space-y-6">
      <div id="graph-momentum-${matchId}" class="rounded-xl border border-slate-700/40 bg-slate-900/55 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p class="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Match Momentum</p>
            <h4 class="text-lg font-semibold text-white mt-1">Who is ahead, when it flips, and why</h4>
          </div>
          <div class="text-right">
            <p id="graph-decisive-swing-${matchId}" class="text-xs font-medium text-cyan-100"></p>
            <p id="graph-hover-readout-${matchId}" class="mt-1 text-[11px] uppercase tracking-wider text-gray-500"></p>
          </div>
        </div>
        <div id="graph-phase-controls-${matchId}" class="flex flex-wrap items-center gap-2 mb-4">
          <button type="button" data-phase="full"></button>
          <button type="button" data-phase="opening"></button>
          <button type="button" data-phase="midgame"></button>
          <button type="button" data-phase="late"></button>
          <button type="button" data-phase="custom"></button>
        </div>
        <div class="relative" style="height: 280px;">
          <canvas id="${chartIds.momentum}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-sm text-gray-400"></div>
        <div class="hidden sm:grid grid-cols-2 gap-3 mt-4">
          <label class="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2">
            <span class="block text-[10px] uppercase tracking-wider text-gray-500">Range Brush Start</span>
            <input id="graph-brush-start-${matchId}" type="range" min="0" max="1" step="0.5" class="mt-2 w-full accent-cyan-400" />
          </label>
          <label class="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2">
            <div class="flex items-center justify-between gap-2">
              <span class="block text-[10px] uppercase tracking-wider text-gray-500">Range Brush End</span>
              <span id="graph-brush-label-${matchId}" class="text-[10px] uppercase tracking-wider text-gray-400"></span>
            </div>
            <input id="graph-brush-end-${matchId}" type="range" min="0.5" max="1" step="0.5" class="mt-2 w-full accent-cyan-400" />
          </label>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div id="graph-economy-${matchId}" class="rounded-xl border border-slate-700/40 bg-slate-900/55 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p class="text-[10px] uppercase tracking-[0.24em] text-gray-400">Economy Pace</p>
              <h4 class="text-sm font-semibold text-white mt-1">Team-level resource tempo</h4>
            </div>
            <div id="graph-economy-controls-${matchId}" class="flex flex-wrap items-center gap-2">
              <button type="button" data-economy-metric="supply"></button>
              <button type="button" data-economy-metric="power"></button>
            </div>
          </div>
          <div class="mb-3">
            <label class="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2 text-xs text-gray-300">
              <span class="text-[10px] uppercase tracking-wider text-gray-500">Player Overlay</span>
              <select id="graph-player-overlay-${matchId}" class="ml-auto rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[11px] text-gray-200">
                <option value="">Team Only</option>
                ${modelOptionMarkup([])}
              </select>
            </label>
          </div>
          <div class="relative" style="height: 240px;">
            <canvas id="${chartIds.economy}"></canvas>
          </div>
          <div class="chart-empty hidden text-center py-4 text-sm text-gray-400"></div>
        </div>

        <div id="graph-army-${matchId}" class="rounded-xl border border-slate-700/40 bg-slate-900/55 p-4">
          <div class="mb-4">
            <p class="text-[10px] uppercase tracking-[0.24em] text-gray-400">Army Pressure</p>
            <h4 class="text-sm font-semibold text-white mt-1">Population pressure plus death differential</h4>
          </div>
          <div class="relative" style="height: 240px;">
            <canvas id="${chartIds.army}"></canvas>
          </div>
          <div class="chart-empty hidden text-center py-4 text-sm text-gray-400"></div>
        </div>
      </div>

      <div id="graph-rail-${matchId}" class="rounded-xl border border-slate-700/40 bg-slate-900/55 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p class="text-[10px] uppercase tracking-[0.24em] text-gray-400">Event Rail</p>
            <h4 class="text-sm font-semibold text-white mt-1">Milestones that explain the swings</h4>
          </div>
          <p class="text-[11px] uppercase tracking-wider text-gray-500">First tech, power spikes, peak pop, death spikes</p>
        </div>
        <div id="graph-event-rail-${matchId}"></div>
      </div>

      <div id="graph-contribution-${matchId}" class="rounded-xl border border-slate-700/40 bg-slate-900/55 p-4">
        <div class="mb-4">
          <p class="text-[10px] uppercase tracking-[0.24em] text-gray-400">Contribution Summary</p>
          <h4 class="text-sm font-semibold text-white mt-1">End-of-match player contribution snapshot</h4>
        </div>
        <div class="relative" style="height: 300px;">
          <canvas id="${chartIds.contribution}"></canvas>
        </div>
        <div class="chart-empty hidden text-center py-4 text-sm text-gray-400"></div>
      </div>
    </div>
  `;

  if (eventResult.ok) {
    const { entries, playersByIndex, isCompleteSet } = await buildEventEntries(eventResult.data);
    const filteredEntries = entries.filter((entry) => {
      if (entry.playerIndex == null) return true;
      const info = playersByIndex.get(entry.playerIndex);
      return info?.playerType !== 3;
    });
    const model = buildMatchGraphModel(filteredEntries, playersByIndex);
    const overlayEl = document.getElementById(`graph-player-overlay-${matchId}`) as HTMLSelectElement | null;
    if (overlayEl) {
      overlayEl.innerHTML = `
        <option value="">Team Only</option>
        ${model.playerSeries.map((series) => `<option value="${series.playerIndex}">${series.teamId ? `Team ${series.teamId}` : 'Unknown'} · ${series.playerName}</option>`).join('')}
      `;
    }
    renderGraphDashboard(Chart, matchId, model, buildContributionRows(matchResultData), {
      hasHeartbeatData: filteredEntries.some((entry) => entry.kind === 'resource'),
      isCompleteSet,
    });
  } else {
    const emptyModel = buildMatchGraphModel([], new Map());
    renderGraphDashboard(Chart, matchId, emptyModel, buildContributionRows(matchResultData), {
      hasHeartbeatData: false,
      isCompleteSet: undefined,
    });
    renderEventRail(matchId, emptyModel, {
      phase: 'full',
      window: getPhaseWindow('full', emptyModel.maxTimeMin),
      economyMetric: 'supply',
      overlayPlayerIndex: null,
      hoverMinute: null,
      customEnabled: false,
    }, undefined);
    const railEl = document.getElementById(`graph-event-rail-${matchId}`);
    if (railEl) {
      railEl.innerHTML = `<div class="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3 text-sm text-gray-400">Match events are unavailable for this game.</div>`;
    }
  }

  graphsEl.removeAttribute('data-loading');
  graphsEl.setAttribute('data-loaded', 'true');
}

function modelOptionMarkup(series: Array<{ playerIndex: number; playerName: string; teamId: 1 | 2 | null }>): string {
  return series.map((item) => `<option value="${item.playerIndex}">${item.teamId ? `Team ${item.teamId}` : 'Unknown'} · ${item.playerName}</option>`).join('');
}
