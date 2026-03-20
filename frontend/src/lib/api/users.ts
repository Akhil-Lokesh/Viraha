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
