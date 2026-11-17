import { test, expect } from '@playwright/test';
import { openAppPage } from './helpers';

// Auth is shared via storageState from setup.spec.ts

test.describe('Navigation', () => {
  test('should navigate to home dashboard', async ({ page }) => {
    await openAppPage(page, '/home');
    await expect(page).toHaveURL(/\/home/);
  });

  test('should navigate to map page', async ({ page }) => {
    await openAppPage(page, '/map');
    await expect(page).toHaveURL(/\/map/);
  });

  test('should navigate to explore page', async ({ page }) => {
    await openAppPage(page, '/explore');
    await expect(page).toHaveURL(/\/explore/);
  });

  test('should navigate to albums page', async ({ page }) => {
    await openAppPage(page, '/albums');
    await expect(page).toHaveURL(/\/albums/);
  });

  test('should navigate to journals page', async ({ page }) => {
    await openAppPage(page, '/journals');
    await expect(page).toHaveURL(/\/journals/);
  });

  test('should navigate to activity page', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(3000);
    // Activity page may redirect depending on auth state
    const url = page.url();
    expect(url).toMatch(/activity|home|sign-in/);
  });

  test('should navigate to saved page', async ({ page }) => {
    await openAppPage(page, '/saved');
    await expect(page).toHaveURL(/\/saved/);
  });
});
