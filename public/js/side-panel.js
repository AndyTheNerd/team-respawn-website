/**
 * Side panel open/close functionality
 */

function initSidePanel() {
  const openPanelButtons = document.querySelectorAll('[data-open-panel]');
  const closePanelButton = document.getElementById('close-panel-button');
  const sidePanel = document.getElementById('side-panel');
  const overlay = document.getElementById('overlay');

  if (!openPanelButtons.length || !closePanelButton || !sidePanel || !overlay) {
    return;
  }

  let previousFocus = null;

  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    element.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    });
  }

  function openPanel() {
    previousFocus = document.activeElement;
    sidePanel.classList.add('open');
    overlay.classList.add('visible');
    sidePanel.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    openPanelButtons.forEach((button) => button.setAttribute('aria-expanded', 'true'));

    const firstFocusable = sidePanel.querySelector('a, button');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    trapFocus(sidePanel);
  }

  function closePanel() {
    sidePanel.classList.remove('open');
    overlay.classList.remove('visible');
    sidePanel.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    openPanelButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));

    if (previousFocus) {
      previousFocus.focus();
    }
  }

  openPanelButtons.forEach((button) => {
    button.addEventListener('click', openPanel);
  });

  closePanelButton.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
      closePanel();
    }
  });

  sidePanel.addEventListener('click', (e) => {
    const navLink = e.target.closest('a[href]');
    if (navLink && sidePanel.contains(navLink)) {
      closePanel();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidePanel);
} else {
  initSidePanel();
}
