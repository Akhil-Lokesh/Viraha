import { test, expect } from '@playwright/test';

// Auth is shared via storageState from setup.spec.ts

test.describe('Journal Flow', () => {
  test('should load journals page', async ({ page }) => {
    await page.goto('/journals');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/journals');
  });

  test('should load create journal page', async ({ page }) => {
    await page.goto('/create/journal');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/create/journal');
  });

  test('should not have executable XSS in rendered content', async ({ page }) => {
    await page.goto('/journals');
    await page.waitForLoadState('networkidle');

    const xssElements = await page.evaluate(() =>
      document.querySelectorAll('[onerror], [onclick], [onload]').length
    );
    expect(xssElements).toBe(0);
  });
});
