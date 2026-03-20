import { test, expect } from '@playwright/test';

// These tests DON'T use shared auth — they test the auth pages themselves

test.describe('Auth Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show sign-in page with form fields', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show sign-up page with form fields', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    const hasContent = content?.includes('Viraha') || content?.includes('travel') || content?.includes('Sign');
    expect(hasContent).toBeTruthy();
  });

  test('should show forgot-password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
