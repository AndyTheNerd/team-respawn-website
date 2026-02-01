/**
 * Dropdown Tests for Storehaus nav menu
 *
 * These tests validate hover/click/focus behavior for the Storehaus dropdown.
 * Run in a browser environment or with a testing framework like Jest + jsdom.
 */

function setupDropdownEnvironment() {
    document.body.innerHTML = `
        <div class="tab-nav-dropdown" data-dropdown>
            <button data-dropdown-toggle aria-expanded="false" aria-controls="storehaus-menu">Storehaus Privacy</button>
            <div id="storehaus-menu" data-dropdown-menu>
                <a href="/storehaus-info">Summary</a>
                <a href="/storehaus/privacy-policy">Privacy Policy</a>
                <a href="/storehaus/terms-of-service">Terms of Service</a>
            </div>
        </div>
    `;
}

function getDropdownHelpers() {
    if (typeof setupNavDropdown === 'function') {
        return { setupNavDropdown };
    }
    if (typeof window !== 'undefined' && typeof window.setupNavDropdown === 'function') {
        return { setupNavDropdown: window.setupNavDropdown };
    }
    try {
        return require('../public/js/dropdowns.js');
    } catch (error) {
        return {};
    }
}

const dropdownTests = {
    testHoverOpensAndCloses: function() {
        console.log('Test 1: Hover opens and closes dropdown');
        setupDropdownEnvironment();

        const { setupNavDropdown } = getDropdownHelpers();
        if (typeof setupNavDropdown !== 'function') {
            return [{
                name: 'setupNavDropdown available',
                pass: false,
                note: 'setupNavDropdown not found. Make sure dropdowns.js is loaded.'
            }];
        }

        const dropdown = document.querySelector('[data-dropdown]');
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');

        setupNavDropdown(dropdown);
        dropdown.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

        const openAfterHover = dropdown.classList.contains('open') && toggle.getAttribute('aria-expanded') === 'true';

        dropdown.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        const closedAfterLeave = !dropdown.classList.contains('open') && toggle.getAttribute('aria-expanded') === 'false';

        return [
            {
                name: 'Dropdown opens on hover',
                pass: openAfterHover
            },
            {
                name: 'Dropdown closes on mouse leave',
                pass: closedAfterLeave
            }
        ];
    },

    testFocusOpensAndCloses: function() {
        console.log('Test 2: Focus opens and closes dropdown');
        setupDropdownEnvironment();

        const { setupNavDropdown } = getDropdownHelpers();
        if (typeof setupNavDropdown !== 'function') {
            return [{
                name: 'setupNavDropdown available',
                pass: false,
                note: 'setupNavDropdown not found. Make sure dropdowns.js is loaded.'
            }];
        }

        const dropdown = document.querySelector('[data-dropdown]');
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        const link = dropdown.querySelector('a');
        const outside = document.createElement('button');
        outside.textContent = 'Outside';
        document.body.appendChild(outside);

        setupNavDropdown(dropdown);
        toggle.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

        const openAfterFocus = dropdown.classList.contains('open') && toggle.getAttribute('aria-expanded') === 'true';

        link.focus();
        toggle.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: link }));
        const staysOpenForMenu = dropdown.classList.contains('open');

        toggle.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
        const closedAfterBlur = !dropdown.classList.contains('open');

        return [
            { name: 'Dropdown opens on focus', pass: openAfterFocus },
            { name: 'Dropdown stays open when focus moves into menu', pass: staysOpenForMenu },
            { name: 'Dropdown closes when focus leaves menu', pass: closedAfterBlur }
        ];
    },

    testClickToggles: function() {
        console.log('Test 3: Click toggles dropdown');
        setupDropdownEnvironment();

        const { setupNavDropdown } = getDropdownHelpers();
        if (typeof setupNavDropdown !== 'function') {
            return [{
                name: 'setupNavDropdown available',
                pass: false,
                note: 'setupNavDropdown not found. Make sure dropdowns.js is loaded.'
            }];
        }

        const dropdown = document.querySelector('[data-dropdown]');
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');

        setupNavDropdown(dropdown);
        toggle.click();

        const opened = dropdown.classList.contains('open') && toggle.getAttribute('aria-expanded') === 'true';
        toggle.click();
        const closed = !dropdown.classList.contains('open') && toggle.getAttribute('aria-expanded') === 'false';

        return [
            { name: 'Dropdown opens on click', pass: opened },
            { name: 'Dropdown closes on second click', pass: closed }
        ];
    }
};

function runDropdownTests() {
    console.log('='.repeat(60));
    console.log('Running Dropdown Tests');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const testFunction of Object.values(dropdownTests)) {
        const testResults = testFunction();
        totalTests += testResults.length;

        testResults.forEach(test => {
            if (test.pass) {
                passedTests++;
                console.log(`✓ ${test.name}`);
            } else {
                failedTests++;
                console.error(`✗ ${test.name}`);
                if (test.note) {
                    console.error(`  Note: ${test.note}`);
                }
            }
        });

        console.log('');
    }

    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dropdownTests, runDropdownTests };
}

if (typeof window !== 'undefined') {
    window.dropdownTests = dropdownTests;
    window.runDropdownTests = runDropdownTests;
}
