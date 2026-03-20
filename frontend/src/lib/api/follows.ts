import apiClient from './client';
import type { User } from '../types';

interface FollowApiResponse {
  success: boolean;
  data: {
    follow: { id: string; followerId: string; followingId: string; createdAt: string };
  };
}

interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
  };
}

interface UsersPageResponse {
  success: boolean;
  data: {
    items: User[];
    nextCursor: string | null;
  };
}

export interface UsersPage {
  items: User[];
  nextCursor: string | null;
}

export async function followUser(userId: string): Promise<void> {
  await apiClient.post<FollowApiResponse>(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/follow`);
}

export async function getFollowers(userId: string, cursor?: string): Promise<UsersPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<UsersPageResponse>(`/users/${userId}/followers`, { params });
  return res.data.data;
}

export async function getFollowing(userId: string, cursor?: string): Promise<UsersPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<UsersPageResponse>(`/users/${userId}/following`, { params });
  return res.data.data;
}

export async function checkFollowStatus(userId: string): Promise<boolean> {
  const res = await apiClient.get<FollowStatusResponse>(`/users/${userId}/follow/status`);
  return res.data.data.isFollowing;
}
