'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Globe, Users, Trash2, Pencil, Images } from 'lucide-react';
import { useAlbum, useAlbumPosts, useDeleteAlbum } from '@/lib/hooks/use-albums';
import { useAuthStore } from '@/lib/stores/auth-store';
import { PostGrid } from '@/components/post/post-grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';
import type { Post } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const privacyIcons: Record<string, React.ReactNode> = {
  public: <Globe style={{ width: 14, height: 14 }} />,
  followers: <Users style={{ width: 14, height: 14 }} />,
  private: <Lock style={{ width: 14, height: 14 }} />,
};

const privacyLabels: Record<string, string> = {
  public: 'Public',
  followers: 'Followers',
  private: 'Private',
};

function AlbumDetailSkeleton() {
  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero skeleton */}
      <Box sx={{ position: 'relative', height: '40vh', minHeight: 280, mx: { xs: -2, md: 0 }, borderRadius: { xs: 0, md: '16px' }, overflow: 'hidden', mb: 4 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ position: 'absolute', inset: 0, height: '100%', width: '100%', borderRadius: 0 }} />
      </Box>
      {/* Title skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 256 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 384 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 80, borderRadius: '9999px' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 64, borderRadius: '9999px' }} />
        </Box>
      </Box>
      {/* Grid skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i}>
            <Box sx={{ aspectRatio: '4/3', borderRadius: '16px', bgcolor: 'action.selected' }} />
            <Box sx={{ px: 0.5, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ height: 16, bgcolor: 'action.selected', borderRadius: 1, width: '75%' }} />
              <Box sx={{ height: 12, bgcolor: 'action.selected', borderRadius: 1, width: '33%' }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: album, isLoading: albumLoading, error: albumError } = useAlbum(id);
  const { data: postsData, isLoading: postsLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAlbumPosts(id);
  const deleteAlbum = useDeleteAlbum();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const posts: Post[] =
    postsData?.pages
      .flatMap((page) => page.items)
      .map((ap) => ap.post)
      .filter((p): p is Post => !!p) ?? [];

  const isOwner = user && album && user.id === album.userId;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteAlbum.mutateAsync(id);
      router.push('/albums');
    } catch {
      // Error handled by React Query
    }
  };

  if (albumLoading) {
    return <AlbumDetailSkeleton />;
  }

  if (albumError || !album) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>Album not found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The album you are looking for does not exist or has been removed.
          </Typography>
          <Button variant="outlined" disableElevation onClick={() => router.push('/albums')}>
            Back to Albums
          </Button>
        </Box>
      </Box>
    );
  }

  const hasCover = !!album.coverImage;
  const coverUrl = album.coverImage ? resolveImageUrl(album.coverImage) : null;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '40vh',
          minHeight: 280,
          mx: { xs: -2, md: 0 },
          borderRadius: { xs: 0, md: '16px' },
          overflow: 'hidden',
          mb: 4,
        }}
      >
        {hasCover && coverUrl ? (
          <img
            src={coverUrl}
            alt={album.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(var(--mui-palette-primary-mainChannel)/0.2), rgba(var(--mui-palette-primary-mainChannel)/0.1), rgba(var(--mui-palette-primary-mainChannel)/0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Images style={{ width: 80, height: 80, color: 'rgba(var(--mui-palette-primary-mainChannel)/0.2)' }} />
          </Box>
        )}

        {/* Gradient overlay */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), rgba(0,0,0,0.1))' }} />

        {/* Back button */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <Button
            variant="text"
            disableElevation
            onClick={() => router.back()}
            sx={{
              minWidth: 'auto',
              p: 1,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)', color: 'white' },
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </Button>
        </Box>

        {/* Title overlay */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, p: { xs: 3, md: 4 } }}>
          <Typography
            component={motion.h1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' }, fontWeight: 'bold', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)', mb: 1 }}
          >
            {album.title}
          </Typography>
          {album.description && (
            <Typography
              component={motion.p}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', maxWidth: 576 }}
            >
              {album.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Meta row */}
      <Box
        component={motion.div}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip variant="filled" color="secondary" size="small" label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {privacyIcons[album.privacy] || privacyIcons.public}
              {privacyLabels[album.privacy] || album.privacy}
            </Box>
          } sx={{ borderRadius: 4, fontWeight: 500, fontSize: '0.75rem' }} />
          <Chip variant="outlined" size="small" label={`${album.postCount} ${album.postCount === 1 ? 'post' : 'posts'}`} sx={{ borderRadius: 4, fontWeight: 500, fontSize: '0.75rem' }} />
        </Box>

        {isOwner && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              disableElevation
              size="small"
              sx={{ borderRadius: '9999px' }}
              onClick={() => router.push(`/albums/${album.id}`)}
            >
              <Pencil style={{ width: 14, height: 14, marginRight: 6 }} />
              Edit
            </Button>
            <Button
              variant={confirmDelete ? 'contained' : 'outlined'}
              disableElevation
              size="small"
              color={confirmDelete ? 'error' : undefined}
              sx={{ borderRadius: '9999px' }}
              onClick={handleDelete}
              disabled={deleteAlbum.isPending}
            >
              <Trash2 style={{ width: 14, height: 14, marginRight: 6 }} />
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Posts */}
      {postsLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 3,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Box sx={{ aspectRatio: '4/3', borderRadius: '16px', bgcolor: 'action.selected' }} />
              <Box sx={{ px: 0.5, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ height: 16, bgcolor: 'action.selected', borderRadius: 1, width: '75%' }} />
                <Box sx={{ height: 12, bgcolor: 'action.selected', borderRadius: 1, width: '33%' }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <PostGrid posts={posts} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant="outlined"
                disableElevation
                size="large"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{ borderRadius: '9999px', px: 4 }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
