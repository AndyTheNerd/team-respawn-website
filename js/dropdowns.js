/**
 * Header dropdown logic for Storehaus menu
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

function setupNavDropdown(dropdown) {
    if (!dropdown || dropdown.dataset.dropdownReady === 'true') {
        return;
    }

    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!toggle || !menu) {
        return;
    }

    dropdown.dataset.dropdownReady = 'true';

    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            closeAllNavDropdowns();
        } else {
            closeAllNavDropdowns(dropdown);
            setDropdownOpen(dropdown, true);
        }
    });

    dropdown.addEventListener('mouseenter', () => {
        closeAllNavDropdowns(dropdown);
        setDropdownOpen(dropdown, true);
    });

    dropdown.addEventListener('mouseleave', () => {
        setDropdownOpen(dropdown, false);
    });

    dropdown.addEventListener('focusin', () => {
        closeAllNavDropdowns(dropdown);
        setDropdownOpen(dropdown, true);
    });

    dropdown.addEventListener('focusout', (event) => {
        if (!dropdown.contains(event.relatedTarget)) {
            setDropdownOpen(dropdown, false);
        }
    });

    dropdown.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllNavDropdowns();
            toggle.focus();
        }
    });

    menu.addEventListener('click', () => {
        closeAllNavDropdowns();
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
