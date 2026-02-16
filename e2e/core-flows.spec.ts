import { test, expect } from '@playwright/test';

test.describe('Core Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Handle possible initial state (e.g. language selection if any, or just wait for load)
        await page.waitForLoadState('networkidle');
    });

    test('should navigate through main menu items', async ({ page }) => {
        await expect(page).toHaveTitle(/GrowTracker/i);

        // Click on Profiles
        // Mobile Toggle Check
        const menuButton = page.locator('button.md\\:hidden'); // Tailwind class for mobile menu button
        if (await menuButton.isVisible()) {
            await menuButton.click();
        }

        await page.click('a[href="/profiles"]');
        await expect(page).toHaveURL(/.*profiles/);
        await expect(page.locator('h2')).toContainText(/Profile|Grow Profile/i);

        // Click on Notes
        await page.click('a[href="/notes"]');
        await expect(page).toHaveURL(/.*notes/);
        await expect(page.locator('h1, h2')).toContainText(/Notes|Notizen/i);
    });

    test('should allow creating a new note', async ({ page }) => {
        await page.goto('/notes');

        // Open new note form
        await page.click('button:has-text("New Note"), button:has-text("Add Note"), button:has-text("Neue Notiz"), button:has-text("Notiz hinzufügen")');

        // Fill form
        await page.fill('input[placeholder="e.g. Nutrient Observation"]', 'Test Note Title');
        await page.fill('textarea[placeholder*="Write your notes"]', 'This is a test note content.');

        // Add tag
        await page.fill('input[placeholder*="Tag"]', 'TestTag');
        await page.press('input[placeholder*="Tag"]', 'Enter');

        // Save
        await page.click('button:has-text("Save"), button:has-text("Speichern")');

        // Verify it appears in list
        await expect(page.locator('h3', { hasText: 'Test Note Title' })).toBeVisible();
        await expect(page.locator('h3', { hasText: 'Test Note Title' })).toBeVisible();
        // Tags usually displayed with hash
        // Using first() or specific class if needed, or getByText with exact match if possible
        await expect(page.locator('span').filter({ hasText: 'TestTag' }).first()).toBeVisible();
    });
});
