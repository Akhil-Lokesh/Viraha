import apiClient from './client';

interface ToggleLikeResponse {
  success: boolean;
  data: {
    liked: boolean;
    likeCount: number;
  };
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await apiClient.post<ToggleLikeResponse>(`/posts/${postId}/like`);
  return res.data.data;
}
