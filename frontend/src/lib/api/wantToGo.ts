import apiClient from './client';

export interface WantToGoItem {
  id: string;
  userId: string;
  locationLat: number;
  locationLng: number;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  placeId: string | null;
  notes: string | null;
  status: 'dreaming' | 'planned' | 'visited';
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getWantToGo(status?: string): Promise<WantToGoItem[]> {
  const res = await apiClient.get('/want-to-go', { params: status ? { status } : {} });
  return res.data.data;
}

export async function createWantToGo(data: {
  locationLat: number;
  locationLng: number;
  locationName?: string;
  locationCity?: string;
  locationCountry?: string;
  placeId?: string;
  notes?: string;
}): Promise<WantToGoItem> {
  const res = await apiClient.post('/want-to-go', data);
  return res.data.data;
}

export async function updateWantToGo(id: string, data: { notes?: string; status?: string }): Promise<WantToGoItem> {
  const res = await apiClient.patch(`/want-to-go/${id}`, data);
  return res.data.data;
}

export async function deleteWantToGo(id: string): Promise<void> {
  await apiClient.delete(`/want-to-go/${id}`);
}
