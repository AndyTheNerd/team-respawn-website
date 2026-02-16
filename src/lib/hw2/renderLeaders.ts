import { hideSkeleton } from './uiState';
import { buildLeaderStatsFromMatches, renderLeaderRows } from './dataProcessing';

export function renderLeaderUsage(matches?: any[]) {
  hideSkeleton('leaders');
  const leadersContent = document.getElementById('leaders-content')!;

  const recentMatches = Array.isArray(matches) ? matches : [];
  const recentMatchCount = recentMatches.filter((m: any) => m.MatchType == null || m.MatchType === 3).length;
  const recentMap = buildLeaderStatsFromMatches(recentMatches);
  const recentEntries = [...recentMap.entries()].filter(([, data]) => data.matches > 0).sort((a, b) => b[1].matches - a[1].matches);
  const recentMax = recentEntries.length ? recentEntries[0][1].matches : 0;

  const headerHtml = `
    <div class="flex items-baseline justify-between mb-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Leader Usage</h3>
      <span class="text-xs text-gray-500">Last ${recentMatchCount} matches</span>
    </div>
  `;

  leadersContent.innerHTML = recentEntries.length
    ? headerHtml + `<div class="space-y-3">${renderLeaderRows(recentEntries, recentMax)}</div>`
    : headerHtml + '<p class="text-gray-500 text-sm text-center py-4">No recent leader data.</p>';
  leadersContent.classList.remove('hidden');
}
