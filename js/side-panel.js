/**
 * Side panel open/close functionality
 */

/**
 * Initializes side panel event listeners
 */
function initSidePanel() {
    const openPanelButton = document.getElementById('open-panel-button');
    const closePanelButton = document.getElementById('close-panel-button');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('overlay');

    if (!openPanelButton || !closePanelButton || !sidePanel || !overlay) {
        console.warn('Side panel elements not found. Make sure components are loaded first.');
        return;
    }

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
        openPanelButton.setAttribute('aria-expanded', 'true');
        
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
        openPanelButton.setAttribute('aria-expanded', 'false');
        
        // Return focus to trigger button
        if (previousFocus) {
            previousFocus.focus();
        }
    }

    // Side panel event listeners
    openPanelButton.addEventListener('click', openPanel);

    closePanelButton.addEventListener('click', closePanel);

    overlay.addEventListener('click', closePanel);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
            closePanel();
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSidePanel };
}

