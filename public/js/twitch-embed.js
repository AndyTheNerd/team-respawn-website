/**
 * Twitch embed collapse/expand on the homepage.
 */

function toggleTwitchCollapse() {
  const twitchContent = document.getElementById('twitch-embed-content');
  const collapseToggle = document.getElementById('twitch-collapse-toggle');
  const collapseIcon = document.getElementById('twitch-collapse-icon');

  if (!twitchContent || !collapseToggle || !collapseIcon) {
    return;
  }

  const isExpanded = twitchContent.classList.contains('twitch-content-expanded');

  if (isExpanded) {
    twitchContent.classList.remove('twitch-content-expanded');
    twitchContent.classList.add('twitch-content-collapsed');
    collapseIcon.classList.remove('fa-chevron-up');
    collapseIcon.classList.add('fa-chevron-down');
    collapseToggle.setAttribute('aria-expanded', 'false');
    localStorage.setItem('twitchEmbedCollapsed', 'true');
  } else {
    twitchContent.classList.remove('twitch-content-collapsed');
    twitchContent.classList.add('twitch-content-expanded');
    collapseIcon.classList.remove('fa-chevron-down');
    collapseIcon.classList.add('fa-chevron-up');
    collapseToggle.setAttribute('aria-expanded', 'true');
    localStorage.setItem('twitchEmbedCollapsed', 'false');
  }
}

function restoreTwitchCollapseState() {
  const twitchContent = document.getElementById('twitch-embed-content');
  const collapseToggle = document.getElementById('twitch-collapse-toggle');
  const collapseIcon = document.getElementById('twitch-collapse-icon');

  if (!twitchContent || !collapseToggle || !collapseIcon) {
    return;
  }

  const isCollapsed = localStorage.getItem('twitchEmbedCollapsed') === 'true';

  if (isCollapsed) {
    twitchContent.classList.remove('twitch-content-expanded');
    twitchContent.classList.add('twitch-content-collapsed');
    collapseIcon.classList.remove('fa-chevron-up');
    collapseIcon.classList.add('fa-chevron-down');
    collapseToggle.setAttribute('aria-expanded', 'false');
  } else {
    twitchContent.classList.remove('twitch-content-collapsed');
    twitchContent.classList.add('twitch-content-expanded');
    collapseIcon.classList.remove('fa-chevron-down');
    collapseIcon.classList.add('fa-chevron-up');
    collapseToggle.setAttribute('aria-expanded', 'true');
  }
}

function initTwitchEmbed() {
  const collapseToggle = document.getElementById('twitch-collapse-toggle');
  if (collapseToggle) {
    collapseToggle.addEventListener('click', toggleTwitchCollapse);
    restoreTwitchCollapseState();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTwitchEmbed);
} else {
  initTwitchEmbed();
}
