import { STORAGE_KEY, PINNED_MATCHES_KEY, MAX_RECENT } from './state';
import { recentSearchesEl, searchInput } from './dom';

let searchCallback: ((gt: string) => void) | null = null;

export function setSearchCallback(fn: (gt: string) => void) {
  searchCallback = fn;
}

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function addRecentSearch(gt: string) {
  const searches = getRecentSearches().filter(s => s.toLowerCase() !== gt.toLowerCase());
  searches.unshift(gt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  renderRecentSearches();
}

export function getPinnedMatches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_MATCHES_KEY) || '[]');
  } catch { return []; }
}

export function setPinnedMatches(ids: string[]) {
  localStorage.setItem(PINNED_MATCHES_KEY, JSON.stringify(ids));
}

export function togglePinnedMatch(matchId: string): boolean {
  const pinned = new Set(getPinnedMatches());
  if (pinned.has(matchId)) {
    pinned.delete(matchId);
  } else {
    pinned.add(matchId);
  }
  setPinnedMatches([...pinned]);
  return pinned.has(matchId);
}

export function renderRecentSearches() {
  const searches = getRecentSearches();
  if (searches.length === 0) {
    recentSearchesEl.classList.add('hidden');
    return;
  }
  recentSearchesEl.classList.remove('hidden');
  recentSearchesEl.innerHTML = '<span class="text-xs text-gray-400 self-center">Recent:</span>' +
    searches.map(s =>
      `<div class="recent-search-wrapper inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-slate-700/60 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-slate-600/60 transition-colors font-mono">
        <button type="button" class="recent-search-tag hover:text-cyan-200 transition-colors" data-gamertag="${s.replace(/"/g, '&quot;')}">${s}</button>
        <button type="button" class="recent-search-remove text-gray-400 hover:text-red-400 transition-colors ml-1" data-gamertag="${s.replace(/"/g, '&quot;')}" aria-label="Remove ${s} from recent searches">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>`
    ).join('');

  recentSearchesEl.querySelectorAll('.recent-search-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const gt = (btn as HTMLElement).dataset.gamertag || '';
      searchInput.value = gt;
      if (searchCallback) searchCallback(gt);
    });
  });

  recentSearchesEl.querySelectorAll('.recent-search-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gt = (btn as HTMLElement).dataset.gamertag || '';
      removeRecentSearch(gt);
    });
  });
}

export function removeRecentSearch(gamertagToRemove: string) {
  try {
    const searches = getRecentSearches();
    const filteredSearches = searches.filter(s => s.toLowerCase() !== gamertagToRemove.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSearches));
    renderRecentSearches();
  } catch {
    // Silently fail if localStorage is not available
  }
}
