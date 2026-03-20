'use client';

import { useQuery } from '@tanstack/react-query';
import { getMapMarkers } from '../api/map';

export function useMapMarkers(params: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  type?: string;
  userId?: string;
} | null) {
  return useQuery({
    queryKey: ['map-markers', params],
    queryFn: () => getMapMarkers(params!),
    enabled: !!params,
    staleTime: 60_000,
  });
}
