import { MATCH_FETCH_COUNT, CURRENT_SEASON, state } from './state';
import { globalError, resultsContainer, playerGamertagEl, playerContentCreatorIndicatorEl, playerCheaterIndicatorEl, playerLastSeenEl, playerLastRefreshedEl, profileShareBtn, recentHw2SearchesSectionEl, videoCtaEl } from './dom';
import { showSkeleton, hideSkeleton, showError, showStaleBanner, hideStaleBanner, showSectionStaleBadge, removeSectionStaleBadge, showSectionRetryButton, formatAge } from './uiState';
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
import type { CacheMeta } from '../../utils/haloApi';

function getMeta(data: unknown): CacheMeta | undefined {
  return (data as { _meta?: CacheMeta } | null | undefined)?._meta;
}

function metaAgeSeconds(meta: CacheMeta | undefined): number | undefined {
  if (!meta) return undefined;
  if (typeof meta.cacheAgeSeconds === 'number') return meta.cacheAgeSeconds;
  if (meta.fetchedAt) {
    return Math.floor((Date.now() - new Date(meta.fetchedAt).getTime()) / 1000);
  }
  return undefined;
}

function updateLastRefreshed(meta: CacheMeta | undefined) {
  if (!playerLastRefreshedEl) return;
  const ageSeconds = metaAgeSeconds(meta);
  if (ageSeconds == null && !meta?.fetchedAt) {
    playerLastRefreshedEl.textContent = '';
    playerLastRefreshedEl.classList.add('hidden');
    return;
  }
  const ageText = ageSeconds != null ? formatAge(ageSeconds) : null;
  const label =
    ageText === 'just now' || ageText == null
      ? 'Refreshed just now'
      : `Refreshed ${ageText} ago`;
  playerLastRefreshedEl.textContent = label;
  playerLastRefreshedEl.classList.remove('hidden');
}

async function retryStatsSection(gamertag: string): Promise<void> {
  showSkeleton('overview');
  showSkeleton('ranked');
  showSkeleton('leaders');

  const [statsResult, seasonResult] = await Promise.all([
    getPlayerStats(gamertag),
    CURRENT_SEASON
      ? getPlayerSeasonStats(gamertag, CURRENT_SEASON.id)
      : Promise.resolve({ ok: false as const, error: { type: 'unknown' as const, message: 'No season configured.' } }),
  ]);

  if (statsResult.ok) {
    const meta = getMeta(statsResult.data);
    renderOverview(statsResult.data, gamertag);
    renderRankedStats(statsResult.data, seasonResult.ok ? seasonResult.data : undefined);
    if (meta?.cached) {
      showSectionStaleBadge('overview', meta);
      showSectionStaleBadge('ranked', meta);
    } else {
      removeSectionStaleBadge('overview');
      removeSectionStaleBadge('ranked');
    }
    updateLastRefreshed(meta);
  } else {
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    const errorEl = document.getElementById('overview-error')!;
    showError(errorEl, statsResult.error);
    showSectionRetryButton('overview', statsResult.error.type, () => {
      void retryStatsSection(gamertag);
    });
  }
}

async function retryMatchesSection(gamertag: string): Promise<void> {
  showSkeleton('matches');
  showSkeleton('leaders');
  showSkeleton('insights');

  const matchesResult = await getPlayerMatches(gamertag, MATCH_FETCH_COUNT);

  if (matchesResult.ok) {
    const meta = getMeta(matchesResult.data);
    state.matchesCacheMeta = meta;
    if (meta?.cached) {
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
    renderMatches(matchesList, gamertag, meta);
    renderLeaderUsage(matchesList);
    renderDurationDistribution(matchesList);
    updateLastRefreshed(meta);
  } else {
    hideSkeleton('matches');
    hideSkeleton('leaders');
    hideSkeleton('insights');
    const errorEl = document.getElementById('matches-error')!;
    showError(errorEl, matchesResult.error);
    showSectionRetryButton('matches', matchesResult.error.type, () => {
      void retryMatchesSection(gamertag);
    });
  }
}

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
  if (playerLastRefreshedEl) {
    playerLastRefreshedEl.textContent = '';
    playerLastRefreshedEl.classList.add('hidden');
  }
  state.currentGamertag = cleanGamertag;
  state.currentMatchPage = 1;
  state.matchesCacheMeta = undefined;
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
    const meta = getMeta(r1Stats.data);
    renderOverview(r1Stats.data, cleanGamertag);
    renderRankedStats(r1Stats.data, r1Season.ok ? r1Season.data : undefined);
    showSectionStaleBadge('overview', meta);
    showSectionStaleBadge('ranked', meta);
    updateLastRefreshed(meta);
  }

  if (r1CampaignLevels.ok) {
    parseCampaignLevelsMetadata(r1CampaignLevels.data);
  }
  if (r1Campaign.ok) {
    const meta = getMeta(r1Campaign.data);
    renderCampaignStats(r1Campaign.data, r1Stats.ok ? r1Stats.data : null);
    showSectionStaleBadge('campaign', meta);
  }

  if (r1Matches.ok) {
    const meta = getMeta(r1Matches.data);
    state.matchesCacheMeta = meta;
    const r1MatchesList = r1Matches.data.Results || [];
    updateLastSeen(r1MatchesList);
    renderMatches(r1MatchesList, cleanGamertag, meta);
    renderLeaderUsage(r1MatchesList);
    renderDurationDistribution(r1MatchesList);
    showSectionStaleBadge('matches', meta);
    showSectionStaleBadge('leaders', meta);
    showSectionStaleBadge('insights', meta);
  }

  // ── Round 2: fresh fetch ─────────────────────────────────────────────────
  await refreshSearch(cleanGamertag, {
    round1: {
      statsOk: round1StatsOk,
      matchesOk: round1MatchesOk,
      campaignOk: round1CampaignOk,
      stats: r1Stats.ok ? r1Stats.data : null,
      matches: r1Matches.ok ? r1Matches.data : null,
    },
  });
}

type Round1Snapshot = {
  statsOk: boolean;
  matchesOk: boolean;
  campaignOk: boolean;
  stats: unknown;
  matches: unknown;
};

const EMPTY_ROUND1: Round1Snapshot = {
  statsOk: false,
  matchesOk: false,
  campaignOk: false,
  stats: null,
  matches: null,
};

/**
 * Re-runs the fresh-fetch round (Round 2) only — no `cacheOnly` calls.
 * Used by both `performSearch` (after Round 1) and the stale-banner Refresh
 * button. If Round 1 already rendered cached content, that content is preserved
 * when Round 2 fails for non-`not_found` reasons.
 */
export async function refreshSearch(
  gamertag: string,
  options: { round1?: Round1Snapshot } = {}
): Promise<void> {
  const round1 = options.round1 ?? EMPTY_ROUND1;

  // Fetch live data from the Halo API (via Pages Functions + D1 write-through).
  // Results silently replace Round 1 renders; stale badges are removed on success.
  const [statsResult, matchesResult, seasonResult, campaignResult, campaignLevelsResult] = await Promise.all([
    getPlayerStats(gamertag),
    getPlayerMatches(gamertag, MATCH_FETCH_COUNT),
    CURRENT_SEASON
      ? getPlayerSeasonStats(gamertag, CURRENT_SEASON.id)
      : Promise.resolve({ ok: false as const, error: { type: 'unknown' as const, message: 'No season configured.' } }),
    getCampaignProgress(gamertag),
    getCampaignLevels(),
  ]);

  const staleSources: Array<{ label: string; fetchedAt?: string | null }> = [];
  let freshestMeta: CacheMeta | undefined;

  // Stats / Overview / Ranked
  if (statsResult.ok) {
    const meta = getMeta(statsResult.data);
    if (meta?.cached) {
      staleSources.push({ label: 'Overview', fetchedAt: meta.fetchedAt });
      showSectionStaleBadge('overview', meta);
      showSectionStaleBadge('ranked', meta);
    } else {
      removeSectionStaleBadge('overview');
      removeSectionStaleBadge('ranked');
    }
    renderOverview(statsResult.data, gamertag);
    renderRankedStats(statsResult.data, seasonResult.ok ? seasonResult.data : undefined);
    // If response carried no _meta (e.g. direct Halo fallback), treat as just-fetched.
    freshestMeta = meta ?? { cached: false, fetchedAt: new Date().toISOString(), cacheAgeSeconds: 0 };
  } else if (statsResult.error.type === 'not_found') {
    // Player genuinely doesn't exist — clear any cached render and show error.
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    const errorEl = document.getElementById('overview-error')!;
    showError(errorEl, statsResult.error);
  } else if (!round1.statsOk) {
    // API failed and we had nothing from Round 1 — show error + retry button.
    hideSkeleton('overview');
    hideSkeleton('ranked');
    hideSkeleton('leaders');
    const errorEl = document.getElementById('overview-error')!;
    showError(errorEl, statsResult.error);
    showSectionRetryButton('overview', statsResult.error.type, () => {
      void retryStatsSection(gamertag);
    });
  } else {
    // API failed but Round 1 rendered cached stats — keep them, mark stale.
    const r1Meta = getMeta(round1.stats);
    staleSources.push({ label: 'Overview', fetchedAt: r1Meta?.fetchedAt });
    if (r1Meta) freshestMeta = r1Meta;
  }

  // Campaign
  if (campaignLevelsResult.ok) {
    parseCampaignLevelsMetadata(campaignLevelsResult.data);
  }
  if (campaignResult.ok) {
    const meta = getMeta(campaignResult.data);
    if (meta?.cached) {
      staleSources.push({ label: 'Campaign', fetchedAt: meta.fetchedAt });
      showSectionStaleBadge('campaign', meta);
    } else {
      removeSectionStaleBadge('campaign');
    }
    renderCampaignStats(campaignResult.data, statsResult.ok ? statsResult.data : null);
  } else if (!round1.campaignOk) {
    // No cached campaign and API failed — silently hide (same as before).
    hideSkeleton('campaign');
  }
  // else: Round 1 had cached campaign, API failed (non-not_found) — keep cached content.

  // Matches / Leaders / Insights
  if (matchesResult.ok) {
    const meta = getMeta(matchesResult.data);
    state.matchesCacheMeta = meta;
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
    renderMatches(matchesList, gamertag, meta);
    renderLeaderUsage(matchesList);
    renderDurationDistribution(matchesList);
    if (state.pendingDeepLinkMatchId) {
      const targetMatchId = state.pendingDeepLinkMatchId;
      state.pendingDeepLinkMatchId = null;
      revealDeepLinkedMatch(targetMatchId);
    }
    if (!freshestMeta) {
      freshestMeta = meta ?? { cached: false, fetchedAt: new Date().toISOString(), cacheAgeSeconds: 0 };
    }
  } else if (matchesResult.error.type === 'not_found') {
    hideSkeleton('matches');
    const matchesError = document.getElementById('matches-error')!;
    showError(matchesError, matchesResult.error);
    hideSkeleton('leaders');
    const leadersError = document.getElementById('leaders-error')!;
    showError(leadersError, matchesResult.error);
    hideSkeleton('insights');
  } else if (!round1.matchesOk) {
    // API failed, no cache — show error + retry button.
    hideSkeleton('matches');
    const matchesError = document.getElementById('matches-error')!;
    showError(matchesError, matchesResult.error);
    showSectionRetryButton('matches', matchesResult.error.type, () => {
      void retryMatchesSection(gamertag);
    });
    hideSkeleton('leaders');
    const leadersError = document.getElementById('leaders-error')!;
    showError(leadersError, matchesResult.error);
    hideSkeleton('insights');
  } else {
    // API failed but Round 1 rendered cached matches — keep them, mark stale.
    const r1Meta = getMeta(round1.matches);
    staleSources.push({ label: 'Matches', fetchedAt: r1Meta?.fetchedAt });
    if (r1Meta && !freshestMeta) freshestMeta = r1Meta;
    // Still handle deep link against the Round 1 render.
    if (state.pendingDeepLinkMatchId) {
      const targetMatchId = state.pendingDeepLinkMatchId;
      state.pendingDeepLinkMatchId = null;
      revealDeepLinkedMatch(targetMatchId);
    }
  }

  // Season stale tracking (section has no dedicated render — rolled into Overview/Ranked)
  const seasonMeta = seasonResult.ok ? getMeta(seasonResult.data) : undefined;
  if (seasonMeta?.cached) {
    staleSources.push({ label: 'Season', fetchedAt: seasonMeta.fetchedAt });
  }

  if (staleSources.length > 0) {
    showStaleBanner(staleSources);
  } else {
    hideStaleBanner();
  }

  updateLastRefreshed(freshestMeta);
}
