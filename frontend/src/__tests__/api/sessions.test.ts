import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../lib/api/client';
import { getSessions, revokeSession, revokeOtherSessions } from '../../lib/api/sessions';

const mockedClient = vi.mocked(apiClient, true);

describe('sessions API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSessions unwraps data.sessions from the envelope', async () => {
    const sessions = [
      {
        id: 's1',
        userAgent: 'Mozilla/5.0',
        ip: '1.2.3.4',
        createdAt: '2026-01-01T00:00:00Z',
        lastUsedAt: '2026-01-02T00:00:00Z',
        current: true,
      },
    ];
    mockedClient.get.mockResolvedValue({ data: { success: true, data: { sessions } } });
    const result = await getSessions();
    expect(mockedClient.get).toHaveBeenCalledWith('/auth/sessions');
    expect(result).toEqual(sessions);
  });

  it('revokeSession DELETEs /auth/sessions/:id', async () => {
    mockedClient.delete.mockResolvedValue({ data: { success: true } });
    await revokeSession('sess-123');
    expect(mockedClient.delete).toHaveBeenCalledWith('/auth/sessions/sess-123');
  });

  it('revokeOtherSessions DELETEs /auth/sessions and returns revoked count', async () => {
    mockedClient.delete.mockResolvedValue({ data: { success: true, data: { revoked: 3 } } });
    const revoked = await revokeOtherSessions();
    expect(mockedClient.delete).toHaveBeenCalledWith('/auth/sessions');
    expect(revoked).toBe(3);
  });
});
