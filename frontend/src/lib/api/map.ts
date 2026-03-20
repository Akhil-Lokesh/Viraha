import apiClient from './client';
import type { MapMarkerData } from '../types';

interface MapMarkersResponse {
  success: boolean;
  data: { markers: MapMarkerData[] };
}

export async function getMapMarkers(params: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  type?: string;
  userId?: string;
}): Promise<MapMarkerData[]> {
  const res = await apiClient.get<MapMarkersResponse>('/map/markers', { params });
  return res.data.data.markers;
}
