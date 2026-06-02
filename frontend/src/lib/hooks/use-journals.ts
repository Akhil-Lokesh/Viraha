'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getJournals,
  getJournalById,
  getJournalBySlug,
  getJournalEntries,
  createJournal,
  updateJournal,
  deleteJournal,
  publishJournal,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../api/journals';
import type {
  CreateJournalInput,
  UpdateJournalInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../types';

export function useJournals(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['journals', 'list', userId],
    queryFn: ({ pageParam }) => getJournals(pageParam as string | undefined, userId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: ['journals', 'detail', id],
    queryFn: () => getJournalById(id),
    enabled: !!id,
  });
}

export function useJournalBySlug(slug: string) {
  return useQuery({
    queryKey: ['journals', 'slug', slug],
    queryFn: () => getJournalBySlug(slug),
    enabled: !!slug,
  });
}

export function useJournalEntries(journalId: string) {
  return useInfiniteQuery({
    queryKey: ['journals', 'entries', journalId],
    queryFn: ({ pageParam }) => getJournalEntries(journalId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!journalId,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJournalInput) => createJournal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJournalInput }) => updateJournal(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJournal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function usePublishJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishJournal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ journalId, input }: { journalId: string; input: CreateJournalEntryInput }) =>
      createJournalEntry(journalId, input),
    onSuccess: (_data, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'entries', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', journalId] });
      // entryCount / wordCount are shown on the journals grid — refresh the list too.
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ journalId, entryId, input }: { journalId: string; entryId: string; input: UpdateJournalEntryInput }) =>
      updateJournalEntry(journalId, entryId, input),
    onSuccess: (_data, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'entries', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', journalId] });
      // entryCount / wordCount are shown on the journals grid — refresh the list too.
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ journalId, entryId }: { journalId: string; entryId: string }) =>
      deleteJournalEntry(journalId, entryId),
    onSuccess: (_data, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', 'entries', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journals', 'detail', journalId] });
      // entryCount / wordCount are shown on the journals grid — refresh the list too.
      queryClient.invalidateQueries({ queryKey: ['journals', 'list'] });
    },
  });
}
