import {
  DEFAULT_SORT,
  PAGE_SIZE,
  filterAndSortVideos,
  getActiveFilterChips,
  getDefaultState,
  getPageHref,
  getPaginationWindow,
  getSortStatusLabel,
  isDefaultFormatSelection,
  paginateVideos,
  parseStateFromSearchParams,
  serializeStateToSearchParams,
  type FormatTag,
  type GameTag,
  type SeriesTag,
  type VideoDatabaseState,
  type VideoSearchRecord,
} from './videoUtils';

const SEARCH_DEBOUNCE_MS = 140;

type FilterType = 'game' | 'series' | 'format' | 'year';

/**
 * DOM refs threaded through the pure render functions so they don't need
 * to close over module-level variables.
 */
interface VdbContext {
  root: HTMLElement;
  searchInput: HTMLInputElement;
  searchClear: HTMLButtonElement;
  sortBadge: HTMLElement | null;
  activeChips: HTMLElement;
  resultsGrid: HTMLElement;
  pagination: HTMLElement;
  paginationControls: HTMLElement;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseJsonElement<T>(elementId: string, fallback: T): T {
  const element = document.getElementById(elementId);
  if (!element?.textContent) return fallback;

  try {
    return JSON.parse(element.textContent) as T;
  } catch (error) {
    console.error(`vdb: failed to parse ${elementId}`, error);
    return fallback;
  }
}

function toggleValue<T extends string | number>(values: T[], value: T, comparer?: (left: T, right: T) => number): T[] {
  const nextValues = new Set(values);

  if (nextValues.has(value)) nextValues.delete(value);
  else nextValues.add(value);

  const orderedValues = [...nextValues];
  if (comparer) orderedValues.sort(comparer);
  return orderedValues;
}

function removeValue<T extends string | number>(values: T[], value: T, comparer?: (left: T, right: T) => number): T[] {
  const nextValues = values.filter((entry) => entry !== value);
  if (comparer) nextValues.sort(comparer);
  return nextValues;
}

function canRemoveFormat(values: FormatTag[], value: FormatTag): boolean {
  return !(values.length === 1 && values.includes(value));
}

function formatComparer(left: FormatTag, right: FormatTag): number {
  const order: Record<FormatTag, number> = { short: 0, long: 1 };
  return order[left] - order[right];
}

/**
 * Compares two states by serialising them to URL params. Used to decide
 * whether the server-rendered HTML already reflects the initial client state,
 * so we can skip the redundant first render.
 */
function statesAreEqual(a: VideoDatabaseState, b: VideoDatabaseState): boolean {
  return serializeStateToSearchParams(a).toString() === serializeStateToSearchParams(b).toString();
}

// ─── Pure render functions ───────────────────────────────────────────────────
// Each function receives explicit dependencies rather than closing over them,
// making them independently testable and keeping initVideoDatabase() concise.

function renderFilterButtons(ctx: VdbContext, state: VideoDatabaseState): void {
  ctx.root.querySelectorAll<HTMLElement>('[data-filter-type][data-filter-value]').forEach((element) => {
    const filterType = element.dataset.filterType as FilterType;
    const filterValue = element.dataset.filterValue;

    if (!filterValue) {
      console.warn('vdb: filter button is missing data-filter-value', element);
      return;
    }

    let isActive = false;
    if (filterType === 'game') isActive = state.games.includes(filterValue as GameTag);
    if (filterType === 'series') isActive = state.series.includes(filterValue as SeriesTag);
    if (filterType === 'format') isActive = state.formats.includes(filterValue as FormatTag);
    if (filterType === 'year') isActive = state.years.includes(Number.parseInt(filterValue, 10));

    const isDisabled = filterType === 'format' && isActive && !canRemoveFormat(state.formats, filterValue as FormatTag);

    element.classList.toggle('is-active', isActive);
    element.classList.toggle('is-disabled', isDisabled);
    element.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  });

  ctx.root.querySelectorAll<HTMLElement>('[data-sort]').forEach((element) => {
    const isActive = element.dataset.sort === state.sort;
    element.classList.toggle('is-active', isActive);
    element.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  ctx.searchInput.value = state.query;
  ctx.searchClear.classList.toggle('is-hidden', state.query.length === 0);

  if (ctx.sortBadge) {
    ctx.sortBadge.innerHTML = `<i class="fas fa-arrow-down-wide-short" aria-hidden="true"></i>${escapeHtml(getSortStatusLabel(state.sort))}`;
  }
}

function renderChips(ctx: VdbContext, state: VideoDatabaseState): void {
  const chips = getActiveFilterChips(state);
  ctx.activeChips.classList.toggle('is-empty', chips.length === 0);

  if (chips.length === 0) {
    ctx.activeChips.innerHTML = isDefaultFormatSelection(state.formats)
      ? '<p class="vdb-chip-empty">Showing the default archive view: Long Form is enabled. Shorts are any videos under two minutes.</p>'
      : '<p class="vdb-chip-empty">No filters applied. Start with the search bar or pick a game.</p>';
    return;
  }

  ctx.activeChips.innerHTML = chips
    .map(
      (chip) => `
        <button
          type="button"
          class="vdb-chip"
          data-chip-type="${escapeHtml(chip.type)}"
          data-chip-value="${escapeHtml(chip.value)}"
          aria-label="Remove filter: ${escapeHtml(chip.label)}"
        >
          <span>${escapeHtml(chip.label)}</span>
          <i class="fas fa-xmark" aria-hidden="true"></i>
        </button>
      `,
    )
    .join('');
}

function renderCards(ctx: VdbContext, videos: VideoSearchRecord[]): void {
  if (videos.length === 0) {
    ctx.resultsGrid.innerHTML = `
      <div class="vdb-empty-state">
        <i class="fas fa-satellite-dish" aria-hidden="true"></i>
        <h3>No videos match this combination</h3>
        <p>Try widening the search, removing a filter, or switching the sort back to newest.</p>
      </div>
    `;
    return;
  }

  ctx.resultsGrid.innerHTML = videos
    .map((video) => {
      // Pre-escape values used more than once per card
      const url = escapeHtml(video.youtubeUrl);
      const title = escapeHtml(video.title);
      const thumbnail = escapeHtml(video.thumbnailUrl);
      const gameLabel = escapeHtml(video.gameLabel);
      const formatTag =
        video.format === 'short'
          ? `<span class="vdb-card-tag is-format">${escapeHtml(video.formatLabel)}</span>`
          : '';

      const seriesTag =
        video.series !== 'general'
          ? `<span class="vdb-card-tag is-series">${escapeHtml(video.seriesLabel)}</span>`
          : '';
      const blogTag = video.blogHref
        ? `<a href="${escapeHtml(video.blogHref)}" class="vdb-card-tag is-blog" target="_blank" rel="noopener noreferrer">Blog</a>`
        : '';
      const durationTag = video.durationLabel
        ? `<span class="vdb-duration-badge">${escapeHtml(video.durationLabel)}</span>`
        : '';
      const dateTag = video.publishedLabel
        ? `<span class="vdb-card-detail is-date"><i class="fas fa-calendar-days" aria-hidden="true"></i>${escapeHtml(video.publishedLabel)}</span>`
        : '';

      return `
        <article class="vdb-card" role="listitem">
          <a
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
            class="vdb-card-thumb"
            aria-label="Watch ${title} on YouTube"
          >
            <img src="${thumbnail}" alt="" width="480" height="270" loading="lazy" />
            ${durationTag}
          </a>
          <div class="vdb-card-body">
            <div class="vdb-card-tags">
              <span class="vdb-card-tag is-game">${gameLabel}</span>
              ${formatTag}
              ${seriesTag}
              ${blogTag}
            </div>
            <h3 class="vdb-card-title">
              <a href="${url}" target="_blank" rel="noopener noreferrer">
                ${title}
              </a>
            </h3>
            <div class="vdb-card-meta">
              ${dateTag}
            </div>
            <div class="vdb-card-actions">
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="vdb-watch-link">
                <i class="fab fa-youtube" aria-hidden="true"></i>
                <span>Watch on YouTube</span>
              </a>
              <button type="button" class="vdb-copy-link" data-video-url="${url}">
                <i class="fas fa-link" aria-hidden="true"></i>
                <span class="vdb-copy-link-label">Copy link</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderPagination(ctx: VdbContext, state: VideoDatabaseState, totalPages: number): void {
  if (totalPages <= 1) {
    ctx.pagination.classList.add('is-hidden');
    ctx.paginationControls.innerHTML = '';
    return;
  }

  ctx.pagination.classList.remove('is-hidden');
  const pages = getPaginationWindow(totalPages, state.page);

  const pageLinks = [
    `
      <a
        href="${escapeHtml(getPageHref(state, Math.max(1, state.page - 1)))}"
        class="vdb-page-btn${state.page === 1 ? ' is-disabled' : ''}"
        data-page="${Math.max(1, state.page - 1)}"
        aria-disabled="${state.page === 1 ? 'true' : 'false'}"
      >
        Previous
      </a>
    `,
  ];

  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      pageLinks.push('<span class="vdb-page-gap">...</span>');
    }

    pageLinks.push(`
      <a
        href="${escapeHtml(getPageHref(state, page))}"
        class="vdb-page-btn${page === state.page ? ' is-current' : ''}"
        data-page="${page}"
        ${page === state.page ? 'aria-current="page"' : ''}
      >
        ${page}
      </a>
    `);
  });

  pageLinks.push(`
    <a
      href="${escapeHtml(getPageHref(state, Math.min(totalPages, state.page + 1)))}"
      class="vdb-page-btn${state.page === totalPages ? ' is-disabled' : ''}"
      data-page="${Math.min(totalPages, state.page + 1)}"
      aria-disabled="${state.page === totalPages ? 'true' : 'false'}"
    >
      Next
    </a>
  `);

  ctx.paginationControls.innerHTML = pageLinks.join('');
}

// ─── Main init ───────────────────────────────────────────────────────────────

export function initVideoDatabase() {
  const root = document.querySelector<HTMLElement>('[data-video-database]');
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const allVideos = parseJsonElement<VideoSearchRecord[]>('vdb-data', []);
  const serverState = parseJsonElement<VideoDatabaseState>('vdb-state', getDefaultState());
  const initialState = window.location.search
    ? parseStateFromSearchParams(new URLSearchParams(window.location.search), allVideos)
    : serverState;

  const searchInput = document.getElementById('vdb-search-input') as HTMLInputElement | null;
  const searchClear = document.getElementById('vdb-search-clear') as HTMLButtonElement | null;
  const clearAllButton = document.getElementById('vdb-clear-all') as HTMLButtonElement | null;
  const matchCount = document.getElementById('vdb-match-count');
  const rangeSummary = document.getElementById('vdb-range-summary');
  const activeChips = document.getElementById('vdb-active-chips');
  const resultsGrid = document.getElementById('video-results-grid');
  const pagination = document.getElementById('vdb-pagination');
  const paginationControls = document.getElementById('vdb-pagination-controls');
  const shareStatus = document.getElementById('vdb-share-status');
  const scrollTopButton = document.getElementById('vdb-scroll-top') as HTMLButtonElement | null;
  const sortBadge = document.getElementById('vdb-results-badge');

  if (!searchInput || !searchClear || !matchCount || !rangeSummary || !activeChips || !resultsGrid || !pagination || !paginationControls) {
    return;
  }

  const ctx: VdbContext = {
    root,
    searchInput,
    searchClear,
    sortBadge,
    activeChips,
    resultsGrid,
    pagination,
    paginationControls,
  };

  let state: VideoDatabaseState = {
    ...initialState,
    games: [...initialState.games],
    series: [...initialState.series],
    formats: [...initialState.formats],
    years: [...initialState.years],
  };

  let searchTimer = 0;

  function syncStateToUrl() {
    const searchParams = serializeStateToSearchParams(state);
    const query = searchParams.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }

  function renderResults(shouldSyncUrl = true) {
    resultsGrid.setAttribute('aria-busy', 'true');

    const filteredVideos = filterAndSortVideos(allVideos, state);
    const pageData = paginateVideos(filteredVideos, state.page, PAGE_SIZE);
    state = { ...state, page: pageData.page };

    matchCount.textContent = filteredVideos.length.toLocaleString();
    rangeSummary.textContent =
      filteredVideos.length === 0
        ? 'Showing 0 of 0'
        : `Showing ${pageData.startIndex + 1}-${pageData.endIndex} of ${filteredVideos.length.toLocaleString()}`;

    renderFilterButtons(ctx, state);
    renderChips(ctx, state);
    renderCards(ctx, pageData.items);
    renderPagination(ctx, state, pageData.totalPages);

    resultsGrid.setAttribute('aria-busy', 'false');

    if (shouldSyncUrl) {
      syncStateToUrl();
    }
  }

  /** Single entry point for all state mutations — ensures consistent immutability. */
  function setState(patch: Partial<VideoDatabaseState>, syncUrl = true) {
    state = { ...state, ...patch };
    renderResults(syncUrl);
  }

  function resetState() {
    state = getDefaultState();
    renderResults();
  }

  function removeChip(filterType: string, filterValue: string) {
    if (filterType === 'query') {
      setState({ query: '', sort: state.sort === 'relevance' ? DEFAULT_SORT : state.sort, page: 1 });
      return;
    }

    if (filterType === 'game') {
      setState({ games: removeValue(state.games, filterValue as GameTag), page: 1 });
      return;
    }

    if (filterType === 'series') {
      setState({ series: removeValue(state.series, filterValue as SeriesTag), page: 1 });
      return;
    }

    if (filterType === 'format') {
      if (!canRemoveFormat(state.formats, filterValue as FormatTag)) return;
      setState({ formats: removeValue(state.formats, filterValue as FormatTag, formatComparer), page: 1 });
      return;
    }

    if (filterType === 'year') {
      setState({
        years: removeValue(state.years, Number.parseInt(filterValue, 10), (left, right) => right - left),
        page: 1,
      });
    }
  }

  function toggleFilter(filterType: FilterType, filterValue: string) {
    if (filterType === 'game') {
      setState({ games: toggleValue(state.games, filterValue as GameTag), page: 1 });
      return;
    }

    if (filterType === 'series') {
      setState({ series: toggleValue(state.series, filterValue as SeriesTag), page: 1 });
      return;
    }

    if (filterType === 'format') {
      if (state.formats.includes(filterValue as FormatTag) && !canRemoveFormat(state.formats, filterValue as FormatTag)) {
        return;
      }
      setState({ formats: toggleValue(state.formats, filterValue as FormatTag, formatComparer), page: 1 });
      return;
    }

    if (filterType === 'year') {
      setState({
        years: toggleValue(state.years, Number.parseInt(filterValue, 10), (left, right) => right - left),
        page: 1,
      });
    }
  }

  async function copyVideoUrl(url: string, button: HTMLButtonElement) {
    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      window.prompt('Copy this YouTube link:', url);
      if (shareStatus) shareStatus.textContent = 'Copy link prompt opened.';
      return;
    }

    const label = button.querySelector('.vdb-copy-link-label');
    button.classList.add('is-copied');
    if (label) label.textContent = 'Copied';
    if (shareStatus) shareStatus.textContent = 'YouTube link copied to clipboard.';

    window.setTimeout(() => {
      button.classList.remove('is-copied');
      if (label) label.textContent = 'Copy link';
    }, 1800);
  }

  function updateScrollTopVisibility() {
    if (!scrollTopButton) return;
    scrollTopButton.classList.toggle('is-visible', window.scrollY > 320);
  }

  // ─── Event delegation ──────────────────────────────────────────────────────

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const filterButton = target.closest<HTMLElement>('[data-filter-type][data-filter-value]');
    const sortButton = target.closest<HTMLElement>('[data-sort]');
    const chipButton = target.closest<HTMLElement>('[data-chip-type][data-chip-value]');
    const copyButton = target.closest<HTMLButtonElement>('.vdb-copy-link[data-video-url]');
    const pageButton = target.closest<HTMLElement>('[data-page]');

    if (filterButton) {
      const filterValue = filterButton.dataset.filterValue;
      if (!filterValue) {
        console.warn('vdb: filter button is missing data-filter-value', filterButton);
        return;
      }
      toggleFilter(filterButton.dataset.filterType as FilterType, filterValue);
      return;
    }

    if (sortButton) {
      const nextSort = sortButton.dataset.sort as VideoDatabaseState['sort'];
      if (!nextSort || nextSort === state.sort) return;
      setState({ sort: nextSort, page: 1 });
      return;
    }

    if (chipButton) {
      const chipType = chipButton.dataset.chipType;
      const chipValue = chipButton.dataset.chipValue;
      if (!chipType || !chipValue) {
        console.warn('vdb: chip button is missing data attributes', chipButton);
        return;
      }
      removeChip(chipType, chipValue);
      return;
    }

    if (copyButton) {
      copyVideoUrl(copyButton.dataset.videoUrl || '', copyButton);
      return;
    }

    if (pageButton) {
      const page = Number.parseInt(pageButton.dataset.page || '', 10);
      if (!Number.isInteger(page) || page < 1) return;
      if (pageButton.getAttribute('aria-disabled') === 'true' || page === state.page) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      setState({ page });
      resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const nextQuery = searchInput.value;
      const hasQuery = nextQuery.trim().length > 0;
      const nextSort =
        hasQuery && state.sort === DEFAULT_SORT
          ? 'relevance'
          : !hasQuery && state.sort === 'relevance'
            ? DEFAULT_SORT
            : state.sort;

      setState({ query: nextQuery, sort: nextSort, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
  });

  searchClear.addEventListener('click', () => {
    setState({ query: '', sort: state.sort === 'relevance' ? DEFAULT_SORT : state.sort, page: 1 });
  });

  clearAllButton?.addEventListener('click', resetState);

  scrollTopButton?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('popstate', () => {
    state = parseStateFromSearchParams(new URLSearchParams(window.location.search), allVideos);
    renderResults(false);
  });

  window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
  updateScrollTopVisibility();

  // Skip re-rendering what the server already painted correctly on first load
  if (!statesAreEqual(initialState, serverState)) {
    renderResults(false);
  }
}
