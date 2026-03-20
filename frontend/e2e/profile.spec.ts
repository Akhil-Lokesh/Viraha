import { test, expect } from '@playwright/test';

// Auth is shared via storageState from setup.spec.ts (logged in as anya)

test.describe('Profile', () => {
  test('should display own profile with username', async ({ page }) => {
    await page.goto('/profile/anya');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toContain('anya');
  });

  test('should display profile stats section', async ({ page }) => {
    await page.goto('/profile/anya');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    const hasStats = content?.match(/\d+/) !== null;
    expect(hasStats).toBeTruthy();
  });

  test('should view another user profile', async ({ page }) => {
    await page.goto('/profile/marco');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toContain('marco');
  });
});
