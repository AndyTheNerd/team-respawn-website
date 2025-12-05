/**
 * Main initialization and orchestration
 */

// Cached walkthrough data for sorting
let walkthroughsData = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load all components
        await loadAllComponents({
            'header': 'header-container',
            'footer': 'footer-container',
            'side-panel': 'side-panel-container'
        });

        // Initialize side panel after components are loaded
        initSidePanel();

        // Initialize tabs after components are loaded
        initTabs();

        // Load and render video data
        await loadAndRenderVideos();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

/**
 * Loads video data from JSON and renders it
 */
async function loadAndRenderVideos() {
    try {
        const response = await fetch('data/videos.json');
        if (!response.ok) {
            throw new Error('Failed to load video data');
        }
        const data = await response.json();

        // Validate that data is an object
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid video data format');
        }

        // Render home content with all video data
        if (typeof renderHomeContent === 'function') {
            renderHomeContent(data);
        }

        // Render walkthroughs
        if (data.walkthroughs && Array.isArray(data.walkthroughs) && data.walkthroughs.length > 0) {
            initWalkthroughSorting(data.walkthroughs);
        }

        // Render Halo Wars content
        if (data['halo-wars'] && typeof data['halo-wars'] === 'object') {
            const haloWarsContent = document.getElementById('halo-wars-content');
            if (haloWarsContent) {
                haloWarsContent.innerHTML = ''; // Clear any existing content
                
                // Render Halo Wars 2 section
                if (data['halo-wars']['halo-wars-2'] && typeof data['halo-wars']['halo-wars-2'] === 'object') {
                    renderVideoSection(data['halo-wars']['halo-wars-2'], 'halo-wars-content', 'halo-wars-2');
                }
                
                // Render Halo Wars 1 section
                if (data['halo-wars']['halo-wars-1'] && typeof data['halo-wars']['halo-wars-1'] === 'object') {
                    renderVideoSection(data['halo-wars']['halo-wars-1'], 'halo-wars-content', 'halo-wars-1');
                }
            }
        }

        // Render Age of Empires content
        if (data['age-of-empires'] && typeof data['age-of-empires'] === 'object') {
            const aoeContent = document.getElementById('age-of-empires-content');
            if (aoeContent) {
                aoeContent.innerHTML = ''; // Clear any existing content

                // Render AoE IV section
                if (data['age-of-empires']['aoe-4'] && typeof data['age-of-empires']['aoe-4'] === 'object') {
                    renderVideoSection(data['age-of-empires']['aoe-4'], 'age-of-empires-content', 'aoe-4');
                }
                
                // Render AoE II section
                if (data['age-of-empires']['aoe-2'] && typeof data['age-of-empires']['aoe-2'] === 'object') {
                    renderVideoSection(data['age-of-empires']['aoe-2'], 'age-of-empires-content', 'aoe-2');
                }
            }
        }

        // Render Age of Mythology content
        if (data['age-of-mythology'] && Array.isArray(data['age-of-mythology'])) {
            renderVideoGrid(data['age-of-mythology'], 'age-of-mythology-content');
        }
    } catch (error) {
        console.error('Error loading and rendering videos:', error);
    }
}

/**
 * Initializes walkthrough sorting controls and renders initial grid
 * @param {Array} walkthroughs - Walkthrough data with metadata
 */
function initWalkthroughSorting(walkthroughs) {
    walkthroughsData = Array.isArray(walkthroughs) ? [...walkthroughs] : [];
    const sortSelect = document.getElementById('walkthroughs-sort-select');
    const gridId = 'walkthroughs-grid';

    if (!sortSelect) {
        // Fallback: render without sorting controls
        renderVideoGrid(walkthroughsData, gridId);
        return;
    }

    const defaultSort = 'alpha';
    sortSelect.value = defaultSort;

    const renderSorted = () => {
        const sorted = getSortedWalkthroughs(sortSelect.value || defaultSort);
        renderVideoGrid(sorted, gridId);
    };

    sortSelect.addEventListener('change', renderSorted);
    renderSorted();
}

/**
 * Returns a sorted copy of walkthrough data based on the selected sort option
 * @param {string} sortKey - Sort option key
 * @returns {Array} Sorted walkthrough array
 */
function getSortedWalkthroughs(sortKey) {
    const key = sortKey || 'alpha';
    const safeList = [...walkthroughsData];

    const compareTitlesAsc = (a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
    const compareTitlesDesc = (a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' });

    switch (key) {
        case 'reverse-alpha':
            return safeList.sort(compareTitlesDesc);
        case 'release-desc':
            return safeList.sort((a, b) => {
                const diff = getReleaseTimestamp(b) - getReleaseTimestamp(a);
                return diff !== 0 ? diff : compareTitlesAsc(a, b);
            });
        case 'series':
            return safeList.sort((a, b) => {
                const seriesCompare = (a.series || '').localeCompare(b.series || '', undefined, { sensitivity: 'base' });
                return seriesCompare !== 0 ? seriesCompare : compareTitlesAsc(a, b);
            });
        case 'alpha':
        default:
            return safeList.sort(compareTitlesAsc);
    }
}

/**
 * Safely parses a release date string into a timestamp
 * @param {Object} entry - Walkthrough entry with releaseDate
 * @returns {number} Timestamp or 0 if invalid
 */
function getReleaseTimestamp(entry) {
    if (!entry || !entry.releaseDate) return 0;
    const parsed = Date.parse(entry.releaseDate);
    return Number.isNaN(parsed) ? 0 : parsed;
}

