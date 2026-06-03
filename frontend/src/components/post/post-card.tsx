'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  MessageCircle,
  Bookmark,
  Share2,
  Plane,
  MoreHorizontal,
  Flag,
} from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import type { Post } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useToggleSave } from '@/lib/hooks/use-saves';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function PostCard({ post }: { post: Post }) {
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [saveCount, setSaveCount] = useState(post.saveCount ?? 0);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // The ReportDialog self-manages its open state via its trigger element. We keep
  // that trigger OUTSIDE the Menu (so closing the Menu doesn't unmount the dialog)
  // and click it programmatically from the in-menu "Report" row.
  const reportTriggerRef = useRef<HTMLButtonElement>(null);
  const toggleSave = useToggleSave();

  // Feed cards use the generated thumbnail to save bandwidth; the full-res
  // mediaUrls image is reserved for the post detail lightbox.
  const thumbnailSource = post.mediaThumbnails?.[0] || post.mediaUrls[0];
  const imageUrl = thumbnailSource
    ? resolveImageUrl(thumbnailSource)
    : null;
  // Relative /uploads paths resolve to the API origin, which is not registered
  // in next.config image remotePatterns; bypass the optimizer for those so the
  // image still loads (R2/CDN absolute URLs stay optimized).
  const imageUnoptimized = !!thumbnailSource && !thumbnailSource.startsWith('http');

  const locationLabel = [post.locationName, post.locationCity, post.locationCountry]
    .filter(Boolean)
    .join(', ');

  const postedDate = post.postedAt ? new Date(post.postedAt) : null;
  const timeAgo = postedDate
    ? formatDistanceToNow(postedDate, { addSuffix: false })
    : null;
  const fullDate = postedDate ? format(postedDate, 'MMM d, yyyy') : null;

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasSaved = saved;
    setSaved(!wasSaved);
    setSaveCount((c) => (wasSaved ? c - 1 : c + 1));
    toggleSave.mutate(post.id, {
      onError: () => {
        setSaved(wasSaved);
        setSaveCount((c) => (wasSaved ? c + 1 : c - 1));
      },
    });
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.caption || 'Travel memory',
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '20px 0' }}
    >
      {/* Location badge */}
      {locationLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <MapPin style={{ height: 14, width: 14, color: '#10B981' }} />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#10B981',
            }}
          >
            {locationLabel}
          </Typography>
        </Box>
      )}

      {/* Header: Avatar + Name + Time */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {post.user && (
          <UserAvatar
            src={post.user.avatar}
            username={post.user.username}
            displayName={post.user.displayName}
            size="md"
            link={true}
            sx={{ mt: 0.25 }}
          />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              {post.user && (
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.user.displayName || post.user.username}
                  </Typography>
                </Link>
              )}
              {post.user && (
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  @{post.user.username}
                </Typography>
              )}
              {timeAgo && (
                <>
                  <Typography sx={{ color: 'text.disabled' }}>&middot;</Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}
                    title={fullDate || undefined}
                  >
                    {timeAgo}
                  </Typography>
                </>
              )}
              {post.travelMode === 'traveling' && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    bgcolor: 'rgba(59,130,246,0.1)',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '#60a5fa'
                        : '#2563eb',
                    borderRadius: '9999px',
                    px: 0.75,
                    py: 0.25,
                    fontSize: '10px',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  <Plane style={{ height: 10, width: 10 }} />
                  Traveling
                </Box>
              )}
            </Box>
            {/* More options menu (Report) */}
            <Box
              component="button"
              type="button"
              aria-label="More options"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.75,
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                borderRadius: '9999px',
                color: 'text.secondary',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <MoreHorizontal style={{ height: 16, width: 16 }} />
            </Box>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 160 } } }}
            >
              <MuiMenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  reportTriggerRef.current?.click();
                }}
                sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5, color: 'error.main' }}
              >
                <Flag size={16} style={{ marginRight: 8 }} />
                Report
              </MuiMenuItem>
            </Menu>
            {/* Report dialog — trigger lives outside the Menu so closing the Menu does
                not unmount the open dialog. It is activated via reportTriggerRef. */}
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
          </Box>

          {/* Caption */}
          {post.caption && (
            <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none', marginTop: 8 }}>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  color: 'text.primary',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {post.caption}
              </Typography>
            </Link>
          )}

          {/* Image */}
          {imageUrl && (
            <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none', marginTop: 12 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  maxHeight: 600,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                }}
              >
                <Image
                  src={imageUrl}
                  alt={post.caption || 'Travel photo'}
                  fill
                  sizes="(max-width: 600px) 100vw, 600px"
                  unoptimized={imageUnoptimized}
                  style={{ objectFit: 'cover' }}
                />
                {post.mediaUrls.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      px: 1,
                      py: 0.5,
                      borderRadius: '9999px',
                    }}
                  >
                    1/{post.mediaUrls.length}
                  </Box>
                )}
              </Box>
            </Link>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
              {post.tags.map((tag) => (
                <Typography
                  key={tag}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'secondary.main',
                    fontWeight: 500,
                  }}
                >
                  #{tag}
                </Typography>
              ))}
            </Box>
          )}

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              mt: 1.5,
              ml: -1,
            }}
          >
            {/* Comments */}
            <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: '9999px',
                  color: 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: 'secondary.main',
                    bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.05)',
                  },
                }}
              >
                <MessageCircle style={{ height: 18, width: 18 }} />
                {post.commentCount > 0 && (
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {post.commentCount}
                  </Typography>
                )}
              </Box>
            </Link>

            {/* Save/Bookmark */}
            <Box
              component="button"
              onClick={handleSave}
              aria-label={saved ? 'Unsave post' : 'Save post'}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: '9999px',
                transition: 'all 0.2s',
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: saved ? 'secondary.main' : 'text.secondary',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.05)',
                },
              }}
            >
              <Bookmark
                style={{
                  height: 18,
                  width: 18,
                  fill: saved ? 'currentColor' : 'none',
                }}
              />
              {saveCount > 0 && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {saveCount}
                </Typography>
              )}
            </Box>

            {/* Share */}
            <Box
              component="button"
              onClick={handleShare}
              aria-label="Share post"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: '9999px',
                transition: 'all 0.2s',
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.05)',
                },
              }}
            >
              <Share2 style={{ height: 18, width: 18 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.article>
  );
}
