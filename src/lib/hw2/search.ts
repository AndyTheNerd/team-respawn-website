import { MATCH_FETCH_COUNT, CURRENT_SEASON, state } from './state';
import { globalError, resultsContainer, playerGamertagEl, playerContentCreatorIndicatorEl, playerCheaterIndicatorEl, playerSmurfIndicatorEl, playerLastSeenEl, profileShareBtn, recentHw2SearchesSectionEl, videoCtaEl, hw2CsrRankGuideEl, hw2ReturnToSearchWrapEl } from './dom';
import { showSkeleton, hideSkeleton, showError, showStaleBanner, hideStaleBanner } from './uiState';
import { destroyAllCharts } from './chartManager';
import { updateLastSeen, isContentCreatorGamertag, isConfirmedCheaterGamertag, isSuspectedSmurfGamertag } from './dataProcessing';
import { syncProfileUrl, syncHw2CsrRankGuideVisibility, syncHw2ReturnToSearchVisibility } from './urlProfile';
import { addRecentSearch } from './localStorage';
import { renderOverview } from './renderOverview';
import { renderRankedStats } from './renderRanked';
import { renderLeaderUsage } from './renderLeaders';
import { renderDurationDistribution } from './renderInsights';
import { renderCampaignStats, parseCampaignLevelsMetadata } from './renderCampaign';
import { renderMatches, revealDeepLinkedMatch } from './renderMatches';
import { getPlayerStats, getPlayerSeasonStats, getPlayerMatches, getCampaignProgress, getCampaignLevels } from '../../utils/haloApi';

export async function performSearch(gamertag: string, options: { matchId?: string | null } = {}) {
  const cleanGamertag = gamertag.trim();
  if (!cleanGamertag) return;
  syncProfileUrl(cleanGamertag, options.matchId ?? null);
  syncHw2CsrRankGuideVisibility(hw2CsrRankGuideEl);
  syncHw2ReturnToSearchVisibility(hw2ReturnToSearchWrapEl);

  globalError.classList.add('hidden');
  globalError.innerHTML = '';
  hideStaleBanner();
  recentHw2SearchesSectionEl?.classList.add('hidden');
  resultsContainer.classList.remove('hidden');

  if (playerGamertagEl) playerGamertagEl.textContent = cleanGamertag;
  if (playerContentCreatorIndicatorEl) {
    const isCreator = isContentCreatorGamertag(cleanGamertag);
    playerContentCreatorIndicatorEl.classList.toggle('hidden', !isCreator);
  }
  if (playerCheaterIndicatorEl) {
    const suspected = isConfirmedCheaterGamertag(cleanGamertag);
    playerCheaterIndicatorEl.classList.toggle('hidden', !suspected);
  }
  if (playerSmurfIndicatorEl) {
    const suspected = isSuspectedSmurfGamertag(cleanGamertag);
    playerSmurfIndicatorEl.classList.toggle('hidden', !suspected);
  }
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
  showSkeleton('campaign');
  showSkeleton('leaders');
  showSkeleton('insights');
  showSkeleton('matches');

  destroyAllCharts();

  document.getElementById('overview-content')!.classList.add('hidden');
  document.getElementById('ranked-content')!.classList.add('hidden');
  document.getElementById('campaign-content')?.classList.add('hidden');
  document.getElementById('leaders-content')!.classList.add('hidden');
  document.getElementById('insights-content')!.classList.add('hidden');
  document.getElementById('matches-content')!.classList.add('hidden');

  addRecentSearch(cleanGamertag);

  const [statsResult, matchesResult, seasonResult, campaignResult, campaignLevelsResult] = await Promise.all([
    getPlayerStats(cleanGamertag),
    getPlayerMatches(cleanGamertag, MATCH_FETCH_COUNT),
    CURRENT_SEASON ? getPlayerSeasonStats(cleanGamertag, CURRENT_SEASON.id) : Promise.resolve({ ok: false, error: { type: 'unknown' as const, message: 'No season configured.' } }),
    getCampaignProgress(cleanGamertag),
    getCampaignLevels(),
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
  const campaignMeta = campaignResult.ok ? (campaignResult.data as any)?._meta : null;
  if (campaignMeta?.cached) {
    staleSources.push({ label: 'Campaign', fetchedAt: campaignMeta.fetchedAt });
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

  // Campaign progress (independent of stats result)
  if (campaignLevelsResult.ok) {
    parseCampaignLevelsMetadata(campaignLevelsResult.data);
  }
  if (campaignResult.ok) {
    renderCampaignStats(campaignResult.data, statsResult.ok ? statsResult.data : null);
  } else {
    hideSkeleton('campaign');
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
