import { test, expect } from '@playwright/test';

test.describe('Profiles Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/profiles');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should allow creating a new profile', async ({ page }) => {
        // Open new profile form
        // Look for button with common "New Profile" text or icon
        await page.click('button:has-text("New Profile"), button:has-text("Neues Profil")');

        // Fill form
        // Assuming "Profile Name" label or placeholder
        // In Profiles.tsx: placeholder="e.g. Winter Run" or similar? 
        // Let's check Profiles.tsx again or use generic selector if safe.
        // Actually Profiles.tsx has: <input value={currentProfile.name} ... />
        // Let's try to find by label "Profile Name" or "Profilname"

        // Waiting for form to appear
        await expect(page.locator('h2')).toContainText(/Edit Profile|Create Profile|Neues Profil/i);

        await page.fill('input[type="text"]', 'Test Profile'); // First text input usually name

        // Save
        // Ensure button is visible (sometimes behind sticky footer or similar?)
        const saveButton = page.locator('button:has-text("Save Profile"), button:has-text("Profil speichern")');
        await saveButton.scrollIntoViewIfNeeded();
        await saveButton.click();

        // Verify
        await expect(page.locator('h3', { hasText: 'Test Profile' })).toBeVisible();
    });
});
