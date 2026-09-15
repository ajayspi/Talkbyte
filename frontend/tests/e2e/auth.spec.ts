import { test, expect } from '@playwright/test';

/**
 * E2E tests for the restaurant portal login page at /login.
 *
 * These tests verify page structure and form accessibility without
 * requiring real credentials (demo-safe).
 */
test.describe('Restaurant Login Page (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('page returns 200 and loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    // Verify no error page is shown
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('displays the TalkByte brand heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText('TalkByte');
  });

  test('has an email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('has a password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('has a sign-in submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign In');
  });

  test('login form is present and accessible', async ({ page }) => {
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('user can type into email and password fields', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@restaurant.com');
    await passwordInput.fill('testpassword');

    await expect(emailInput).toHaveValue('test@restaurant.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });
});
