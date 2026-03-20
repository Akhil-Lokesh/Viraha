import apiClient from './client';

export interface OnThisDayItem {
  id: string;
  type: 'post' | 'journal_entry';
  title: string;
  thumbnail: string | null;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  yearsAgo: number;
  originalDate: string;
  journalId?: string;
}

export interface VirahaMoment {
  id: string;
  type: string;
  title: string;
  description: string | null;
  referenceType: string;
  referenceId: string;
  thumbnail: string | null;
  locationName: string | null;
  yearsAgo: number | null;
  momentDate: string;
}

export interface PlaceHistory {
  posts: Array<{
    id: string;
    caption: string | null;
    mediaUrls: string[];
    mediaThumbnails: string[];
    locationName: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    postedAt: string;
    tags: string[];
  }>;
  journalEntries: Array<{
    id: string;
    title: string | null;
    mediaUrls: string[];
    locationName: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    date: string | null;
    mood: string | null;
    journalId: string;
    contentPreview: string | null;
  }>;
  placeNote: {
    id: string;
    note: string;
    updatedAt: string;
  } | null;
  stats: {
    totalPosts: number;
    totalEntries: number;
    firstVisit: string | null;
    totalVisits: number;
  };
}

export interface PlaceResonanceItem {
  locationCity: string;
  locationCountry: string;
  locationName: string | null;
  lat: number;
  lng: number;
  postCount: number;
  latestVisit: string;
  firstVisit: string;
  hasJournal: boolean;
  thumbnail: string | null;
  resonance: number;
}

export async function getOnThisDay(): Promise<OnThisDayItem[]> {
  const res = await apiClient.get('/viraha/on-this-day');
  return res.data.data;
}

export async function getMoments(): Promise<VirahaMoment[]> {
  const res = await apiClient.get('/viraha/moments');
  return res.data.data;
}

export async function dismissMoment(id: string): Promise<void> {
  await apiClient.patch(`/viraha/moments/${id}/dismiss`);
}

export async function getPlaceHistory(lat: number, lng: number, radius?: number): Promise<PlaceHistory> {
  const res = await apiClient.get('/viraha/places/history', { params: { lat, lng, radius } });
  return res.data.data;
}

export async function getPlaceResonance(): Promise<PlaceResonanceItem[]> {
  const res = await apiClient.get('/viraha/places/resonance');
  return res.data.data;
}

export async function upsertPlaceNote(data: {
  locationLat: number;
  locationLng: number;
  locationName?: string;
  locationCity?: string;
  locationCountry?: string;
  placeId?: string;
  note: string;
}): Promise<void> {
  await apiClient.put('/viraha/places/note', data);
}
