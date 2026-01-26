# Navigation Tests

This directory contains tests for verifying that page navigation works correctly across the Team Respawn website, especially the conversion of tab buttons to links on non-home pages.

## Running the Tests

### Option 1: Browser Test Runner (Recommended)

1. Open `test-runner.html` in a web browser
2. Click the "Run All Tests" button
3. Review the test results in the output panel

### Option 2: Browser Console

1. Open any page of the website in a browser
2. Open the browser's developer console (F12)
3. Navigate to the `tests` directory and load `navigation.test.js`
4. Run: `runNavigationTests()`

### Option 3: Node.js (with jsdom)

If you have Node.js installed with jsdom:

```bash
npm install jsdom
node tests/navigation.test.js
```

## Test Coverage

The test suite covers:

1. **Button to Link Conversion**: Verifies that tab buttons are converted to links on non-home pages
2. **Home Page Behavior**: Ensures buttons remain buttons on the home page
3. **Attribute Preservation**: Checks that all attributes (class, aria-label, role, etc.) are preserved during conversion
4. **Hash Navigation**: Verifies the mapping between URL hashes and tab IDs
5. **Link Hrefs**: Ensures converted links have correct href attributes
6. **DOMPurify Configuration**: Verifies that data-tab-link attributes are allowed

## Expected Results

All tests should pass when:
- `tabs.js` is properly loaded
- `convertTabsToLinks()` function is available globally
- The website is functioning correctly

## Troubleshooting

If tests fail:

1. **Function not found**: Make sure `tabs.js` is loaded before running tests
2. **Location mocking issues**: Some browsers don't allow location mocking. The tests will use the current location instead.
3. **Timing issues**: If tests fail due to timing, try running them after a short delay

## Manual Testing Checklist

In addition to automated tests, manually verify:

- [ ] Navigate to `/storehaus` page
- [ ] Click on "Home" tab - should navigate to home page
- [ ] Click on "Walkthroughs" tab - should navigate to home page with #walkthroughs hash
- [ ] Click on "Halo Wars Guides" tab - should navigate to home page with #halo-wars hash
- [ ] Click on "Age of Empires Guides" tab - should navigate to home page with #age-of-empires hash
- [ ] Click on "Age of Mythology Guides" tab - should navigate to home page with #age-of-mythology hash
- [ ] Click on "Other Projects" tab - should navigate to home page with #other-projects hash
- [ ] On home page, tabs should work as buttons (no navigation, just content switching)
- [ ] Logo should display correctly on all pages
