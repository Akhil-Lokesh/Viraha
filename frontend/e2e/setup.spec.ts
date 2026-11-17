import { test as setup } from '@playwright/test';
import { loginViaAPI, openAppPage } from './helpers';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '..', 'test-results', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  await loginViaAPI(page, 'anya@viraha.com', 'password123');

  // Verify the session works (the guard restores it from the cookies)
  await openAppPage(page, '/home');

  // Save the auth state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
