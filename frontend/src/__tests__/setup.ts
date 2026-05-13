import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api/v1';

  // Provide a minimal window global for tests that mock window.location
  if (typeof window === 'undefined') {
    vi.stubGlobal('window', {
      location: {
        pathname: '/',
        href: '',
      },
    });
  }
});
