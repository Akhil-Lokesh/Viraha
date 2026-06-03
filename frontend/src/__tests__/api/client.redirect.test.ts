import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosError, type AxiosAdapter } from 'axios';

/**
 * Regression tests for the redirect-loop guard added in commit b42c219
 * (frontend/src/lib/api/client.ts lines 82-91). After a failed token refresh
 * the response interceptor must only reassign `window.location.href` when
 * the user is NOT already on an auth page. Without this guard, sitting on
 * `/sign-in` could trigger an infinite reload loop.
 */
describe('API client redirect guard on refresh failure', () => {
  let hrefSetter: (value: string) => void;
  let hrefCalls: string[];
  let currentPathname: string;

  function installMockLocation(pathname: string) {
    currentPathname = pathname;
    hrefCalls = [];
    hrefSetter = (value: string) => {
      hrefCalls.push(value);
    };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get pathname() {
          return currentPathname;
        },
        set href(value: string) {
          hrefSetter(value);
        },
        get href() {
          return '';
        },
      },
    });
  }

  beforeEach(() => {
    // Reset module cache so each test imports a fresh client (avoids the
    // shared `isRefreshing` / `failedQueue` module-level state polluting
    // subsequent tests).
    vi.resetModules();
  });

  afterEach(() => {
    // Restore a jsdom-compatible location for subsequent tests
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('http://localhost/'),
    });
    vi.restoreAllMocks();
  });

  /**
   * Build an adapter that returns 401 for every request. The first protected
   * request 401s, forcing the response interceptor to attempt a refresh; the
   * refresh now goes through `apiClient.post('/auth/refresh')` (so the CSRF
   * header is attached) and is skipped by the retry guard (url includes
   * '/auth/refresh'), so it rejects with the adapter's 401. The interceptor's
   * catch branch then runs the redirect-guard logic.
   */
  function buildFailingAdapter(): AxiosAdapter {
    return (config) => {
      const err = new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        null,
        {
          status: 401,
          statusText: 'Unauthorized',
          data: { success: false, error: { code: 'UNAUTHORIZED' } },
          headers: {},
          config,
        }
      );
      return Promise.reject(err);
    };
  }

  it('should NOT reassign window.location.href when already on /sign-in', async () => {
    installMockLocation('/sign-in');
    const { default: apiClient } = await import('../../lib/api/client');

    // The failing adapter 401s every request, including the apiClient refresh.
    apiClient.defaults.adapter = buildFailingAdapter();

    await apiClient.get('/protected').catch(() => {});

    // On an auth page the guard must NOT reassign window.location.href.
    expect(hrefCalls).toEqual([]);
  });

  it('should redirect to /sign-in when on a protected page like /home', async () => {
    installMockLocation('/home');
    const { default: apiClient } = await import('../../lib/api/client');

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    apiClient.defaults.adapter = buildFailingAdapter();

    await apiClient.get('/protected').catch(() => {});

    expect(hrefCalls).toEqual(['/sign-in']);
  });

  it('should NOT redirect when already on /forgot-password (auth-page allowlist)', async () => {
    installMockLocation('/forgot-password');
    const { default: apiClient } = await import('../../lib/api/client');

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    apiClient.defaults.adapter = buildFailingAdapter();

    await apiClient.get('/protected').catch(() => {});

    expect(hrefCalls).toEqual([]);
  });

  it('should NOT redirect when already on /sign-up', async () => {
    installMockLocation('/sign-up');
    const { default: apiClient } = await import('../../lib/api/client');

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    apiClient.defaults.adapter = buildFailingAdapter();

    await apiClient.get('/protected').catch(() => {});

    expect(hrefCalls).toEqual([]);
  });

  it('should NOT redirect when already on /reset-password', async () => {
    installMockLocation('/reset-password');
    const { default: apiClient } = await import('../../lib/api/client');

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    apiClient.defaults.adapter = buildFailingAdapter();

    await apiClient.get('/protected').catch(() => {});

    expect(hrefCalls).toEqual([]);
  });
});
