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

  // Each card is a self-lit frame in the dark room — generous gaps, no dividers.
  // The index drives the orchestrated entrance stagger inside PostCard.
  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 4, py: 1 }}>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} />
      ))}
    </Box>
  );
}
