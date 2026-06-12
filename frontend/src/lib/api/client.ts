import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await apiClient.get('/auth/csrf-token');
    csrfToken = res.data.data.csrfToken;
  } catch {
    // CSRF token fetch failed — will retry on next mutation
  }
}

apiClient.interceptors.request.use((config) => {
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use apiClient (not bare axios) so the request interceptor attaches
        // the X-CSRF-Token header — the backend CSRF-protects this POST.
        await apiClient.post('/auth/refresh', {});

        await fetchCsrfToken();
        processQueue(null);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only redirect if not already on an auth page to prevent loops, and
        // never for the silent /auth/me bootstrap probe — that path is handled
        // by CsrfInitializer (clears stale state) so routing stays deterministic
        // instead of hard-bouncing logged-out visitors off the public landing.
        if (typeof window !== 'undefined') {
          const isAuthProbe = originalRequest.url?.includes('/auth/me');
          const onAuthPage = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'].some(
            (p) => window.location.pathname.startsWith(p)
          );
          if (!onAuthPage && !isAuthProbe) {
            window.location.href = '/sign-in';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
