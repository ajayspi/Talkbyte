import { test, expect } from '@playwright/test';

/**
 * Bonus Journey 4: SaaS Billing Route & Plan Gating
 *
 * Verifies that /dashboard/billing returns HTTP 200, renders all 3 official
 * subscription tiers ($149 Starter, $249 Growth, $499 Enterprise), displays
 * usage meters and billing history, and opens the upgrade checkout modal.
 */
test.describe('Bonus Journey 4: SaaS Subscription Billing', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase Auth & REST calls
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

  test('loads /dashboard/billing route with HTTP 200 and renders plans and meters', async ({ page }) => {
    // 1. Navigate to /dashboard/billing
    const response = await page.goto('/dashboard/billing');
    expect(response?.status()).toBe(200);

    // 2. Verify page title
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toHaveText('Billing & Plan');

    // 3. Verify all 3 official SaaS plan cards
    await expect(page.locator('.plan-name:has-text("Starter")')).toBeVisible();
    await expect(page.locator('.plan-name:has-text("Growth")')).toBeVisible();
    await expect(page.locator('.plan-name:has-text("Enterprise")')).toBeVisible();

    await expect(page.locator('.plan-price:has-text("$149")')).toBeVisible();
    await expect(page.locator('.plan-price:has-text("$249")')).toBeVisible();
    await expect(page.locator('.plan-price:has-text("$499")')).toBeVisible();

    // 4. Verify usage meters and billing history cards
    await expect(page.locator('text=Usage This Month')).toBeVisible();
    await expect(page.locator('text=Billing & Invoice History')).toBeVisible();

    // 5. Click non-active plan (Starter) to open subscription change modal
    const starterCard = page.locator('.plan-card').filter({ hasText: 'Starter' });
    await starterCard.click();

    await expect(page.locator('text=Confirm Subscription Change')).toBeVisible();
    await expect(page.locator('text=Starter includes up to 500 inbound calls/month')).toBeVisible();

    // 6. Close modal via Cancel button
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Confirm Subscription Change')).not.toBeVisible();
  });
});
