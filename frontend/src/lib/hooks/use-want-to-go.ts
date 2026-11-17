'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWantToGo, createWantToGo, deleteWantToGo } from '../api/wantToGo';

export function useWantToGo(status?: string) {
  return useQuery({
    queryKey: ['want-to-go', status],
    queryFn: () => getWantToGo(status),
    staleTime: 60_000,
  });
}

export function useCreateWantToGo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWantToGo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['want-to-go'] });
    },
  });
}

export function useDeleteWantToGo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWantToGo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['want-to-go'] });
    },
  });
}
