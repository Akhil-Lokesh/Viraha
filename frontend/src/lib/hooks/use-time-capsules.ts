'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTimeCapsules, createTimeCapsule, openTimeCapsule } from '../api/timeCapsules';

export function useTimeCapsules(includeSealed?: boolean) {
  return useQuery({
    queryKey: ['time-capsules', includeSealed],
    queryFn: () => getTimeCapsules(includeSealed),
    staleTime: 60_000,
  });
}

export function useCreateTimeCapsule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTimeCapsule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-capsules'] });
    },
  });
}

export function useOpenTimeCapsule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: openTimeCapsule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-capsules'] });
    },
  });
}
