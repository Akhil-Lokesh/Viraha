'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, Share2, MessageCircle, MessageCircleOff, Send, Loader2, FolderPlus, MoreVertical, Flag, Pencil, Trash2, MessageSquare, MapPin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Box, Typography, useTheme } from '@mui/material';
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
import {
  GOLD,
  paper,
  ink,
  inkMuted,
  hairline,
  hardShadow,
  grain,
  EYEBROW_SX,
  hasCoordinates,
  formatCoordinates,
} from './keepsake';
import type { Post, Comment } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
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
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </Typography>
        {isOwner && !editing && (
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              aria-label="Edit comment"
              onClick={() => { setDraft(comment.text); setEditing(true); }}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem' } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9999px', height: 36, fontSize: '0.8125rem' } }}
            />
            <IconButton
              type="submit"
              size="small"
              aria-label="Post reply"
              disabled={createReply.isPending || !replyValue.trim()}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
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
          <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

/**
 * Ticket-stub divider: perforation line with notched edges. The notches use
 * the page background color so they read as punched-out semicircles.
 */
function TicketDivider({ isDark, sx }: { isDark: boolean; sx?: object }) {
  const notch = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    bgcolor: 'background.default',
    border: `1px solid ${hairline(isDark)}`,
    flexShrink: 0,
  } as const;

  return (
    <Box
      aria-hidden="true"
      sx={{ display: 'flex', alignItems: 'center', my: 3.5, ...sx }}
    >
      <Box sx={{ ...notch, ml: { xs: -4.25, md: -6.25 } }} />
      <Box
        sx={{
          flex: 1,
          mx: 1.5,
          borderTop: `2px dashed ${isDark ? 'rgba(212,168,67,0.35)' : 'rgba(212,168,67,0.55)'}`,
        }}
      />
      <Box sx={{ ...notch, mr: { xs: -4.25, md: -6.25 } }} />
    </Box>
  );
}

export function PostDetail({ post }: { post: Post }) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
  // city/country remain. Such posts get an "Approximate location" stamp
  // instead of coordinates and no map affordances.
  const hasCoords = hasCoordinates(post.locationLat, post.locationLng);
  const isApproximateLocation =
    !hasCoords && !!(post.locationCity || post.locationCountry);

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

        {/* Gradient overlay — warm ink-plum wash */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(22,18,31,0.72), rgba(22,18,31,0.2) 50%, rgba(22,18,31,0.32))',
            pointerEvents: 'none',
          }}
        />

        {/* Postcard inset frame */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: { xs: 12, md: 20 },
            border: '1px solid rgba(250,246,238,0.35)',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 5,
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
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/explore');
              }
            }}
            aria-label="Go back"
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
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    reportTriggerRef.current?.click();
                  }}
                  sx={{ fontSize: '0.875rem', color: 'error.main', gap: 1 }}
                >
                  <Flag size={16} />
                  Report post
                </MenuItem>
              </Menu>
            </>
          )}
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
          maxWidth: 1040,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 48,
        }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* Postcard surface: warm paper, hairline border, hard offset shadow */}
        <Box
          sx={{
            bgcolor: paper(isDark),
            backgroundImage: grain(isDark),
            borderRadius: '8px',
            p: { xs: 3, md: 5 },
            boxShadow: hardShadow(isDark),
            border: `1px solid ${hairline(isDark)}`,
          }}
        >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' },
            columnGap: { md: 6 },
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
              {canShowFollowButton && (
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

          {/* Coordinates eyebrow + passport-stamp location */}
          {(hasCoords || isApproximateLocation || location) && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
              {hasCoords ? (
                <Typography component="span" sx={{ ...EYEBROW_SX, color: inkMuted(isDark) }}>
                  {formatCoordinates(post.locationLat, post.locationLng)}
                </Typography>
              ) : isApproximateLocation ? (
                /* Redacted location: approximate stamp, no coordinates, no map affordances */
                <Box
                  component="span"
                  sx={{
                    ...EYEBROW_SX,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.4,
                    border: `1.5px dashed ${GOLD}`,
                    borderRadius: '3px',
                    transform: 'rotate(-1.5deg)',
                    color: GOLD,
                    fontSize: '0.625rem',
                  }}
                >
                  <MapPin style={{ height: 11, width: 11 }} />
                  Approximate location
                </Box>
              ) : null}

              {location && (
                <Box
                  component="span"
                  sx={{
                    ...EYEBROW_SX,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    border: `1.5px solid ${GOLD}`,
                    borderRadius: '3px',
                    transform: 'rotate(1.2deg)',
                    color: ink(isDark),
                    letterSpacing: '0.1em',
                    fontSize: '0.625rem',
                    maxWidth: '100%',
                  }}
                >
                  <MapPin style={{ height: 11, width: 11, color: GOLD, flexShrink: 0 }} />
                  <Box
                    component="span"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {location}
                  </Box>
                </Box>
              )}
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
                color: ink(isDark),
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
                    borderRadius: '3px',
                    border: `1px solid ${isDark ? 'rgba(212,168,67,0.4)' : 'rgba(212,168,67,0.6)'}`,
                    color: GOLD,
                    fontWeight: 600,
                    px: 0.5,
                    fontSize: '0.7rem',
                    bgcolor: 'transparent',
                  }}
                />
              ))}
            </Box>
          )}

          {/* Engagement stats — Posterama microtext */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: { xs: 0, md: 3 } }}>
            <Box component="span" sx={{ ...EYEBROW_SX, display: 'flex', alignItems: 'center', gap: 0.75, color: inkMuted(isDark) }}>
              <MessageCircle style={{ height: 14, width: 14, color: '#D4A843' }} />
              {post.commentCount} comments
            </Box>
            <Box component="span" sx={{ ...EYEBROW_SX, display: 'flex', alignItems: 'center', gap: 0.75, color: inkMuted(isDark) }}>
              <Bookmark style={{ height: 14, width: 14, color: '#D4A843' }} />
              {post.saveCount} saves
            </Box>
          </Box>
        </Box>

        {/* ── Margin-note column: comments ────────────────── */}
        <Box
          sx={{
            minWidth: 0,
            borderLeft: { md: `1px dashed ${isDark ? 'rgba(212,168,67,0.3)' : 'rgba(212,168,67,0.5)'}` },
            pl: { md: 4 },
            mt: { xs: 0, md: 0.5 },
          }}
        >
          {/* Ticket-stub divider between the photo/content and comments (stacked layout) */}
          <TicketDivider isDark={isDark} sx={{ display: { xs: 'flex', md: 'none' } }} />

          {/* -- Comments Section ------------------------------------------ */}
          <Box>
            <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1.5 }}>
              Margin notes
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Comments
                <Box component="span" sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 400, color: 'text.secondary' }}>
                  ({post.commentCount})
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
                    transition={{ delay: 0.1 * index }}
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
                        bgcolor: 'action.hover',
                        '& fieldset': { borderColor: 'divider' },
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
