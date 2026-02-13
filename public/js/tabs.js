/**
 * Tab switching logic
 */

/**
 * Tab configuration object
 */
const tabs = {
    'home-tab': {
        button: null,
        content: null,
        summary: null
    },
    'walkthroughs-tab': {
        button: null,
        content: null,
        summary: null
    },
    'halo-wars-tab': {
        button: null,
        content: null,
        summary: null
    },
    'age-of-empires-tab': {
        button: null,
        content: null,
        summary: null
    },
    'age-of-mythology-tab': {
        button: null,
        content: null,
        summary: null
    },
    'other-projects-tab': {
        button: null,
        content: null,
        summary: null
    }
};

/**
 * Switches to the specified tab
 * @param {string} activeTabId - ID of the tab to activate
 */
function switchTab(activeTabId) {
    // Initialize tab elements if not already done
    if (!tabs[activeTabId]?.button) {
        for (const id in tabs) {
            tabs[id].button = document.getElementById(id);
            tabs[id].content = document.getElementById(id.replace('-tab', '-content'));
            tabs[id].summary = document.getElementById(id.replace('-tab', '-summary'));
        }
    }

    for (const id in tabs) {
        const tab = tabs[id];
        if (!tab.button || !tab.content) {
            continue;
        }

        const isTabButton = tab.button && tab.button.getAttribute('role') === 'tab';

        if (id === activeTabId) {
            if (isTabButton) {
                tab.button.classList.remove('tab-nav-inactive');
                tab.button.classList.add('tab-nav-active');
                // Add nav-link-active for visual indicator on header nav
                tab.button.classList.add('nav-link-active');
                // Update ARIA attributes
                tab.button.setAttribute('aria-selected', 'true');
                tab.button.setAttribute('tabindex', '0');
            }
            tab.content.classList.remove('hidden');
            if (tab.summary) tab.summary.classList.remove('hidden');
        } else {
            if (isTabButton) {
                tab.button.classList.remove('tab-nav-active');
                tab.button.classList.add('tab-nav-inactive');
                // Remove nav-link-active from inactive tabs
                tab.button.classList.remove('nav-link-active');
                // Update ARIA attributes
                tab.button.setAttribute('aria-selected', 'false');
                tab.button.setAttribute('tabindex', '-1');
            }
            tab.content.classList.add('hidden');
            if (tab.summary) tab.summary.classList.add('hidden');
        }
    }

    // Control Twitch embed visibility - only show on home tab
    const twitchContainer = document.getElementById('twitch-embed-container');
    if (twitchContainer) {
        if (activeTabId === 'home-tab') {
            // Show Twitch embed - remove hidden class and show with transition
            twitchContainer.classList.remove('hidden');
            // Small delay to ensure display change happens before transition
            requestAnimationFrame(() => {
                twitchContainer.classList.remove('opacity-0', 'invisible', '-translate-y-2', 'pointer-events-none');
                twitchContainer.classList.add('opacity-100', 'visible', 'translate-y-0');
            });
            // Restore collapse state when switching to home tab
            restoreTwitchCollapseState();
        } else {
            // Hide Twitch embed - remove from layout flow immediately (no blank space)
            twitchContainer.classList.remove('opacity-100', 'visible', 'translate-y-0');
            twitchContainer.classList.add('hidden', 'opacity-0', 'invisible', '-translate-y-2', 'pointer-events-none');
        }
    }

    // Control home-only content visibility (e.g., Storehaus CTA on home page)
    const homeFeaturedContent = document.getElementById('home-featured-content');
    if (homeFeaturedContent) {
        if (activeTabId === 'home-tab') {
            homeFeaturedContent.classList.remove('hidden');
        } else {
            homeFeaturedContent.classList.add('hidden');
        }
    }
    
    // Announce tab change to screen readers
    const announcement = document.getElementById('tab-announcement');
    if (announcement && tabs[activeTabId]?.button) {
        announcement.textContent = `Switched to ${tabs[activeTabId].button.textContent.trim()} tab`;
    }

    // Update side panel active tab indicator if function exists
    if (typeof updateSidePanelActiveTab === 'function') {
        updateSidePanelActiveTab(activeTabId);
    }
    
    // Update URL hash for bookmarking and back/forward navigation (only on home page)
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHomePage) {
        const tabToHashMap = {
            'home-tab': '',
            'walkthroughs-tab': 'walkthroughs',
            'halo-wars-tab': 'halo-wars',
            'age-of-empires-tab': 'age-of-empires',
            'age-of-mythology-tab': 'age-of-mythology',
            'other-projects-tab': 'other-projects'
        };
        
        const hash = tabToHashMap[activeTabId] || '';
        // Use replaceState to avoid adding to browser history
        if (hash) {
            window.history.replaceState(null, '', `/#${hash}`);
        } else {
            window.history.replaceState(null, '', '/');
        }
    }
}

/**
 * Toggles the Twitch embed collapse state
 */
function toggleTwitchCollapse() {
    const twitchContent = document.getElementById('twitch-embed-content');
    const collapseToggle = document.getElementById('twitch-collapse-toggle');
    const collapseIcon = document.getElementById('twitch-collapse-icon');
    
    if (!twitchContent || !collapseToggle || !collapseIcon) {
        return;
    }
    
    const isExpanded = twitchContent.classList.contains('twitch-content-expanded');
    
    if (isExpanded) {
        // Collapse
        twitchContent.classList.remove('twitch-content-expanded');
        twitchContent.classList.add('twitch-content-collapsed');
        collapseIcon.classList.remove('fa-chevron-up');
        collapseIcon.classList.add('fa-chevron-down');
        collapseToggle.setAttribute('aria-expanded', 'false');
        localStorage.setItem('twitchEmbedCollapsed', 'true');
    } else {
        // Expand
        twitchContent.classList.remove('twitch-content-collapsed');
        twitchContent.classList.add('twitch-content-expanded');
        collapseIcon.classList.remove('fa-chevron-down');
        collapseIcon.classList.add('fa-chevron-up');
        collapseToggle.setAttribute('aria-expanded', 'true');
        localStorage.setItem('twitchEmbedCollapsed', 'false');
    }
}

/**
 * Restores the Twitch embed collapse state from localStorage
 */
function restoreTwitchCollapseState() {
    const twitchContent = document.getElementById('twitch-embed-content');
    const collapseToggle = document.getElementById('twitch-collapse-toggle');
    const collapseIcon = document.getElementById('twitch-collapse-icon');
    
    if (!twitchContent || !collapseToggle || !collapseIcon) {
        return;
    }
    
    const savedCollapsePreference = localStorage.getItem('twitchEmbedCollapsed');
    const isCollapsed = savedCollapsePreference !== 'false';
    
    if (isCollapsed) {
        twitchContent.classList.remove('twitch-content-expanded');
        twitchContent.classList.add('twitch-content-collapsed');
        collapseIcon.classList.remove('fa-chevron-up');
        collapseIcon.classList.add('fa-chevron-down');
        collapseToggle.setAttribute('aria-expanded', 'false');
    } else {
        twitchContent.classList.remove('twitch-content-collapsed');
        twitchContent.classList.add('twitch-content-expanded');
        collapseIcon.classList.remove('fa-chevron-down');
        collapseIcon.classList.add('fa-chevron-up');
        collapseToggle.setAttribute('aria-expanded', 'true');
    }
}

/**
 * Converts tab buttons to links when not on the home page
 */
function convertTabsToLinks() {
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    
    if (!isHomePage) {
        // Find all buttons with data-tab-link attribute (more reliable than using tabs object)
        const tabButtons = document.querySelectorAll('button[data-tab-link]');
        
        tabButtons.forEach(button => {
            const link = button.getAttribute('data-tab-link');
            if (!link) return;
            
            // Get button ID BEFORE replacing (important!)
            const buttonId = button.id;
            
            const classes = button.className;
            const ariaLabel = button.getAttribute('aria-label');
            const role = button.getAttribute('role');
            const tabindex = button.getAttribute('tabindex');
            
            // Create a link element
            const linkElement = document.createElement('a');
            linkElement.href = link;
            linkElement.id = buttonId; // Preserve the ID
            linkElement.className = classes;
            if (ariaLabel) linkElement.setAttribute('aria-label', ariaLabel);
            if (role) linkElement.setAttribute('role', role);
            if (tabindex) linkElement.setAttribute('tabindex', tabindex);
            linkElement.innerHTML = button.innerHTML;
            
            // Replace button with link
            button.parentNode.replaceChild(linkElement, button);
            
            // Update tabs object if the button ID exists in it
            if (buttonId && tabs[buttonId]) {
                tabs[buttonId].button = linkElement;
            }
        });
    }
}

/**
 * Handles hash-based navigation to switch tabs
 */
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the #
    if (!hash) return;
    
    // Map hash values to tab IDs
    const hashToTabMap = {
        'walkthroughs': 'walkthroughs-tab',
        'halo-wars': 'halo-wars-tab',
        'age-of-empires': 'age-of-empires-tab',
        'age-of-mythology': 'age-of-mythology-tab',
        'other-projects': 'other-projects-tab'
    };
    
    const tabId = hashToTabMap[hash];
    if (tabId && tabs[tabId] && tabs[tabId].button && tabs[tabId].content) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            switchTab(tabId);
        }, 100);
    }
}

/**
 * Initializes tab event listeners
 */
function initTabs() {
    // Initialize tab elements
    for (const id in tabs) {
        tabs[id].button = document.getElementById(id);
        tabs[id].content = document.getElementById(id.replace('-tab', '-content'));
        tabs[id].summary = document.getElementById(id.replace('-tab', '-summary'));
    }

    // Convert tabs to links if not on home page
    convertTabsToLinks();

    // Attach event listeners to all tab buttons (only on home page)
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHomePage) {
        for (const id in tabs) {
            if (tabs[id].button && tabs[id].button.tagName === 'BUTTON') {
                tabs[id].button.addEventListener('click', () => {
                    switchTab(id);
                });
            }
        }
    }

    // Add keyboard navigation for visible tab buttons
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
        tabList.addEventListener('keydown', (e) => {
            const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]'));
            const tabIds = tabButtons.map((button) => button.id).filter(Boolean);
            const currentIndex = tabButtons.findIndex((button) => button === document.activeElement);

            if (tabIds.length === 0 || currentIndex === -1) {
                return;
            }

            let nextIndex = currentIndex;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabIds.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                nextIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                nextIndex = tabIds.length - 1;
            } else {
                return; // Not a navigation key
            }

            const nextTabId = tabIds[nextIndex];
            const nextButton = document.getElementById(nextTabId);
            if (nextButton) {
                nextButton.focus();
            }
            switchTab(nextTabId);
        });
    }

    // Initialize Twitch collapse functionality
    const collapseToggle = document.getElementById('twitch-collapse-toggle');
    if (collapseToggle) {
        collapseToggle.addEventListener('click', toggleTwitchCollapse);
    }
    
    // Restore collapse state from localStorage
    restoreTwitchCollapseState();

    // Handle hash navigation first, then set default tab
    const hash = window.location.hash.substring(1);
    const hashToTabMap = {
        'walkthroughs': 'walkthroughs-tab',
        'halo-wars': 'halo-wars-tab',
        'age-of-empires': 'age-of-empires-tab',
        'age-of-mythology': 'age-of-mythology-tab',
        'other-projects': 'other-projects-tab'
    };
    
    const initialTabId = hash && hashToTabMap[hash] ? hashToTabMap[hash] : 'home-tab';
    
    // Set the initial active tab
    switchTab(initialTabId);
    
    // Update side panel active state on initialization if function exists
    if (typeof updateSidePanelActiveTab === 'function') {
        updateSidePanelActiveTab(initialTabId);
    }
    
    // Listen for hash changes (for browser back/forward)
    window.addEventListener('hashchange', () => {
        handleHashNavigation();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { switchTab, initTabs, tabs, toggleTwitchCollapse, restoreTwitchCollapseState, convertTabsToLinks };
}

// Make functions available globally for use on other pages
window.switchTab = switchTab;
window.convertTabsToLinks = convertTabsToLinks;

// Initialize tabs when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
} else {
    initTabs();
}
