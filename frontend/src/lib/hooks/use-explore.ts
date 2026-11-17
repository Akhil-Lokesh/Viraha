'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrendingLocations } from '../api/explore';

export function useTrendingLocations() {
  return useQuery({
    queryKey: ['explore', 'trending-locations'],
    queryFn: getTrendingLocations,
    staleTime: 5 * 60_000,
  });
}

