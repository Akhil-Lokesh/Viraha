import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../lib/api/client';
import { muteUser, unmuteUser, getMutedUsers } from '../../lib/api/mutes';

const mockedClient = vi.mocked(apiClient, true);

describe('mutes API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muteUser POSTs to /users/:username/mute', async () => {
    mockedClient.post.mockResolvedValue({ data: { success: true } });
    await muteUser('wanderer');
    expect(mockedClient.post).toHaveBeenCalledWith('/users/wanderer/mute');
  });

  it('unmuteUser DELETEs /users/:username/mute', async () => {
    mockedClient.delete.mockResolvedValue({ data: { success: true } });
    await unmuteUser('wanderer');
    expect(mockedClient.delete).toHaveBeenCalledWith('/users/wanderer/mute');
  });

  it('encodes usernames in the path', async () => {
    mockedClient.post.mockResolvedValue({ data: { success: true } });
    await muteUser('we/ird name');
    expect(mockedClient.post).toHaveBeenCalledWith('/users/we%2Fird%20name/mute');
  });

  it('getMutedUsers unwraps data.users from the envelope', async () => {
    const users = [
      { id: 'u1', username: 'a', displayName: 'A', avatar: null, mutedAt: '2026-01-01T00:00:00Z' },
    ];
    mockedClient.get.mockResolvedValue({ data: { success: true, data: { users } } });
    const result = await getMutedUsers();
    expect(mockedClient.get).toHaveBeenCalledWith('/users/me/muted');
    expect(result).toEqual(users);
  });
});
