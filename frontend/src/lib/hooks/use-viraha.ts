'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOnThisDay,
  getMoments,
  dismissMoment,
  getPlaceHistory,
  getPlaceResonance,
  upsertPlaceNote,
} from '../api/viraha';

export function useOnThisDay() {
  return useQuery({
    queryKey: ['viraha', 'on-this-day'],
    queryFn: getOnThisDay,
    staleTime: 300_000, // 5 min
  });
}

export function useMoments() {
  return useQuery({
    queryKey: ['viraha', 'moments'],
    queryFn: getMoments,
    staleTime: 300_000,
  });
}

export function useDismissMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dismissMoment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['viraha', 'moments'] });
    },
  });
}

export function usePlaceHistory(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['viraha', 'place-history', lat, lng],
    queryFn: () => getPlaceHistory(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 120_000,
  });
}

export function usePlaceResonance() {
  return useQuery({
    queryKey: ['viraha', 'place-resonance'],
    queryFn: getPlaceResonance,
    staleTime: 300_000,
  });
}

export function useUpsertPlaceNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertPlaceNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['viraha', 'place-history'] });
    },
  });
}
