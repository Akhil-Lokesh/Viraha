import apiClient from './client';

export interface Journey {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  startDate: string;
  endDate: string | null;
  status: 'auto' | 'confirmed' | 'edited';
  createdAt: string;
  updatedAt: string;
  journeyPosts?: JourneyPost[];
}

export interface JourneyPost {
  id: string;
  journeyId: string;
  postId: string;
  sortOrder: number;
  post?: {
    id: string;
    caption: string | null;
    mediaUrls: string[];
    mediaThumbnails: string[];
    locationName: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    locationLat: number;
    locationLng: number;
    postedAt: string;
    tags?: string[];
  };
}

export async function getJourneys(status?: string): Promise<Journey[]> {
  const res = await apiClient.get('/journeys', { params: status ? { status } : {} });
  return res.data.data;
}

export async function getJourney(id: string): Promise<Journey> {
  const res = await apiClient.get(`/journeys/${id}`);
  return res.data.data;
}

export async function updateJourney(id: string, data: { title?: string; description?: string; coverImage?: string }): Promise<Journey> {
  const res = await apiClient.patch(`/journeys/${id}`, data);
  return res.data.data;
}

export async function confirmJourney(id: string): Promise<Journey> {
  const res = await apiClient.post(`/journeys/${id}/confirm`);
  return res.data.data;
}

export async function deleteJourney(id: string): Promise<void> {
  await apiClient.delete(`/journeys/${id}`);
}

export async function detectJourneys(): Promise<{ journeysCreated: number }> {
  const res = await apiClient.post('/journeys/detect');
  return res.data.data;
}
