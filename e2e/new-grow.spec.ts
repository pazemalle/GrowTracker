import { test, expect } from '@playwright/test';

test.describe('New Grow Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/new-grow');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should start a new grow', async ({ page }) => {
        // Fill Grow Name
        await page.fill('input[placeholder*="Name"], input[placeholder*="Run"]', 'My First E2E Grow');

        // Initial date is usually pre-filled

        // Start Grow
        await page.click('button:has-text("Start Grow"), button:has-text("Grow starten")');

        // Should redirect to Grow Detail
        await expect(page).toHaveURL(/\/grow\/.*/);

        // Verify Grow Name on Detail Page (might be different structure)
        // await expect(page.locator('h1')).toContainText('My First E2E Grow'); 

        // Navigate to Dashboard to verify it appears there (Standard verification)
        await page.goto('/');
        await expect(page.locator('h3', { hasText: 'My First E2E Grow' })).toBeVisible();
    });
});
