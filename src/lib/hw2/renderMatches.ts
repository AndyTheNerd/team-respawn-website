import { MATCHES_PER_PAGE, state } from './state';
import { hideSkeleton, showError } from './uiState';
import { globalError } from './dom';
import { parseDuration, getGameModeName } from './dataProcessing';
import { getPinnedMatches, togglePinnedMatch } from './localStorage';
import { showShareModal } from './shareCard';
import { exportMatchToCsv, exportAllMatchesToCsv } from './matchExport';
import { loadMatchDetails } from './matchDetails';
import { loadMatchTimeline } from './matchTimeline';
import { loadMatchGraphs } from './matchGraphs';
import { loadMatchSummary, type MatchSummaryContext, type PlayerSummary } from './matchSummary';
import { fetchMatchEventsPayload, buildEventEntries } from './matchEventProcessing';
import { getMatchResult } from '../../utils/haloApi';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getMapName, getMapImage, getMapImageFallback } from '../../data/haloWars2/maps';
import { getPlaylistName } from '../../data/haloWars2/playlists';

function getOrderedMatches(matches: any[], pinnedSet: Set<string> = new Set(getPinnedMatches())) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const pinnedMatches = safeMatches.filter((m: any) => m?.MatchId && pinnedSet.has(m.MatchId));
  const unpinnedMatches = safeMatches.filter((m: any) => !m?.MatchId || !pinnedSet.has(m.MatchId));
  return [...pinnedMatches, ...unpinnedMatches];
}

export function renderMatches(matches: any[], gamertag: string) {
  hideSkeleton('matches');
  const matchesContent = document.getElementById('matches-content')!;
  state.currentMatches = Array.isArray(matches) ? matches : [];
  state.currentGamertag = gamertag;
  state.matchLookup = new Map<string, any>();
  state.currentMatches.forEach((m: any) => {
    const id = m?.MatchId;
    if (id) state.matchLookup.set(id, m);
  });

  if (!matches || matches.length === 0) {
    state.currentMatchPage = 1;
    matchesContent.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No recent matches found.</p>';
    matchesContent.classList.remove('hidden');
    return;
  }

  const pinnedSet = new Set(getPinnedMatches());
  const displayMatches = getOrderedMatches(state.currentMatches, pinnedSet);
  const totalMatchPages = Math.max(1, Math.ceil(displayMatches.length / MATCHES_PER_PAGE));
  state.currentMatchPage = Math.max(1, Math.min(state.currentMatchPage, totalMatchPages));

  const pageStart = (state.currentMatchPage - 1) * MATCHES_PER_PAGE;
  const pageMatches = displayMatches.slice(pageStart, pageStart + MATCHES_PER_PAGE);
  const PAGE_WINDOW = 5;
  const halfWindow = Math.floor(PAGE_WINDOW / 2);
  let windowStart = Math.max(1, state.currentMatchPage - halfWindow);
  let windowEnd = Math.min(totalMatchPages, windowStart + PAGE_WINDOW - 1);
  windowStart = Math.max(1, windowEnd - PAGE_WINDOW + 1);
  const pageButtonsHtml = Array.from({ length: windowEnd - windowStart + 1 }, (_unused, index) => {
    const pageNum = windowStart + index;
    const isActive = pageNum === state.currentMatchPage;
    const activeClass = isActive
      ? 'bg-cyan-500/90 text-slate-950 border-cyan-300'
      : 'bg-slate-800/50 text-cyan-200 border-cyan-500/20 hover:border-cyan-400/40 hover:text-cyan-100';
    return `
      <button
        type="button"
        class="matches-page-btn rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${activeClass}"
        data-page-target="${pageNum}"
        ${isActive ? 'aria-current="page"' : ''}
      >
        ${pageNum}
      </button>
    `;
  }).join('');
  const paginationHtml = totalMatchPages > 1
    ? `
      <div class="flex items-center justify-between gap-3 border-t border-slate-700/40 px-4 py-3">
        <button
          type="button"
          class="matches-page-btn rounded-md border border-cyan-500/20 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed"
          data-page-target="${state.currentMatchPage - 1}"
          ${state.currentMatchPage <= 1 ? 'disabled' : ''}
        >
          Previous
        </button>
        <div class="flex items-center gap-2" aria-label="Matches pages">
          ${pageButtonsHtml}
        </div>
        <button
          type="button"
          class="matches-page-btn rounded-md border border-cyan-500/20 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed"
          data-page-target="${state.currentMatchPage + 1}"
          ${state.currentMatchPage >= totalMatchPages ? 'disabled' : ''}
        >
          Next
        </button>
      </div>
    `
    : '';

  const exportAllHtml = `
    <div class="flex justify-end px-4 py-2 border-b border-slate-700/30">
      <button
        type="button"
        class="export-all-matches-btn inline-flex items-center gap-2 rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
        title="Export all matches to CSV"
      >
        <i class="fas fa-file-export" aria-hidden="true"></i>
        Export All Matches (CSV)
      </button>
    </div>
  `;
  matchesContent.innerHTML = exportAllHtml + '<div class="divide-y divide-slate-700/30">' + pageMatches.map((match: any, i: number) => {
    const gtLower = gamertag.toLowerCase();
    const player = match.Players?.find((p: any) => {
      const id = p.HumanPlayerId || p.Gamertag || p.PlayerId;
      return id && String(id).toLowerCase() === gtLower;
    }) || match.Players?.[0] || null;

    const rawOutcome = player?.MatchOutcome
      ?? player?.PlayerMatchOutcome
      ?? match.PlayerMatchOutcome
      ?? match.MatchOutcome
      ?? match.MatchResult;
    const outcome = typeof rawOutcome === 'string' ? rawOutcome.toLowerCase() : rawOutcome;
    const isWin = outcome === 1 || outcome === 'win' || outcome === 'victory';
    const isLoss = outcome === 2 || outcome === 'loss' || outcome === 'defeat';
    const resultText = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';
    const resultColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400';
    const borderColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : '#6b7280';

    const leaderId = player?.LeaderId ?? match.LeaderId;
    const leaderName = leaderId != null ? getLeaderName(leaderId) : 'Unknown';
    const mapName = getMapName(match.MapId || '');
    const mapImg = getMapImage(match.MapId || '');
    const mapFallback = getMapImageFallback(match.MapId || '');
    const fallbackAttr = mapFallback ? ` data-fallback="${mapFallback}"` : '';
    const dateStr = match.MatchStartDate?.ISO8601Date
      ? new Date(match.MatchStartDate.ISO8601Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    const durationIso = match.PlayerMatchDuration || match.MatchDuration;
    const durationStr = durationIso ? parseDuration(durationIso) : '';

    const playlistName = match.PlaylistId ? getPlaylistName(match.PlaylistId) : '';
    const fallbackLabel = getGameModeName(match.GameMode) || (match.MatchType === 3 ? 'Matchmaking' : match.MatchType === 2 ? 'Custom' : match.MatchType === 1 ? 'Campaign' : 'Unknown');
    const playlistLabel = playlistName || fallbackLabel;

    const prevCsr = match.RatingProgress?.PreviousCsr?.Raw;
    const nextCsr = match.RatingProgress?.UpdatedCsr?.Raw;
    const csrDelta = (typeof prevCsr === 'number' && typeof nextCsr === 'number') ? Math.round(nextCsr - prevCsr) : null;
    const csrDeltaText = csrDelta != null ? `${csrDelta > 0 ? '+' : ''}${csrDelta}` : '';
    const csrDeltaClass = csrDelta == null ? 'text-gray-500' : csrDelta > 0 ? 'text-green-400' : csrDelta < 0 ? 'text-red-400' : 'text-gray-400';

    const unitStats = player?.UnitStats || match.UnitStats;
    let unitsDestroyed = 0;
    let unitsLost = 0;
    if (unitStats && typeof unitStats === 'object') {
      Object.values(unitStats).forEach((u: any) => {
        unitsDestroyed += u?.TotalDestroyed || 0;
        unitsLost += u?.TotalLost || 0;
      });
    }
    const unitsText = (unitsDestroyed || unitsLost) ? `${unitsDestroyed}D / ${unitsLost}L` : '';

    const completed = player?.PlayerCompletedMatch ?? match.PlayerCompletedMatch;
    const completionTag = completed == null
      ? ''
      : completed
        ? '<span class="text-green-400">Completed</span>'
        : '<span class="text-red-400">Left Early</span>';

    let teamSizeLabel = '';
    if (match.Teams && typeof match.Teams === 'object') {
      const sizes = Object.values(match.Teams).map((t: any) => t?.TeamSize).filter((s: any) => typeof s === 'number');
      if (sizes.length >= 2) {
        teamSizeLabel = `${sizes[0]}v${sizes[1]}`;
      } else if (sizes.length === 1) {
        teamSizeLabel = `${sizes[0]}v${sizes[0]}`;
      }
    }

    const matchId = match.MatchId || '';
    const detailsId = matchId ? `match-details-${matchId}` : '';
    const timelineId = matchId ? `match-timeline-${matchId}` : '';
    const isPinned = matchId ? pinnedSet.has(matchId) : false;
    const pinLabel = isPinned ? 'Pinned' : 'Pin';
    const pinClass = isPinned
      ? 'text-amber-200 border-amber-400/40 bg-amber-400/10'
      : 'text-cyan-300 border-cyan-500/20 bg-slate-800/40 hover:text-cyan-200 hover:border-cyan-400/40';
    const bgClass = i % 2 === 0 ? 'bg-slate-800/20' : '';

    return `
      <div class="${bgClass} hover:bg-slate-700/20 transition-colors" style="border-left: 4px solid ${borderColor};">
        <div class="flex items-start gap-4 p-4">
          ${mapImg
            ? `<img src="${mapImg}" alt="${mapName}"${fallbackAttr} class="w-16 h-10 sm:w-20 sm:h-12 rounded object-cover flex-shrink-0 border border-slate-600/30" loading="lazy" />`
            : `<div class="w-16 h-10 sm:w-20 sm:h-12 rounded bg-slate-700/50 flex-shrink-0 flex items-center justify-center text-xs text-gray-500">${mapName}</div>`
          }
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold ${resultColor} text-sm">${resultText}</span>
              <span class="text-gray-400 text-xs">on</span>
              <span class="text-white text-sm truncate">${mapName}</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
              <span>${leaderName}</span>
              ${dateStr ? `<span>${dateStr}</span>` : ''}
              ${durationStr ? `<span>• ${durationStr}</span>` : ''}
              ${teamSizeLabel ? `<span>• ${teamSizeLabel}</span>` : ''}
              ${completionTag ? `<span>• ${completionTag}</span>` : ''}
              ${playlistLabel ? `<span class="text-cyan-300">• ${playlistLabel}</span>` : ''}
              ${csrDeltaText ? `<span class="${csrDeltaClass}">• CSR ${csrDeltaText}</span>` : ''}
              ${unitsText ? `<span>• Units ${unitsText}</span>` : ''}
            </div>
            ${matchId ? `
              <div class="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  class="match-details-toggle flex-none w-full sm:w-auto sm:flex-[4] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="${detailsId}"
                  aria-expanded="false"
                >
                  <span>Team Compositions and Stats</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="match-details-state text-[10px] uppercase tracking-wider text-gray-400">Expand</span>
                    <span class="match-details-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="match-timeline-toggle flex-none w-full sm:w-auto sm:flex-[3] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="${timelineId}"
                  aria-expanded="false"
                >
                  <span>Build Timeline</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="match-timeline-state text-[10px] uppercase tracking-wider text-gray-400">Expand</span>
                    <span class="match-timeline-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="match-graphs-toggle flex-none w-full sm:w-auto sm:flex-[3] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="match-graphs-${matchId}"
                  aria-expanded="false"
                >
                  <span>Match Graphs</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="match-graphs-state text-[10px] uppercase tracking-wider text-gray-400">Expand</span>
                    <span class="match-graphs-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="match-pin-toggle flex-[1] inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs ${pinClass} transition-colors"
                  aria-pressed="${isPinned ? 'true' : 'false'}"
                  title="${pinLabel} match"
                  data-match-id="${matchId}"
                >
                  <i class="fas fa-thumbtack mr-1" aria-hidden="true"></i>
                  <span class="hidden sm:inline">${pinLabel}</span>
                </button>
                <button
                  type="button"
                  class="match-share-toggle flex-[1] inline-flex items-center justify-center rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  aria-label="Share match"
                  title="Share match"
                  data-match-id="${matchId}"
                  data-gamertag="${gamertag}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span class="hidden sm:inline">Share</span>
                </button>
                <button
                  type="button"
                  class="match-export-toggle flex-[1] hidden sm:inline-flex items-center justify-center rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  aria-label="Export match to CSV"
                  title="Export match to CSV"
                  data-match-id="${matchId}"
                  data-gamertag="${gamertag}"
                >
                  <i class="fas fa-file-export" aria-hidden="true"></i>
                  <span class="hidden sm:inline">Export</span>
                </button>
                <button
                  type="button"
                  class="match-summary-toggle flex-none w-full sm:w-auto sm:flex-[4] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="match-summary-${matchId}"
                  aria-expanded="false"
                >
                  <span>✨ AI Summary</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="match-summary-state text-[10px] uppercase tracking-wider text-gray-400">Expand</span>
                    <span class="match-summary-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                  </span>
                </button>
              </div>
              <div id="${detailsId}" class="match-details mt-3 hidden" data-loaded="false"></div>
              <div id="${timelineId}" class="match-timeline mt-3 hidden" data-loaded="false"></div>
              <div id="match-graphs-${matchId}" class="match-graphs mt-3 hidden" data-loaded="false"></div>
              <div id="match-summary-${matchId}" class="match-summary mt-3 hidden" data-loaded="false"></div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') + '</div>' + paginationHtml;
  matchesContent.classList.remove('hidden');

  // Wire up pagination
  matchesContent.querySelectorAll('[data-page-target]').forEach((node) => {
    const button = node as HTMLButtonElement;
    button.addEventListener('click', () => {
      const targetPage = Number(button.getAttribute('data-page-target'));
      if (!Number.isFinite(targetPage)) return;
      if (targetPage < 1 || targetPage > totalMatchPages) return;
      if (targetPage === state.currentMatchPage) return;
      state.currentMatchPage = targetPage;
      renderMatches(state.currentMatches, state.currentGamertag);
    });
  });

  // Wire up image fallbacks
  matchesContent.querySelectorAll('img[data-fallback]').forEach((node) => {
    const img = node as HTMLImageElement;
    img.addEventListener('error', () => {
      const fallback = img.getAttribute('data-fallback') || '';
      if (fallback && img.getAttribute('src') !== fallback) {
        img.setAttribute('src', fallback);
      }
    }, { once: true });
  });

  // Wire up match details toggles
  const setPanelToggleState = (
    toggle: HTMLElement,
    panel: 'details' | 'timeline' | 'graphs' | 'summary',
    expanded: boolean
  ) => {
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    const chevron = toggle.querySelector(`.match-${panel}-chevron`) as HTMLElement | null;
    if (chevron) chevron.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
    const stateText = toggle.querySelector(`.match-${panel}-state`) as HTMLElement | null;
    if (stateText) stateText.textContent = expanded ? 'Collapse' : 'Expand';
  };

  const collapseOtherPanels = (matchId: string, keepPanel: string) => {
    const panels = ['details', 'timeline', 'graphs', 'summary'] as const;
    panels.forEach((panel) => {
      if (panel === keepPanel) return;
      const toggle = matchesContent.querySelector(`.match-${panel}-toggle[data-match-id="${matchId}"]`) as HTMLElement | null;
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
        setPanelToggleState(toggle, panel, false);
        const el = document.getElementById(`match-${panel}-${matchId}`);
        if (el) el.classList.add('hidden');
      }
    });
  };

  matchesContent.querySelectorAll('.match-details-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      const detailsId = `match-details-${matchId}`;
      const detailsEl = document.getElementById(detailsId);
      if (!detailsEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      setPanelToggleState(btn as HTMLElement, 'details', !isExpanded);
      detailsEl.classList.toggle('hidden', isExpanded);

      if (!isExpanded) collapseOtherPanels(matchId, 'details');
      if (isExpanded) return;
      if (detailsEl.getAttribute('data-loaded') === 'true') return;
      await loadMatchDetails(matchId, detailsEl);
    });
  });

  matchesContent.querySelectorAll('.match-timeline-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      const timelineId = `match-timeline-${matchId}`;
      const timelineEl = document.getElementById(timelineId);
      if (!timelineEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      setPanelToggleState(btn as HTMLElement, 'timeline', !isExpanded);
      timelineEl.classList.toggle('hidden', isExpanded);

      if (!isExpanded) collapseOtherPanels(matchId, 'timeline');
      if (isExpanded) return;
      if (timelineEl.getAttribute('data-loaded') === 'true') return;
      await loadMatchTimeline(matchId, timelineEl);
    });
  });

  matchesContent.querySelectorAll('.match-graphs-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      const graphsId = `match-graphs-${matchId}`;
      const graphsEl = document.getElementById(graphsId);
      if (!graphsEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      setPanelToggleState(btn as HTMLElement, 'graphs', !isExpanded);
      graphsEl.classList.toggle('hidden', isExpanded);

      if (!isExpanded) collapseOtherPanels(matchId, 'graphs');
      if (isExpanded) return;
      if (graphsEl.getAttribute('data-loaded') === 'true') return;
      await loadMatchGraphs(matchId, graphsEl);
    });
  });

  matchesContent.querySelectorAll('.match-summary-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      const summaryId = `match-summary-${matchId}`;
      const summaryEl = document.getElementById(summaryId);
      if (!summaryEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      setPanelToggleState(btn as HTMLElement, 'summary', !isExpanded);
      summaryEl.classList.toggle('hidden', isExpanded);

      if (!isExpanded) collapseOtherPanels(matchId, 'summary');
      if (isExpanded) return;
      if (summaryEl.getAttribute('data-loaded') === 'true') return;

      // Show loading skeleton immediately before any async work
      summaryEl.innerHTML = `
        <div class="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-base">✨</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-cyan-300">AI Summary</span>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-slate-700/50 rounded animate-pulse w-full"></div>
            <div class="h-3 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
            <div class="h-3 bg-slate-700/50 rounded animate-pulse w-4/6"></div>
            <div class="h-3 bg-slate-700/50 rounded animate-pulse w-full"></div>
            <div class="h-3 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      `;

      const gtLower = state.currentGamertag.toLowerCase();

      try {

      // Always fetch detailed match for full UnitStats + LeaderPowerStats
      let match = state.matchLookup.get(matchId);
      const listPlayer = (Array.isArray(match?.Players) ? match.Players : []).find((p: any) => {
        const id = (typeof p.HumanPlayerId === 'object' ? p.HumanPlayerId?.Gamertag : p.HumanPlayerId) || p.Gamertag;
        return id && String(id).toLowerCase() === gtLower;
      });
      if (!listPlayer?.UnitStats) {
        const detailResult = await getMatchResult(matchId);
        if (detailResult.ok && detailResult.data) {
          match = detailResult.data;
          state.matchLookup.set(matchId, match);
        }
      }
      if (!match) return;

      // Fetch events for leader resolution, tech timing, build order, and powers
      const eventsResult = await fetchMatchEventsPayload(matchId);
      const { entries, playersByIndex } = eventsResult.ok && eventsResult.data
        ? await buildEventEntries(eventsResult.data)
        : { entries: [], playersByIndex: new Map<number, any>() };

      // Index event data per playerIndex
      const techT2ByPlayer = new Map<number, number>();
      const techT3ByPlayer = new Map<number, number>();
      const firstBuildingByPlayer = new Map<number, string>();
      const firstUnitByPlayer = new Map<number, string>();
      const powerCountByPlayer = new Map<number, Map<string, number>>();
      for (const e of entries) {
        if (e.playerIndex == null) continue;
        if (e.kind === 'upgrade' && e.techTier === 2 && !techT2ByPlayer.has(e.playerIndex)) techT2ByPlayer.set(e.playerIndex, e.timeMs);
        if (e.kind === 'upgrade' && e.techTier === 3 && !techT3ByPlayer.has(e.playerIndex)) techT3ByPlayer.set(e.playerIndex, e.timeMs);
        if (e.kind === 'building' && !firstBuildingByPlayer.has(e.playerIndex)) firstBuildingByPlayer.set(e.playerIndex, e.label.replace(/^Completed /, ''));
        if (e.kind === 'unit' && !firstUnitByPlayer.has(e.playerIndex)) firstUnitByPlayer.set(e.playerIndex, e.label.replace(/^Trained /, ''));
        if (e.kind === 'power') {
          const powerName = e.label.replace(/^Cast /, '');
          const map = powerCountByPlayer.get(e.playerIndex) || new Map<string, number>();
          map.set(powerName, (map.get(powerName) || 0) + 1);
          powerCountByPlayer.set(e.playerIndex, map);
        }
      }

      const toMin = (ms: number) => Math.round(ms / 6000) / 10; // 1 decimal place minutes
      const getGt = (p: any): string =>
        String((typeof p.HumanPlayerId === 'object' ? p.HumanPlayerId?.Gamertag : p.HumanPlayerId) || p.Gamertag || p.PlayerId || 'Unknown');

      const buildPlayerSummary = (p: any): PlayerSummary => {
        const gamertag = getGt(p);
        const pidx = typeof p.PlayerIndex === 'number' ? p.PlayerIndex : null;
        const info = pidx != null ? playersByIndex.get(pidx) : null;
        const leaderId = info?.leaderId ?? p.LeaderId ?? null;

        let unitsDestroyed = 0, unitsLost = 0;
        const us = p.UnitStats;
        if (us && typeof us === 'object') Object.values(us).forEach((u: any) => { unitsDestroyed += u?.TotalDestroyed || 0; unitsLost += u?.TotalLost || 0; });

        const powerMap = pidx != null ? powerCountByPlayer.get(pidx) : null;
        const topPowers = powerMap
          ? [...powerMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, n]) => `${name} x${n}`)
          : [];

        return {
          gamertag,
          leader: leaderId != null ? getLeaderName(leaderId) : 'Unknown',
          teamId: p.TeamId ?? null,
          unitsDestroyed,
          unitsLost,
          topPowers,
          techT2Min: pidx != null && techT2ByPlayer.has(pidx) ? toMin(techT2ByPlayer.get(pidx)!) : null,
          techT3Min: pidx != null && techT3ByPlayer.has(pidx) ? toMin(techT3ByPlayer.get(pidx)!) : null,
          firstBuilding: pidx != null ? (firstBuildingByPlayer.get(pidx) ?? null) : null,
          firstUnit: pidx != null ? (firstUnitByPlayer.get(pidx) ?? null) : null,
        };
      };

      const humanPlayers: any[] = (Array.isArray(match.Players) ? match.Players : Object.values(match.Players || {}))
        .filter((p: any) => p.IsHuman !== false && p.PlayerType !== 2 && p.PlayerType !== 3);
      const youPlayer = humanPlayers.find((p: any) => getGt(p).toLowerCase() === gtLower) || humanPlayers[0];
      if (!youPlayer) return;

      const youTeamId = youPlayer.TeamId ?? null;
      const rawOutcome = youPlayer.MatchOutcome ?? youPlayer.PlayerMatchOutcome ?? match.PlayerMatchOutcome ?? match.MatchOutcome;
      const outcome = typeof rawOutcome === 'string' ? rawOutcome.toLowerCase() : rawOutcome;
      const resultText = outcome === 1 || outcome === 'win' || outcome === 'victory' ? 'Victory'
        : outcome === 2 || outcome === 'loss' || outcome === 'defeat' ? 'Defeat' : 'Draw';

      const mapName = getMapName(match.MapId || '');
      const dateStr = match.MatchStartDate?.ISO8601Date
        ? new Date(match.MatchStartDate.ISO8601Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const durationStr = parseDuration(match.PlayerMatchDuration || match.MatchDuration || '') || '';
      const playlistLabel = (match.PlaylistId ? getPlaylistName(match.PlaylistId) : '') || getGameModeName(match.GameMode) || '';
      let teamSizeLabel = '';
      if (match.Teams && typeof match.Teams === 'object') {
        const sizes = Object.values(match.Teams).map((t: any) => t?.TeamSize).filter((s: any) => typeof s === 'number');
        if (sizes.length >= 2) teamSizeLabel = `${sizes[0]}v${sizes[1]}`;
        else if (sizes.length === 1) teamSizeLabel = `${sizes[0]}v${sizes[0]}`;
      }
      const prevCsr = match.RatingProgress?.PreviousCsr?.Raw;
      const nextCsr = match.RatingProgress?.UpdatedCsr?.Raw;
      const csrDelta = (typeof prevCsr === 'number' && typeof nextCsr === 'number') ? Math.round(nextCsr - prevCsr) : null;
      const csrDeltaText = csrDelta != null ? `${csrDelta > 0 ? '+' : ''}${csrDelta}` : '';

      const matchContext: MatchSummaryContext = {
        result: resultText,
        mapName,
        duration: durationStr,
        teamSize: teamSizeLabel,
        playlist: playlistLabel,
        csrDelta: csrDeltaText,
        completed: youPlayer.PlayerCompletedMatch ?? match.PlayerCompletedMatch ?? null,
        date: dateStr,
        you: buildPlayerSummary(youPlayer),
        allies: humanPlayers.filter((p: any) => p !== youPlayer && p.TeamId === youTeamId).map(buildPlayerSummary),
        opponents: humanPlayers.filter((p: any) => p.TeamId !== youTeamId).map(buildPlayerSummary),
      };

      await loadMatchSummary(matchId, state.currentGamertag, matchContext, summaryEl);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load summary.';
        summaryEl.innerHTML = `
          <div class="rounded-lg border border-red-500/20 bg-red-900/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-base">✨</span>
              <span class="text-xs font-semibold uppercase tracking-wider text-red-300">AI Summary</span>
            </div>
            <p class="text-sm text-red-300">${msg}</p>
          </div>
        `;
      }
    });
  });

  matchesContent.querySelectorAll('.match-pin-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      togglePinnedMatch(matchId);
      renderMatches(state.currentMatches, state.currentGamertag);
    });
  });

  matchesContent.querySelectorAll('.match-share-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      const gamertag = (btn as HTMLElement).getAttribute('data-gamertag') || '';
      if (!matchId || !gamertag) return;
      await showShareModal(matchId, gamertag);
    });
  });

  matchesContent.querySelectorAll('.match-export-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const button = btn as HTMLButtonElement;
      const matchId = button.getAttribute('data-match-id') || '';
      const gamertag = button.getAttribute('data-gamertag') || '';
      if (!matchId || !gamertag) return;
      button.disabled = true;
      const originalText = button.querySelector('span')?.textContent || '';
      const spanEl = button.querySelector('span');
      if (spanEl) spanEl.textContent = 'Exporting...';
      try {
        await exportMatchToCsv(matchId, gamertag);
      } finally {
        button.disabled = false;
        if (spanEl) spanEl.textContent = originalText;
      }
    });
  });

  const exportAllBtn = matchesContent.querySelector('.export-all-matches-btn') as HTMLButtonElement | null;
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      exportAllMatchesToCsv(state.currentGamertag);
    });
  }
}

export function revealDeepLinkedMatch(matchId: string) {
  if (!matchId) return;
  const orderedMatches = getOrderedMatches(state.currentMatches);
  const targetIndex = orderedMatches.findIndex((match: any) => match?.MatchId === matchId);
  if (targetIndex < 0) {
    showError(globalError, { type: 'not_found', message: 'Match not found in recent history.' });
    return;
  }
  const targetPage = Math.floor(targetIndex / MATCHES_PER_PAGE) + 1;
  if (targetPage !== state.currentMatchPage) {
    state.currentMatchPage = targetPage;
    renderMatches(state.currentMatches, state.currentGamertag);
  }

  const matchesContent = document.getElementById('matches-content');
  if (!matchesContent) return;
  const selectorId = matchId.replace(/"/g, '\\"');
  const detailsBtn = matchesContent.querySelector(`.match-details-toggle[data-match-id="${selectorId}"]`) as HTMLButtonElement | null;
  const timelineBtn = matchesContent.querySelector(`.match-timeline-toggle[data-match-id="${selectorId}"]`) as HTMLButtonElement | null;
  if (!detailsBtn && !timelineBtn) {
    showError(globalError, { type: 'not_found', message: 'Match not found in recent history.' });
    return;
  }
  const anchorEl = (detailsBtn || timelineBtn) as HTMLElement | null;
  if (anchorEl) {
    anchorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (detailsBtn && detailsBtn.getAttribute('aria-expanded') !== 'true') {
    detailsBtn.click();
  }
  if (timelineBtn && timelineBtn.getAttribute('aria-expanded') !== 'true') {
    timelineBtn.click();
  }
}
