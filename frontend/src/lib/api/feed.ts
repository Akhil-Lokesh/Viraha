import apiClient from './client';
import type { Post } from '../types';

interface FeedResponse {
  success: boolean;
  data: {
    items: (Post & { isSaved: boolean })[];
    nextCursor: string | null;
  };
}

export interface FeedPage {
  items: (Post & { isSaved: boolean })[];
  nextCursor: string | null;
}

export async function getPersonalizedFeed(cursor?: string): Promise<FeedPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<FeedResponse>('/feed', { params });
  return res.data.data;
}

export async function getDiscoverFeed(cursor?: string): Promise<FeedPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<FeedResponse>('/feed/discover', { params });
  return res.data.data;
}
