import apiClient from './client';
import type { Activity } from '../types';

interface ActivitiesResponse {
  success: boolean;
  data: {
    items: Activity[];
    nextCursor: string | null;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface ActivitiesPage {
  items: Activity[];
  nextCursor: string | null;
}

export async function getActivities(cursor?: string): Promise<ActivitiesPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<ActivitiesResponse>('/activities', { params });
  return res.data.data;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/activities/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/activities/read-all');
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>('/activities/unread');
  return res.data.data.count;
}
