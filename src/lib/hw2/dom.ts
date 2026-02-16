export const searchInput = document.getElementById('gamertag-input') as HTMLInputElement;
export const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
export const resultsContainer = document.getElementById('results-container')!;
export const globalError = document.getElementById('global-error')!;
export const staleBanner = document.getElementById('stale-banner') as HTMLElement | null;
export const staleBannerMeta = document.getElementById('stale-banner-meta') as HTMLElement | null;
export const staleBannerRetry = document.getElementById('stale-banner-retry') as HTMLButtonElement | null;
export const recentSearchesEl = document.getElementById('recent-searches')!;
export const videoCtaEl = document.getElementById('hw2-video-cta') as HTMLElement | null;
export const videoThumbEl = document.getElementById('hw2-video-thumb') as HTMLImageElement | null;
export const videoTitleEl = document.getElementById('hw2-video-title') as HTMLElement | null;
export const videoDateEl = document.getElementById('hw2-video-date') as HTMLElement | null;
export const videoLinkEl = document.getElementById('hw2-video-link') as HTMLAnchorElement | null;
export const videoDataEl = document.getElementById('hw2-video-data') as HTMLScriptElement | null;
export const nameMapsEl = document.getElementById('hw2-name-maps') as HTMLScriptElement | null;

// Match share modal elements
export const shareModal = document.getElementById('match-share-modal') as HTMLElement | null;
export const shareCard = document.getElementById('match-share-card') as HTMLElement | null;
export const shareResultEl = document.getElementById('match-share-result') as HTMLElement | null;
export const shareGamertagEl = document.getElementById('match-share-gamertag') as HTMLElement | null;
export const shareSubtitleEl = document.getElementById('match-share-subtitle') as HTMLElement | null;
export const shareMapEl = document.getElementById('match-share-map') as HTMLElement | null;
export const shareLeaderEl = document.getElementById('match-share-leader') as HTMLElement | null;
export const shareDurationEl = document.getElementById('match-share-duration') as HTMLElement | null;
export const sharePowersEl = document.getElementById('match-share-powers') as HTMLElement | null;
export const shareUnitsEl = document.getElementById('match-share-units') as HTMLElement | null;
export const shareTeamEl = document.getElementById('match-share-team') as HTMLElement | null;
export const sharePlaylistEl = document.getElementById('match-share-playlist') as HTMLElement | null;
export const shareDateEl = document.getElementById('match-share-date') as HTMLElement | null;
export const shareHeroEl = document.getElementById('match-share-hero') as HTMLElement | null;
export const shareStatusEl = document.getElementById('match-share-status') as HTMLElement | null;
export const shareCopyLinkBtn = document.getElementById('match-share-copy-link') as HTMLButtonElement | null;
export const shareDownloadBtn = document.getElementById('match-share-download') as HTMLButtonElement | null;
export const shareCopyImageBtn = document.getElementById('match-share-copy-image') as HTMLButtonElement | null;
export const shareLinks = shareModal?.querySelectorAll('.match-share-link') ?? document.querySelectorAll('.match-share-link');

// Profile share modal elements
export const profileShareModal = document.getElementById('profile-share-modal') as HTMLElement | null;
export const profileShareCard = document.getElementById('profile-share-card') as HTMLElement | null;
export const profileShareGamertagEl = document.getElementById('profile-share-gamertag') as HTMLElement | null;
export const profileShareSubtitleEl = document.getElementById('profile-share-subtitle') as HTMLElement | null;
export const profileShareMatchesEl = document.getElementById('profile-share-matches') as HTMLElement | null;
export const profileShareWinsEl = document.getElementById('profile-share-wins') as HTMLElement | null;
export const profileShareLossesEl = document.getElementById('profile-share-losses') as HTMLElement | null;
export const profileShareWinRateEl = document.getElementById('profile-share-winrate') as HTMLElement | null;
export const profileShareRatingEl = document.getElementById('profile-share-rating') as HTMLElement | null;
export const profileShareTimeEl = document.getElementById('profile-share-time') as HTMLElement | null;
export const profileShareAvgEl = document.getElementById('profile-share-avg') as HTMLElement | null;
export const profileShareTerminusEl = document.getElementById('profile-share-terminus') as HTMLElement | null;
export const profileShareDateEl = document.getElementById('profile-share-date') as HTMLElement | null;
export const profileShareStatusEl = document.getElementById('profile-share-status') as HTMLElement | null;
export const profileShareCopyLinkBtn = document.getElementById('profile-share-copy-link') as HTMLButtonElement | null;
export const profileShareDownloadBtn = document.getElementById('profile-share-download') as HTMLButtonElement | null;
export const profileShareCopyImageBtn = document.getElementById('profile-share-copy-image') as HTMLButtonElement | null;
export const profileShareLinks = profileShareModal?.querySelectorAll('.profile-share-link') ?? document.querySelectorAll('.profile-share-link');
export const profileShareBtn = document.getElementById('profile-share-btn') as HTMLButtonElement | null;

// Player info elements
export const playerGamertagEl = document.getElementById('player-gamertag') as HTMLElement | null;
export const playerLastSeenEl = document.getElementById('player-last-seen') as HTMLElement | null;

// Collapsible panel elements
export const leadersToggle = document.getElementById('leaders-toggle') as HTMLButtonElement | null;
export const leadersPanel = document.getElementById('leaders-panel') as HTMLElement | null;
export const leadersChevron = leadersToggle?.querySelector('.leaders-chevron') as HTMLElement | null;
export const insightsToggle = document.getElementById('insights-toggle') as HTMLButtonElement | null;
export const insightsPanel = document.getElementById('insights-panel') as HTMLElement | null;
export const insightsChevron = insightsToggle?.querySelector('.insights-chevron') as HTMLElement | null;
