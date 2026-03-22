import type { ShareData } from './types';
import { SHARE_HERO_GRADIENT, state } from './state';
import {
  shareModal, shareCard, shareResultEl, shareGamertagEl, shareSubtitleEl,
  shareMapEl, shareLeaderEl, shareDurationEl, sharePowersEl, shareUnitsEl,
  shareTeamEl, sharePlaylistEl, shareDateEl, shareHeroEl, shareStatusEl,
  shareCopyLinkBtn, shareDownloadBtn, shareCopyImageBtn, shareLinks,
  profileShareModal,
} from './dom';
import { globalError } from './dom';
import { showError } from './uiState';
import { findMatchPlayer, parseDuration, getGameModeName } from './dataProcessing';
import { buildProfileUrl } from './urlProfile';
import { getLeaderName } from '../../data/haloWars2/leaders';
import { getMapName, getMapImage, getMapImageFallback } from '../../data/haloWars2/maps';
import { getPlaylistName } from '../../data/haloWars2/playlists';
import { getMatchResult } from '../../utils/haloApi';

function setShareStatus(message: string, tone: 'ok' | 'error' | 'info' = 'info') {
  if (!shareStatusEl) return;
  shareStatusEl.textContent = message;
  shareStatusEl.classList.remove('ok', 'error');
  if (tone !== 'info') shareStatusEl.classList.add(tone);
  if (state.shareStatusTimeout) {
    window.clearTimeout(state.shareStatusTimeout);
  }
  if (message) {
    state.shareStatusTimeout = window.setTimeout(() => {
      if (shareStatusEl) {
        shareStatusEl.textContent = '';
        shareStatusEl.classList.remove('ok', 'error');
      }
    }, 3000);
  }
}

function setShareCardLoading(isLoading: boolean) {
  if (!shareCard) return;
  shareCard.classList.toggle('share-loading', isLoading);
}

export function updateShareBodyState() {
  const anyOpen = [shareModal, profileShareModal].some((modal) => modal && !modal.classList.contains('hidden'));
  document.body.classList.toggle('match-share-open', anyOpen);
}

function updateShareCard(data: ShareData) {
  if (shareResultEl) {
    shareResultEl.textContent = data.resultText;
    shareResultEl.classList.remove('win', 'loss', 'draw');
    shareResultEl.classList.add(data.resultClass);
  }
  if (shareGamertagEl) shareGamertagEl.textContent = data.gamertag;
  if (shareSubtitleEl) shareSubtitleEl.textContent = `${data.leaderName} | ${data.mapName}`;
  if (shareMapEl) shareMapEl.textContent = data.mapName;
  if (shareLeaderEl) shareLeaderEl.textContent = data.leaderName;
  if (shareDurationEl) shareDurationEl.textContent = data.durationStr || '-';
  if (sharePowersEl) sharePowersEl.textContent = data.powersText || '-';
  if (shareUnitsEl) shareUnitsEl.textContent = data.unitsText || '-';
  if (shareTeamEl) shareTeamEl.textContent = data.teamSizeLabel || '-';
  if (sharePlaylistEl) sharePlaylistEl.textContent = data.playlistLabel || 'Matchmaking';
  if (shareDateEl) shareDateEl.textContent = data.dateStr || '';
}

function updateShareLinks(data: ShareData) {
  const encodedUrl = encodeURIComponent(data.shareUrl);
  const encodedTitle = encodeURIComponent(data.shareTitle);
  const encodedText = encodeURIComponent(data.shareText);
  const linkMap: Record<string, string> = {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  shareLinks.forEach((link) => {
    const key = link.getAttribute('data-share') || '';
    if (key && linkMap[key]) {
      link.setAttribute('href', linkMap[key]);
    }
  });
}

async function resolveShareMapImage(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function setShareMapImage(url: string, fallbackUrl = '') {
  if (!shareHeroEl) return;
  const requestId = ++state.mapImageRequestId;
  const primaryUrl = url || '';
  const backupUrl = fallbackUrl || '';
  state.shareMapImageDataUrl = null;
  state.shareMapImageUrl = primaryUrl || backupUrl || null;
  state.shareMapImagePromise = null;

  if (primaryUrl) {
    shareHeroEl.style.backgroundImage = `url('${primaryUrl}')`;
  } else if (backupUrl) {
    shareHeroEl.style.backgroundImage = `url('${backupUrl}')`;
  } else {
    shareHeroEl.style.backgroundImage = SHARE_HERO_GRADIENT;
  }

  state.shareMapImagePromise = (async () => {
    if (primaryUrl) {
      const primaryData = await resolveShareMapImage(primaryUrl);
      if (primaryData) return primaryData;
    }
    if (backupUrl) {
      return await resolveShareMapImage(backupUrl);
    }
    return null;
  })();

  const dataUrl = await state.shareMapImagePromise;
  if (requestId !== state.mapImageRequestId) return;
  if (dataUrl) {
    state.shareMapImageDataUrl = dataUrl;
    shareHeroEl.style.backgroundImage = `url('${dataUrl}')`;
  } else if (backupUrl) {
    shareHeroEl.style.backgroundImage = `url('${backupUrl}')`;
  }
}

function preloadShareImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function ensureShareMapImageReady(): Promise<string | null> {
  if (state.shareMapImageDataUrl) {
    await preloadShareImage(state.shareMapImageDataUrl);
    return state.shareMapImageDataUrl;
  }
  if (state.shareMapImagePromise) {
    const dataUrl = await state.shareMapImagePromise;
    if (dataUrl) {
      state.shareMapImageDataUrl = dataUrl;
      await preloadShareImage(dataUrl);
      return dataUrl;
    }
  }
  return null;
}

function openShareModal(data: ShareData) {
  if (!shareModal) return;
  state.activeShareData = data;
  updateShareCard(data);
  updateShareLinks(data);
  setShareCardLoading(false);
  if (shareCopyLinkBtn) shareCopyLinkBtn.setAttribute('data-url', data.shareUrl);
  shareModal.classList.remove('hidden');
  shareModal.setAttribute('aria-hidden', 'false');
  updateShareBodyState();
  setShareStatus('');
  setShareMapImage(data.mapImage, data.mapImageFallback);
  shareCopyLinkBtn?.focus();
}

export function closeShareModal() {
  if (!shareModal) return;
  shareModal.classList.add('hidden');
  shareModal.setAttribute('aria-hidden', 'true');
  updateShareBodyState();
  state.activeShareData = null;
  setShareStatus('');
}

async function ensureHtml2canvas(): Promise<any> {
  const existing = (window as any).html2canvas;
  if (existing) return existing;
  if (state.html2canvasPromise) return state.html2canvasPromise;
  state.html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    script.onload = () => resolve((window as any).html2canvas);
    script.onerror = () => reject(new Error('Failed to load image capture library.'));
    document.head.appendChild(script);
  });
  return state.html2canvasPromise;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to generate image.'));
    }, 'image/png');
  });
}

async function renderShareCardCanvas(): Promise<HTMLCanvasElement> {
  if (!shareCard) throw new Error('Share card not found.');
  const html2canvas = await ensureHtml2canvas();
  const previousBg = shareHeroEl?.style.backgroundImage;
  if (shareHeroEl) {
    const dataUrl = await ensureShareMapImageReady();
    if (dataUrl) {
      shareHeroEl.style.backgroundImage = `url('${dataUrl}')`;
    } else if (!shareHeroEl.style.backgroundImage) {
      shareHeroEl.style.backgroundImage = SHARE_HERO_GRADIENT;
    }
  }
  try {
    return await html2canvas(shareCard, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
  } finally {
    if (shareHeroEl && typeof previousBg === 'string') {
      shareHeroEl.style.backgroundImage = previousBg;
    }
  }
}

async function copyShareLink() {
  if (!state.activeShareData) return;
  try {
    await navigator.clipboard.writeText(state.activeShareData.shareUrl);
    setShareStatus('Link copied to clipboard.', 'ok');
  } catch {
    setShareStatus('Failed to copy link.', 'error');
  }
}

async function downloadShareImage() {
  if (!state.activeShareData) return;
  try {
    const mapWarning = !!state.activeShareData.mapImage && !state.shareMapImageDataUrl;
    setShareStatus(mapWarning ? 'Preparing map art for export...' : 'Generating image...', 'info');
    const canvas = await renderShareCardCanvas();
    const blob = await canvasToBlob(canvas);
    const safeGamertag = state.activeShareData.gamertag.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const safeMatch = state.activeShareData.matchId ? state.activeShareData.matchId.slice(0, 8) : 'match';
    const fileName = `hw2-${safeGamertag || 'player'}-${safeMatch}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setShareStatus('Image downloaded.', 'ok');
  } catch (err) {
    setShareStatus('Unable to generate image.', 'error');
  }
}

async function copyShareImage() {
  if (!state.activeShareData) return;
  if (!navigator.clipboard || !(window as any).ClipboardItem) {
    setShareStatus('Copy image is not supported in this browser.', 'error');
    return;
  }
  if (!window.isSecureContext) {
    setShareStatus('Copy image requires HTTPS.', 'error');
    return;
  }
  try {
    const mapWarning = !!state.activeShareData.mapImage && !state.shareMapImageDataUrl;
    setShareStatus(mapWarning ? 'Preparing map art for export...' : 'Generating image...', 'info');
    const canvas = await renderShareCardCanvas();
    const blob = await canvasToBlob(canvas);
    const item = new (window as any).ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    setShareStatus('Image copied to clipboard.', 'ok');
  } catch {
    setShareStatus('Unable to copy image.', 'error');
  }
}

export function buildMatchShareData(match: any, gamertag: string): ShareData {
  const player = findMatchPlayer(match, gamertag);

  const rawOutcome = player?.MatchOutcome
    ?? player?.PlayerMatchOutcome
    ?? match.PlayerMatchOutcome
    ?? match.MatchOutcome
    ?? match.MatchResult;
  const outcome = typeof rawOutcome === 'string' ? rawOutcome.toLowerCase() : rawOutcome;
  const isWin = outcome === 1 || outcome === 'win' || outcome === 'victory';
  const isLoss = outcome === 2 || outcome === 'loss' || outcome === 'defeat';
  const resultText = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';
  const resultClass: ShareData['resultClass'] = isWin ? 'win' : isLoss ? 'loss' : 'draw';

  const leaderId = player?.LeaderId ?? match.LeaderId;
  const leaderName = leaderId != null ? getLeaderName(leaderId) : 'Unknown';
  const mapName = getMapName(match.MapId || '');
  const mapImage =
    getMapImage(match.MapId || '')
    || (typeof match.MapImageUrl === 'string' ? match.MapImageUrl : '')
    || (typeof match.MapImage === 'string' ? match.MapImage : '');
  const mapImageFallback =
    getMapImageFallback(match.MapId || '')
    || (typeof match.MapImageUrl === 'string' ? match.MapImageUrl : '')
    || (typeof match.MapImage === 'string' ? match.MapImage : '');
  const dateStr = match.MatchStartDate?.ISO8601Date
    ? new Date(match.MatchStartDate.ISO8601Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const durationIso = match.PlayerMatchDuration || match.MatchDuration;
  const durationStr = durationIso ? parseDuration(durationIso) : '';

  const playlistName = match.PlaylistId ? getPlaylistName(match.PlaylistId) : '';
  const fallbackLabel = getGameModeName(match.GameMode) || (match.MatchType === 3 ? 'Matchmaking' : match.MatchType === 2 ? 'Custom' : match.MatchType === 1 ? 'Campaign' : 'Unknown');
  const playlistLabel = playlistName || fallbackLabel;

  let powersUsed = 0;
  const leaderPowerStats = player?.LeaderPowerStats;
  if (leaderPowerStats && typeof leaderPowerStats === 'object') {
    Object.values(leaderPowerStats).forEach((stats: any) => {
      if (typeof stats === 'number') {
        powersUsed += stats;
      } else if (stats && typeof stats === 'object') {
        powersUsed += stats.TimesCast ?? stats.TotalPlays ?? 0;
      }
    });
  }
  const powersText = String(powersUsed);

  const unitStats = player?.UnitStats || match.UnitStats;
  let unitsDestroyed = 0;
  if (unitStats && typeof unitStats === 'object') {
    Object.values(unitStats).forEach((u: any) => {
      unitsDestroyed += u?.TotalDestroyed || 0;
    });
  }
  const unitsText = String(unitsDestroyed);

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
  const shareUrl = buildProfileUrl(gamertag, matchId || null);
  const shareTitle = `${gamertag} - ${resultText} as ${leaderName} on ${mapName} | Halo Wars 2 Stats`;
  const shareText = `${gamertag} - ${resultText} on ${mapName} as ${leaderName}${durationStr ? ` | ${durationStr}` : ''}${teamSizeLabel ? ` | ${teamSizeLabel}` : ''}`;

  return {
    matchId,
    gamertag,
    resultText,
    resultClass,
    mapName,
    mapImage,
    mapImageFallback,
    leaderName,
    dateStr,
    durationStr,
    playlistLabel,
    teamSizeLabel: teamSizeLabel || '-',
    powersText,
    unitsText,
    shareUrl,
    shareTitle,
    shareText,
  };
}

export async function showShareModal(matchId: string, gamertag: string) {
  if (!matchId) return;
  const match = state.matchLookup.get(matchId) || state.currentMatches.find((m: any) => m.MatchId === matchId);
  if (!match) {
    showError(globalError, { type: 'not_found', message: 'Match not found in recent history.' });
    return;
  }
  const requestId = ++state.shareRequestId;
  const data = buildMatchShareData(match, gamertag);
  openShareModal(data);

  const player = findMatchPlayer(match, gamertag);
  const needsDetails = !player || (!player?.UnitStats && !player?.LeaderPowerStats);
  setShareCardLoading(needsDetails);
  if (!needsDetails) return;

  setShareStatus('Fetching match details...', 'info');
  const result = await getMatchResult(matchId);
  if (requestId !== state.shareRequestId) return;
  if (!result.ok || !result.data) {
    setShareStatus('Match details unavailable.', 'error');
    setShareCardLoading(false);
    return;
  }

  const mergedMatch = {
    ...match,
    ...result.data,
    Players: result.data?.Players ?? match.Players,
  };
  const updated = buildMatchShareData(mergedMatch, gamertag);
  state.activeShareData = updated;
  updateShareCard(updated);
  updateShareLinks(updated);
  if (shareCopyLinkBtn) shareCopyLinkBtn.setAttribute('data-url', updated.shareUrl);
  setShareMapImage(updated.mapImage, updated.mapImageFallback);
  setShareStatus('Match details loaded.', 'ok');
  setShareCardLoading(false);
}

export function initShareModalListeners() {
  if (shareModal) {
    shareModal.querySelectorAll('[data-close="true"]').forEach((el) => {
      el.addEventListener('click', closeShareModal);
    });
  }

  shareCopyLinkBtn?.addEventListener('click', copyShareLink);
  shareDownloadBtn?.addEventListener('click', downloadShareImage);
  shareCopyImageBtn?.addEventListener('click', copyShareImage);
}
