(function() {
  'use strict';

  const searchInput = document.getElementById('blog-search');
  const categorySelect = document.querySelector('[data-id="w-select-category-filter"]');
  const blogGrid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  const paginationContainer = document.querySelector('.mt-12.flex.justify-center');

  let currentSearchTerm = '';
  let currentCategory = 'all';

  function filterPosts() {
    const cards = blogGrid.querySelectorAll('.blog-card-wrapper');
    let visibleCount = 0;

    cards.forEach(function(card) {
      const title = card.dataset.title || '';
      const category = card.dataset.category || '';
      const excerpt = card.dataset.excerpt || '';

      const matchesSearch = currentSearchTerm === '' ||
        title.includes(currentSearchTerm) ||
        excerpt.includes(currentSearchTerm);

      const matchesCategory = currentCategory === 'all' ||
        currentCategory === 'All Categories' ||
        category === currentCategory;

      if (matchesSearch && matchesCategory) {
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
      if (currentSearchTerm !== '' || (currentCategory !== 'all' && currentCategory !== 'All Categories')) {
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
        currentCategory = event.detail.value || event.detail.name || 'all';
        filterPosts();
      }
    });
  }
})();
