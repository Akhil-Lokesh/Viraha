import apiClient from './client';
import type { Post } from '../types';

interface ToggleSaveResponse {
  success: boolean;
  data: {
    saved: boolean;
    saveCount: number;
  };
}

interface SaveStatusResponse {
  success: boolean;
  data: {
    saved: boolean;
  };
}

interface SavedPostsResponse {
  success: boolean;
  data: {
    items: (Post & { savedAt: string })[];
    nextCursor: string | null;
  };
}

export interface SavedPostsPage {
  items: (Post & { savedAt: string })[];
  nextCursor: string | null;
}

export async function toggleSave(postId: string): Promise<{ saved: boolean; saveCount: number }> {
  const res = await apiClient.post<ToggleSaveResponse>(`/posts/${postId}/save`);
  return res.data.data;
}

export async function checkSaveStatus(postId: string): Promise<boolean> {
  const res = await apiClient.get<SaveStatusResponse>(`/posts/${postId}/save`);
  return res.data.data.saved;
}

export async function getSavedPosts(cursor?: string): Promise<SavedPostsPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<SavedPostsResponse>('/saves', { params });
  return res.data.data;
}
