/**
 * Component loader using fetch() to inject HTML fragments
 */

/**
 * Gets the base path for components based on current page location
 * @returns {string} Base path to components directory
 */
function getComponentsBasePath() {
    const currentPath = window.location.pathname;
    // If we're in a subdirectory (blog/ or blog/posts/ or storehaus/), go up one or two levels
    if (currentPath.includes('/blog/posts/')) {
        return '../../components/';
    } else if (currentPath.includes('/blog/') || currentPath.includes('/storehaus/')) {
        return '../components/';
    }
    return 'components/';
}

/**
 * Validates component name to prevent path traversal attacks
 * @param {string} componentName - Component name to validate
 * @returns {boolean} True if valid
 */
function isValidComponentName(componentName) {
    // Only allow alphanumeric, hyphens, and underscores
    return /^[a-zA-Z0-9-_]+$/.test(componentName);
}

/**
 * Loads a component HTML file and injects it into the target element
 * @param {string} componentName - Name of the component file (without .html)
 * @param {string} targetElementId - ID of the element to inject the component into
 * @returns {Promise<void>}
 */
async function loadComponent(componentName, targetElementId) {
    try {
        // Validate component name to prevent path traversal
        if (!isValidComponentName(componentName)) {
            throw new Error(`Invalid component name: ${componentName}`);
        }

        const basePath = getComponentsBasePath();
        const response = await fetch(`${basePath}${componentName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${componentName}`);
        }
        
        const html = await response.text();
        const targetElement = document.getElementById(targetElementId);
        
        if (targetElement) {
            // Sanitize HTML from component files before inserting
            if (typeof DOMPurify !== 'undefined') {
                const sanitized = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: ['div', 'header', 'footer', 'aside', 'nav', 'a', 'button', 'img', 'svg', 'path', 'h1', 'h2', 'h3', 'p', 'span', 'i', 'ul', 'li'],
                    ALLOWED_ATTR: ['class', 'id', 'href', 'target', 'rel', 'aria-label', 'aria-hidden', 'aria-expanded', 'aria-controls', 'aria-selected', 'tabindex', 'role', 'type', 'src', 'alt', 'width', 'height', 'fill', 'stroke', 'viewBox', 'stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd', 'data-tab-id', 'data-tab-link'],
                    ALLOW_DATA_ATTR: true
                });
                targetElement.innerHTML = sanitized;
            } else {
                // Fallback: still sanitize basic XSS attempts
                // Remove script tags and event handlers
                const cleaned = html
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/javascript:/gi, '');
                targetElement.innerHTML = cleaned;
            }
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
