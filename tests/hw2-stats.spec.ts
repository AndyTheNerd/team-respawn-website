import { test, expect } from '@playwright/test';

const TEST_GAMERTAG = 'xandy92';

test.describe('HW2 Stats Page', () => {
  test('page loads with search input and search button', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await expect(page.locator('#gamertag-input')).toBeVisible();
    await expect(page.locator('#search-btn')).toBeVisible();
    await expect(page.locator('#main-content h1')).toContainText('Halo Wars 2 Stats');
  });

  test('search for gamertag shows results', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    // Results container should become visible
    await expect(page.locator('#results-container')).toBeVisible({ timeout: 15_000 });

    // Overview section should render stats (skeleton hidden, content visible)
    await expect(page.locator('#overview-content')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#player-gamertag')).toContainText(TEST_GAMERTAG);

    // Stat boxes should have real values (not just "-")
    const matchesStat = page.locator('#stat-matches');
    await expect(matchesStat).not.toHaveText('-', { timeout: 10_000 });
  });

  test('ranked stats section renders', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#ranked-content')).toBeVisible({ timeout: 15_000 });
    // Should have at least one ranked card
    const rankedCards = page.locator('#ranked-content > div');
    await expect(rankedCards.first()).toBeVisible();
  });

  test('match cards render with correct structure', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#matches-content')).toBeVisible({ timeout: 30_000 });
    // Should have match cards inside the content area
    const matchCards = page.locator('#matches-content .match-details-toggle');
    await expect(matchCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('pagination works', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#matches-content')).toBeVisible({ timeout: 30_000 });
    // Wait for pagination buttons
    const nextBtn = page.locator('.matches-page-btn').filter({ hasText: 'Next' });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // After clicking next, page 2 button should be active
      const page2Btn = page.locator('.matches-page-btn[aria-current="page"]');
      await expect(page2Btn).toContainText('2');
    }
  });

  test('share modal opens and closes', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#matches-content')).toBeVisible({ timeout: 30_000 });

    // Click first share button
    const shareBtn = page.locator('.match-share-toggle').first();
    await expect(shareBtn).toBeVisible({ timeout: 10_000 });
    await shareBtn.click();

    // Modal should open
    await expect(page.locator('#match-share-modal')).not.toHaveClass(/hidden/, { timeout: 5_000 });

    // Close via close button
    await page.locator('#match-share-modal .match-share-close').click();
    await expect(page.locator('#match-share-modal')).toHaveClass(/hidden/);
  });

  test('recent searches appear after search', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    // Clear any existing localStorage
    await page.evaluate(() => localStorage.removeItem('hw2-recent-searches'));

    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#overview-content')).toBeVisible({ timeout: 15_000 });

    // Reload page and check recent searches
    await page.goto('/halo-wars-stats/');
    await expect(page.locator('#recent-searches')).toBeVisible();
    await expect(page.locator('.recent-search-tag').first()).toContainText(TEST_GAMERTAG);
  });

  test('deep link via URL parameter works', async ({ page }) => {
    await page.goto(`/halo-wars-stats/?gamertag=${TEST_GAMERTAG}`);

    // Should auto-search with the gamertag
    await expect(page.locator('#results-container')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#player-gamertag')).toContainText(TEST_GAMERTAG);
  });

  test('profile share button appears after loading', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#overview-content')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#profile-share-btn')).toBeVisible({ timeout: 5_000 });
  });

  test('leader usage section exists and is collapsible', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#results-container')).toBeVisible({ timeout: 15_000 });

    // Leaders section should exist
    const leadersToggle = page.locator('#leaders-toggle');
    await expect(leadersToggle).toBeVisible();

    // Click to expand
    await leadersToggle.click();
    await expect(page.locator('#leaders-panel')).not.toHaveClass(/hidden/);

    // Click to collapse
    await leadersToggle.click();
    await expect(page.locator('#leaders-panel')).toHaveClass(/hidden/);
  });

  test('match insights section exists and is collapsible', async ({ page }) => {
    await page.goto('/halo-wars-stats/');
    await page.fill('#gamertag-input', TEST_GAMERTAG);
    await page.click('#search-btn');

    await expect(page.locator('#results-container')).toBeVisible({ timeout: 15_000 });

    const insightsToggle = page.locator('#insights-toggle');
    await expect(insightsToggle).toBeVisible();

    await insightsToggle.click();
    await expect(page.locator('#insights-panel')).not.toHaveClass(/hidden/);
  });
});
