import apiClient from './client';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '../types';

interface CommentApiResponse {
  success: boolean;
  data: {
    comment: Comment;
  };
}

interface CommentsPageResponse {
  success: boolean;
  data: {
    items: Comment[];
    nextCursor: string | null;
  };
}

export interface CommentsPage {
  items: Comment[];
  nextCursor: string | null;
}

export async function createComment(postId: string, data: CreateCommentInput): Promise<Comment> {
  const res = await apiClient.post<CommentApiResponse>(`/posts/${postId}/comments`, data);
  return res.data.data.comment;
}

export async function getComments(postId: string, cursor?: string): Promise<CommentsPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<CommentsPageResponse>(`/posts/${postId}/comments`, { params });
  return res.data.data;
}

export async function getReplies(commentId: string, cursor?: string): Promise<CommentsPage> {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<CommentsPageResponse>(`/comments/${commentId}/replies`, { params });
  return res.data.data;
}

export async function updateComment(commentId: string, data: UpdateCommentInput): Promise<Comment> {
  const res = await apiClient.patch<CommentApiResponse>(`/comments/${commentId}`, data);
  return res.data.data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
