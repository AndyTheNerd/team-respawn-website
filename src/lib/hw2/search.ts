import { MATCH_FETCH_COUNT, CURRENT_SEASON, state } from './state';
import { globalError, resultsContainer, playerGamertagEl, playerLastSeenEl, profileShareBtn, videoCtaEl } from './dom';
import { showSkeleton, hideSkeleton, showError, showStaleBanner, hideStaleBanner } from './uiState';
import { destroyAllCharts } from './chartManager';
import { updateLastSeen } from './dataProcessing';
import { syncProfileUrl } from './urlProfile';
import { addRecentSearch } from './localStorage';
import { renderOverview } from './renderOverview';
import { renderRankedStats } from './renderRanked';
import { renderLeaderUsage } from './renderLeaders';
import { renderDurationDistribution } from './renderInsights';
import { renderMatches, revealDeepLinkedMatch } from './renderMatches';
import { getPlayerStats, getPlayerSeasonStats, getPlayerMatches } from '../../utils/haloApi';

export async function performSearch(gamertag: string, options: { matchId?: string | null } = {}) {
  const cleanGamertag = gamertag.trim();
  if (!cleanGamertag) return;
  syncProfileUrl(cleanGamertag, options.matchId ?? null);

  globalError.classList.add('hidden');
  globalError.innerHTML = '';
  hideStaleBanner();
  resultsContainer.classList.remove('hidden');

  if (playerGamertagEl) playerGamertagEl.textContent = cleanGamertag;
  if (playerLastSeenEl) {
    playerLastSeenEl.textContent = '';
    playerLastSeenEl.classList.add('hidden');
  }
  state.currentGamertag = cleanGamertag;
  state.currentMatchPage = 1;
  state.activeProfileShareData = null;
  if (profileShareBtn) {
    profileShareBtn.classList.add('hidden');
    profileShareBtn.disabled = true;
  }
  if (videoCtaEl) {
    videoCtaEl.classList.add('hidden');
  }

  showSkeleton('overview');
  showSkeleton('ranked');
  showSkeleton('leaders');
  showSkeleton('insights');
  showSkeleton('matches');

  destroyAllCharts();

  document.getElementById('overview-content')!.classList.add('hidden');
  document.getElementById('ranked-content')!.classList.add('hidden');
  document.getElementById('leaders-content')!.classList.add('hidden');
  document.getElementById('insights-content')!.classList.add('hidden');
  document.getElementById('matches-content')!.classList.add('hidden');

  addRecentSearch(cleanGamertag);

  const [statsResult, matchesResult, seasonResult] = await Promise.all([
    getPlayerStats(cleanGamertag),
    getPlayerMatches(cleanGamertag, MATCH_FETCH_COUNT),
    CURRENT_SEASON ? getPlayerSeasonStats(cleanGamertag, CURRENT_SEASON.id) : Promise.resolve({ ok: false, error: { type: 'unknown', message: 'No season configured.' } }),
  ]);

  const staleSources: Array<{ label: string; fetchedAt?: string | null }> = [];
  const statsMeta = statsResult.ok ? (statsResult.data as any)?._meta : null;
  if (statsMeta?.cached) {
    staleSources.push({ label: 'Overview', fetchedAt: statsMeta.fetchedAt });
  }
  const matchesMeta = matchesResult.ok ? (matchesResult.data as any)?._meta : null;
  if (matchesMeta?.cached) {
    staleSources.push({ label: 'Matches', fetchedAt: matchesMeta.fetchedAt });
  }
  const seasonMeta = seasonResult.ok ? (seasonResult.data as any)?._meta : null;
  if (seasonMeta?.cached) {
    staleSources.push({ label: 'Season', fetchedAt: seasonMeta.fetchedAt });
  }
  if (staleSources.length > 0) {
    showStaleBanner(staleSources);
  }

  const matchesList = matchesResult.ok ? (matchesResult.data.Results || []) : [];
  updateLastSeen(matchesList);

  if (statsResult.ok) {
    renderOverview(statsResult.data, cleanGamertag);
    renderRankedStats(statsResult.data, seasonResult.ok ? seasonResult.data : undefined);
  } else {
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    showError(document.getElementById('overview-error')!, statsResult.error);
  }

  if (matchesResult.ok) {
    renderMatches(matchesList, cleanGamertag);
    renderLeaderUsage(matchesList);
    renderDurationDistribution(matchesList);
    if (state.pendingDeepLinkMatchId) {
      const targetMatchId = state.pendingDeepLinkMatchId;
      state.pendingDeepLinkMatchId = null;
      revealDeepLinkedMatch(targetMatchId);
    }
  } else {
    hideSkeleton('matches');
    showError(document.getElementById('matches-error')!, matchesResult.error);
    hideSkeleton('leaders');
    showError(document.getElementById('leaders-error')!, matchesResult.error);
    hideSkeleton('insights');
  }
}
