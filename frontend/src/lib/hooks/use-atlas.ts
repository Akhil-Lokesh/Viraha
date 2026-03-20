'use client';

import { useQuery } from '@tanstack/react-query';
import { getAtlas, getSeasonalReflection } from '../api/atlas';

export function useAtlas() {
  return useQuery({
    queryKey: ['atlas'],
    queryFn: getAtlas,
    staleTime: 300_000,
  });
}

export function useSeasonalReflection() {
  return useQuery({
    queryKey: ['seasonal-reflection'],
    queryFn: getSeasonalReflection,
    staleTime: 300_000,
  });
}
