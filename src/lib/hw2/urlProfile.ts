import { PROFILE_PATH_PREFIX } from './state';

export function parseGamertagFromProfilePath(pathname: string): string | null {
  if (!pathname || !pathname.toLowerCase().startsWith(PROFILE_PATH_PREFIX)) return null;
  const remainder = pathname.slice(PROFILE_PATH_PREFIX.length);
  if (!remainder) return null;
  const segment = remainder.split('/').find((part) => part.trim() !== '') || '';
  if (!segment) return null;
  try {
    const decoded = decodeURIComponent(segment).trim();
    return decoded || null;
  } catch {
    const fallback = segment.trim();
    return fallback || null;
  }
}

export function buildProfilePath(gamertag: string): string {
  return `${PROFILE_PATH_PREFIX}${encodeURIComponent(gamertag.trim())}`;
}

export function supportsCanonicalProfilePath(): boolean {
  const host = window.location.hostname.toLowerCase();
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
}

export function buildProfileUrl(gamertag: string, matchId?: string | null): string {
  const cleanGamertag = gamertag.trim();
  const params = new URLSearchParams();
  const cleanMatchId = (matchId || '').trim();
  if (cleanMatchId) params.set('matchId', cleanMatchId);

  if (supportsCanonicalProfilePath()) {
    const path = buildProfilePath(cleanGamertag);
    const query = params.toString();
    return `${window.location.origin}${path}${query ? `?${query}` : ''}`;
  }

  params.set('gamertag', cleanGamertag);
  return `${window.location.origin}/halo-wars-stats?${params.toString()}`;
}

/** True when the HW2 stats page has no active gamertag in the URL (base landing view). */
export function isHw2StatsBaseView(): boolean {
  const pathname = window.location.pathname;
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath !== '/halo-wars-stats') return false;
  const gamertagParam = new URLSearchParams(window.location.search).get('gamertag')?.trim() ?? '';
  return !gamertagParam;
}

export function syncHw2CsrRankGuideVisibility(guideEl: HTMLElement | null) {
  if (!guideEl) return;
  guideEl.classList.toggle('hidden', !isHw2StatsBaseView());
}

/** “Back to HW2 home” control: visible whenever the URL is not the base stats landing (e.g. ?gamertag= or /player/…). */
export function syncHw2ReturnToSearchVisibility(wrapEl: HTMLElement | null) {
  if (!wrapEl) return;
  const base = isHw2StatsBaseView();
  wrapEl.classList.toggle('hidden', base);
  wrapEl.classList.toggle('flex', !base);
  wrapEl.classList.toggle('items-stretch', !base);
}

export function syncProfileUrl(gamertag: string, matchId?: string | null) {
  const cleanGamertag = gamertag.trim();
  if (!cleanGamertag) return;
  const params = new URLSearchParams(window.location.search);
  const cleanMatchId = (matchId || '').trim();
  let next = '';

  if (supportsCanonicalProfilePath()) {
    const path = buildProfilePath(cleanGamertag);
    params.delete('gamertag');
    if (cleanMatchId) {
      params.set('matchId', cleanMatchId);
    } else {
      params.delete('matchId');
    }
    const query = params.toString();
    next = `${path}${query ? `?${query}` : ''}`;
  } else {
    params.set('gamertag', cleanGamertag);
    if (cleanMatchId) {
      params.set('matchId', cleanMatchId);
    } else {
      params.delete('matchId');
    }
    next = `/halo-wars-stats?${params.toString()}`;
  }

  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) {
    window.history.replaceState(null, '', next);
  }
}
