import apiClient from './client';
import type { Post } from '../types';

interface TravelModeResponse {
  success: boolean;
  data: {
    mode: string;
    currentLat: number | null;
    currentLng: number | null;
    homeLat: number | null;
    homeLng: number | null;
    homeCity: string | null;
    homeCountry: string | null;
  };
}

interface NearbyFeedResponse {
  success: boolean;
  data: {
    items: Post[];
    nextCursor: string | null;
    meta: {
      lat: number;
      lng: number;
      radius: number;
    };
  };
}

export interface TravelModeState {
  mode: string;
  currentLat: number | null;
  currentLng: number | null;
  homeLat: number | null;
  homeLng: number | null;
  homeCity: string | null;
  homeCountry: string | null;
}

export interface NearbyFeedPage {
  items: Post[];
  nextCursor: string | null;
}

export async function getTravelMode(): Promise<TravelModeState> {
  const res = await apiClient.get<TravelModeResponse>('/travel/mode');
  return res.data.data;
}

export async function updateTravelMode(input: {
  mode: 'local' | 'traveling';
  currentLat?: number;
  currentLng?: number;
}): Promise<TravelModeState> {
  const res = await apiClient.put<TravelModeResponse>('/travel/mode', input);
  return res.data.data;
}

export async function getNearbyFeed(params: {
  lat: number;
  lng: number;
  radius?: number;
  cursor?: string;
}): Promise<NearbyFeedPage> {
  const res = await apiClient.get<NearbyFeedResponse>('/travel/nearby', { params });
  return res.data.data;
}
