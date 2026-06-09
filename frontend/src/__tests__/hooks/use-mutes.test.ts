/**
 * Unit tests for the use-mutes hooks.
 *
 * The repo's vitest setup runs in the node environment (no jsdom / no
 * @testing-library), so instead of mounting components we mock the React
 * binding layer of @tanstack/react-query (useQuery / useMutation /
 * useQueryClient) to capture the exact options each hook wires up, then
 * exercise those options against a REAL QueryClient + the query cache.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  QueryClient as QueryClientType,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type { MutedUser } from '@/lib/types';

vi.mock('@/lib/api/mutes', () => ({
  muteUser: vi.fn(),
  unmuteUser: vi.fn(),
  getMutedUsers: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

import {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { muteUser, unmuteUser, getMutedUsers } from '@/lib/api/mutes';
import {
  useMutedUsers,
  useMuteUser,
  useUnmuteUser,
  MUTED_USERS_QUERY_KEY,
} from '@/lib/hooks/use-mutes';

type MutedListQueryOptions = UseQueryOptions<MutedUser[]>;
type MuteMutationOptions = UseMutationOptions<void, Error, string>;

const mutedFixture: MutedUser[] = [
  { id: 'u1', username: 'amelia', displayName: 'Amelia', avatar: null, mutedAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', username: 'basil', displayName: null, avatar: null, mutedAt: '2026-01-02T00:00:00Z' },
];

function createClient(): QueryClientType {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Calls the hook with the React binding mocked, returning the options it registered. */
function captureQueryOptions(call: () => unknown): MutedListQueryOptions {
  let captured: MutedListQueryOptions | undefined;
  vi.mocked(useQuery).mockImplementation((options: unknown) => {
    captured = options as MutedListQueryOptions;
    return { data: undefined } as ReturnType<typeof useQuery>;
  });
  call();
  if (!captured) throw new Error('useQuery was not called');
  return captured;
}

function captureMutationOptions(call: () => unknown): MuteMutationOptions {
  let captured: MuteMutationOptions | undefined;
  vi.mocked(useMutation).mockImplementation((options: unknown) => {
    captured = options as MuteMutationOptions;
    return { mutate: vi.fn() } as unknown as ReturnType<typeof useMutation>;
  });
  call();
  if (!captured) throw new Error('useMutation was not called');
  return captured;
}

describe('use-mutes hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useMutedUsers registers the muted list query (key + fn + enabled)', async () => {
    vi.mocked(getMutedUsers).mockResolvedValue(mutedFixture);
    const options = captureQueryOptions(() => useMutedUsers());

    expect(options.queryKey).toEqual(MUTED_USERS_QUERY_KEY);
    expect(options.enabled).toBe(true);
    const queryFn = options.queryFn;
    if (typeof queryFn !== 'function') throw new Error('expected a queryFn');
    await expect(
      queryFn({} as Parameters<typeof queryFn>[0])
    ).resolves.toEqual(mutedFixture);
  });

  it('useMutedUsers(false) disables the query', () => {
    const options = captureQueryOptions(() => useMutedUsers(false));
    expect(options.enabled).toBe(false);
  });

  it('useMuteUser calls the API and invalidates the muted list on success', async () => {
    vi.mocked(muteUser).mockResolvedValue(undefined);
    const client = createClient();
    vi.mocked(useQueryClient).mockReturnValue(client);
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const options = captureMutationOptions(() => useMuteUser());

    await options.mutationFn?.('amelia', { client, meta: undefined });
    expect(muteUser).toHaveBeenCalledWith('amelia');

    options.onSuccess?.(undefined, 'amelia', undefined, {} as never);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: MUTED_USERS_QUERY_KEY });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['explore'] });
  });

  it('unmuting invalidates and a refetch removes the user from the cached list', async () => {
    // First fetch returns two muted users; after the unmute, the server returns one.
    vi.mocked(getMutedUsers)
      .mockResolvedValueOnce(mutedFixture)
      .mockResolvedValue([mutedFixture[0]]);
    vi.mocked(unmuteUser).mockResolvedValue(undefined);

    const client = createClient();
    vi.mocked(useQueryClient).mockReturnValue(client);

    // Seed the cache through the hook's own registered query options.
    const queryOptions = captureQueryOptions(() => useMutedUsers());
    const initial = await client.fetchQuery(queryOptions);
    expect(initial).toHaveLength(2);

    // Run the unmute mutation pipeline (mutationFn + onSuccess invalidation).
    const mutationOptions = captureMutationOptions(() => useUnmuteUser());
    await mutationOptions.mutationFn?.('basil', { client, meta: undefined });
    expect(unmuteUser).toHaveBeenCalledWith('basil');
    mutationOptions.onSuccess?.(undefined, 'basil', undefined, {} as never);

    // Invalidation marked the list stale, so the next fetch hits the API again.
    const afterUnmute = await client.fetchQuery(queryOptions);
    expect(afterUnmute).toHaveLength(1);
    expect(afterUnmute[0]?.username).toBe('amelia');
    expect(getMutedUsers).toHaveBeenCalledTimes(2);
  });
});
