import apiClient from './client';
import type { ApiResponse, User } from '../types';

interface UploadResult {
  urls: string[];
  thumbnails: string[];
}

export async function uploadPhotos(files: File[]): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file);
  });
  const res = await apiClient.post<ApiResponse<UploadResult>>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data!;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await apiClient.post<ApiResponse<{ user: User }>>('/media/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data!.user;
}
