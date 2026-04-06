import { MATCH_FETCH_COUNT, CURRENT_SEASON, state } from './state';
import { globalError, resultsContainer, playerGamertagEl, playerContentCreatorIndicatorEl, playerCheaterIndicatorEl, playerLastSeenEl, profileShareBtn, recentHw2SearchesSectionEl, videoCtaEl } from './dom';
import { showSkeleton, hideSkeleton, showError, showStaleBanner, hideStaleBanner, showSectionStaleBadge, removeSectionStaleBadge } from './uiState';
import { destroyAllCharts } from './chartManager';
import { updateLastSeen, isContentCreatorGamertag, isConfirmedCheaterGamertag } from './dataProcessing';
import { syncProfileUrl } from './urlProfile';
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

  // ── Round 1: cache-only ──────────────────────────────────────────────────
  // Immediately render whatever D1 has. These calls skip the Halo API entirely
  // so they resolve as fast as a single D1 read.
  const [r1Stats, r1Matches, r1Season, r1Campaign, r1CampaignLevels] = await Promise.all([
    getPlayerStats(cleanGamertag, { cacheOnly: true }),
    getPlayerMatches(cleanGamertag, MATCH_FETCH_COUNT, { cacheOnly: true }),
    CURRENT_SEASON
      ? getPlayerSeasonStats(cleanGamertag, CURRENT_SEASON.id, { cacheOnly: true })
      : Promise.resolve({ ok: false as const, error: { type: 'not_found' as const, message: 'No season configured.' } }),
    getCampaignProgress(cleanGamertag, { cacheOnly: true }),
    getCampaignLevels({ cacheOnly: true }),
  ]);

  const round1StatsOk = r1Stats.ok;
  const round1MatchesOk = r1Matches.ok;
  const round1CampaignOk = r1Campaign.ok;

  if (r1Stats.ok) {
    renderOverview(r1Stats.data, cleanGamertag);
    renderRankedStats(r1Stats.data, r1Season.ok ? r1Season.data : undefined);
    showSectionStaleBadge('overview', (r1Stats.data as any)._meta);
    showSectionStaleBadge('ranked', (r1Stats.data as any)._meta);
  }

  if (r1CampaignLevels.ok) {
    parseCampaignLevelsMetadata(r1CampaignLevels.data);
  }
  if (r1Campaign.ok) {
    renderCampaignStats(r1Campaign.data, r1Stats.ok ? r1Stats.data : null);
    showSectionStaleBadge('campaign', (r1Campaign.data as any)._meta);
  }

  if (r1Matches.ok) {
    const r1MatchesList = r1Matches.data.Results || [];
    updateLastSeen(r1MatchesList);
    renderMatches(r1MatchesList, cleanGamertag);
    renderLeaderUsage(r1MatchesList);
    renderDurationDistribution(r1MatchesList);
    showSectionStaleBadge('matches', (r1Matches.data as any)._meta);
    showSectionStaleBadge('leaders', (r1Matches.data as any)._meta);
    showSectionStaleBadge('insights', (r1Matches.data as any)._meta);
  }

  // ── Round 2: fresh fetch ─────────────────────────────────────────────────
  // Fetch live data from the Halo API (via Pages Functions + D1 write-through).
  // Results silently replace Round 1 renders; stale badges are removed on success.
  const [statsResult, matchesResult, seasonResult, campaignResult, campaignLevelsResult] = await Promise.all([
    getPlayerStats(cleanGamertag),
    getPlayerMatches(cleanGamertag, MATCH_FETCH_COUNT),
    CURRENT_SEASON
      ? getPlayerSeasonStats(cleanGamertag, CURRENT_SEASON.id)
      : Promise.resolve({ ok: false as const, error: { type: 'unknown' as const, message: 'No season configured.' } }),
    getCampaignProgress(cleanGamertag),
    getCampaignLevels(),
  ]);

  const staleSources: Array<{ label: string; fetchedAt?: string | null }> = [];

  // Stats / Overview / Ranked
  if (statsResult.ok) {
    const meta = (statsResult.data as any)?._meta;
    if (meta?.cached) {
      staleSources.push({ label: 'Overview', fetchedAt: meta.fetchedAt });
      showSectionStaleBadge('overview', meta);
      showSectionStaleBadge('ranked', meta);
    } else {
      removeSectionStaleBadge('overview');
      removeSectionStaleBadge('ranked');
    }
    renderOverview(statsResult.data, cleanGamertag);
    renderRankedStats(statsResult.data, seasonResult.ok ? seasonResult.data : undefined);
  } else if (statsResult.error.type === 'not_found') {
    // Player genuinely doesn't exist — clear any cached render and show error.
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    showError(document.getElementById('overview-error')!, statsResult.error);
  } else if (!round1StatsOk) {
    // API failed and we had nothing from Round 1 — show error.
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    showError(document.getElementById('overview-error')!, statsResult.error);
  } else {
    // API failed but Round 1 rendered cached stats — keep them, mark stale.
    const r1Meta = (r1Stats.ok && (r1Stats.data as any)._meta) || null;
    staleSources.push({ label: 'Overview', fetchedAt: r1Meta?.fetchedAt });
  }

  // Campaign
  if (campaignLevelsResult.ok) {
    parseCampaignLevelsMetadata(campaignLevelsResult.data);
  }
  if (campaignResult.ok) {
    const meta = (campaignResult.data as any)?._meta;
    if (meta?.cached) {
      staleSources.push({ label: 'Campaign', fetchedAt: meta.fetchedAt });
      showSectionStaleBadge('campaign', meta);
    } else {
      removeSectionStaleBadge('campaign');
    }
    renderCampaignStats(campaignResult.data, statsResult.ok ? statsResult.data : null);
  } else if (!round1CampaignOk) {
    // No cached campaign and API failed — silently hide (same as before).
    hideSkeleton('campaign');
  }
  // else: Round 1 had cached campaign, API failed (non-not_found) — keep cached content.

  // Matches / Leaders / Insights
  if (matchesResult.ok) {
    const meta = (matchesResult.data as any)?._meta;
    if (meta?.cached) {
      staleSources.push({ label: 'Matches', fetchedAt: meta.fetchedAt });
      showSectionStaleBadge('matches', meta);
      showSectionStaleBadge('leaders', meta);
      showSectionStaleBadge('insights', meta);
    } else {
      removeSectionStaleBadge('matches');
      removeSectionStaleBadge('leaders');
      removeSectionStaleBadge('insights');
    }
    const matchesList = matchesResult.data.Results || [];
    updateLastSeen(matchesList);
    renderMatches(matchesList, cleanGamertag);
    renderLeaderUsage(matchesList);
    renderDurationDistribution(matchesList);
    if (state.pendingDeepLinkMatchId) {
      const targetMatchId = state.pendingDeepLinkMatchId;
      state.pendingDeepLinkMatchId = null;
      revealDeepLinkedMatch(targetMatchId);
    }
  } else if (matchesResult.error.type === 'not_found') {
    hideSkeleton('matches');
    showError(document.getElementById('matches-error')!, matchesResult.error);
    hideSkeleton('leaders');
    showError(document.getElementById('leaders-error')!, matchesResult.error);
    hideSkeleton('insights');
  } else if (!round1MatchesOk) {
    // API failed, no cache — show error.
    hideSkeleton('matches');
    showError(document.getElementById('matches-error')!, matchesResult.error);
    hideSkeleton('leaders');
    showError(document.getElementById('leaders-error')!, matchesResult.error);
    hideSkeleton('insights');
  } else {
    // API failed but Round 1 rendered cached matches — keep them, mark stale.
    const r1Meta = (r1Matches.ok && (r1Matches.data as any)._meta) || null;
    staleSources.push({ label: 'Matches', fetchedAt: r1Meta?.fetchedAt });
    // Still handle deep link against the Round 1 render.
    if (state.pendingDeepLinkMatchId) {
      const targetMatchId = state.pendingDeepLinkMatchId;
      state.pendingDeepLinkMatchId = null;
      revealDeepLinkedMatch(targetMatchId);
    }
  }

  // Season stale tracking (section has no dedicated render — rolled into Overview/Ranked)
  const seasonMeta = seasonResult.ok ? (seasonResult.data as any)?._meta : null;
  if (seasonMeta?.cached) {
    staleSources.push({ label: 'Season', fetchedAt: seasonMeta.fetchedAt });
  }

  if (staleSources.length > 0) {
    showStaleBanner(staleSources);
  } else {
    hideStaleBanner();
  }
}
