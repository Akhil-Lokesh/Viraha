import apiClient from './client';
import type { TrendingLocation } from '../types';

interface TrendingLocationsResponse {
  success: boolean;
  data: { locations: TrendingLocation[] };
}

export async function getTrendingLocations(): Promise<TrendingLocation[]> {
  const res = await apiClient.get<TrendingLocationsResponse>('/explore/trending-locations');
  return res.data.data.locations;
}

