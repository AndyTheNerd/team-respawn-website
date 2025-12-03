/**
 * Component loader using fetch() to inject HTML fragments
 */

/**
 * Gets the base path for components based on current page location
 * @returns {string} Base path to components directory
 */
function getComponentsBasePath() {
    const currentPath = window.location.pathname;
    // If we're in a subdirectory (blog/ or blog/posts/), go up one or two levels
    if (currentPath.includes('/blog/posts/')) {
        return '../../components/';
    } else if (currentPath.includes('/blog/')) {
        return '../components/';
    }
    return 'components/';
}

/**
 * Loads a component HTML file and injects it into the target element
 * @param {string} componentName - Name of the component file (without .html)
 * @param {string} targetElementId - ID of the element to inject the component into
 * @returns {Promise<void>}
 */
async function loadComponent(componentName, targetElementId) {
    try {
        const basePath = getComponentsBasePath();
        const response = await fetch(`${basePath}${componentName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${componentName}`);
        }
        const html = await response.text();
        const targetElement = document.getElementById(targetElementId);
        if (targetElement) {
            targetElement.innerHTML = html;
        } else {
            console.error(`Target element not found: ${targetElementId}`);
        }
    } catch (error) {
        console.error(`Error loading component ${componentName}:`, error);
    }
}

/**
 * Loads all components on page load
 * @param {Object} componentMap - Object mapping component names to target element IDs
 */
async function loadAllComponents(componentMap) {
    const loadPromises = Object.entries(componentMap).map(([componentName, targetId]) => 
        loadComponent(componentName, targetId)
    );
    await Promise.all(loadPromises);
    
    // After components are loaded, load social icons into their containers
    await loadComponent('social-icons', 'header-social-icons');
    await loadComponent('social-icons', 'sidebar-social-icons');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadComponent, loadAllComponents };
}

