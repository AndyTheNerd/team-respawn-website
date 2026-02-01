(function() {
  'use strict';

  const searchInput = document.getElementById('blog-search');
  const categorySelect = document.querySelector('[data-id="w-select-category-filter"]');
  const tagSelect = document.querySelector('[data-id="w-select-tag-filter"]');
  const sortSelect = document.querySelector('[data-id="w-select-sort-filter"]');
  const blogGrid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  const paginationContainer = document.querySelector('.mt-12.flex.justify-center');
  const activeFilters = document.getElementById('blog-active-filters');
  const activeFilterList = document.getElementById('blog-active-filter-list');
  const clearFiltersButton = document.getElementById('blog-clear-filters');

  let currentSearchTerm = '';
  let currentCategory = 'all';
  let currentTag = 'all';
  let currentSort = 'newest';

  function normalizeValue(value) {
    return (value || '').toLowerCase().trim();
  }

  function getOptionLabel(selectName, value) {
    const normalized = normalizeValue(value);
    if (!normalized) {
      return '';
    }

    const options = Array.from(
      document.querySelectorAll(`[data-id="w-options-${selectName}"] [data-value]`)
    );

    const match = options.find(option => normalizeValue(option.dataset.value) === normalized)
      || options.find(option => normalizeValue(option.dataset.name) === normalized);

    return (match && (match.dataset.name || match.dataset.value)) || value;
  }

  function setSelectUI(selectName, value) {
    const selectInput = document.querySelector(`[data-id="w-select-${selectName}"]`);
    if (!selectInput) {
      return;
    }

    const options = Array.from(
      document.querySelectorAll(`[data-id="w-options-${selectName}"] [data-value]`)
    );

    const normalized = normalizeValue(value);
    const match = options.find(option => normalizeValue(option.dataset.value) === normalized)
      || options.find(option => normalizeValue(option.dataset.name) === normalized);

    if (match) {
      selectInput.value = match.dataset.name || match.dataset.value || '';
      options.forEach(option => option.removeAttribute('data-selected'));
      match.dataset.selected = 'true';
    } else if (normalized === '') {
      selectInput.value = '';
      options.forEach(option => option.removeAttribute('data-selected'));
    }
  }

  function isActiveCategory() {
    return currentCategory !== 'all' && currentCategory !== 'all categories' && currentCategory !== '';
  }

  function isActiveTag() {
    return currentTag !== 'all' && currentTag !== 'all tags' && currentTag !== '';
  }

  function isActiveSort() {
    return currentSort !== 'newest' && currentSort !== '';
  }

  function updateSelectActiveStates() {
    if (categorySelect) {
      if (isActiveCategory()) {
        categorySelect.dataset.filterActive = 'true';
      } else {
        categorySelect.removeAttribute('data-filter-active');
      }
    }

    if (tagSelect) {
      if (isActiveTag()) {
        tagSelect.dataset.filterActive = 'true';
      } else {
        tagSelect.removeAttribute('data-filter-active');
      }
    }

    if (sortSelect) {
      if (isActiveSort()) {
        sortSelect.dataset.filterActive = 'true';
      } else {
        sortSelect.removeAttribute('data-filter-active');
      }
    }

    if (searchInput) {
      if (currentSearchTerm !== '') {
        searchInput.dataset.filterActive = 'true';
      } else {
        searchInput.removeAttribute('data-filter-active');
      }
    }
  }

  function renderActiveFilters() {
    if (!activeFilters || !activeFilterList) {
      return;
    }

    const filters = [];
    const searchValue = searchInput ? searchInput.value.trim() : '';

    if (searchValue) {
      filters.push({ label: `Search: ${searchValue}` });
    }

    if (isActiveCategory()) {
      filters.push({ label: `Category: ${getOptionLabel('category-filter', currentCategory)}` });
    }

    if (isActiveTag()) {
      filters.push({ label: `Tag: ${getOptionLabel('tag-filter', currentTag)}` });
    }

    if (isActiveSort()) {
      filters.push({ label: `Sort: ${getOptionLabel('sort-filter', currentSort)}` });
    }

    activeFilterList.innerHTML = '';

    filters.forEach(filter => {
      const pill = document.createElement('span');
      pill.className = 'blog-active-pill';
      pill.textContent = filter.label;
      activeFilterList.appendChild(pill);
    });

    if (filters.length) {
      activeFilters.classList.remove('hidden');
    } else {
      activeFilters.classList.add('hidden');
    }
  }

  function sortCards() {
    const cards = Array.from(blogGrid.querySelectorAll('.blog-card-wrapper'));

    cards.sort(function(a, b) {
      if (currentSort === 'oldest' || currentSort === 'newest') {
        const aDate = Date.parse(a.dataset.date || '') || 0;
        const bDate = Date.parse(b.dataset.date || '') || 0;
        return currentSort === 'oldest' ? aDate - bDate : bDate - aDate;
      }

      if (currentSort === 'title-desc') {
        return (b.dataset.title || '').localeCompare(a.dataset.title || '');
      }

      return (a.dataset.title || '').localeCompare(b.dataset.title || '');
    });

    cards.forEach(function(card) {
      blogGrid.appendChild(card);
    });
  }

  function filterPosts() {
    sortCards();
    const cards = blogGrid.querySelectorAll('.blog-card-wrapper');
    let visibleCount = 0;

    cards.forEach(function(card) {
      const title = (card.dataset.title || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const excerpt = (card.dataset.excerpt || '').toLowerCase();
      const tags = (card.dataset.tags || '').split('|').map(tag => tag.toLowerCase()).filter(Boolean);

      const matchesSearch = currentSearchTerm === '' ||
        title.includes(currentSearchTerm) ||
        excerpt.includes(currentSearchTerm);

      const matchesCategory = currentCategory === 'all' ||
        currentCategory === 'all categories' ||
        category === currentCategory;

      const matchesTag = currentTag === 'all' ||
        currentTag === 'all tags' ||
        tags.includes(currentTag);

      if (matchesSearch && matchesCategory && matchesTag) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show/hide no results message
    if (visibleCount === 0) {
      noResults.classList.remove('hidden');
      blogGrid.classList.add('hidden');
    } else {
      noResults.classList.add('hidden');
      blogGrid.classList.remove('hidden');
    }

    // Hide pagination when filtering
    if (paginationContainer) {
      if (
        currentSearchTerm !== '' ||
        (currentCategory !== 'all' && currentCategory !== 'all categories') ||
        (currentTag !== 'all' && currentTag !== 'all tags')
      ) {
        paginationContainer.style.display = 'none';
      } else {
        paginationContainer.style.display = '';
      }
    }

    updateSelectActiveStates();
    renderActiveFilters();
  }

  // Debounce function for search input
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // Search input handler
  if (searchInput) {
    var debouncedFilter = debounce(function() {
      currentSearchTerm = searchInput.value.toLowerCase().trim();
      filterPosts();
    }, 200);

    searchInput.addEventListener('input', debouncedFilter);

    // Handle search clear (x button)
    searchInput.addEventListener('search', function() {
      if (searchInput.value === '') {
        currentSearchTerm = '';
        filterPosts();
      }
    });
  }

  // Category select handler - listen for webcoreui select change event
  if (typeof window !== 'undefined') {
    document.addEventListener('selectOnChange', function(event) {
      if (event.detail && event.detail.select === 'category-filter') {
        currentCategory = (event.detail.value || event.detail.name || 'all').toLowerCase();
        filterPosts();
      }

      if (event.detail && event.detail.select === 'tag-filter') {
        currentTag = (event.detail.value || event.detail.name || 'all').toLowerCase();
        filterPosts();
      }

      if (event.detail && event.detail.select === 'sort-filter') {
        currentSort = (event.detail.value || event.detail.name || 'newest').toLowerCase();
        filterPosts();
      }
    });
  }

  // Apply initial filters from query params
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('category');
    const initialTag = params.get('tag');
    const initialQuery = params.get('q');
    const initialSort = params.get('sort');

    if (initialCategory) {
      currentCategory = initialCategory.toLowerCase();
      setSelectUI('category-filter', initialCategory);
    }

    if (initialTag) {
      currentTag = initialTag.toLowerCase();
      setSelectUI('tag-filter', initialTag);
    }

    if (initialQuery && searchInput) {
      searchInput.value = initialQuery;
      currentSearchTerm = initialQuery.toLowerCase().trim();
    }

    if (initialSort) {
      currentSort = initialSort.toLowerCase();
      setSelectUI('sort-filter', initialSort);
    }

    if (initialCategory || initialTag || initialQuery || initialSort) {
      filterPosts();
    } else {
      updateSelectActiveStates();
    }
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', function() {
      currentSearchTerm = '';
      currentCategory = 'all';
      currentTag = 'all';
      currentSort = 'newest';

      if (searchInput) {
        searchInput.value = '';
      }

      setSelectUI('category-filter', 'all');
      setSelectUI('tag-filter', 'all');
      setSelectUI('sort-filter', 'newest');

      filterPosts();
    });
  }
})();
