/**
 * SessionsSection markup tests.
 *
 * The repo's vitest setup runs in the node environment (jsdom hangs under
 * the local Node runtime), so we assert against server-rendered markup via
 * react-dom/server with the data hooks mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AuthSession } from '@/lib/types';

vi.mock('@/lib/hooks/use-sessions', () => ({
  SESSIONS_QUERY_KEY: ['auth', 'sessions'],
  useSessions: vi.fn(),
  useRevokeSession: vi.fn(),
  useRevokeOtherSessions: vi.fn(),
}));

import { useSessions, useRevokeSession, useRevokeOtherSessions } from '@/lib/hooks/use-sessions';
import { SessionsSection } from '@/components/settings/sessions-section';

const sessionsFixture: AuthSession[] = [
  {
    id: 's-current',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ip: '10.0.0.1',
    createdAt: '2026-06-01T00:00:00Z',
    lastUsedAt: '2026-06-09T00:00:00Z',
    current: true,
  },
  {
    id: 's-other',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    ip: '10.0.0.2',
    createdAt: '2026-05-01T00:00:00Z',
    lastUsedAt: '2026-06-08T00:00:00Z',
    current: false,
  },
];

type SessionsResult = ReturnType<typeof useSessions>;
type RevokeResult = ReturnType<typeof useRevokeSession>;
type RevokeAllResult = ReturnType<typeof useRevokeOtherSessions>;

function mockQueries(
  overrides: Partial<{ data: AuthSession[] | undefined; isLoading: boolean; isError: boolean }> = {}
) {
  vi.mocked(useSessions).mockReturnValue({
    data: sessionsFixture,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as SessionsResult);
  vi.mocked(useRevokeSession).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as RevokeResult);
  vi.mocked(useRevokeOtherSessions).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as RevokeAllResult);
}

function renderMarkup(): string {
  return renderToStaticMarkup(<SessionsSection />);
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('SessionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one row per session with parsed device labels', () => {
    mockQueries();
    const markup = renderMarkup();

    expect(countOccurrences(markup, 'data-testid="session-row"')).toBe(2);
    expect(markup).toContain('Chrome on macOS');
    expect(markup).toContain('Firefox on Windows');
  });

  it('marks only the current session with the gold stamp', () => {
    mockQueries();
    const markup = renderMarkup();

    expect(countOccurrences(markup, 'data-testid="current-session-stamp"')).toBe(1);
    expect(markup).toContain('This device');
    expect(markup).toContain('Active now');
  });

  it('shows a revoke button for other sessions but not the current one', () => {
    mockQueries();
    const markup = renderMarkup();

    expect(countOccurrences(markup, '>Sign out<')).toBe(1);
    expect(markup).toContain('Sign out all other devices');
  });

  it('hides the bulk sign-out action when there are no other sessions', () => {
    mockQueries({ data: [sessionsFixture[0]] });
    const markup = renderMarkup();

    expect(markup).not.toContain('Sign out all other devices');
    expect(markup).not.toContain('>Sign out<');
  });

  it('renders an error state when sessions fail to load', () => {
    mockQueries({ data: undefined, isError: true });
    const markup = renderMarkup();

    expect(markup).toContain('load your sessions');
    expect(countOccurrences(markup, 'data-testid="session-row"')).toBe(0);
  });

  it('renders an empty state when there are no sessions', () => {
    mockQueries({ data: [] });
    const markup = renderMarkup();

    expect(markup).toContain('No active sessions found.');
  });
});
