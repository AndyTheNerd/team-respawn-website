/**
 * Main initialization and orchestration
 */

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
            renderVideoGrid(data.walkthroughs, 'walkthroughs-content');
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

