import { test, expect } from '@playwright/test';
import { openAppPage } from './helpers';

// Auth is shared via storageState from setup.spec.ts

test.describe('Journal Flow', () => {
  test('should load journals page', async ({ page }) => {
    await openAppPage(page, '/journals');
    await expect(page).toHaveURL(/\/journals/);
  });

  test('should load create journal page', async ({ page }) => {
    await openAppPage(page, '/create/journal');
    await expect(page).toHaveURL(/\/create\/journal/);
  });

  test('should not have executable XSS in rendered content', async ({ page }) => {
    await openAppPage(page, '/journals');

    const xssElements = await page.evaluate(() =>
      document.querySelectorAll('[onerror], [onclick], [onload]').length
    );
    expect(xssElements).toBe(0);
  });
});
