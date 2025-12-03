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
            'side-panel': 'side-panel-container',
            'tab-navigation': 'tab-navigation-container'
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

        // Render walkthroughs
        if (data.walkthroughs && data.walkthroughs.length > 0) {
            renderVideoGrid(data.walkthroughs, 'walkthroughs-content');
        }

        // Render Halo Wars content
        if (data['halo-wars']) {
            const haloWarsContent = document.getElementById('halo-wars-content');
            if (haloWarsContent) {
                haloWarsContent.innerHTML = ''; // Clear any existing content
                
                // Render Halo Wars 2 section
                if (data['halo-wars']['halo-wars-2']) {
                    renderVideoSection(data['halo-wars']['halo-wars-2'], 'halo-wars-content');
                }
                
                // Render Halo Wars 1 section
                if (data['halo-wars']['halo-wars-1']) {
                    renderVideoSection(data['halo-wars']['halo-wars-1'], 'halo-wars-content');
                }
            }
        }

        // Render Age of Empires content
        if (data['age-of-empires']) {
            const aoeContent = document.getElementById('age-of-empires-content');
            if (aoeContent) {
                aoeContent.innerHTML = ''; // Clear any existing content
                
                // Render AoE II section
                if (data['age-of-empires']['aoe-2']) {
                    renderVideoSection(data['age-of-empires']['aoe-2'], 'age-of-empires-content');
                }
                
                // Render AoE IV section
                if (data['age-of-empires']['aoe-4']) {
                    renderVideoSection(data['age-of-empires']['aoe-4'], 'age-of-empires-content');
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

