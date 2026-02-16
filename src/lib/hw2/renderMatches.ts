import { MATCHES_PER_PAGE, state } from './state';
import { hideSkeleton, showError } from './uiState';
import { globalError } from './dom';
import { parseDuration, getGameModeName } from './dataProcessing';
import { getPinnedMatches, togglePinnedMatch } from './localStorage';
import { showShareModal } from './shareCard';
import { loadMatchDetails } from './matchDetails';
import { loadMatchTimeline } from './matchTimeline';
import { loadMatchGraphs } from './matchGraphs';
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

  matchesContent.innerHTML = '<div class="divide-y divide-slate-700/30">' + pageMatches.map((match: any, i: number) => {
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
                  class="match-details-toggle flex-[4] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="${detailsId}"
                  aria-expanded="false"
                >
                  <span>Team Compositions and Stats</span>
                  <span class="match-details-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                </button>
                <button
                  type="button"
                  class="match-timeline-toggle flex-[3] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="${timelineId}"
                  aria-expanded="false"
                >
                  <span>Build Timeline</span>
                  <span class="match-timeline-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
                </button>
                <button
                  type="button"
                  class="match-graphs-toggle flex-[3] flex items-center justify-between rounded-md border border-cyan-500/20 bg-slate-800/40 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors"
                  data-match-id="${matchId}"
                  aria-controls="match-graphs-${matchId}"
                  aria-expanded="false"
                >
                  <span>Match Graphs</span>
                  <span class="match-graphs-chevron transition-transform duration-200" aria-hidden="true">&#x25BC;</span>
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
              </div>
              <div id="${detailsId}" class="match-details mt-3 hidden" data-loaded="false"></div>
              <div id="${timelineId}" class="match-timeline mt-3 hidden" data-loaded="false"></div>
              <div id="match-graphs-${matchId}" class="match-graphs mt-3 hidden" data-loaded="false"></div>
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
  const collapseOtherPanels = (matchId: string, keepPanel: string) => {
    const panels = ['details', 'timeline', 'graphs'] as const;
    panels.forEach((panel) => {
      if (panel === keepPanel) return;
      const toggle = matchesContent.querySelector(`.match-${panel}-toggle[data-match-id="${matchId}"]`) as HTMLElement | null;
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        const el = document.getElementById(`match-${panel}-${matchId}`);
        if (el) el.classList.add('hidden');
        const chevron = toggle.querySelector(`.match-${panel}-chevron`) as HTMLElement | null;
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    });
  };

  matchesContent.querySelectorAll('.match-details-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = (btn as HTMLElement).getAttribute('data-match-id') || '';
      if (!matchId) return;
      const detailsId = `match-details-${matchId}`;
      const detailsEl = document.getElementById(detailsId);
      const chevron = (btn as HTMLElement).querySelector('.match-details-chevron') as HTMLElement | null;
      if (!detailsEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      (btn as HTMLElement).setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      detailsEl.classList.toggle('hidden', isExpanded);
      if (chevron) chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';

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
      const chevron = (btn as HTMLElement).querySelector('.match-timeline-chevron') as HTMLElement | null;
      if (!timelineEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      (btn as HTMLElement).setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      timelineEl.classList.toggle('hidden', isExpanded);
      if (chevron) chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';

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
      const chevron = (btn as HTMLElement).querySelector('.match-graphs-chevron') as HTMLElement | null;
      if (!graphsEl) return;

      const isExpanded = (btn as HTMLElement).getAttribute('aria-expanded') === 'true';
      (btn as HTMLElement).setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      graphsEl.classList.toggle('hidden', isExpanded);
      if (chevron) chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';

      if (!isExpanded) collapseOtherPanels(matchId, 'graphs');
      if (isExpanded) return;
      if (graphsEl.getAttribute('data-loaded') === 'true') return;
      await loadMatchGraphs(matchId, graphsEl);
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
