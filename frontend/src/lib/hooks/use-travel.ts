'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getTravelMode, updateTravelMode, getNearbyFeed } from '../api/travel';
import { useTravelStore } from '../stores/travel-store';

export function useTravelMode() {
  const setMode = useTravelStore((s) => s.setMode);
  return useQuery({
    queryKey: ['travel', 'mode'],
    queryFn: async () => {
      const data = await getTravelMode();
      // Sync with local store
      setMode(
        data.mode as 'local' | 'traveling',
        data.currentLat,
        data.currentLng
      );
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateTravelMode() {
  const queryClient = useQueryClient();
  const setMode = useTravelStore((s) => s.setMode);
  return useMutation({
    mutationFn: updateTravelMode,
    onMutate: async (variables) => {
      // Optimistically update the local store immediately
      setMode(variables.mode, variables.currentLat, variables.currentLng);
    },
    onSuccess: (data) => {
      setMode(
        data.mode as 'local' | 'traveling',
        data.currentLat,
        data.currentLng
      );
      queryClient.invalidateQueries({ queryKey: ['travel'] });
    },
    onError: () => {
      // Keep optimistic state — will sync on next successful fetch
    },
  });
}

export function useNearbyFeed(lat?: number | null, lng?: number | null, radius?: number) {
  return useInfiniteQuery({
    queryKey: ['feed', 'nearby', lat, lng, radius],
    queryFn: ({ pageParam }) =>
      getNearbyFeed({
        lat: lat!,
        lng: lng!,
        radius,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: lat != null && lng != null,
  });
}
