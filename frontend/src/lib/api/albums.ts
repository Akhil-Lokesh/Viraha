import apiClient from './client';
import type { Album, AlbumPost, CreateAlbumInput, UpdateAlbumInput } from '../types';

interface AlbumResponse {
  success: boolean;
  data: { album: Album };
}

interface AlbumsResponse {
  success: boolean;
  data: { items: Album[]; nextCursor: string | null };
}

interface AlbumPostsResponse {
  success: boolean;
  data: { items: (AlbumPost & { post: import('../types').Post & { user?: import('../types').User } })[]; nextCursor: string | null };
}

interface AlbumPostResponse {
  success: boolean;
  data: { albumPost: AlbumPost };
}

export interface AlbumsPage {
  items: Album[];
  nextCursor: string | null;
}

export interface AlbumPostsPage {
  items: AlbumPost[];
  nextCursor: string | null;
}

export async function getAlbums(cursor?: string, userId?: string): Promise<AlbumsPage> {
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  if (userId) params.userId = userId;
  const res = await apiClient.get<AlbumsResponse>('/albums', { params });
  return res.data.data;
}

export async function getAlbumById(id: string): Promise<Album> {
  const res = await apiClient.get<AlbumResponse>(`/albums/${id}`);
  return res.data.data.album;
}

export async function getAlbumBySlug(slug: string): Promise<Album> {
  const res = await apiClient.get<AlbumResponse>(`/albums/slug/${slug}`);
  return res.data.data.album;
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const res = await apiClient.post<AlbumResponse>('/albums', input);
  return res.data.data.album;
}

export async function updateAlbum(id: string, input: UpdateAlbumInput): Promise<Album> {
  const res = await apiClient.patch<AlbumResponse>(`/albums/${id}`, input);
  return res.data.data.album;
}

export async function deleteAlbum(id: string): Promise<void> {
  await apiClient.delete(`/albums/${id}`);
}

export async function getAlbumPosts(albumId: string, cursor?: string): Promise<AlbumPostsPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<AlbumPostsResponse>(`/albums/${albumId}/posts`, { params });
  return res.data.data;
}

export async function addPostToAlbum(albumId: string, postId: string): Promise<AlbumPost> {
  const res = await apiClient.post<AlbumPostResponse>(`/albums/${albumId}/posts`, { postId });
  return res.data.data.albumPost;
}

export async function removePostFromAlbum(albumId: string, postId: string): Promise<void> {
  await apiClient.delete(`/albums/${albumId}/posts/${postId}`);
}
