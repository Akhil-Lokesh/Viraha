import apiClient from './client';
import type { AuthSession } from '../types';

interface SessionsResponse {
  success: boolean;
  data: { sessions: AuthSession[] };
}

interface RevokeAllResponse {
  success: boolean;
  data: { revoked: number };
}

export async function getSessions(): Promise<AuthSession[]> {
  const res = await apiClient.get<SessionsResponse>('/auth/sessions');
  return res.data.data.sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await apiClient.delete(`/auth/sessions/${encodeURIComponent(id)}`);
}

/** Revokes every session except the current one. Returns how many were revoked. */
export async function revokeOtherSessions(): Promise<number> {
  const res = await apiClient.delete<RevokeAllResponse>('/auth/sessions');
  return res.data.data.revoked;
}
