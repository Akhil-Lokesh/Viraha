'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrendingLocations, getTrendingTags, getFeaturedContent } from '../api/explore';

export function useTrendingLocations() {
  return useQuery({
    queryKey: ['explore', 'trending-locations'],
    queryFn: getTrendingLocations,
    staleTime: 5 * 60_000,
  });
}

export function useTrendingTags() {
  return useQuery({
    queryKey: ['explore', 'trending-tags'],
    queryFn: getTrendingTags,
    staleTime: 5 * 60_000,
  });
}

export function useFeaturedContent() {
  return useQuery({
    queryKey: ['explore', 'featured'],
    queryFn: () => getFeaturedContent(),
    staleTime: 5 * 60_000,
  });
}
