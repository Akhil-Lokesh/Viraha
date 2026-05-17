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
