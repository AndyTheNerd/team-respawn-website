let chartJsPromise: Promise<any> | null = null;
export const chartInstances = new Map<string, any>();

export async function ensureChartJs(): Promise<any> {
  const existing = (window as any).Chart;
  if (existing) return existing;
  if (chartJsPromise) return chartJsPromise;
  chartJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    script.onload = () => resolve((window as any).Chart);
    script.onerror = () => {
      chartJsPromise = null;
      reject(new Error('Failed to load Chart.js'));
    };
    document.head.appendChild(script);
  });
  return chartJsPromise;
}

export function destroyChart(canvasId: string) {
  const existing = chartInstances.get(canvasId);
  if (existing) {
    existing.destroy();
    chartInstances.delete(canvasId);
  }
}

export function destroyAllCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
}
