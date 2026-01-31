(function() {
  'use strict';

  const searchInput = document.getElementById('blog-search');
  const categorySelect = document.querySelector('[data-id="w-select-category-filter"]');
  const tagSelect = document.querySelector('[data-id="w-select-tag-filter"]');
  const blogGrid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  const paginationContainer = document.querySelector('.mt-12.flex.justify-center');

  let currentSearchTerm = '';
  let currentCategory = 'all';
  let currentTag = 'all';
  let currentSort = 'newest';

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
    }

    if (initialTag) {
      currentTag = initialTag.toLowerCase();
    }

    if (initialQuery && searchInput) {
      searchInput.value = initialQuery;
      currentSearchTerm = initialQuery.toLowerCase().trim();
    }

    if (initialSort) {
      currentSort = initialSort.toLowerCase();
    }

    if (initialCategory || initialTag || initialQuery || initialSort) {
      filterPosts();
    }
  }
})();
