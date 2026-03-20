import apiClient from './client';

export interface TimeCapsule {
  id: string;
  userId: string;
  content: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  type: 'departure' | 'letter_to_self';
  sealedAt: string;
  openAt: string;
  isOpened: boolean;
  isOpenable: boolean;
  openedAt: string | null;
  createdAt: string;
}

export async function getTimeCapsules(includeSealed?: boolean): Promise<TimeCapsule[]> {
  const res = await apiClient.get('/time-capsules', { params: includeSealed ? { includeSealed: 'true' } : {} });
  return res.data.data;
}

export async function createTimeCapsule(data: {
  content: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  type?: string;
  openAt: string;
}): Promise<TimeCapsule> {
  const res = await apiClient.post('/time-capsules', data);
  return res.data.data;
}

export async function openTimeCapsule(id: string): Promise<TimeCapsule> {
  const res = await apiClient.post(`/time-capsules/${id}/open`);
  return res.data.data;
}
