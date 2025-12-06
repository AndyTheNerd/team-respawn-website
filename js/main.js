/**
 * Main initialization and orchestration
 */

// Cached walkthrough data for sorting
let walkthroughsData = [];

/**
 * Gets the base path for data directory based on current page location
 * @returns {string} Base path to data directory
 */
function getDataBasePath() {
    const currentPath = window.location.pathname;
    // If we're in a subdirectory (blog/ or blog/posts/), go up one or two levels
    if (currentPath.includes('/blog/posts/')) {
        return '../../data/';
    } else if (currentPath.includes('/blog/')) {
        return '../data/';
    }
    return 'data/';
}

/**
 * Loads taglines from JSON and randomly selects one to update the header
 */
async function loadAndUpdateTagline() {
    try {
        const dataPath = getDataBasePath();
        const response = await fetch(`${dataPath}taglines.json`);
        
        if (!response.ok) {
            // Silently fail if taglines.json doesn't exist - use default tagline
            console.warn('Taglines file not found, using default tagline');
            return;
        }
        
        const taglines = await response.json();
        
        // Validate that taglines is an array
        if (!Array.isArray(taglines) || taglines.length === 0) {
            console.warn('Invalid taglines format, using default tagline');
            return;
        }
        
        // Select a random tagline
        const randomIndex = Math.floor(Math.random() * taglines.length);
        const selectedTagline = taglines[randomIndex];
        
        // Update the tagline element if it exists
        const taglineElement = document.getElementById('header-tagline');
        if (taglineElement && selectedTagline) {
            taglineElement.textContent = selectedTagline;
        }
    } catch (error) {
        // Silently fail if there's an error - use default tagline
        console.warn('Error loading taglines, using default tagline:', error);
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load all components
        await loadAllComponents({
            'header': 'header-container',
            'footer': 'footer-container',
            'side-panel': 'side-panel-container'
        });

        // Load and update tagline after header is loaded
        await loadAndUpdateTagline();

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
        case 'release-asc':
            return safeList.sort((a, b) => {
                const diff = getReleaseTimestamp(a) - getReleaseTimestamp(b);
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
    
    // Parse YYYY-MM-DD format explicitly for consistent sorting
    const dateStr = entry.releaseDate.trim();
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    
    if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateMatch[3], 10);
        
        // Create date in UTC to avoid timezone issues
        const date = new Date(Date.UTC(year, month, day));
        const timestamp = date.getTime();
        
        // Validate the date was created correctly
        if (!Number.isNaN(timestamp) && date.getUTCFullYear() === year && 
            date.getUTCMonth() === month && date.getUTCDate() === day) {
            return timestamp;
        }
    }
    
    // Fallback to Date.parse for other formats
    const parsed = Date.parse(dateStr);
    return Number.isNaN(parsed) ? 0 : parsed;
}

