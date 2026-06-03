import apiClient from './client';
import type { UserProfile, UpdateProfileInput, User } from '../types';

interface UserApiResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

interface UpdateUserApiResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export async function getUserByUsername(username: string): Promise<UserProfile> {
  const res = await apiClient.get<UserApiResponse>(`/users/${username}`);
  return res.data.data.user;
}

export async function updateProfile(data: UpdateProfileInput): Promise<User> {
  const res = await apiClient.patch<UpdateUserApiResponse>('/users/me', data);
  return res.data.data.user;
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  homeCity: string | null;
  homeCountry: string | null;
  postCount: number;
  followerCount: number;
}

interface SearchUsersResponse {
  success: boolean;
  data: { users: UserSearchResult[] };
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const res = await apiClient.get<SearchUsersResponse>('/users/search', { params: { q } });
  return res.data.data.users;
}

export interface BlockedUserEntry {
  id: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

interface BlockedUsersResponse {
  success: boolean;
  data: { items: BlockedUserEntry[]; nextCursor: string | null };
}

export async function blockUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/block`);
}

export async function getBlockedUsers(): Promise<BlockedUserEntry[]> {
  const res = await apiClient.get<BlockedUsersResponse>('/users/me/blocks');
  return res.data.data.items;
}

/**
 * Requests a full export of the authenticated user's data and triggers a
 * browser download. The backend streams a JSON attachment; we read it as a
 * blob so the filename/Content-Disposition is preserved on save.
 */
export async function exportData(): Promise<void> {
  const res = await apiClient.post('/users/me/export', null, { responseType: 'blob' });
  const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data)], { type: 'application/json' });

  const disposition = res.headers?.['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] ?? 'viraha-export.json';

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Permanently deletes the authenticated user's account. The backend requires
 * the username to be re-typed as a confirmation guard before cascading the delete.
 */
export async function deleteAccount(confirmUsername: string): Promise<void> {
  await apiClient.delete('/users/me', { data: { confirmUsername } });
}
