import { hideSkeleton } from './uiState';
import { parseDurationParts } from './dataProcessing';
import { ensureChartJs, destroyChart, chartInstances } from './chartManager';

export async function renderDurationDistribution(matches: any[]) {
  hideSkeleton('insights');
  const insightsContent = document.getElementById('insights-content')!;
  const emptyEl = document.getElementById('duration-chart-empty');
  const canvasEl = document.getElementById('chart-duration-distribution') as HTMLCanvasElement | null;

  if (!canvasEl) return;

  const durations: number[] = [];
  (Array.isArray(matches) ? matches : []).forEach((match: any) => {
    const iso = match.PlayerMatchDuration || match.MatchDuration;
    if (!iso) return;
    const parts = parseDurationParts(iso);
    const totalMinutes = (parts.weeks * 7 + parts.days) * 1440
      + parts.hours * 60
      + parts.minutes
      + parts.seconds / 60;
    if (totalMinutes > 0) durations.push(totalMinutes);
  });

  if (durations.length < 2) {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    insightsContent.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  canvasEl.parentElement!.classList.remove('hidden');

  const bucketSize = 5;
  const maxDuration = Math.ceil(Math.max(...durations) / bucketSize) * bucketSize;
  const bucketCount = Math.max(1, maxDuration / bucketSize);
  const buckets = new Array(bucketCount).fill(0);

  durations.forEach((d) => {
    const index = Math.min(Math.floor(d / bucketSize), bucketCount - 1);
    buckets[index]++;
  });

  const labels = buckets.map((_: number, i: number) => {
    const start = i * bucketSize;
    const end = start + bucketSize;
    return `${start}-${end}m`;
  });

  try {
    const Chart = await ensureChartJs();
    destroyChart('chart-duration-distribution');

    const chart = new Chart(canvasEl, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Matches',
          data: buckets,
          backgroundColor: 'rgba(6, 182, 212, 0.6)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
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
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
            title: { display: true, text: 'Duration', color: '#94a3b8' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1, precision: 0 },
            title: { display: true, text: 'Matches', color: '#94a3b8' },
          },
        },
      },
    });
    chartInstances.set('chart-duration-distribution', chart);
  } catch {
    canvasEl.parentElement!.classList.add('hidden');
    if (emptyEl) {
      emptyEl.textContent = 'Unable to load chart library.';
      emptyEl.classList.remove('hidden');
    }
  }

  insightsContent.classList.remove('hidden');
}
