import type { Page } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';

/**
 * Login via API and set auth cookies on the browser context.
 * This bypasses the UI form and CSRF token dance for reliable E2E tests.
 */
export async function loginViaAPI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  // Hit the API directly to get auth cookies
  const context = page.context();

  // First get CSRF token
  const csrfRes = await context.request.get(`${API_URL}/auth/csrf-token`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.data?.csrfToken;

  // Login
  const loginRes = await context.request.post(`${API_URL}/auth/login`, {
    data: { email, password },
    headers: { 'X-CSRF-Token': csrfToken || '' },
  });

  if (!loginRes.ok()) {
    throw new Error(`Login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }

  // Cookies are automatically set on the context by Playwright
}

export async function registerAndLogin(
  page: Page,
  username: string,
  email: string,
  password: string,
): Promise<void> {
  const context = page.context();

  const csrfRes = await context.request.get(`${API_URL}/auth/csrf-token`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.data?.csrfToken;

  await context.request.post(`${API_URL}/auth/register`, {
    data: { username, email, password },
    headers: { 'X-CSRF-Token': csrfToken || '' },
  });

  // Cookies are set from register response
}
