import apiClient from './client';
import type { Post, CreatePostInput, UpdatePostInput } from '../types';

interface PostsApiResponse {
  success: boolean;
  data: {
    items: Post[];
    nextCursor: string | null;
  };
}

interface PostApiResponse {
  success: boolean;
  data: {
    post: Post;
  };
}

export interface PostsPage {
  items: Post[];
  nextCursor: string | null;
}

export async function getPosts(cursor?: string, userId?: string): Promise<PostsPage> {
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  if (userId) params.userId = userId;
  const res = await apiClient.get<PostsApiResponse>('/posts', { params });
  return res.data.data;
}

export async function getPostById(id: string): Promise<Post> {
  const res = await apiClient.get<PostApiResponse>(`/posts/${id}`);
  return res.data.data.post;
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  const res = await apiClient.post<PostApiResponse>('/posts', data);
  return res.data.data.post;
}

export async function updatePost(id: string, data: UpdatePostInput): Promise<Post> {
  const res = await apiClient.patch<PostApiResponse>(`/posts/${id}`, data);
  return res.data.data.post;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}

export async function searchPosts(q: string, cursor?: string): Promise<PostsPage> {
  const params: Record<string, string> = { q };
  if (cursor) params.cursor = cursor;
  const res = await apiClient.get<PostsApiResponse>('/posts/search', { params });
  return res.data.data;
}
