import { test as setup, expect } from '@playwright/test';
import { loginViaAPI } from './helpers';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '..', 'test-results', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  await loginViaAPI(page, 'anya@viraha.com', 'password123');

  // Navigate to verify login works
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  // Save the auth state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
