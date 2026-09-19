import { test, expect } from '@playwright/test';

/**
 * Journey 2: Menu Item Availability Toggle Updates Correctly
 *
 * Verifies that a restaurant manager can navigate to the menu tab,
 * toggle item availability instantly with 30s AI sync notification,
 * and toggle it back.
 */
test.describe('Journey 2: Menu Item Availability Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase calls to ensure offline resilience
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-owner-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: 'mock-owner-uuid', email: 'owner@mamaspizzeria.com.au' },
        }),
      });
    });

    await page.route('**/rest/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('toggles menu item availability and verifies badge and toast updates', async ({ page }) => {
    // 1. Navigate to /dashboard?tab=menu
    await page.goto('/dashboard?tab=menu');

    // 2. Wait for menu item cards to load
    const firstCard = page.locator('.menu-item-card').first();
    await expect(firstCard).toBeVisible();

    // 3. Check initial availability state: Available with badge-green
    const badge = firstCard.locator('.item-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Available');
    await expect(badge).toHaveClass(/badge-green/);

    // 4. Click the toggle switch to set item Out of Stock / Unavailable
    const toggle = firstCard.locator('.toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // 5. Verify badge updates immediately to Unavailable with badge-red
    await expect(badge).toContainText('Unavailable');
    await expect(badge).toHaveClass(/badge-red/);

    // 6. Verify toast notification appears confirming AI voice agent sync
    const toast = page.locator('text=Out of stock').first();
    await expect(toast).toBeVisible();

    // 7. Click the toggle switch again to flip back to Available
    await toggle.click();

    // 8. Verify badge flips back to Available with badge-green
    await expect(badge).toContainText('Available');
    await expect(badge).toHaveClass(/badge-green/);

    // 9. Verify toast notification reflects Available
    const toastAvailable = page.locator('text=Available: AI voice agent synced').first();
    await expect(toastAvailable).toBeVisible();
  });
});
