import { staleBanner, staleBannerMeta, staleBannerRetry } from './dom';

export function showSectionRetryButton(
  sectionId: string,
  errorType: string,
  onRetry: () => void
) {
  const errorEl = document.getElementById(`${sectionId}-error`);
  if (!errorEl) return;
  const existing = errorEl.querySelector('.section-retry-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.className = 'section-retry-btn mt-3 text-sm px-3 py-1.5 rounded border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  if (errorType === 'rate_limit') {
    let remaining = 5;
    btn.textContent = `Retry in ${remaining}s…`;
    btn.disabled = true;
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        btn.textContent = 'Retry';
        btn.disabled = false;
      } else {
        btn.textContent = `Retry in ${remaining}s…`;
      }
    }, 1000);
  } else {
    btn.textContent = 'Retry';
  }

  btn.addEventListener('click', () => {
    btn.remove();
    onRetry();
  });

  errorEl.appendChild(btn);
}

export function showError(container: HTMLElement, error: { type: string; message: string }) {
  const colorMap: Record<string, string> = {
    not_found: 'border-red-500/40 bg-red-900/20 text-red-300',
    rate_limit: 'border-amber-500/40 bg-amber-900/20 text-amber-300',
    auth: 'border-blue-500/40 bg-blue-900/20 text-blue-300',
    network: 'border-blue-500/40 bg-blue-900/20 text-blue-300',
    unknown: 'border-red-500/40 bg-red-900/20 text-red-300',
  };
  const iconMap: Record<string, string> = {
    not_found: 'fa-user-slash',
    rate_limit: 'fa-clock',
    auth: 'fa-exclamation-triangle',
    network: 'fa-wifi',
    unknown: 'fa-exclamation-circle',
  };
  const classes = colorMap[error.type] || colorMap.unknown;
  const icon = iconMap[error.type] || iconMap.unknown;
  container.innerHTML = `
    <div class="rounded-lg border p-4 flex items-start gap-3 ${classes}">
      <i class="fas ${icon} mt-0.5" aria-hidden="true"></i>
      <div>
        <p class="font-medium">${error.message}</p>
      </div>
    </div>
  `;
  container.classList.remove('hidden');
}

export function hideStaleBanner() {
  if (!staleBanner) return;
  staleBanner.classList.add('hidden');
  if (staleBannerMeta) staleBannerMeta.textContent = '';
}

export function showStaleBanner(sources: Array<{ label: string; fetchedAt?: string | null }>) {
  if (!staleBanner) return;
  const sourceText = sources.map((source) => source.label).join(', ');
  const dates = sources.map((source) => source.fetchedAt).filter(Boolean) as string[];
  const latest = dates.sort().at(-1);
  const latestText = latest
    ? new Date(latest).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';
  const metaBits = [
    sourceText ? `Sources: ${sourceText}.` : '',
    latestText ? `Cached snapshot from ${latestText}.` : '',
  ].filter(Boolean).join(' ');
  if (staleBannerMeta) staleBannerMeta.textContent = metaBits;
  staleBanner.classList.remove('hidden');
}

export function formatAge(seconds: number): string {
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function getAgeUrgencyClass(seconds?: number): string {
  if (seconds == null) return 'bg-zinc-800 text-zinc-400';
  if (seconds < 3600) return 'bg-zinc-800 text-zinc-400';
  if (seconds < 86400) return 'bg-amber-900/30 text-amber-400';
  return 'bg-amber-900/50 text-amber-300';
}

export function showSectionStaleBadge(sectionId: string, meta?: { fetchedAt?: string; cacheAgeSeconds?: number; reason?: string } | null) {
  const container = document.getElementById(`${sectionId}-content`);
  if (!container) return;
  const existing = container.querySelector('.cache-stale-badge');
  if (existing) existing.remove();

  const ageSeconds = meta?.cacheAgeSeconds ?? (
    meta?.fetchedAt
      ? Math.floor((Date.now() - new Date(meta.fetchedAt).getTime()) / 1000)
      : undefined
  );
  const ageText = ageSeconds != null ? formatAge(ageSeconds) : null;
  const urgencyClass = getAgeUrgencyClass(ageSeconds);

  const badge = document.createElement('div');
  badge.className = `cache-stale-badge text-xs px-2 py-1 rounded inline-flex items-center gap-1 mb-3 ${urgencyClass}`;
  badge.setAttribute('aria-label', `Showing cached data${ageText && ageText !== 'just now' ? ` from ${ageText} ago` : ''}`);
  badge.innerHTML = `<i class="fas fa-clock" aria-hidden="true"></i> ${ageText && ageText !== 'just now' ? `Cached · ${ageText} ago` : 'Cached snapshot'}`;
  container.prepend(badge);
}

export function removeSectionStaleBadge(sectionId: string) {
  document.getElementById(`${sectionId}-content`)
    ?.querySelector('.cache-stale-badge')?.remove();
}

export function showSkeleton(sectionId: string) {
  const skeleton = document.getElementById(`${sectionId}-skeleton`);
  const content = document.getElementById(`${sectionId}-content`);
  const error = document.getElementById(`${sectionId}-error`);
  if (skeleton) skeleton.classList.remove('hidden');
  if (content) content.classList.add('hidden');
  if (error) { error.classList.add('hidden'); error.innerHTML = ''; }
}

export function hideSkeleton(sectionId: string) {
  const skeleton = document.getElementById(`${sectionId}-skeleton`);
  if (skeleton) skeleton.classList.add('hidden');
}
