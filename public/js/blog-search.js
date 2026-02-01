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
  const featuredToggle = document.getElementById('featured-toggle');

  let currentSearchTerm = '';
  let currentCategory = 'all';
  let currentTag = 'all';
  let currentSort = 'newest';
  let featuredEnabled = true; // Default to enabled

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

  // Filter pill removal handlers
  if (activeFilterList) {
    activeFilterList.addEventListener('click', function(event) {
      if (event.target.classList.contains('blog-pill-remove')) {
        const pill = event.target.closest('.blog-active-pill');
        if (!pill) return;
        
        const filterType = pill.dataset.filterType;
        const filterValue = pill.dataset.filterValue;
        
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
        
        filterPosts();
      }
    });
  }

  // Featured toggle handler
  if (featuredToggle) {
    featuredToggle.addEventListener('change', function() {
      featuredEnabled = this.checked;
      
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

    // Initialize data-featured-enabled attributes
    const blogCards = document.querySelectorAll('.blog-card-wrapper');
    blogCards.forEach(function(card) {
      card.dataset.featuredEnabled = 'true';
    });

    if (initialCategory || initialTag || initialQuery || initialSort) {
      filterPosts();
    } else {
      updateSelectActiveStates();
      renderActiveFilters(); // Show "None" text on initial load
    }
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', function() {
      currentSearchTerm = '';
      currentCategory = 'all';
      currentTag = 'all';
      currentSort = 'newest';
      featuredEnabled = true; // Reset to enabled

      if (searchInput) {
        searchInput.value = '';
      }

      if (featuredToggle) {
        featuredToggle.checked = true;
      }

      // Reset data-featured-enabled attribute on all blog cards
      const blogCards = document.querySelectorAll('.blog-card-wrapper');
      blogCards.forEach(function(card) {
        card.dataset.featuredEnabled = 'true';
      });

      setSelectUI('category-filter', 'all');
      setSelectUI('tag-filter', 'all');
      setSelectUI('sort-filter', 'newest');

      filterPosts();
    });
  }
})();
