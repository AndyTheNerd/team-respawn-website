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
  type FormatTag,
  type GameTag,
  type SeriesTag,
  type VideoDatabaseState,
  type VideoSearchRecord,
} from './videoUtils';

type FilterType = 'game' | 'series' | 'format' | 'year';

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
  const sortBadge = root.querySelector('.vdb-results-badge');

  if (!searchInput || !searchClear || !matchCount || !rangeSummary || !activeChips || !resultsGrid || !pagination || !paginationControls) {
    return;
  }

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

  function renderFilterButtons() {
    root.querySelectorAll<HTMLElement>('[data-filter-type][data-filter-value]').forEach((element) => {
      const filterType = element.dataset.filterType as FilterType;
      const filterValue = element.dataset.filterValue || '';

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

    root.querySelectorAll<HTMLElement>('[data-sort]').forEach((element) => {
      const isActive = element.dataset.sort === state.sort;
      element.classList.toggle('is-active', isActive);
      element.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    searchInput.value = state.query;
    searchClear.classList.toggle('is-hidden', state.query.length === 0);

    if (sortBadge) {
      sortBadge.innerHTML = `<i class="fas fa-arrow-down-wide-short" aria-hidden="true"></i>${escapeHtml(getSortStatusLabel(state.sort))}`;
    }
  }

  function renderChips() {
    const chips = getActiveFilterChips(state);
    activeChips.classList.toggle('is-empty', chips.length === 0);

    if (chips.length === 0) {
      activeChips.innerHTML = isDefaultFormatSelection(state.formats)
        ? '<p class="vdb-chip-empty">Showing the default archive view: Long Form is enabled. Shorts are any videos under two minutes.</p>'
        : '<p class="vdb-chip-empty">No filters applied. Start with the search bar or pick a game.</p>';
      return;
    }

    activeChips.innerHTML = chips
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

  function renderCards(videos: VideoSearchRecord[]) {
    if (videos.length === 0) {
      resultsGrid.innerHTML = `
        <div class="vdb-empty-state">
          <i class="fas fa-satellite-dish" aria-hidden="true"></i>
          <h3>No videos match this combination</h3>
          <p>Try widening the search, removing a filter, or switching the sort back to newest.</p>
        </div>
      `;
      return;
    }

    resultsGrid.innerHTML = videos
      .map((video) => {
        const seriesTag =
          video.series !== 'general'
            ? `<span class="vdb-card-tag is-series">${escapeHtml(video.seriesLabel)}</span>`
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
              href="${escapeHtml(video.youtubeUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="vdb-card-thumb"
              aria-label="Watch ${escapeHtml(video.title)} on YouTube"
            >
              <img src="${escapeHtml(video.thumbnailUrl)}" alt="" width="480" height="270" loading="lazy" />
              ${durationTag}
            </a>
            <div class="vdb-card-body">
              <div class="vdb-card-tags">
                <span class="vdb-card-tag is-game">${escapeHtml(video.gameLabel)}</span>
                <span class="vdb-card-tag is-format">${escapeHtml(video.formatLabel)}</span>
                ${seriesTag}
              </div>
              <h3 class="vdb-card-title">
                <a href="${escapeHtml(video.youtubeUrl)}" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(video.title)}
                </a>
              </h3>
              <div class="vdb-card-meta">
                ${dateTag}
              </div>
              <div class="vdb-card-actions">
                <a href="${escapeHtml(video.youtubeUrl)}" target="_blank" rel="noopener noreferrer" class="vdb-watch-link">
                  <i class="fab fa-youtube" aria-hidden="true"></i>
                  <span>Watch on YouTube</span>
                </a>
                <button type="button" class="vdb-copy-link" data-video-url="${escapeHtml(video.youtubeUrl)}">
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

  function renderPagination(totalPages: number) {
    if (totalPages <= 1) {
      pagination.classList.add('is-hidden');
      paginationControls.innerHTML = '';
      return;
    }

    pagination.classList.remove('is-hidden');
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

    paginationControls.innerHTML = pageLinks.join('');
  }

  function renderResults(shouldSyncUrl = true) {
    const filteredVideos = filterAndSortVideos(allVideos, state);
    const pageData = paginateVideos(filteredVideos, state.page, PAGE_SIZE);
    state = { ...state, page: pageData.page };

    matchCount.textContent = filteredVideos.length.toLocaleString();
    rangeSummary.textContent =
      filteredVideos.length === 0
        ? 'Showing 0 of 0'
        : `Showing ${pageData.startIndex + 1}-${pageData.endIndex} of ${filteredVideos.length.toLocaleString()}`;

    renderFilterButtons();
    renderChips();
    renderCards(pageData.items);
    renderPagination(pageData.totalPages);

    if (shouldSyncUrl) {
      syncStateToUrl();
    }
  }

  function resetState() {
    state = getDefaultState();
    renderResults();
  }

  function removeChip(filterType: string, filterValue: string) {
    if (filterType === 'query') {
      state = { ...state, query: '', sort: state.sort === 'relevance' ? DEFAULT_SORT : state.sort, page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'game') {
      state = { ...state, games: removeValue(state.games, filterValue as GameTag), page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'series') {
      state = { ...state, series: removeValue(state.series, filterValue as SeriesTag), page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'format') {
      if (!canRemoveFormat(state.formats, filterValue as FormatTag)) return;
      state = { ...state, formats: removeValue(state.formats, filterValue as FormatTag, formatComparer), page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'year') {
      state = {
        ...state,
        years: removeValue(
          state.years,
          Number.parseInt(filterValue, 10),
          (left, right) => right - left,
        ),
        page: 1,
      };
      renderResults();
    }
  }

  function toggleFilter(filterType: FilterType, filterValue: string) {
    if (filterType === 'game') {
      state = { ...state, games: toggleValue(state.games, filterValue as GameTag), page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'series') {
      state = { ...state, series: toggleValue(state.series, filterValue as SeriesTag), page: 1 };
      renderResults();
      return;
    }

    if (filterType === 'format') {
      if (state.formats.includes(filterValue as FormatTag) && !canRemoveFormat(state.formats, filterValue as FormatTag)) {
        return;
      }

      state = {
        ...state,
        formats: toggleValue(state.formats, filterValue as FormatTag, formatComparer),
        page: 1,
      };
      renderResults();
      return;
    }

    if (filterType === 'year') {
      state = {
        ...state,
        years: toggleValue(
          state.years,
          Number.parseInt(filterValue, 10),
          (left, right) => right - left,
        ),
        page: 1,
      };
      renderResults();
    }
  }

  async function copyVideoUrl(url: string, button: HTMLButtonElement) {
    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch (error) {
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

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const filterButton = target.closest<HTMLElement>('[data-filter-type][data-filter-value]');
    const sortButton = target.closest<HTMLElement>('[data-sort]');
    const chipButton = target.closest<HTMLElement>('[data-chip-type][data-chip-value]');
    const copyButton = target.closest<HTMLButtonElement>('.vdb-copy-link[data-video-url]');
    const pageButton = target.closest<HTMLElement>('[data-page]');

    if (filterButton) {
      toggleFilter(filterButton.dataset.filterType as FilterType, filterButton.dataset.filterValue || '');
      return;
    }

    if (sortButton) {
      const nextSort = sortButton.dataset.sort as VideoDatabaseState['sort'];
      if (!nextSort || nextSort === state.sort) return;
      state = { ...state, sort: nextSort, page: 1 };
      renderResults();
      return;
    }

    if (chipButton) {
      removeChip(chipButton.dataset.chipType || '', chipButton.dataset.chipValue || '');
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
      state = { ...state, page };
      renderResults();
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

      state = {
        ...state,
        query: nextQuery,
        sort: nextSort,
        page: 1,
      };

      renderResults();
    }, 140);
  });

  searchClear.addEventListener('click', () => {
    state = {
      ...state,
      query: '',
      sort: state.sort === 'relevance' ? DEFAULT_SORT : state.sort,
      page: 1,
    };
    renderResults();
  });

  clearAllButton?.addEventListener('click', () => {
    resetState();
  });

  scrollTopButton?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('popstate', () => {
    state = parseStateFromSearchParams(new URLSearchParams(window.location.search), allVideos);
    renderResults(false);
  });

  window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
  updateScrollTopVisibility();
  renderResults(false);
}
