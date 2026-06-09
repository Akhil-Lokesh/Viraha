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
import { Box, Typography, useTheme } from '@mui/material';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import type { Post } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useToggleSave } from '@/lib/hooks/use-saves';
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function PostCard({ post }: { post: Post }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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

  // The backend redacts hidden locations: lat/lng arrive as null while
  // city/country remain. Such posts get an "Approximate location" stamp
  // instead of coordinates and no map affordances.
  const hasCoords = hasCoordinates(post.locationLat, post.locationLng);
  const isApproximateLocation =
    !hasCoords && !!(post.locationCity || post.locationCountry);

  const postedDate = post.postedAt ? new Date(post.postedAt) : null;
  const timeAgo = postedDate
    ? formatDistanceToNow(postedDate, { addSuffix: false })
    : null;
  const fullDate = postedDate ? format(postedDate, 'MMM d, yyyy') : null;

  const quietAction = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.5,
    borderRadius: '4px',
    transition: 'all 0.2s',
    border: 'none',
    bgcolor: 'transparent',
    cursor: 'pointer',
    color: inkMuted(isDark),
    '&:hover': {
      color: GOLD,
      bgcolor: isDark ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.1)',
    },
  } as const;

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
      whileHover={{ rotate: -0.7, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ willChange: 'transform' }}
    >
      {/* Postcard surface: warm paper, hairline border, hard offset shadow */}
      <Box
        sx={{
          bgcolor: paper(isDark),
          backgroundImage: grain(isDark),
          border: `1px solid ${hairline(isDark)}`,
          borderRadius: '6px',
          boxShadow: hardShadow(isDark),
          overflow: 'hidden',
        }}
      >
        {/* Header: Avatar + Name + Time */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.25, pt: 2 }}>
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
                        color: ink(isDark),
                        '&:hover': { textDecoration: 'underline' },
                        textUnderlineOffset: 3,
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
                      color: inkMuted(isDark),
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
                    <Typography sx={{ color: inkMuted(isDark), opacity: 0.6 }}>&middot;</Typography>
                    <Typography
                      sx={{
                        color: inkMuted(isDark),
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
                      ...EYEBROW_SX,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      border: `1px solid ${GOLD}`,
                      color: GOLD,
                      borderRadius: '3px',
                      px: 0.75,
                      py: 0.25,
                      fontSize: '0.5625rem',
                      flexShrink: 0,
                      transform: 'rotate(-1.5deg)',
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
                  borderRadius: '4px',
                  color: inkMuted(isDark),
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.1)',
                    color: ink(isDark),
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
                slotProps={{ paper: { sx: { borderRadius: 1.5, minWidth: 160 } } }}
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
          </Box>
        </Box>

        {/* Photo — narrow mat on the sides, thick mat below (postcard treatment) */}
        {imageUrl && (
          <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <Box sx={{ px: 1.5, mt: 1.75 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  maxHeight: 600,
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: `1px solid ${hairline(isDark)}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(34,28,24,0.05)',
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
                      ...EYEBROW_SX,
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'rgba(22,18,31,0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#FAF6EE',
                      px: 1,
                      py: 0.5,
                      borderRadius: '3px',
                      fontSize: '0.625rem',
                    }}
                  >
                    1/{post.mediaUrls.length}
                  </Box>
                )}
              </Box>
            </Box>
          </Link>
        )}

        {/* Bottom mat: eyebrow + stamp, caption, tags, quiet action row */}
        <Box sx={{ px: 2.5, pt: imageUrl ? 1.75 : 1.25, pb: 2 }}>
          {/* Coordinates eyebrow (or date) + passport-stamp location chip */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              mb: post.caption || locationLabel ? 1.25 : 0,
            }}
          >
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
            ) : fullDate ? (
              <Typography component="span" sx={{ ...EYEBROW_SX, color: inkMuted(isDark) }}>
                {fullDate}
              </Typography>
            ) : (
              <Box component="span" />
            )}

            {locationLabel && (
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
                  {locationLabel}
                </Box>
              </Box>
            )}
          </Box>

          {/* Caption */}
          {post.caption && (
            <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  color: ink(isDark),
                  lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {post.caption}
              </Typography>
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
                    color: GOLD,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </Typography>
              ))}
            </Box>
          )}

          {/* Quiet action row — gold active states */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              mt: 1.5,
              ml: -1,
              pt: 1.25,
              borderTop: `1px dashed ${isDark ? 'rgba(212,168,67,0.22)' : 'rgba(212,168,67,0.4)'}`,
            }}
          >
            {/* Comments */}
            <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
              <Box sx={quietAction}>
                <MessageCircle style={{ height: 18, width: 18 }} />
                {post.commentCount > 0 && (
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {post.commentCount}
                  </Typography>
                )}
              </Box>
            </Link>

            {/* Save/Bookmark — gold when active */}
            <Box
              component="button"
              onClick={handleSave}
              aria-label={saved ? 'Unsave post' : 'Save post'}
              sx={{
                ...quietAction,
                color: saved ? GOLD : inkMuted(isDark),
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
              sx={quietAction}
            >
              <Share2 style={{ height: 18, width: 18 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.article>
  );
}
