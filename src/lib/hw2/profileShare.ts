import type { ProfileShareData } from './types';
import { state } from './state';
import {
  profileShareModal, profileShareCard, profileShareGamertagEl, profileShareSubtitleEl,
  profileShareMatchesEl, profileShareWinsEl, profileShareLossesEl, profileShareWinRateEl,
  profileShareRatingEl, profileShareTimeEl, profileShareAvgEl, profileShareTerminusEl,
  profileShareDateEl, profileShareStatusEl, profileShareCopyLinkBtn, profileShareDownloadBtn,
  profileShareCopyImageBtn, profileShareLinks, profileShareBtn,
} from './dom';
import { updateShareBodyState } from './shareCard';

function setProfileShareStatus(message: string, tone: 'ok' | 'error' | 'info' = 'info') {
  if (!profileShareStatusEl) return;
  profileShareStatusEl.textContent = message;
  profileShareStatusEl.classList.remove('ok', 'error');
  if (tone !== 'info') profileShareStatusEl.classList.add(tone);
  if (state.profileShareStatusTimeout) {
    window.clearTimeout(state.profileShareStatusTimeout);
  }
  if (message) {
    state.profileShareStatusTimeout = window.setTimeout(() => {
      if (profileShareStatusEl) {
        profileShareStatusEl.textContent = '';
        profileShareStatusEl.classList.remove('ok', 'error');
      }
    }, 3000);
  }
}

function updateProfileShareCard(data: ProfileShareData) {
  if (profileShareGamertagEl) profileShareGamertagEl.textContent = data.gamertag;
  if (profileShareSubtitleEl) profileShareSubtitleEl.textContent = data.subtitle;
  if (profileShareMatchesEl) profileShareMatchesEl.textContent = data.matches;
  if (profileShareWinsEl) profileShareWinsEl.textContent = data.wins;
  if (profileShareLossesEl) profileShareLossesEl.textContent = data.losses;
  if (profileShareWinRateEl) profileShareWinRateEl.textContent = data.winRate;
  if (profileShareRatingEl) profileShareRatingEl.textContent = data.viewerRating;
  if (profileShareTimeEl) profileShareTimeEl.textContent = data.timeStr;
  if (profileShareAvgEl) profileShareAvgEl.textContent = data.avgMatchStr;
  if (profileShareTerminusEl) profileShareTerminusEl.textContent = data.terminusWave;
  if (profileShareDateEl) profileShareDateEl.textContent = data.dateStr;
}

function updateProfileShareLinks(data: ProfileShareData) {
  const encodedUrl = encodeURIComponent(data.shareUrl);
  const encodedTitle = encodeURIComponent(data.shareTitle);
  const encodedText = encodeURIComponent(data.shareText);
  const linkMap: Record<string, string> = {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  profileShareLinks.forEach((link) => {
    const key = link.getAttribute('data-share') || '';
    if (key && linkMap[key]) {
      link.setAttribute('href', linkMap[key]);
    }
  });
}

function openProfileShareModal(data: ProfileShareData) {
  if (!profileShareModal) return;
  state.activeProfileShareData = data;
  updateProfileShareCard(data);
  updateProfileShareLinks(data);
  if (profileShareCopyLinkBtn) profileShareCopyLinkBtn.setAttribute('data-url', data.shareUrl);
  profileShareModal.classList.remove('hidden');
  profileShareModal.setAttribute('aria-hidden', 'false');
  updateShareBodyState();
  setProfileShareStatus('');
  profileShareCopyLinkBtn?.focus();
}

export function closeProfileShareModal() {
  if (!profileShareModal) return;
  profileShareModal.classList.add('hidden');
  profileShareModal.setAttribute('aria-hidden', 'true');
  updateShareBodyState();
  setProfileShareStatus('');
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

async function renderProfileShareCardCanvas(): Promise<HTMLCanvasElement> {
  if (!profileShareCard) throw new Error('Profile share card not found.');
  const html2canvas = await ensureHtml2canvas();
  return await html2canvas(profileShareCard, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });
}

async function copyProfileShareLink() {
  if (!state.activeProfileShareData) return;
  try {
    await navigator.clipboard.writeText(state.activeProfileShareData.shareUrl);
    setProfileShareStatus('Link copied to clipboard.', 'ok');
  } catch {
    setProfileShareStatus('Failed to copy link.', 'error');
  }
}

async function downloadProfileShareImage() {
  if (!state.activeProfileShareData) return;
  try {
    setProfileShareStatus('Generating image...', 'info');
    const canvas = await renderProfileShareCardCanvas();
    const blob = await canvasToBlob(canvas);
    const safeGamertag = state.activeProfileShareData.gamertag.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const fileName = `hw2-${safeGamertag || 'player'}-profile.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setProfileShareStatus('Image downloaded.', 'ok');
  } catch {
    setProfileShareStatus('Unable to generate image.', 'error');
  }
}

async function copyProfileShareImage() {
  if (!state.activeProfileShareData) return;
  if (!navigator.clipboard || !(window as any).ClipboardItem) {
    setProfileShareStatus('Copy image is not supported in this browser.', 'error');
    return;
  }
  if (!window.isSecureContext) {
    setProfileShareStatus('Copy image requires HTTPS.', 'error');
    return;
  }
  try {
    setProfileShareStatus('Generating image...', 'info');
    const canvas = await renderProfileShareCardCanvas();
    const blob = await canvasToBlob(canvas);
    const item = new (window as any).ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    setProfileShareStatus('Image copied to clipboard.', 'ok');
  } catch {
    setProfileShareStatus('Unable to copy image.', 'error');
  }
}

export function initProfileShareListeners() {
  if (profileShareModal) {
    profileShareModal.querySelectorAll('[data-close="true"]').forEach((el) => {
      el.addEventListener('click', closeProfileShareModal);
    });
  }

  profileShareCopyLinkBtn?.addEventListener('click', copyProfileShareLink);
  profileShareDownloadBtn?.addEventListener('click', downloadProfileShareImage);
  profileShareCopyImageBtn?.addEventListener('click', copyProfileShareImage);

  profileShareBtn?.addEventListener('click', () => {
    if (state.activeProfileShareData) {
      openProfileShareModal(state.activeProfileShareData);
    }
  });
}
