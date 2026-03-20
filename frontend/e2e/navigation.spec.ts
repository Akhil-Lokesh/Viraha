import { test, expect } from '@playwright/test';

// Auth is shared via storageState from setup.spec.ts

test.describe('Navigation', () => {
  test('should navigate to home dashboard', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/home');
  });

  test('should navigate to map page', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/map');
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/explore');
  });

  test('should navigate to albums page', async ({ page }) => {
    await page.goto('/albums');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/albums');
  });

  test('should navigate to journals page', async ({ page }) => {
    await page.goto('/journals');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/journals');
  });

  test('should navigate to activity page', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(3000);
    // Activity page may redirect depending on auth state
    const url = page.url();
    expect(url).toMatch(/activity|home|sign-in/);
  });

  test('should navigate to saved page', async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/saved');
  });
});
