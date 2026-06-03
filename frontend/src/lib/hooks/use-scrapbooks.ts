'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getScrapbooks,
  getScrapbookById,
  createScrapbook,
  updateScrapbook,
  deleteScrapbook,
  addScrapbookItem,
  removeScrapbookItem,
} from '../api/scrapbooks';
import type {
  CreateScrapbookInput,
  UpdateScrapbookInput,
  AddScrapbookItemInput,
} from '../api/scrapbooks';

export function useScrapbooks() {
  return useQuery({
    queryKey: ['scrapbooks'],
    queryFn: () => getScrapbooks(),
  });
}

export function useScrapbook(id: string) {
  return useQuery({
    queryKey: ['scrapbooks', id],
    queryFn: () => getScrapbookById(id),
    enabled: !!id,
  });
}

export function useCreateScrapbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScrapbookInput) => createScrapbook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrapbooks'] });
    },
  });
}

export function useUpdateScrapbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateScrapbookInput }) =>
      updateScrapbook(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scrapbooks'] });
      queryClient.invalidateQueries({ queryKey: ['scrapbooks', variables.id] });
    },
  });
}

export function useDeleteScrapbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScrapbook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrapbooks'] });
    },
  });
}

export function useAddScrapbookItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scrapbookId,
      input,
    }: {
      scrapbookId: string;
      input: AddScrapbookItemInput;
    }) => addScrapbookItem(scrapbookId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scrapbooks'] });
      queryClient.invalidateQueries({ queryKey: ['scrapbooks', variables.scrapbookId] });
    },
  });
}

export function useRemoveScrapbookItem() {
  const queryClient = useQueryClient();
  return useMutation({
    // scrapbookId is supplied so the detail query can be invalidated precisely.
    mutationFn: ({ itemId }: { itemId: string; scrapbookId?: string }) =>
      removeScrapbookItem(itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scrapbooks'] });
      if (variables.scrapbookId) {
        queryClient.invalidateQueries({ queryKey: ['scrapbooks', variables.scrapbookId] });
      }
    },
  });
}
