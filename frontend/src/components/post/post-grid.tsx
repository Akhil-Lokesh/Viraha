'use client';

import { Box } from '@mui/material';
import type { Post } from '@/lib/types';
import { PostCard } from './post-card';
import { EmptyState } from '@/components/shared/empty-state';

export function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon="camera"
        title="No posts yet"
        description="When you or the people you follow share travel moments, they will appear here."
        actionLabel="Create your first post"
        actionHref="/create/post"
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column' }}>
      {posts.map((post) => (
        <Box key={post.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <PostCard post={post} />
        </Box>
      ))}
    </Box>
  );
}
