import apiClient from './client';
import type { TrendingLocation, TrendingTag, Post } from '../types';

interface TrendingLocationsResponse {
  success: boolean;
  data: { locations: TrendingLocation[] };
}

interface TrendingTagsResponse {
  success: boolean;
  data: { tags: TrendingTag[] };
}

interface FeaturedResponse {
  success: boolean;
  data: { items: Post[]; nextCursor: string | null };
}

export async function getTrendingLocations(): Promise<TrendingLocation[]> {
  const res = await apiClient.get<TrendingLocationsResponse>('/explore/trending-locations');
  return res.data.data.locations;
}

export async function getTrendingTags(): Promise<TrendingTag[]> {
  const res = await apiClient.get<TrendingTagsResponse>('/explore/trending-tags');
  return res.data.data.tags;
}

export async function getFeaturedContent(cursor?: string): Promise<{ items: Post[]; nextCursor: string | null }> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<FeaturedResponse>('/explore/featured', { params });
  return res.data.data;
}
