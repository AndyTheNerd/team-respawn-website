const SCROLL_TOP_THRESHOLD_PX = 320;

/** Fixed “scroll to top” control (same behavior as the videos database page). */
export function initHw2ScrollToTop(): void {
  const btn = document.getElementById('hw2-scroll-top') as HTMLButtonElement | null;
  if (!btn) return;

  const updateVisibility = () => {
    btn.classList.toggle('is-visible', window.scrollY > SCROLL_TOP_THRESHOLD_PX);
  };

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}
