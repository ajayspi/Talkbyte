import { test, expect } from '@playwright/test';

/**
 * Journey 3: Operator Admin Login -> Restaurants List Loads
 *
 * Verifies that an operator admin can log in via /admin/login,
 * access the operator admin panel at /admin, navigate to the
 * restaurant fleet directory, and verify fleet metrics and tenant rows.
 */
test.describe('Journey 3: Operator Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase Auth for admin session
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-admin-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-admin-refresh-token',
          user: {
            id: 'mock-admin-uuid',
            aud: 'authenticated',
            role: 'service_role',
            email: 'admin@talkbyte.io',
            app_metadata: { provider: 'email', role: 'admin' },
            user_metadata: { name: 'Platform Operator' },
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        }),
      });
    });
  });

  test('admin logs in and navigates to restaurant fleet table', async ({ page }) => {
    // 1. Navigate to /admin/login
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 2. Fill admin credentials
    const emailInput = page.locator('#admin-email');
    const passwordInput = page.locator('#admin-password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    await emailInput.fill('admin@talkbyte.io');
    await passwordInput.fill('AdminSecretPass123!');

    // 3. Click submit
    await submitButton.click();

    // 4. Verify navigation to /admin
    await page.waitForURL('**/admin**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);

    // 5. Navigate to Restaurants fleet view (via sidebar button with fallback)
    const restaurantsNavButton = page.locator('aside button:has-text("Restaurants")').first();
    try {
      await restaurantsNavButton.waitFor({ state: 'visible', timeout: 3000 });
      await restaurantsNavButton.click();
    } catch {
      await page.goto('/admin?tab=restaurants');
    }

    // 6. Verify fleet table columns
    await expect(page.locator('th:has-text("Calls/mo")').first()).toBeVisible();
    await expect(page.locator('th:has-text("MRR")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Status")').first()).toBeVisible();

    // 7. Verify fleet restaurant rows are displayed
    await expect(page.locator('td:has-text("Mama\'s Pizzeria")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Thai Express")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Burger Palace")').first()).toBeVisible();
  });
});
