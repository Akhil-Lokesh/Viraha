'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Lock, Globe, Users, Trash2, Pencil, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useAlbum, useAlbumPosts, useDeleteAlbum } from '@/lib/hooks/use-albums';
import { useAuthStore } from '@/lib/stores/auth-store';
import { EmptyState } from '@/components/shared/empty-state';
import { GlowButton, PhotoTile, SectionLabel } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import Skeleton from '@mui/material/Skeleton';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';
import type { Post } from '@/lib/types';

const privacyIcons: Record<string, React.ReactNode> = {
  public: <Globe style={{ width: 13, height: 13 }} />,
  followers: <Users style={{ width: 13, height: 13 }} />,
  private: <Lock style={{ width: 13, height: 13 }} />,
};

const privacyLabels: Record<string, string> = {
  public: 'Public',
  followers: 'Followers',
  private: 'Private',
};

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) => format(new Date(d), 'MMM d, yyyy');
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt((start ?? end) as string);
}

function AlbumDetailSkeleton() {
  return (
    <Box sx={{ pb: 6, pt: { xs: 2, md: 4 } }}>
      {/* Meta skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 5 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 120, bgcolor: CIN.surface2 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 40, width: 280, bgcolor: CIN.surface2 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 384, bgcolor: CIN.surface2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 80, bgcolor: CIN.surface2 }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 64, bgcolor: CIN.surface2 }} />
        </Box>
      </Box>
      {/* Editorial grid skeleton: full-width hero + tiles */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        <Skeleton
          variant="rounded"
          animation="pulse"
          sx={{
            gridColumn: '1 / -1',
            aspectRatio: { xs: '16 / 10', md: '21 / 9' },
            width: '100%',
            height: 'auto',
            borderRadius: '14px',
            bgcolor: CIN.surface2,
          }}
        />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            animation="pulse"
            sx={{
              aspectRatio: '4 / 3',
              width: '100%',
              height: 'auto',
              borderRadius: '14px',
              bgcolor: CIN.surface2,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

/** One photo in the editorial grid — hero spans the full row; all link to the post. */
function PostTile({ post, hero }: { post: Post; hero: boolean }) {
  const reduceMotion = useReducedMotion();
  const img = hero
    ? post.mediaUrls?.[0] || post.mediaThumbnails?.[0]
    : post.mediaThumbnails?.[0] || post.mediaUrls?.[0];
  const location = post.locationCity || post.locationCountry || post.locationName;
  const dateLabel = format(new Date(post.takenAt ?? post.postedAt), 'MMM d, yyyy');

  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      sx={{
        gridColumn: hero ? '1 / -1' : 'auto',
        borderRadius: '14px',
        transition: 'box-shadow .2s ease',
        '&:hover': { boxShadow: glowRing(1) },
      }}
    >
      <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <PhotoTile
          src={img ?? ''}
          alt={post.caption || 'Travel memory'}
          sx={{ aspectRatio: hero ? { xs: '16 / 10', md: '21 / 9' } : '4 / 3' }}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: hero ? { xs: 2, md: 3 } : 1.75,
            }}
          >
            <Typography
              suppressHydrationWarning
              sx={{ ...eyebrowSx, fontSize: 10, color: 'rgba(255,255,255,0.65)' }}
            >
              {dateLabel}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mt: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: hero ? { xs: '1rem', md: '1.2rem' } : '0.9rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.caption || 'Untitled memory'}
              </Typography>
              {location && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                    maxWidth: 150,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.72rem',
                  }}
                >
                  <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                  <Box
                    component="span"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {location}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </PhotoTile>
      </Link>
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
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'Posterama, var(--font-body)',
              fontWeight: 700,
              fontSize: '1.4rem',
              color: CIN.text,
            }}
          >
            Album not found
          </Typography>
          <Typography variant="body2" sx={{ color: CIN.textMuted }}>
            The album you are looking for does not exist or has been removed.
          </Typography>
          <GlowButton variant="ghost" onClick={() => router.push('/albums')}>
            Back to Albums
          </GlowButton>
        </Box>
      </Box>
    );
  }

  const dateRange = formatDateRange(album.startDate, album.endDate);

  return (
    <Box sx={{ pb: 6, pt: { xs: 2, md: 4 } }}>
      {/* Meta — editorial header */}
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        sx={{ mb: 5 }}
      >
        <GlowButton
          variant="ghost"
          onClick={() => router.back()}
          sx={{ mb: 2.5, minWidth: 'auto', px: 1.5, py: 0.5, color: CIN.textMuted, '&:hover': { color: CIN.text } }}
        >
          <ArrowLeft style={{ width: 16, height: 16, marginRight: 6 }} />
          Back
        </GlowButton>

        <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>Photo Album</Typography>
        <Typography
          component="h1"
          sx={{ ...displaySx, fontSize: { xs: '2.25rem', md: '3rem' }, mb: 1 }}
        >
          {album.title}
        </Typography>
        {album.description && (
          <Typography sx={{ color: CIN.textMuted, fontSize: '1rem', maxWidth: 576, lineHeight: 1.6 }}>
            {album.description}
          </Typography>
        )}

        {/* Meta row: privacy + count + dates, owner actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mt: 2.5,
            pt: 2,
            borderTop: `1px solid ${CIN.hairline}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: CIN.textMuted,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {privacyIcons[album.privacy] || privacyIcons.public}
              {privacyLabels[album.privacy] || album.privacy}
            </Box>
            <Typography
              sx={{
                color: CIN.textMuted,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
            </Typography>
            {dateRange && (
              <Typography
                suppressHydrationWarning
                sx={{
                  color: CIN.textMuted,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {dateRange}
              </Typography>
            )}
          </Box>

          {isOwner && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GlowButton
                variant="ghost"
                size="small"
                onClick={() => router.push(`/albums/${album.id}/edit`)}
              >
                <Pencil style={{ width: 14, height: 14, marginRight: 6 }} />
                Edit
              </GlowButton>
              <GlowButton
                variant="ghost"
                size="small"
                onClick={handleDelete}
                disabled={deleteAlbum.isPending}
                sx={
                  confirmDelete
                    ? {
                        bgcolor: CIN.danger,
                        color: '#0B0B0F',
                        border: 'none',
                        '&:hover': { bgcolor: CIN.danger, boxShadow: `0 0 0 1px ${CIN.danger}` },
                      }
                    : { color: CIN.textMuted }
                }
              >
                <Trash2 style={{ width: 14, height: 14, marginRight: 6 }} />
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </GlowButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Posts — editorial dark grid: hero tile + supporting tiles */}
      {postsLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: { xs: 2.5, md: 3 },
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Box component={motion.div} variants={staggerItem} sx={{ gridColumn: '1 / -1' }}>
            <Skeleton
              variant="rounded"
              animation="pulse"
              sx={{
                aspectRatio: { xs: '16 / 10', md: '21 / 9' },
                borderRadius: '14px',
                width: '100%',
                height: 'auto',
                bgcolor: CIN.surface2,
              }}
            />
          </Box>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Skeleton
                variant="rounded"
                animation="pulse"
                sx={{
                  aspectRatio: '4 / 3',
                  borderRadius: '14px',
                  width: '100%',
                  height: 'auto',
                  bgcolor: CIN.surface2,
                }}
              />
            </Box>
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="camera"
          title="No posts in this album yet"
          description="Add posts to this album and they will appear here as an editorial grid."
          actionLabel="Create a post"
          actionHref="/create/post"
        />
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <SectionLabel>In this album</SectionLabel>
          <Box
            component={motion.div}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: { xs: 2.5, md: 3 },
            }}
          >
            {posts.map((post, i) => (
              <PostTile key={post.id} post={post} hero={i === 0} />
            ))}
          </Box>

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <GlowButton
                variant="ghost"
                size="large"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{ px: 4 }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </GlowButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
