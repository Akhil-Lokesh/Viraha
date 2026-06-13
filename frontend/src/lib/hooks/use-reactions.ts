'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleLike } from '../api/reactions';

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
