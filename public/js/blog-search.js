(function() {
  'use strict';

  const searchInput = document.getElementById('blog-search');
  const categorySelect = document.querySelector('[data-id="w-select-category-filter"]');
  const tagSelect = document.querySelector('[data-id="w-select-tag-filter"]');
  const sortSelect = document.querySelector('[data-id="w-select-sort-filter"]');
  const blogGrid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  const paginationNav = document.getElementById('blog-pagination');
  const paginationControls = document.getElementById('pagination-controls');
  const activeFilters = document.getElementById('blog-active-filters');
  const activeFilterList = document.getElementById('blog-active-filter-list');
  const clearFiltersButton = document.getElementById('blog-clear-filters');
  const featuredToggle = document.getElementById('featured-toggle');

  let currentSearchTerm = '';
  let currentCategory = 'all';
  let currentTag = 'all';
  let currentSort = 'newest';
  let featuredEnabled = true; // Default to enabled
  let currentPage = 1;
  const pageSize = window.blogPageSize || 12;

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
      filters.push({ 
        label: `Search: ${searchValue}`, 
        type: 'search',
        value: searchValue 
      });
    }

    if (isActiveCategory()) {
      filters.push({ 
        label: `Category: ${getOptionLabel('category-filter', currentCategory)}`, 
        type: 'category',
        value: currentCategory 
      });
    }

    if (isActiveTag()) {
      filters.push({ 
        label: `Tag: ${getOptionLabel('tag-filter', currentTag)}`, 
        type: 'tag',
        value: currentTag 
      });
    }

    if (isActiveSort()) {
      filters.push({ 
        label: `Sort: ${getOptionLabel('sort-filter', currentSort)}`, 
        type: 'sort',
        value: currentSort 
      });
    }

    activeFilterList.innerHTML = '';

    if (filters.length === 0) {
      // Show "None" text when no filters are active
      const noneText = document.createElement('span');
      noneText.className = 'blog-active-none';
      noneText.textContent = 'None';
      activeFilterList.appendChild(noneText);
    } else {
      // Show filter pills
      filters.forEach(filter => {
        const pill = document.createElement('span');
        pill.className = 'blog-active-pill';
        pill.dataset.filterType = filter.type;
        pill.dataset.filterValue = filter.value;
        
        const pillContent = document.createElement('span');
        pillContent.className = 'blog-pill-content';
        pillContent.textContent = filter.label;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'blog-pill-remove';
        removeButton.innerHTML = '×';
        removeButton.setAttribute('aria-label', `Remove ${filter.type} filter`);
        removeButton.type = 'button';
        
        pill.appendChild(pillContent);
        pill.appendChild(removeButton);
        activeFilterList.appendChild(pill);
      });
    }

    // Always show active filters section now that we have the featured toggle
    activeFilters.classList.remove('hidden');
  }

  function sortCards() {
    const cards = Array.from(blogGrid.querySelectorAll('.blog-card-wrapper'));

    cards.sort(function(a, b) {
      // Only prioritize featured posts if the toggle is enabled
      if (featuredEnabled) {
        const aFeatured = a.dataset.featured === 'true';
        const bFeatured = b.dataset.featured === 'true';
        
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
      }
      
      // Then apply the selected sort order
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

  function getFilteredCards() {
    sortCards();
    const cards = Array.from(blogGrid.querySelectorAll('.blog-card-wrapper'));

    return cards.filter(function(card) {
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

      return matchesSearch && matchesCategory && matchesTag;
    });
  }

  function renderPagination(totalItems) {
    if (!paginationControls) return;

    const totalPages = Math.ceil(totalItems / pageSize);
    paginationControls.innerHTML = '';

    if (totalPages <= 1) {
      if (paginationNav) paginationNav.style.display = 'none';
      return;
    }

    if (paginationNav) paginationNav.style.display = '';

    // Previous button
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700';
      prevBtn.textContent = 'Previous';
      prevBtn.setAttribute('aria-label', 'Previous page');
      prevBtn.addEventListener('click', function() {
        goToPage(currentPage - 1);
      });
      paginationControls.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = i === currentPage
        ? 'px-3 py-2 rounded-lg border bg-cyan-500 text-white border-cyan-400'
        : 'px-3 py-2 rounded-lg border bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700';
      pageBtn.textContent = i;
      if (i === currentPage) {
        pageBtn.setAttribute('aria-current', 'page');
      }
      pageBtn.addEventListener('click', function() {
        goToPage(i);
      });
      paginationControls.appendChild(pageBtn);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'px-3 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700';
      nextBtn.textContent = 'Next';
      nextBtn.setAttribute('aria-label', 'Next page');
      nextBtn.addEventListener('click', function() {
        goToPage(currentPage + 1);
      });
      paginationControls.appendChild(nextBtn);
    }
  }

  function goToPage(page) {
    currentPage = page;
    filterPosts();
    // Scroll to top of blog grid
    if (blogGrid) {
      blogGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function filterPosts() {
    const filteredCards = getFilteredCards();
    const totalFiltered = filteredCards.length;

    // Calculate pagination
    const totalPages = Math.ceil(totalFiltered / pageSize);
    // Reset to page 1 if current page is out of bounds
    if (currentPage > totalPages) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Hide all cards first
    const allCards = blogGrid.querySelectorAll('.blog-card-wrapper');
    allCards.forEach(function(card) {
      card.style.display = 'none';
    });

    // Show only cards for current page
    filteredCards.slice(startIndex, endIndex).forEach(function(card) {
      card.style.display = '';
    });

    // Show/hide no results message
    if (totalFiltered === 0) {
      noResults.classList.remove('hidden');
      blogGrid.classList.add('hidden');
    } else {
      noResults.classList.add('hidden');
      blogGrid.classList.remove('hidden');
    }

    // Render pagination
    renderPagination(totalFiltered);

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

  // Filter pill removal handlers
  if (activeFilterList) {
    activeFilterList.addEventListener('click', function(event) {
      if (event.target.classList.contains('blog-pill-remove')) {
        const pill = event.target.closest('.blog-active-pill');
        if (!pill) return;

        const filterType = pill.dataset.filterType;

        switch(filterType) {
          case 'search':
            if (searchInput) {
              searchInput.value = '';
              currentSearchTerm = '';
            }
            break;
          case 'category':
            currentCategory = 'all';
            setSelectUI('category-filter', 'all');
            break;
          case 'tag':
            currentTag = 'all';
            setSelectUI('tag-filter', 'all');
            break;
          case 'sort':
            currentSort = 'newest';
            setSelectUI('sort-filter', 'newest');
            break;
        }

        currentPage = 1; // Reset to first page
        filterPosts();
      }
    });
  }

  // Featured toggle handler
  if (featuredToggle) {
    featuredToggle.addEventListener('change', function() {
      featuredEnabled = this.checked;
      currentPage = 1; // Reset to first page

      // Update data-featured-enabled attribute on all blog cards
      const blogCards = document.querySelectorAll('.blog-card-wrapper');
      blogCards.forEach(function(card) {
        card.dataset.featuredEnabled = featuredEnabled ? 'true' : 'false';
      });

      filterPosts();
    });
  }

  // Search input handler
  if (searchInput) {
    var debouncedFilter = debounce(function() {
      currentSearchTerm = searchInput.value.toLowerCase().trim();
      currentPage = 1; // Reset to first page on search
      filterPosts();
    }, 200);

    searchInput.addEventListener('input', debouncedFilter);

    // Handle search clear (x button)
    searchInput.addEventListener('search', function() {
      if (searchInput.value === '') {
        currentSearchTerm = '';
        currentPage = 1;
        filterPosts();
      }
    });
  }

  // Category select handler - listen for webcoreui select change event
  if (typeof window !== 'undefined') {
    document.addEventListener('selectOnChange', function(event) {
      if (event.detail && event.detail.select === 'category-filter') {
        currentCategory = (event.detail.value || event.detail.name || 'all').toLowerCase();
        currentPage = 1; // Reset to first page on filter change
        filterPosts();
      }

      if (event.detail && event.detail.select === 'tag-filter') {
        currentTag = (event.detail.value || event.detail.name || 'all').toLowerCase();
        currentPage = 1; // Reset to first page on filter change
        filterPosts();
      }

      if (event.detail && event.detail.select === 'sort-filter') {
        currentSort = (event.detail.value || event.detail.name || 'newest').toLowerCase();
        currentPage = 1; // Reset to first page on sort change
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

    // Initialize data-featured-enabled attributes
    const blogCards = document.querySelectorAll('.blog-card-wrapper');
    blogCards.forEach(function(card) {
      card.dataset.featuredEnabled = 'true';
    });

    // Always call filterPosts on init to set up pagination
    filterPosts();
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', function() {
      currentSearchTerm = '';
      currentCategory = 'all';
      currentTag = 'all';
      currentSort = 'newest';
      featuredEnabled = false; // Turn off featured prioritization
      currentPage = 1; // Reset to first page

      if (searchInput) {
        searchInput.value = '';
      }

      if (featuredToggle) {
        featuredToggle.checked = false;
      }

      // Update data-featured-enabled attribute on all blog cards
      const blogCards = document.querySelectorAll('.blog-card-wrapper');
      blogCards.forEach(function(card) {
        card.dataset.featuredEnabled = 'false';
      });

      setSelectUI('category-filter', 'all');
      setSelectUI('tag-filter', 'all');
      setSelectUI('sort-filter', 'newest');

      filterPosts();
    });
  }
})();
