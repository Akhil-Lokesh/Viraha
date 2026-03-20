'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJourneys,
  getJourney,
  updateJourney,
  confirmJourney,
  deleteJourney,
  detectJourneys,
} from '../api/journeys';

export function useJourneys(status?: string) {
  return useQuery({
    queryKey: ['journeys', status],
    queryFn: () => getJourneys(status),
    staleTime: 60_000,
  });
}

export function useJourney(id: string | null) {
  return useQuery({
    queryKey: ['journey', id],
    queryFn: () => getJourney(id!),
    enabled: !!id,
  });
}

export function useUpdateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; coverImage?: string }) =>
      updateJourney(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useConfirmJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmJourney,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useDeleteJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJourney,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useDetectJourneys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: detectJourneys,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}
