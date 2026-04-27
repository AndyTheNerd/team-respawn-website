(function () {
  'use strict';

  if (window.__teamRespawnScrollTopInit) return;
  window.__teamRespawnScrollTopInit = true;

  function sync() {
    var show = window.scrollY > 300;
    document.querySelectorAll('[data-scroll-to-top]').forEach(function (btn) {
      if (show) {
        btn.classList.remove('opacity-0', 'pointer-events-none');
        btn.classList.add('opacity-100');
      } else {
        btn.classList.add('opacity-0', 'pointer-events-none');
        btn.classList.remove('opacity-100');
      }
    });
  }

  window.addEventListener('scroll', sync, { passive: true });

  document.addEventListener(
    'click',
    function (e) {
      var btn = e.target.closest('[data-scroll-to-top]');
      if (btn) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    true
  );

  sync();
})();
