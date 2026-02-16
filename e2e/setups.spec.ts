import { test, expect } from '@playwright/test';

test.describe('Setup Manager Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/setups'); // Assuming route is /setups or navigating via menu
        // If route is different, we might need to click menu. 
        // Let's assume /setup or check menu links in App.tsx if fails.
        // Actually "setups" key in nav suggests /setups.
        await page.waitForLoadState('domcontentloaded');
    });

    test('should allow creating a new setup', async ({ page }) => {
        // Open new setup form "New Setup" / "Neues Setup"
        await page.click('button:has-text("New Setup"), button:has-text("Neues Setup")');

        // Fill form
        // Setup Name
        await page.fill('input[placeholder*="Name"], input[placeholder*="Bezeichnung"]', 'Test Setup 4x4');

        // We might need to fill other required fields?
        // Usually name is enough for basic test.

        // Save
        await page.click('button:has-text("Create Setup"), button:has-text("Setup erstellen")');

        // Verify
        await expect(page.locator('h3', { hasText: 'Test Setup 4x4' })).toBeVisible();
    });
});
