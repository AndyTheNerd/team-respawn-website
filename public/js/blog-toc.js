(function () {
  'use strict';

  var prose = document.querySelector('#main-content .prose');
  if (!prose) return;

  var headings = prose.querySelectorAll('h2');
  if (headings.length < 2) return;

  var mount = document.getElementById('blog-toc-mount');
  if (!mount) return;

  var usedIds = {};

  function slugify(text) {
    var base = String(text)
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
})();
