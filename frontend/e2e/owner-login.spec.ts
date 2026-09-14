import { test, expect } from '@playwright/test';

/**
 * Journey 1: Restaurant Owner Login -> Dashboard Loads
 *
 * Verifies that a restaurant owner can sign in via /login and
 * successfully navigate to /dashboard, viewing KPIs, active calls,
 * and recent orders.
 */
test.describe('Journey 1: Restaurant Owner Login', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase Auth endpoint to guarantee 100% resilient offline/CI execution
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-owner-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token-123',
          user: {
            id: 'mock-owner-uuid',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'owner@mamaspizzeria.com.au',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {
              name: 'Mario Rossi',
              restaurant_id: 'rest-1',
            },
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        }),
      });
    });
  });

  test('owner logs in and views restaurant dashboard with KPIs and widgets', async ({ page }) => {
    // 1. Navigate to /login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // 2. Verify login form elements are present
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 3. Fill in restaurant owner credentials
    await emailInput.fill('owner@mamaspizzeria.com.au');
    await passwordInput.fill('TestPassword123!');

    // 4. Submit login form
    await submitButton.click();

    // 5. Verify navigation to /dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // 6. Assert dashboard title and venue name
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toHaveText('Dashboard');

    const venueName = page.locator('.venue-name');
    await expect(venueName).toContainText("Mama's Pizzeria");

    // 7. Assert KPI cards are displayed
    await expect(page.locator('text=Calls Today')).toBeVisible();
    await expect(page.locator('text=Revenue Today')).toBeVisible();

    // 8. Assert Active Calls widget
    await expect(page.locator('text=Active Calls')).toBeVisible();

    // 9. Assert Recent Orders widget
    await expect(page.locator('text=Recent Orders')).toBeVisible();
  });
});
