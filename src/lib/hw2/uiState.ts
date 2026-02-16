import { staleBanner, staleBannerMeta } from './dom';

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
