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
        if (!tab.button || !tab.content || !tab.summary) {
            continue;
        }

        if (id === activeTabId) {
            tab.button.classList.remove('tab-nav-inactive');
            tab.button.classList.add('tab-nav-active');
            tab.content.classList.remove('hidden');
            tab.summary.classList.remove('hidden');
            // Update ARIA attributes
            tab.button.setAttribute('aria-selected', 'true');
            tab.button.setAttribute('tabindex', '0');
        } else {
            tab.button.classList.remove('tab-nav-active');
            tab.button.classList.add('tab-nav-inactive');
            tab.content.classList.add('hidden');
            tab.summary.classList.add('hidden');
            // Update ARIA attributes
            tab.button.setAttribute('aria-selected', 'false');
            tab.button.setAttribute('tabindex', '-1');
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
    
    // Announce tab change to screen readers
    const announcement = document.getElementById('tab-announcement');
    if (announcement && tabs[activeTabId]?.button) {
        announcement.textContent = `Switched to ${tabs[activeTabId].button.textContent.trim()} tab`;
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
    
    const isCollapsed = localStorage.getItem('twitchEmbedCollapsed') === 'true';
    
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
 * Initializes tab event listeners
 */
function initTabs() {
    // Initialize tab elements
    for (const id in tabs) {
        tabs[id].button = document.getElementById(id);
        tabs[id].content = document.getElementById(id.replace('-tab', '-content'));
        tabs[id].summary = document.getElementById(id.replace('-tab', '-summary'));
    }

    // Attach event listeners to all tab buttons
    for (const id in tabs) {
        if (tabs[id].button) {
            tabs[id].button.addEventListener('click', () => {
                switchTab(id);
            });
        }
    }

    // Add keyboard navigation
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
        tabList.addEventListener('keydown', (e) => {
            const tabsArray = Object.keys(tabs);
            const currentIndex = tabsArray.findIndex(id => tabs[id].button === document.activeElement);
            
            let nextIndex = currentIndex;
            
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabsArray.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                nextIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                nextIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                nextIndex = tabsArray.length - 1;
            } else {
                return; // Not a navigation key
            }
            
            tabs[tabsArray[nextIndex]].button.focus();
            switchTab(tabsArray[nextIndex]);
        });
    }

    // Initialize Twitch collapse functionality
    const collapseToggle = document.getElementById('twitch-collapse-toggle');
    if (collapseToggle) {
        collapseToggle.addEventListener('click', toggleTwitchCollapse);
    }
    
    // Restore collapse state from localStorage
    restoreTwitchCollapseState();

    // Set the initial active tab
    switchTab('home-tab');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { switchTab, initTabs, tabs, toggleTwitchCollapse, restoreTwitchCollapseState };
}

