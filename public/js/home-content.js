/**
 * Home content renderer
 * Hero, stats, and other sections are now static Astro components.
 * This function is kept for backwards-compatibility with main.js.
 */
function renderHomeContent(_allVideos) {
    // Sections removed — rendered as static Astro components.
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderHomeContent };
}
