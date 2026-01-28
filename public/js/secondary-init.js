/**
 * Initialization for non-home pages that use shared navigation components.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initSidePanel === 'function') {
        initSidePanel();
    }
    if (typeof initTabs === 'function') {
        initTabs();
    }
});
