import apiClient from './client';
import type {
  Journal,
  JournalEntry,
  CreateJournalInput,
  UpdateJournalInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../types';

interface JournalResponse {
  success: boolean;
  data: { journal: Journal };
}

interface JournalsResponse {
  success: boolean;
  data: { items: Journal[]; nextCursor: string | null };
}

interface JournalEntryResponse {
  success: boolean;
  data: { entry: JournalEntry };
}

interface JournalEntriesResponse {
  success: boolean;
  data: { items: JournalEntry[]; nextCursor: string | null };
}

export interface JournalsPage {
  items: Journal[];
  nextCursor: string | null;
}

export interface JournalEntriesPage {
  items: JournalEntry[];
  nextCursor: string | null;
}

export async function getJournals(cursor?: string, userId?: string): Promise<JournalsPage> {
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  if (userId) params.userId = userId;
  const res = await apiClient.get<JournalsResponse>('/journals', { params });
  return res.data.data;
}

export async function getJournalById(id: string): Promise<Journal> {
  const res = await apiClient.get<JournalResponse>(`/journals/${id}`);
  return res.data.data.journal;
}

export async function getJournalBySlug(slug: string): Promise<Journal> {
  const res = await apiClient.get<JournalResponse>(`/journals/slug/${slug}`);
  return res.data.data.journal;
}

export async function createJournal(input: CreateJournalInput): Promise<Journal> {
  const res = await apiClient.post<JournalResponse>('/journals', input);
  return res.data.data.journal;
}

export async function updateJournal(id: string, input: UpdateJournalInput): Promise<Journal> {
  const res = await apiClient.patch<JournalResponse>(`/journals/${id}`, input);
  return res.data.data.journal;
}

export async function deleteJournal(id: string): Promise<void> {
  await apiClient.delete(`/journals/${id}`);
}

export async function getJournalEntries(journalId: string, cursor?: string): Promise<JournalEntriesPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<JournalEntriesResponse>(`/journals/${journalId}/entries`, { params });
  return res.data.data;
}

export async function createJournalEntry(journalId: string, input: CreateJournalEntryInput): Promise<JournalEntry> {
  const res = await apiClient.post<JournalEntryResponse>(`/journals/${journalId}/entries`, input);
  return res.data.data.entry;
}

export async function updateJournalEntry(journalId: string, entryId: string, input: UpdateJournalEntryInput): Promise<JournalEntry> {
  const res = await apiClient.patch<JournalEntryResponse>(`/journals/${journalId}/entries/${entryId}`, input);
  return res.data.data.entry;
}

export async function deleteJournalEntry(journalId: string, entryId: string): Promise<void> {
  await apiClient.delete(`/journals/${journalId}/entries/${entryId}`);
}
