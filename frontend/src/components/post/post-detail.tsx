'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Share2, MessageCircle, MessageCircleOff, Send, Loader2, FolderPlus, MoreVertical, Flag, Pencil, Trash2, MessageSquare, MapPin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useComments, useCreateComment, useReplies, useUpdateComment, useDeleteComment } from '@/lib/hooks/use-comments';
import { useUpdatePost } from '@/lib/hooks/use-posts';
import { useToggleSave } from '@/lib/hooks/use-saves';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/lib/hooks/use-follows';
import { useAuth } from '@/lib/hooks/use-auth';
import { AddToAlbumDialog } from '@/components/album/add-to-album-dialog';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { fadeInUp, fadeIn } from '@/lib/animations';
import { CinemaCard, PhotoTile, GlowButton } from '@/components/cinema';
import { CIN, eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import { getCoordinates, formatCoordinates } from './keepsake';
import type { Post, Comment } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

/** Dark-glass circular control used over the hero photo. */
const heroButtonSx = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  bgcolor: 'rgba(11,11,15,0.55)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${CIN.hairline}`,
  color: CIN.text,
  '&:hover': { bgcolor: 'rgba(11,11,15,0.8)', color: CIN.text },
} as const;

/** Counts a stat up from 0 on mount; respects prefers-reduced-motion. */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{display}</span>;
}

function CommentBody({
  comment,
  isOwner,
  onEdit,
  onDelete,
  isDeleting,
  compact = false,
}: {
  comment: Comment;
  isOwner: boolean;
  onEdit: (text: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);

  function handleSaveEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.text) {
      setEditing(false);
      return;
    }
    onEdit(trimmed);
    setEditing(false);
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Link href={`/profile/${comment.user?.username ?? 'unknown'}`} style={{ textDecoration: 'none' }}>
          <Typography
            sx={{
              fontSize: compact ? '0.8125rem' : '0.875rem',
              fontWeight: 500,
              color: 'text.primary',
              '&:hover': { textDecoration: 'underline' },
              textUnderlineOffset: 2,
            }}
          >
            {comment.user?.displayName ?? comment.user?.username ?? 'Unknown'}
          </Typography>
        </Link>
        <Typography suppressHydrationWarning sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </Typography>
        {isOwner && !editing && (
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              aria-label="Edit comment"
              onClick={() => { setDraft(comment.text); setEditing(true); }}
              sx={{ color: 'text.secondary', '&:hover': { color: CIN.accent } }}
            >
              <Pencil style={{ height: 13, width: 13 }} />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete comment"
              onClick={onDelete}
              disabled={isDeleting}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              {isDeleting ? (
                <Loader2 style={{ height: 13, width: 13, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 style={{ height: 13, width: 13 }} />
              )}
            </IconButton>
          </Box>
        )}
      </Box>

      {editing ? (
        <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            multiline
            minRows={1}
            variant="outlined"
            size="small"
            fullWidth
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '0.875rem',
                bgcolor: CIN.surface2,
                '& fieldset': { borderColor: CIN.hairline },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="contained" disableElevation onClick={handleSaveEdit} sx={{ fontSize: '0.75rem' }}>
              Save
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => { setEditing(false); setDraft(comment.text); }}
              sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: compact ? '0.8125rem' : '0.875rem',
            color: 'text.primary',
            opacity: 0.8,
            mt: 0.25,
            lineHeight: 1.625,
          }}
        >
          {comment.text}
        </Typography>
      )}
    </Box>
  );
}

function CommentItem({
  comment,
  postId,
  authUserId,
  allowComments,
}: {
  comment: Comment;
  postId: string;
  authUserId: string | undefined;
  allowComments: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyValue, setReplyValue] = useState('');

  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const createReply = useCreateComment(postId);

  const repliesQuery = useReplies(comment.id);
  const replies: Comment[] = repliesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const isOwner = !!authUserId && authUserId === comment.userId;
  const replyCount = comment.replyCount ?? 0;

  function handleEdit(text: string) {
    updateComment.mutate(
      { commentId: comment.id, data: { text } },
      { onError: () => toast.error('Failed to update comment') },
    );
  }

  function handleDelete() {
    deleteComment.mutate(comment.id, {
      onError: () => toast.error('Failed to delete comment'),
    });
  }

  function handleReplySubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = replyValue.trim();
    if (!trimmed) return;
    createReply.mutate(
      { text: trimmed, parentId: comment.id },
      {
        onSuccess: () => {
          setReplyValue('');
          setReplyOpen(false);
          setShowReplies(true);
          repliesQuery.refetch();
        },
        onError: () => toast.error('Failed to post reply'),
      },
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <UserAvatar
        src={comment.user?.avatar ?? null}
        username={comment.user?.username ?? 'unknown'}
        displayName={comment.user?.displayName ?? null}
        size="sm"
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <CommentBody
          comment={comment}
          isOwner={isOwner}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteComment.isPending}
        />

        {/* Reply / view-replies controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
          {allowComments && authUserId && (
            <Button
              size="small"
              variant="text"
              onClick={() => setReplyOpen((v) => !v)}
              startIcon={<MessageSquare size={12} />}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary', minWidth: 0, p: 0 }}
            >
              Reply
            </Button>
          )}
          {replyCount > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={() => setShowReplies((v) => !v)}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary', minWidth: 0, p: 0 }}
            >
              {showReplies ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </Button>
          )}
        </Box>

        {/* Reply composer */}
        {replyOpen && (
          <Box
            component="form"
            onSubmit={handleReplySubmit}
            sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TextField
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              placeholder="Write a reply..."
              variant="outlined"
              size="small"
              fullWidth
              autoFocus
              disabled={createReply.isPending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '9999px',
                  height: 36,
                  fontSize: '0.8125rem',
                  bgcolor: CIN.surface2,
                  '& fieldset': { borderColor: CIN.hairline },
                },
              }}
            />
            <IconButton
              type="submit"
              size="small"
              aria-label="Post reply"
              disabled={createReply.isPending || !replyValue.trim()}
              sx={{ color: 'text.secondary', '&:hover': { color: CIN.accent } }}
            >
              {createReply.isPending ? (
                <Loader2 style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ height: 14, width: 14 }} />
              )}
            </IconButton>
          </Box>
        )}

        {/* Replies list */}
        {showReplies && (
          <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: `1px solid ${CIN.hairline}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {repliesQuery.isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
              </Box>
            ) : repliesQuery.isError ? (
              <Typography sx={{ fontSize: '0.8125rem', color: 'error.main', py: 0.5 }}>
                Failed to load replies.
              </Typography>
            ) : replies.length === 0 ? (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', py: 0.5 }}>
                No replies yet.
              </Typography>
            ) : (
              replies.map((reply) => {
                const replyIsOwner = !!authUserId && authUserId === reply.userId;
                return (
                  <ReplyRow
                    key={reply.id}
                    reply={reply}
                    isOwner={replyIsOwner}
                  />
                );
              })
            )}
            {repliesQuery.hasNextPage && (
              <Button
                size="small"
                variant="text"
                onClick={() => repliesQuery.fetchNextPage()}
                disabled={repliesQuery.isFetchingNextPage}
                sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary', alignSelf: 'flex-start', minWidth: 0, p: 0 }}
              >
                {repliesQuery.isFetchingNextPage ? 'Loading...' : 'Load more replies'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ReplyRow({ reply, isOwner }: { reply: Comment; isOwner: boolean }) {
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  return (
    <Box sx={{ display: 'flex', gap: 1.25 }}>
      <UserAvatar
        src={reply.user?.avatar ?? null}
        username={reply.user?.username ?? 'unknown'}
        displayName={reply.user?.displayName ?? null}
        size="sm"
      />
      <CommentBody
        comment={reply}
        isOwner={isOwner}
        onEdit={(text) =>
          updateComment.mutate(
            { commentId: reply.id, data: { text } },
            { onError: () => toast.error('Failed to update reply') },
          )
        }
        onDelete={() =>
          deleteComment.mutate(reply.id, {
            onError: () => toast.error('Failed to delete reply'),
          })
        }
        isDeleting={deleteComment.isPending}
        compact
      />
    </Box>
  );
}

export function PostDetail({ post }: { post: Post }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [commentValue, setCommentValue] = useState('');
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  // The ReportDialog self-manages its open state via its trigger element. We keep
  // that trigger OUTSIDE the Menu (so closing the Menu doesn't unmount the dialog)
  // and click it programmatically from the in-menu "Report" row.
  const reportTriggerRef = useRef<HTMLButtonElement>(null);

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

  // Post owner controls
  const updatePost = useUpdatePost();
  function handleToggleComments() {
    updatePost.mutate(
      { id: post.id, data: { allowComments: !post.allowComments } },
      {
        onSuccess: () => {
          toast.success(post.allowComments ? 'Comments disabled' : 'Comments enabled');
        },
        onError: () => {
          toast.error('Could not update post');
        },
      },
    );
  }

  // Follow
  const isOwnPost = authUser?.id === post.user?.id;
  const followStatus = useFollowStatus(post.user?.id ?? '');
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const isFollowing = followStatus.data ?? false;
  // Avoid flicker: only show the follow button once the status query has resolved,
  // and never on the current user's own posts.
  const canShowFollowButton =
    !isOwnPost && isAuthenticated && !followStatus.isLoading;

  // Flatten paginated comments
  const comments: Comment[] =
    commentsData?.pages.flatMap((page) => page.items) ?? [];

  const location = [post.locationName, post.locationCity, post.locationCountry]
    .filter(Boolean)
    .join(', ');

  // The backend redacts hidden locations: lat/lng arrive as null while
  // city/country remain. Such posts get a muted "Approximate location"
  // microlabel instead of coordinates and no map affordances.
  const coords = getCoordinates(post.locationLat, post.locationLng);
  const hasCoords = coords !== null;
  const isApproximateLocation =
    !hasCoords && !!(post.locationCity || post.locationCountry);

  const heroSource = post.mediaUrls[currentPhoto] ?? '';

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
        onError: () => {
          toast.error('Failed to post comment');
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
      {/* -- Hero: the photo is the light source --------------------------- */}
      <Box
        sx={{
          position: 'relative',
          height: '70vh',
          minHeight: 500,
          width: '100%',
          overflow: 'hidden',
          bgcolor: CIN.surface,
        }}
      >
        {heroSource && (
          <motion.div
            key={currentPhoto}
            style={{ position: 'absolute', inset: 0 }}
            initial={reduceMotion ? false : { opacity: 0.4, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <PhotoTile
              src={heroSource}
              alt={post.caption || 'Travel photo'}
              rounded={0}
              sx={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        )}

        {/* Top scrim so the glass controls stay legible */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(11,11,15,0.55), rgba(11,11,15,0) 32%)',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />

        {/* Click-to-lightbox layer (below the controls) */}
        {heroSource && (
          <Box
            component="button"
            type="button"
            aria-label="View photo fullscreen"
            onClick={() => setLightboxOpen(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              bgcolor: 'transparent',
              border: 'none',
              p: 0,
              cursor: 'zoom-in',
            }}
          />
        )}

        {/* Back button -- top left */}
        <motion.div
          style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}
          initial={reduceMotion ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <IconButton
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/explore');
              }
            }}
            aria-label="Go back"
            sx={{ ...heroButtonSx, width: 44, height: 44 }}
          >
            <ArrowLeft style={{ height: 20, width: 20 }} />
          </IconButton>
        </motion.div>

        {/* Photo count badge -- top right */}
        {post.mediaUrls.length > 1 && (
          <motion.div
            style={{ position: 'absolute', top: 24, right: 24, zIndex: 20 }}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box
              component="span"
              sx={{
                ...eyebrowSx,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: '9999px',
                bgcolor: 'rgba(11,11,15,0.6)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${CIN.hairline}`,
                px: 1.75,
                py: 0.75,
                color: CIN.text,
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
              <IconButton
                onClick={() => setCurrentPhoto((p) => p - 1)}
                aria-label="Previous photo"
                sx={{
                  ...heroButtonSx,
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                }}
              >
                <ChevronLeft style={{ height: 20, width: 20 }} />
              </IconButton>
            )}
            {currentPhoto < post.mediaUrls.length - 1 && (
              <IconButton
                onClick={() => setCurrentPhoto((p) => p + 1)}
                aria-label="Next photo"
                sx={{
                  ...heroButtonSx,
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                }}
              >
                <ChevronRight style={{ height: 20, width: 20 }} />
              </IconButton>
            )}
            {/* Dot indicators */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 96,
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
                      ? { width: 24, height: 8, bgcolor: CIN.accent }
                      : {
                          width: 8,
                          height: 8,
                          bgcolor: 'rgba(255,255,255,0.45)',
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
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <IconButton
            component={motion.button}
            whileTap={reduceMotion ? undefined : { scale: 0.85 }}
            sx={{
              ...heroButtonSx,
              ...(isSaved && {
                bgcolor: CIN.accent,
                color: '#0B0B0F',
                boxShadow: glowRing(0),
                '&:hover': { bgcolor: CIN.accent, color: '#0B0B0F' },
              }),
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
              component={motion.button}
              whileTap={reduceMotion ? undefined : { scale: 0.85 }}
              sx={heroButtonSx}
              aria-label="Add to Album"
              onClick={() => setAlbumDialogOpen(true)}
            >
              <FolderPlus style={{ height: 18, width: 18 }} />
            </IconButton>
          )}
          <IconButton
            component={motion.button}
            whileTap={reduceMotion ? undefined : { scale: 0.85 }}
            sx={heroButtonSx}
            aria-label="Share"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/post/${post.id}`,
                );
                toast.success('Link copied');
              } catch {
                toast.error('Failed to copy link');
              }
            }}
          >
            <Share2 style={{ height: 18, width: 18 }} />
          </IconButton>
          {isAuthenticated && !isOwnPost && (
            <>
              <IconButton
                sx={heroButtonSx}
                aria-label="More options"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreVertical style={{ height: 18, width: 18 }} />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: '12px',
                      bgcolor: CIN.surface2,
                      border: `1px solid ${CIN.hairline}`,
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    reportTriggerRef.current?.click();
                  }}
                  sx={{ fontSize: '0.875rem', color: CIN.danger, gap: 1 }}
                >
                  <Flag size={16} />
                  Report post
                </MenuItem>
              </Menu>
            </>
          )}
        </motion.div>
      </Box>

      {/* -- Content surface overlapping the hero -------------------------- */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          marginTop: -72,
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 1100,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 48,
        }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <CinemaCard hover={false} sx={{ p: { xs: 3, md: 5 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
              columnGap: { lg: 6 },
            }}
          >
            {/* ── Main column ─────────────────────────────────── */}
            <Box sx={{ minWidth: 0 }}>
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
                            color: CIN.text,
                            '&:hover': { textDecoration: 'underline' },
                            textUnderlineOffset: 2,
                          }}
                        >
                          {post.user.displayName || post.user.username}
                        </Typography>
                      </Link>
                      <Typography suppressHydrationWarning sx={{ fontSize: '0.75rem', color: CIN.textMuted }}>
                        @{post.user.username}
                        <Box component="span" sx={{ mx: 0.75, opacity: 0.4 }}>&middot;</Box>
                        {format(new Date(post.postedAt), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                  {canShowFollowButton && (
                    <GlowButton
                      variant={isFollowing ? 'ghost' : 'solid'}
                      size="small"
                      sx={{ borderRadius: '9999px', px: 2.5, py: 0.5, fontSize: '0.75rem' }}
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
                    </GlowButton>
                  )}
                </Box>
              )}

              {/* Location microlabels: coordinates, place, or approximate notice */}
              {(hasCoords || isApproximateLocation || location) && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
                  {location && (
                    <Box
                      component="span"
                      sx={{
                        ...eyebrowSx,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.25,
                        py: 0.5,
                        border: `1px solid ${CIN.hairline}`,
                        bgcolor: CIN.surface2,
                        borderRadius: '9999px',
                        color: CIN.text,
                        fontSize: '0.625rem',
                        maxWidth: '100%',
                      }}
                    >
                      <MapPin style={{ height: 11, width: 11, color: CIN.accent, flexShrink: 0 }} />
                      <Box
                        component="span"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {location}
                      </Box>
                    </Box>
                  )}

                  {coords ? (
                    <Typography component="span" sx={{ ...eyebrowSx, fontSize: '0.625rem' }}>
                      {formatCoordinates(coords.lat, coords.lng)}
                    </Typography>
                  ) : isApproximateLocation ? (
                    /* Redacted location: muted microlabel, no coordinates, no map affordances */
                    <Typography component="span" sx={{ ...eyebrowSx, fontSize: '0.625rem', opacity: 0.8 }}>
                      Approximate location
                    </Typography>
                  ) : null}
                </Box>
              )}

              {/* Caption */}
              {post.caption && (
                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontWeight: 300,
                    color: CIN.text,
                    mb: 3,
                  }}
                >
                  {post.caption}
                </Typography>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {post.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: '9999px',
                        border: '1px solid rgba(139,124,255,0.35)',
                        color: CIN.accent,
                        fontWeight: 600,
                        px: 0.5,
                        fontSize: '0.7rem',
                        bgcolor: 'rgba(139,124,255,0.08)',
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Engagement stats — numbers count up on first view */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: { xs: 0, lg: 3 } }}>
                <Box component="span" sx={{ ...eyebrowSx, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <MessageCircle style={{ height: 14, width: 14, color: CIN.accent }} />
                  <Box component="span" sx={{ color: CIN.text, fontWeight: 600 }}>
                    <CountUp value={post.commentCount} />
                  </Box>
                  comments
                </Box>
                <Box component="span" sx={{ ...eyebrowSx, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Bookmark style={{ height: 14, width: 14, color: CIN.accent }} />
                  <Box component="span" sx={{ color: CIN.text, fontWeight: 600 }}>
                    <CountUp value={post.saveCount} />
                  </Box>
                  saves
                </Box>
              </Box>
            </Box>

            {/* ── Side column: comments (stacks below on mobile) ─ */}
            <Box
              sx={{
                minWidth: 0,
                borderLeft: { lg: `1px solid ${CIN.hairline}` },
                pl: { lg: 4 },
                mt: { xs: 0, lg: 0.5 },
              }}
            >
              {/* Hairline divider between content and comments (stacked layout) */}
              <Box
                aria-hidden="true"
                sx={{
                  display: { xs: 'block', lg: 'none' },
                  borderTop: `1px solid ${CIN.hairline}`,
                  my: 3.5,
                }}
              />

              {/* -- Comments Section ------------------------------------------ */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Typography component="h2" sx={{ ...eyebrowSx }}>
                    Comments
                    <Box component="span" sx={{ ml: 1, color: CIN.accent, fontWeight: 600 }}>
                      {post.commentCount}
                    </Box>
                  </Typography>
                  {isOwnPost && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleToggleComments}
                      disabled={updatePost.isPending}
                      startIcon={post.allowComments ? <MessageCircleOff size={14} /> : <MessageCircle size={14} />}
                      sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary' }}
                    >
                      {post.allowComments ? 'Disable comments' : 'Enable comments'}
                    </Button>
                  )}
                </Box>

                {commentsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                    <Loader2 style={{ height: 20, width: 20, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
                  </Box>
                ) : comments.length === 0 ? (
                  <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', py: 2 }}>
                    {post.allowComments
                      ? 'No comments yet. Be the first to share your thoughts.'
                      : 'Comments are disabled on this post.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        whileHover={reduceMotion ? undefined : { x: 2 }}
                        transition={{ delay: Math.min(index, 10) * 0.05 }}
                      >
                        <CommentItem
                          comment={comment}
                          postId={post.id}
                          authUserId={authUser?.id}
                          allowComments={post.allowComments}
                        />
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

                {/* Comment input -- only if authenticated AND comments enabled on this post */}
                {isAuthenticated && post.allowComments && (
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
                            bgcolor: CIN.surface2,
                            '& fieldset': { borderColor: CIN.hairline },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
                            '&.Mui-focused fieldset': { borderColor: CIN.accent },
                          },
                        }}
                        disabled={createComment.isPending}
                      />
                      <IconButton
                        type="submit"
                        aria-label="Post comment"
                        sx={{
                          width: 24,
                          height: 24,
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'text.secondary',
                          '&:hover': { color: CIN.accent },
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
          </Box>
        </CinemaCard>
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

      {/* Report dialog — trigger lives outside the Menu so closing the Menu does
          not unmount the open dialog. It is activated via reportTriggerRef. */}
      {isAuthenticated && !isOwnPost && (
        <ReportDialog
          targetType="post"
          targetId={post.id}
          trigger={
            <Box
              component="button"
              type="button"
              ref={reportTriggerRef}
              aria-hidden="true"
              tabIndex={-1}
              sx={{
                position: 'absolute',
                width: 1,
                height: 1,
                p: 0,
                m: -1,
                overflow: 'hidden',
                border: 0,
                clip: 'rect(0 0 0 0)',
              }}
            />
          }
        />
      )}
    </Box>
  );
}
