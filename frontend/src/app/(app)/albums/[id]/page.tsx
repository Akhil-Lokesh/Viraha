'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Globe, Users, Trash2, Pencil, Images, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useAlbum, useAlbumPosts, useDeleteAlbum } from '@/lib/hooks/use-albums';
import { useAuthStore } from '@/lib/stores/auth-store';
import { EmptyState } from '@/components/shared/empty-state';
import Button from '@mui/material/Button';
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

const GOLD = 'var(--viraha-gold, #D4A843)';

const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD,
} as const;

const stampChipSx = (rotate: number) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    transform: `rotate(${rotate}deg)`,
    border: `1.5px solid ${GOLD}`,
    color: GOLD,
    borderRadius: '4px',
    px: 1.25,
    py: 0.5,
    fontFamily: 'var(--font-brand)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  }) as const;

const privacyIcons: Record<string, React.ReactNode> = {
  public: <Globe style={{ width: 12, height: 12 }} />,
  followers: <Users style={{ width: 12, height: 12 }} />,
  private: <Lock style={{ width: 12, height: 12 }} />,
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
      <Box sx={{ position: 'relative', height: '40vh', minHeight: 280, mx: { xs: -2, md: 0 }, borderRadius: { xs: 0, md: '6px' }, overflow: 'hidden', mb: 4 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ position: 'absolute', inset: 0, height: '100%', width: '100%', borderRadius: 0 }} />
      </Box>
      {/* Title skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 256 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 384 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 80, borderRadius: '4px' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 64, borderRadius: '4px' }} />
        </Box>
      </Box>
      {/* Editorial spread skeleton — varied tile sizes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ gridColumn: { sm: 'span 2' }, aspectRatio: '16/10', borderRadius: '4px' }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/5', borderRadius: '4px' }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/5', borderRadius: '4px' }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/5', borderRadius: '4px' }} />
      </Box>
    </Box>
  );
}

/** One photo in the editorial spread — postcard treatment, links to the post. */
function SpreadTile({ post, index }: { post: Post; index: number }) {
  const isHero = index === 0;
  // Every 7th supporting tile gets a wide panoramic slot to break the grid rhythm.
  const isWide = !isHero && index % 7 === 3;
  const img = isHero
    ? post.mediaUrls?.[0] || post.mediaThumbnails?.[0]
    : post.mediaThumbnails?.[0] || post.mediaUrls?.[0];
  const imgUrl = img ? resolveImageUrl(img) : null;
  const location = post.locationCity || post.locationCountry || post.locationName;
  const dateLabel = format(new Date(post.takenAt ?? post.postedAt), 'MMM d, yyyy').toUpperCase();
  const rotate = isHero ? 0 : index % 2 === 0 ? -0.6 : 0.6;

  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      whileHover={{ rotate: isHero ? -0.4 : rotate * -1.5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      sx={{
        gridColumn: { sm: isHero || isWide ? 'span 2' : 'span 1' },
      }}
    >
      <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <Box
          sx={(theme) => ({
            transform: `rotate(${rotate}deg)`,
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.22)' : 'rgba(34,28,24,0.25)',
            bgcolor:
              theme.palette.mode === 'dark' ? 'var(--viraha-paper-dark, #1D1828)' : '#FFFDF6',
            boxShadow: '3px 3px 0 rgba(34,28,24,0.1)',
            transition: 'box-shadow 0.3s',
            '&:hover': { boxShadow: '4px 5px 0 rgba(34,28,24,0.16)' },
            '&:hover .spread-img': { transform: 'scale(1.03)' },
          })}
        >
          {/* Photo */}
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              m: '6px',
              mb: 0,
              borderRadius: '2px',
              aspectRatio: isHero ? '16/9' : isWide ? '16/8' : '4/3',
            }}
          >
            {imgUrl ? (
              <Box
                component="img"
                className="spread-img"
                src={imgUrl}
                alt={post.caption || 'Travel memory'}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s',
                }}
              />
            ) : (
              <Box
                sx={(theme) => ({
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(242,234,217,0.25)'
                      : 'rgba(34,28,24,0.25)',
                  borderRadius: '2px',
                  bgcolor: 'rgba(212,168,67,0.06)',
                })}
              >
                <Images style={{ width: 32, height: 32, color: GOLD, opacity: 0.55 }} />
              </Box>
            )}
          </Box>

          {/* Postcard bottom strip */}
          <Box sx={{ px: 1.75, pt: 1.25, pb: 1.5 }}>
            <Typography sx={{ ...eyebrowSx, fontSize: '9.5px', color: 'text.secondary' }}>
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
                  fontSize: isHero ? '0.95rem' : '0.85rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.caption || 'Untitled memory'}
              </Typography>
              {location && (
                <Box sx={{ ...stampChipSx(2), px: 0.75, py: 0.25, flexShrink: 0, maxWidth: 140 }}>
                  <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
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
        </Box>
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
          <Typography sx={{ fontFamily: 'var(--font-accent)', fontSize: '1.5rem', color: 'text.primary' }}>
            Album not found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The album you are looking for does not exist or has been removed.
          </Typography>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => router.push('/albums')}
            sx={{
              borderRadius: '4px',
              borderColor: GOLD,
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
            }}
          >
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
      {/* Hero — framed like the album's opening plate */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          height: '40vh',
          minHeight: 280,
          mx: { xs: -2, md: 0 },
          borderRadius: { xs: 0, md: '6px' },
          overflow: 'hidden',
          mb: 4,
          border: { xs: 'none', md: '1px solid' },
          borderColor: {
            md: theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.22)' : 'rgba(34,28,24,0.25)',
          },
          boxShadow: { md: '4px 4px 0 rgba(34,28,24,0.1)' },
        })}
      >
        {hasCover && coverUrl ? (
          <img
            src={coverUrl}
            alt={album.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={(theme) => ({
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'var(--viraha-paper-dark, #1D1828)'
                  : 'var(--viraha-paper, #FAF6EE)',
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(34,28,24,0.02) 0px, rgba(34,28,24,0.02) 1px, transparent 1px, transparent 3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Images style={{ width: 80, height: 80, color: GOLD, opacity: 0.35 }} />
          </Box>
        )}

        {/* Gradient overlay */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,16,12,0.65), rgba(20,16,12,0.2), rgba(20,16,12,0.05))' }} />

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
              bgcolor: 'rgba(20,16,12,0.35)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(20,16,12,0.55)', color: 'white' },
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </Button>
        </Box>

        {/* Title overlay */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, p: { xs: 3, md: 4 } }}>
          <Typography
            component={motion.p}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            sx={{ ...eyebrowSx, color: GOLD, mb: 0.75 }}
          >
            Photo Album
          </Typography>
          <Typography
            component={motion.h1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            sx={{
              fontFamily: 'var(--font-accent)',
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.1,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              mb: 1,
            }}
          >
            {album.title}
          </Typography>
          {album.description && (
            <Typography
              component={motion.p}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', maxWidth: 576 }}
            >
              {album.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Meta row — stamps + owner actions */}
      <Box
        component={motion.div}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={stampChipSx(-1.5)}>
            {privacyIcons[album.privacy] || privacyIcons.public}
            {privacyLabels[album.privacy] || album.privacy}
          </Box>
          <Box
            sx={(theme) => ({
              ...stampChipSx(1.5),
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.35)' : 'rgba(34,28,24,0.35)',
              color: 'text.secondary',
            })}
          >
            {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
          </Box>
        </Box>

        {isOwner && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              disableElevation
              size="small"
              sx={{
                borderRadius: '4px',
                borderColor: GOLD,
                color: 'text.primary',
                fontWeight: 600,
                '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
              }}
              onClick={() => router.push(`/albums/${album.id}/edit`)}
            >
              <Pencil style={{ width: 14, height: 14, marginRight: 6 }} />
              Edit
            </Button>
            <Button
              variant={confirmDelete ? 'contained' : 'outlined'}
              disableElevation
              size="small"
              color={confirmDelete ? 'error' : undefined}
              sx={{ borderRadius: '4px', ...(confirmDelete ? {} : { borderColor: 'divider', color: 'text.secondary' }) }}
              onClick={handleDelete}
              disabled={deleteAlbum.isPending}
            >
              <Trash2 style={{ width: 14, height: 14, marginRight: 6 }} />
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Posts — editorial photo spread */}
      {postsLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Box component={motion.div} variants={staggerItem} sx={{ gridColumn: { sm: 'span 2' } }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '16/10', borderRadius: '4px', width: '100%', height: 'auto' }} />
          </Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/3', borderRadius: '4px', width: '100%', height: 'auto' }} />
            </Box>
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="camera"
          title="No stamps in this album yet"
          description="Add posts to this album and they will appear here as an editorial spread."
          actionLabel="Create a post"
          actionHref="/create/post"
        />
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <Box
            component={motion.div}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: { xs: 3, md: 3.5 },
              gridAutoFlow: 'dense',
            }}
          >
            {posts.map((post, i) => (
              <SpreadTile key={post.id} post={post} index={i} />
            ))}
          </Box>

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant="outlined"
                disableElevation
                size="large"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{
                  borderRadius: '4px',
                  px: 4,
                  borderColor: GOLD,
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
                }}
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
