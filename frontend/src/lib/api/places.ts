import apiClient from './client';
import type { PlacePrediction, PlaceDetails } from '../types';

interface AutocompleteResponse {
  success: boolean;
  data: { predictions: PlacePrediction[] };
}

interface DetailsResponse {
  success: boolean;
  data: { place: PlaceDetails };
}

export async function autocomplete(input: string, lat?: number, lng?: number): Promise<PlacePrediction[]> {
  const params: Record<string, string> = { input };
  if (lat !== undefined) params.lat = String(lat);
  if (lng !== undefined) params.lng = String(lng);
  const res = await apiClient.get<AutocompleteResponse>('/places/autocomplete', { params });
  return res.data.data.predictions;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const res = await apiClient.get<DetailsResponse>(`/places/details/${placeId}`);
  return res.data.data.place;
}
