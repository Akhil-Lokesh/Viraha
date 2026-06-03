import apiClient from './client';

export type ScrapbookItemType = 'saved_post' | 'note' | 'link' | 'place_pin';

export interface ScrapbookItem {
  id: string;
  scrapbookId: string;
  itemType: ScrapbookItemType;
  referenceId: string | null;
  content: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Scrapbook {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on list responses (preview of first items + total count).
  items?: ScrapbookItem[];
  _count?: { items: number };
}

export interface CreateScrapbookInput {
  title: string;
  description?: string;
  coverImage?: string;
}

export interface UpdateScrapbookInput {
  title?: string;
  description?: string | null;
  coverImage?: string | null;
}

export interface AddScrapbookItemInput {
  itemType: ScrapbookItemType;
  referenceId?: string;
  content?: string;
}

interface ScrapbooksResponse {
  success: boolean;
  data: Scrapbook[];
}

interface ScrapbookResponse {
  success: boolean;
  data: Scrapbook;
}

interface ScrapbookItemResponse {
  success: boolean;
  data: ScrapbookItem;
}

export async function getScrapbooks(): Promise<Scrapbook[]> {
  const res = await apiClient.get<ScrapbooksResponse>('/scrapbooks');
  return res.data.data;
}

export async function getScrapbookById(id: string): Promise<Scrapbook> {
  const res = await apiClient.get<ScrapbookResponse>(`/scrapbooks/${id}`);
  return res.data.data;
}

export async function createScrapbook(input: CreateScrapbookInput): Promise<Scrapbook> {
  const res = await apiClient.post<ScrapbookResponse>('/scrapbooks', input);
  return res.data.data;
}

export async function updateScrapbook(id: string, input: UpdateScrapbookInput): Promise<Scrapbook> {
  const res = await apiClient.patch<ScrapbookResponse>(`/scrapbooks/${id}`, input);
  return res.data.data;
}

export async function deleteScrapbook(id: string): Promise<void> {
  await apiClient.delete(`/scrapbooks/${id}`);
}

export async function addScrapbookItem(
  scrapbookId: string,
  input: AddScrapbookItemInput
): Promise<ScrapbookItem> {
  const res = await apiClient.post<ScrapbookItemResponse>(
    `/scrapbooks/${scrapbookId}/items`,
    input
  );
  return res.data.data;
}

export async function removeScrapbookItem(itemId: string): Promise<void> {
  await apiClient.delete(`/scrapbooks/items/${itemId}`);
}
