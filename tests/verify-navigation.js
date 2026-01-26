/**
 * Simple verification script to check if navigation functions are working
 * Run this in the browser console on any page to verify functionality
 */

(function() {
    console.log('🔍 Verifying Navigation Functionality...\n');
    
    const checks = [];
    
    // Check 1: convertTabsToLinks function exists
    checks.push({
        name: 'convertTabsToLinks function exists',
        pass: typeof window.convertTabsToLinks === 'function' || typeof convertTabsToLinks === 'function',
        fix: 'Make sure tabs.js is loaded'
    });
    
    // Check 2: switchTab function exists
    checks.push({
        name: 'switchTab function exists',
        pass: typeof window.switchTab === 'function' || typeof switchTab === 'function',
        fix: 'Make sure tabs.js is loaded'
    });
    
    // Check 3: Tab buttons exist in header
    const tabButtons = document.querySelectorAll('button[data-tab-link]');
    checks.push({
        name: 'Tab buttons with data-tab-link found',
        pass: tabButtons.length > 0,
        count: tabButtons.length,
        fix: 'Make sure header component is loaded'
    });
    
    // Check 4: Verify data-tab-link attributes
    if (tabButtons.length > 0) {
        tabButtons.forEach((button, index) => {
            const link = button.getAttribute('data-tab-link');
            checks.push({
                name: `Tab button ${index + 1} has valid data-tab-link`,
                pass: link && link.length > 0,
                value: link,
                fix: 'Check header.html component'
            });
        });
    }
    
    // Check 5: If on non-home page, verify buttons should be links
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (!isHomePage) {
        const links = document.querySelectorAll('a[data-tab-link], a[href*="#"]');
        const stillButtons = document.querySelectorAll('button[data-tab-link]');
        checks.push({
            name: 'On non-home page: buttons converted to links',
            pass: stillButtons.length === 0 || links.length > 0,
            buttonsRemaining: stillButtons.length,
            linksFound: links.length,
            fix: 'Run convertTabsToLinks() function'
        });
    } else {
        checks.push({
            name: 'On home page: buttons should remain buttons',
            pass: tabButtons.length > 0,
            note: 'This is expected on home page'
        });
    }
    
    // Run checks and report
    console.log('='.repeat(60));
    let passed = 0;
    let failed = 0;
    
    checks.forEach(check => {
        if (check.pass) {
            console.log(`✅ ${check.name}`);
            if (check.count !== undefined) {
                console.log(`   Found: ${check.count}`);
            }
            if (check.value) {
                console.log(`   Value: ${check.value}`);
            }
            passed++;
        } else {
            console.error(`❌ ${check.name}`);
            if (check.count !== undefined) {
                console.error(`   Expected: > 0, Found: ${check.count}`);
            }
            if (check.buttonsRemaining !== undefined) {
                console.error(`   Buttons remaining: ${check.buttonsRemaining}`);
            }
            if (check.linksFound !== undefined) {
                console.error(`   Links found: ${check.linksFound}`);
            }
            if (check.fix) {
                console.error(`   Fix: ${check.fix}`);
            }
            failed++;
        }
    });
    
    console.log('='.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));
    
    // If on non-home page and buttons still exist, offer to convert them
    if (!isHomePage && tabButtons.length > 0) {
        console.log('\n💡 Tip: Run convertTabsToLinks() to convert buttons to links');
        if (typeof window.convertTabsToLinks === 'function') {
            console.log('   You can run: window.convertTabsToLinks()');
        }
    }
    
    return {
        passed,
        failed,
        total: checks.length,
        checks
    };
})();
