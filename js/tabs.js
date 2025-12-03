/**
 * Tab switching logic
 */

/**
 * Tab configuration object
 */
const tabs = {
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
            tab.button.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');
            tab.button.classList.add('bg-gray-200', 'text-gray-900');
            tab.content.classList.remove('hidden');
            tab.summary.classList.remove('hidden');
            // Update ARIA attributes
            tab.button.setAttribute('aria-selected', 'true');
            tab.button.setAttribute('tabindex', '0');
        } else {
            tab.button.classList.remove('bg-gray-200', 'text-gray-900');
            tab.button.classList.add('bg-gray-700', 'hover:bg-gray-600', 'text-gray-200');
            tab.content.classList.add('hidden');
            tab.summary.classList.add('hidden');
            // Update ARIA attributes
            tab.button.setAttribute('aria-selected', 'false');
            tab.button.setAttribute('tabindex', '-1');
        }
    }
    
    // Announce tab change to screen readers
    const announcement = document.getElementById('tab-announcement');
    if (announcement && tabs[activeTabId]?.button) {
        announcement.textContent = `Switched to ${tabs[activeTabId].button.textContent.trim()} tab`;
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

    // Set the initial active tab
    switchTab('walkthroughs-tab');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { switchTab, initTabs, tabs };
}

