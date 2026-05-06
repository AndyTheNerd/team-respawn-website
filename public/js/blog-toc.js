(function () {
  'use strict';

  var prose = document.querySelector('#main-content .prose');
  if (!prose) return;

  var headings = prose.querySelectorAll('h2');
  if (headings.length < 2) return;

  var mount = document.getElementById('blog-toc-mount');
  if (!mount) return;

  var rail = document.getElementById('blog-toc-rail');
  var railMount = document.getElementById('blog-toc-left-mount');
  var hasRail = !!(rail && railMount);

  var usedIds = {};

  function slugify(text) {
    var base =
      String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'section';
    var id = base;
    var n = 0;
    while (usedIds[id]) {
      n += 1;
      id = base + '-' + n;
    }
    usedIds[id] = true;
    return id;
  }

  var nav = document.createElement('nav');
  nav.className = 'blog-toc not-prose';
  nav.setAttribute('aria-label', 'In this article');

  var inner = document.createElement('div');
  inner.className = 'blog-toc__inner';

  var label = document.createElement('p');
  label.className = 'blog-toc__label';
  label.textContent = 'In this article';

  var ul = document.createElement('ul');
  ul.className = 'blog-toc__list';

  headings.forEach(function (h) {
    var text = h.textContent ? h.textContent.trim() : '';
    if (!text) return;

    var id = h.id || slugify(text);
    h.id = id;

    var li = document.createElement('li');
    li.className = 'blog-toc__item';
    var a = document.createElement('a');
    a.href = '#' + id;
    a.className = 'blog-toc__link';
    a.textContent = text;
    li.appendChild(a);
    ul.appendChild(li);
  });

  if (!ul.children.length) return;

  inner.appendChild(label);
  inner.appendChild(ul);
  nav.appendChild(inner);
  mount.appendChild(nav);

  if (hasRail) {
    railMount.appendChild(nav.cloneNode(true));
  }

  var headingEls = Array.prototype.slice.call(headings);

  function setActiveById(activeId) {
    document.querySelectorAll('nav.blog-toc a.blog-toc__link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var isActive = href === '#' + activeId;
      a.classList.toggle('blog-toc__link--active', isActive);
      if (isActive) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  function pickActiveHeadingId() {
    var offset = 100;
    var y = window.scrollY + offset;
    var activeId = headingEls[0].id;
    for (var i = 0; i < headingEls.length; i++) {
      var h = headingEls[i];
      var top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= y) activeId = h.id;
      else break;
    }
    return activeId;
  }

  function isTocPastViewport() {
    var m = document.getElementById('blog-toc-mount');
    if (!m) return false;
    return m.getBoundingClientRect().bottom < 40;
  }

  /** Fixed left rail only when it can sit fully left of #main-content (no clamp-overlap). */
  function hasRoomForRail() {
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(min-width: 1280px)').matches) {
      return false;
    }
    var main = document.getElementById('main-content');
    if (!main) return false;
    var rect = main.getBoundingClientRect();
    var w = rail.offsetWidth || 216;
    var gutter = 16;
    var minLeft = 12;
    var idealLeft = rect.left - w - gutter;
    return idealLeft >= minLeft;
  }

  function positionRail() {
    if (!hasRail || !rail.classList.contains('blog-toc-rail--visible')) return;
    var main = document.getElementById('main-content');
    if (!main) return;
    var rect = main.getBoundingClientRect();
    var w = rail.offsetWidth || 216;
    rail.style.left = Math.round(rect.left - w - 16) + 'px';
  }

  function syncRailVisibility() {
    if (!hasRail) return;
    var show = isTocPastViewport() && hasRoomForRail();
    rail.classList.toggle('blog-toc-rail--visible', show);
    rail.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) {
      positionRail();
    } else {
      rail.style.left = '';
    }
  }

  var ticking = false;
  function onScrollOrResize() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        ticking = false;
        setActiveById(pickActiveHeadingId());
        syncRailVisibility();
      });
      ticking = true;
    }
  }

  setActiveById(pickActiveHeadingId());

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('load', onScrollOrResize);

  if (hasRail) {
    var io = new IntersectionObserver(
      function () {
        syncRailVisibility();
      },
      { threshold: 0, root: null, rootMargin: '0px' }
    );
    io.observe(mount);
    onScrollOrResize();
  }
})();
