/**
 * Header dropdown logic for navigation menus
 */

function setDropdownOpen(dropdown, isOpen) {
    if (!dropdown) {
        return;
    }
    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    if (isOpen) {
        dropdown.classList.add('open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
        }
    } else {
        dropdown.classList.remove('open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
    }
}

function closeAllNavDropdowns(except) {
    const openDropdowns = document.querySelectorAll('[data-dropdown].open');
    openDropdowns.forEach((dropdown) => {
        if (except && dropdown === except) {
            return;
        }
        setDropdownOpen(dropdown, false);
    });
}

function lockDropdownClosed(dropdown) {
    if (!dropdown) {
        return;
    }
    dropdown.classList.add('lock-closed');
    window.setTimeout(() => {
        dropdown.classList.remove('lock-closed');
    }, 200);
}

function setupNavDropdown(dropdown) {
    if (!dropdown || dropdown.dataset.dropdownReady === 'true') {
        return;
    }

    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!toggle || !menu) {
        return;
    }

    let openTimer = null;
    let closeTimer = null;

    function clearOpenTimer() {
        if (openTimer) {
            window.clearTimeout(openTimer);
            openTimer = null;
        }
    }

    function clearCloseTimer() {
        if (closeTimer) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }
    }

    function clearTimers() {
        clearOpenTimer();
        clearCloseTimer();
    }

    function openDropdownImmediately() {
        clearTimers();
        closeAllNavDropdowns(dropdown);
        setDropdownOpen(dropdown, true);
    }

    function scheduleOpen() {
        clearCloseTimer();
        clearOpenTimer();
        openTimer = window.setTimeout(() => {
            openTimer = null;
            closeAllNavDropdowns(dropdown);
            setDropdownOpen(dropdown, true);
        }, 120);
    }

    function scheduleClose() {
        clearOpenTimer();
        clearCloseTimer();
        closeTimer = window.setTimeout(() => {
            closeTimer = null;
            if (!dropdown.matches(':focus-within')) {
                setDropdownOpen(dropdown, false);
            }
        }, 160);
    }

    dropdown.dataset.dropdownReady = 'true';

    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearTimers();
        const isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            closeAllNavDropdowns();
        } else {
            closeAllNavDropdowns(dropdown);
            setDropdownOpen(dropdown, true);
        }
    });

    toggle.addEventListener('pointerenter', () => {
        if (dropdown.classList.contains('open')) {
            clearCloseTimer();
            return;
        }
        scheduleOpen();
    });

    toggle.addEventListener('pointerleave', () => {
        scheduleClose();
    });

    menu.addEventListener('pointerenter', () => {
        clearTimers();
        setDropdownOpen(dropdown, true);
    });

    menu.addEventListener('pointerleave', () => {
        scheduleClose();
    });

    dropdown.addEventListener('focusin', () => {
        openDropdownImmediately();
    });

    dropdown.addEventListener('focusout', (event) => {
        if (!dropdown.contains(event.relatedTarget)) {
            clearTimers();
            setDropdownOpen(dropdown, false);
        }
    });

    dropdown.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            clearTimers();
            closeAllNavDropdowns();
            toggle.focus();
        }
    });

    menu.addEventListener('click', () => {
        clearTimers();
        closeAllNavDropdowns();
        lockDropdownClosed(dropdown);
    });
}

function initNavDropdowns() {
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    dropdowns.forEach(setupNavDropdown);
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dropdown]')) {
        closeAllNavDropdowns();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeAllNavDropdowns();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initNavDropdowns();

    const observer = new MutationObserver(() => {
        initNavDropdowns();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initNavDropdowns, setupNavDropdown, closeAllNavDropdowns, setDropdownOpen };
}

if (typeof window !== 'undefined') {
    window.initNavDropdowns = initNavDropdowns;
    window.setupNavDropdown = setupNavDropdown;
}
