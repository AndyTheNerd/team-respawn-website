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
