/**
 * Side panel open/close functionality
 */

/**
 * Initializes side panel event listeners
 */
function initSidePanel() {
    const openPanelButtons = document.querySelectorAll('[data-open-panel]');
    const closePanelButton = document.getElementById('close-panel-button');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('overlay');

    if (!openPanelButtons.length || !closePanelButton || !sidePanel || !overlay) {
        return;
    }

    console.log('Side panel initialized successfully');

    // Store reference to previously focused element
    let previousFocus = null;

    /**
     * Traps focus within the side panel
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (!firstElement || !lastElement) return;
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    /**
     * Opens the side panel
     */
    function openPanel() {
        previousFocus = document.activeElement;
        sidePanel.classList.add('open');
        overlay.classList.add('visible');
        sidePanel.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        openPanelButtons.forEach((button) => button.setAttribute('aria-expanded', 'true'));
        
        // Focus first element in panel
        const firstFocusable = sidePanel.querySelector('a, button');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        trapFocus(sidePanel);
    }

    /**
     * Closes the side panel
     */
    function closePanel() {
        sidePanel.classList.remove('open');
        overlay.classList.remove('visible');
        sidePanel.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        openPanelButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
        
        // Return focus to trigger button
        if (previousFocus) {
            previousFocus.focus();
        }
    }

    // Side panel event listeners
    openPanelButtons.forEach((button) => {
        button.addEventListener('click', openPanel);
    });

    closePanelButton.addEventListener('click', closePanel);

    overlay.addEventListener('click', closePanel);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
            closePanel();
        }
    });

    /**
     * Updates the active tab indicator in the side panel
     * @param {string} activeTabId - ID of the active tab
     */
    function updateSidePanelActiveTab(activeTabId) {
        const tabLinks = sidePanel.querySelectorAll('.side-panel-tab-link');
        tabLinks.forEach(link => {
            const linkTabId = link.getAttribute('data-tab-id');
            if (linkTabId === activeTabId) {
                link.classList.remove('side-panel-tab-inactive');
                link.classList.add('side-panel-tab-active');
            } else {
                link.classList.remove('side-panel-tab-active');
                link.classList.add('side-panel-tab-inactive');
            }
        });
    }

    /**
     * Handles tab link clicks
     */
    function handleTabLinkClick(e) {
        console.log('Side panel clicked, target:', e.target, 'currentTarget:', e.currentTarget);
        
        // Use closest to find the button even if clicking on icon or text inside
        let tabLink = e.target.closest('.side-panel-tab-link');
        
        // If clicking on an icon or text inside, try to find parent button
        if (!tabLink) {
            // Check if the target itself is a tab link
            if (e.target.classList && e.target.classList.contains('side-panel-tab-link')) {
                tabLink = e.target;
            } else {
                // Try finding parent with data-tab-id
                tabLink = e.target.closest('[data-tab-id]');
            }
        }
        
        if (!tabLink) {
            return; // Not a tab link, ignore
        }

        const tabId = tabLink.getAttribute('data-tab-id');
        if (!tabId) {
            return; // Allow normal navigation for non-tab links (e.g. Blog)
        }

        e.preventDefault();
        e.stopPropagation();

        console.log('Tab link clicked:', tabId);

        // Check if we're on the home page
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        
        if (!isHomePage) {
            // Navigate to home page with hash for the selected tab
            const tabToUrlMap = {
                'home-tab': '/',
                'walkthroughs-tab': '/#walkthroughs',
                'halo-wars-tab': '/halo-wars-guides',
                'age-of-empires-tab': '/age-of-empires-guides',
                'age-of-mythology-tab': '/age-of-mythology-guides',
                'other-projects-tab': '/#other-projects'
            };

            const url = tabToUrlMap[tabId] || '/';
            window.location.href = url;
            return;
        }

        // Check if switchTab is available
        if (typeof window.switchTab !== 'function') {
            console.error('switchTab function not available. Tabs.js may not be loaded yet.');
            console.log('window.switchTab:', window.switchTab);
            return;
        }

        try {
            console.log('Calling switchTab with:', tabId);
            // Switch to the selected tab
            window.switchTab(tabId);
            // Update active state in side panel
            updateSidePanelActiveTab(tabId);
            // Close the panel after selection
            closePanel();
            console.log('Tab switched successfully');
        } catch (error) {
            console.error('Error switching tab:', error);
        }
    }

    // Handle tab navigation links using event delegation
    // This ensures it works even if links are added dynamically
    sidePanel.addEventListener('click', handleTabLinkClick, false);
    
    // Also attach direct listeners to each tab link as a fallback
    const tabLinks = sidePanel.querySelectorAll('.side-panel-tab-link');
    console.log('Side panel tab links found:', tabLinks.length);
    tabLinks.forEach(link => {
        const tabId = link.getAttribute('data-tab-id');
        console.log('Tab link:', tabId, link);
        if (!tabId) {
            return;
        }
        
        // Add direct listener as backup
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Check if we're on the home page
            const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
            
            if (!isHomePage) {
                // Navigate to home page with hash for the selected tab
                const tabToUrlMap = {
                    'home-tab': '/',
                    'walkthroughs-tab': '/#walkthroughs',
                    'halo-wars-tab': '/halo-wars-guides',
                    'age-of-empires-tab': '/age-of-empires-guides',
                    'age-of-mythology-tab': '/age-of-mythology-guides',
                    'other-projects-tab': '/#other-projects'
                };
                
                const url = tabToUrlMap[tabId] || '/';
                window.location.href = url;
                return;
            }
            
            if (typeof window.switchTab === 'function') {
                window.switchTab(tabId);
                updateSidePanelActiveTab(tabId);
                closePanel();
            } else {
                console.error('switchTab not available');
            }
        });
    });
    
    console.log('Tab link click handlers attached');

    // Export updateSidePanelActiveTab so it can be called from tabs.js
    window.updateSidePanelActiveTab = updateSidePanelActiveTab;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSidePanel };
}
