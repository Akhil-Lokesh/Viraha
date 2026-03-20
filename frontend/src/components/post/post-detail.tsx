'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Share2, MessageCircle, Send, Loader2, FolderPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Box, Typography, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LocationBadge } from '@/components/shared/location-badge';
import { useComments, useCreateComment } from '@/lib/hooks/use-comments';
import { useToggleSave } from '@/lib/hooks/use-saves';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/lib/hooks/use-follows';
import { useAuth } from '@/lib/hooks/use-auth';
import { AddToAlbumDialog } from '@/components/album/add-to-album-dialog';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { fadeInUp, fadeIn } from '@/lib/animations';
import type { Post, Comment } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function PostDetail({ post }: { post: Post }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [commentValue, setCommentValue] = useState('');
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Auth
  const { user: authUser, isAuthenticated } = useAuth();

  // Comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments(post.id);
  const createComment = useCreateComment(post.id);

  // Save
  const toggleSave = useToggleSave();

  // Follow
  const isOwnPost = authUser?.id === post.user?.id;
  const followStatus = useFollowStatus(post.user?.id ?? '');
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const isFollowing = followStatus.data ?? false;

  // Flatten paginated comments
  const comments: Comment[] =
    commentsData?.pages.flatMap((page) => page.items) ?? [];

  const location = [post.locationName, post.locationCity, post.locationCountry]
    .filter(Boolean)
    .join(', ');

  const heroImage = post.mediaUrls[currentPhoto]
    ? getImageUrl(post.mediaUrls[currentPhoto])
    : undefined;

  function handleSave() {
    setIsSaved((prev) => !prev);
    toggleSave.mutate(post.id, {
      onError: () => {
        setIsSaved((prev) => !prev);
      },
    });
  }

  function handleFollow() {
    if (!post.user) return;
    if (isFollowing) {
      unfollowUser.mutate(post.user.id);
    } else {
      followUser.mutate(post.user.id);
    }
  }

  function handleCommentSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = commentValue.trim();
    if (!trimmed) return;

    createComment.mutate(
      { text: trimmed },
      {
        onSuccess: () => {
          setCommentValue('');
        },
      },
    );
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', mx: { xs: -2, md: 0 }, mt: { xs: -3, md: 0 } }}>
      {/* -- Hero Section ------------------------------------------------- */}
      <Box
        sx={{
          position: 'relative',
          height: '70vh',
          minHeight: 500,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Full-bleed background image */}
        {heroImage && (
          <motion.img
            src={heroImage}
            alt={post.caption || 'Travel photo'}
            style={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            onClick={() => setLightboxOpen(true)}
          />
        )}

        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3))',
          }}
        />

        {/* Back button -- top left */}
        <motion.div
          style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <IconButton
            component={Link}
            href="/"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' },
            }}
          >
            <ArrowLeft style={{ height: 20, width: 20 }} />
          </IconButton>
        </motion.div>

        {/* Photo count badge -- top right */}
        {post.mediaUrls.length > 1 && (
          <motion.div
            style={{ position: 'absolute', top: 24, right: 24, zIndex: 20 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: '9999px',
                bgcolor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                px: 1.75,
                py: 0.75,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#fff',
              }}
            >
              {currentPhoto + 1}/{post.mediaUrls.length}
            </Box>
          </motion.div>
        )}

        {/* Photo navigation arrows */}
        {post.mediaUrls.length > 1 && (
          <>
            {currentPhoto > 0 && (
              <Box
                component="button"
                onClick={() => setCurrentPhoto((p) => p - 1)}
                aria-label="Previous photo"
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  height: 40,
                  width: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                  transition: 'background-color 0.2s',
                }}
              >
                <ChevronLeft style={{ height: 20, width: 20 }} />
              </Box>
            )}
            {currentPhoto < post.mediaUrls.length - 1 && (
              <Box
                component="button"
                onClick={() => setCurrentPhoto((p) => p + 1)}
                aria-label="Next photo"
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  height: 40,
                  width: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                  transition: 'background-color 0.2s',
                }}
              >
                <ChevronRight style={{ height: 20, width: 20 }} />
              </Box>
            )}
            {/* Dot indicators */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              {post.mediaUrls.map((_, idx) => (
                <Box
                  key={idx}
                  component="button"
                  onClick={() => setCurrentPhoto(idx)}
                  aria-label={`Go to photo ${idx + 1}`}
                  sx={{
                    borderRadius: '9999px',
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    p: 0,
                    ...(idx === currentPhoto
                      ? { width: 24, height: 8, bgcolor: '#fff' }
                      : {
                          width: 8,
                          height: 8,
                          bgcolor: 'rgba(255,255,255,0.5)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.7)' },
                        }),
                  }}
                />
              ))}
            </Box>
          </>
        )}

        {/* Bottom hero content -- action buttons */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <IconButton
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              bgcolor: isSaved ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' },
            }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
            onClick={handleSave}
          >
            <Bookmark
              style={{ height: 18, width: 18 }}
              fill={isSaved ? 'currentColor' : 'none'}
            />
          </IconButton>
          {isAuthenticated && (
            <IconButton
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' },
              }}
              aria-label="Add to Album"
              onClick={() => setAlbumDialogOpen(true)}
            >
              <FolderPlus style={{ height: 18, width: 18 }} />
            </IconButton>
          )}
          <IconButton
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' },
            }}
            aria-label="Share"
          >
            <Share2 style={{ height: 18, width: 18 }} />
          </IconButton>
        </motion.div>
      </Box>

      {/* -- Content Card ------------------------------------------------- */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          marginTop: -80,
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 672,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 48,
        }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 6,
            p: { xs: 3, md: 5 },
            boxShadow: 6,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* User row */}
          {post.user && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <UserAvatar
                  src={post.user.avatar}
                  username={post.user.username}
                  displayName={post.user.displayName}
                  size="md"
                />
                <Box>
                  <Link
                    href={`/profile/${post.user.username}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        '&:hover': { textDecoration: 'underline' },
                        textUnderlineOffset: 2,
                      }}
                    >
                      {post.user.displayName || post.user.username}
                    </Typography>
                  </Link>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    @{post.user.username}
                    <Box component="span" sx={{ mx: 0.75, opacity: 0.4 }}>&middot;</Box>
                    {format(new Date(post.postedAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
              {!isOwnPost && isAuthenticated && (
                <Button
                  variant={isFollowing ? 'contained' : 'outlined'}
                  color={isFollowing ? 'secondary' : undefined}
                  size="small"
                  disableElevation
                  sx={{
                    borderRadius: '9999px',
                    px: 2.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                  onClick={handleFollow}
                  disabled={followUser.isPending || unfollowUser.isPending}
                >
                  {followUser.isPending || unfollowUser.isPending ? (
                    <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite' }} />
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </Button>
              )}
            </Box>
          )}

          {/* Caption */}
          {post.caption && (
            <Typography
              sx={{
                fontSize: '1.125rem',
                lineHeight: 1.625,
                whiteSpace: 'pre-wrap',
                fontWeight: 300,
                color: 'text.primary',
                opacity: 0.9,
                mb: 3,
              }}
            >
              {post.caption}
            </Typography>
          )}

          {/* Location */}
          {location && (
            <Box sx={{ mb: 2 }}>
              <LocationBadge location={location} variant="subtle" />
            </Box>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {post.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  variant="filled"
                  color="secondary"
                  size="small"
                  sx={{
                    borderRadius: '9999px',
                    fontWeight: 400,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Box>
          )}

          {/* Engagement stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.875rem', color: 'text.secondary', mb: 3 }}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <MessageCircle style={{ height: 16, width: 16 }} />
              {post.commentCount} comments
            </Box>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Bookmark style={{ height: 16, width: 16 }} />
              {post.saveCount} saves
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* -- Comments Section ------------------------------------------ */}
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 2.5 }}>
              Comments
              <Box component="span" sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 400, color: 'text.secondary' }}>
                ({post.commentCount})
              </Box>
            </Typography>

            {commentsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Loader2 style={{ height: 20, width: 20, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
              </Box>
            ) : comments.length === 0 ? (
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', py: 2 }}>
                No comments yet. Be the first to share your thoughts.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    style={{ display: 'flex', gap: 12 }}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 * index }}
                  >
                    <UserAvatar
                      src={comment.user?.avatar ?? null}
                      username={comment.user?.username ?? 'unknown'}
                      displayName={comment.user?.displayName ?? null}
                      size="sm"
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Link
                          href={`/profile/${comment.user?.username ?? 'unknown'}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: 'text.primary',
                              '&:hover': { textDecoration: 'underline' },
                              textUnderlineOffset: 2,
                            }}
                          >
                            {comment.user?.displayName ?? comment.user?.username ?? 'Unknown'}
                          </Typography>
                        </Link>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: 'text.primary',
                          opacity: 0.8,
                          mt: 0.25,
                          lineHeight: 1.625,
                        }}
                      >
                        {comment.text}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}

                {/* Load more comments */}
                {hasNextPage && (
                  <Box sx={{ pt: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      disableElevation
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        '&:hover': { color: 'text.primary' },
                      }}
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite', marginRight: 6 }} />
                          Loading...
                        </>
                      ) : (
                        'Load more comments'
                      )}
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Comment input -- only if authenticated */}
            {isAuthenticated && (
              <Box
                component="form"
                onSubmit={handleCommentSubmit}
                sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
              >
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <TextField
                    value={commentValue}
                    onChange={(e) => setCommentValue(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Add a comment..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '9999px',
                        height: 40,
                        fontSize: '0.875rem',
                        pr: 5,
                        bgcolor: 'action.hover',
                        '& fieldset': { borderColor: 'divider' },
                      },
                    }}
                    disabled={createComment.isPending}
                  />
                  <IconButton
                    type="submit"
                    sx={{
                      width: 24,
                      height: 24,
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                    disabled={createComment.isPending || !commentValue.trim()}
                  >
                    {createComment.isPending ? (
                      <Loader2 style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Send style={{ height: 14, width: 14 }} />
                    )}
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Add to Album dialog */}
      <AddToAlbumDialog
        postId={post.id}
        open={albumDialogOpen}
        onOpenChange={setAlbumDialogOpen}
      />

      {/* Image lightbox */}
      <ImageLightbox
        images={post.mediaUrls.map(getImageUrl)}
        initialIndex={currentPhoto}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Box>
  );
}
