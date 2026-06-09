import apiClient from './client';
import type { MutedUser } from '../types';

interface MutedUsersResponse {
  success: boolean;
  data: { users: MutedUser[] };
}

/**
 * Mutes a user by username. One-way: the muted user is never notified and
 * can still see/interact with the viewer's content.
 */
export async function muteUser(username: string): Promise<void> {
  await apiClient.post(`/users/${encodeURIComponent(username)}/mute`);
}

export async function unmuteUser(username: string): Promise<void> {
  await apiClient.delete(`/users/${encodeURIComponent(username)}/mute`);
}

export async function getMutedUsers(): Promise<MutedUser[]> {
  const res = await apiClient.get<MutedUsersResponse>('/users/me/muted');
  return res.data.data.users;
}
