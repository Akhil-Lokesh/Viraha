import apiClient from './client';
import type { User } from '../types';

interface AuthApiResponse {
  success: boolean;
  data: {
    user: User;
  };
}

interface MeApiResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export async function register(data: { username: string; email: string; password: string; displayName?: string }): Promise<{ user: User }> {
  const res = await apiClient.post<AuthApiResponse>('/auth/register', data);
  return { user: res.data.data.user };
}

export async function login(data: { email: string; password: string }): Promise<{ user: User }> {
  const res = await apiClient.post<AuthApiResponse>('/auth/login', data);
  return { user: res.data.data.user };
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<MeApiResponse>('/auth/me');
  return res.data.data.user;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  await apiClient.post('/auth/change-password', data);
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, newPassword });
}
