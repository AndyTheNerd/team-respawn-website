import type { ShareData, ProfileShareData } from './types';
import { seasonData } from '../../data/haloWars2/seasons';

export const STORAGE_KEY = 'hw2-recent-searches';
export const PINNED_MATCHES_KEY = 'hw2-pinned-matches';
export const PROFILE_PATH_PREFIX = '/halo-wars-stats/player/';
export const MAX_RECENT = 5;
export const MATCHES_PER_PAGE = 5;
export const MATCH_FETCH_COUNT = 100;
export const SHARE_HERO_GRADIENT = 'linear-gradient(120deg, rgba(2, 6, 23, 0.85), rgba(6, 40, 64, 0.85))';
export const MIN_HW2_VIDEO_DURATION_MS = 4 * 60 * 1000;

export const CURRENT_SEASON = [...seasonData].sort(
  (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
)[0];

export const state = {
  currentMatches: [] as any[],
  currentGamertag: '',
  currentMatchPage: 1,
  matchLookup: new Map<string, any>(),
  matchEventsCache: new Map<string, any>(),
  matchResultCache: new Map<string, any>(),
  activeShareData: null as ShareData | null,
  activeProfileShareData: null as ProfileShareData | null,
  shareStatusTimeout: null as number | null,
  profileShareStatusTimeout: null as number | null,
  html2canvasPromise: null as Promise<any> | null,
  mapImageRequestId: 0,
  pendingDeepLinkMatchId: null as string | null,
  shareMapImageDataUrl: null as string | null,
  shareRequestId: 0,
  shareMapImageUrl: null as string | null,
  shareMapImagePromise: null as Promise<string | null> | null,
};
