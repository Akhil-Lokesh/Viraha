'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  MessageCircle,
  Bookmark,
  Heart,
  Share2,
  Plane,
  MoreHorizontal,
  Flag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import type { Post } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useToggleSave } from '@/lib/hooks/use-saves';
import { CinemaCard, PhotoTile } from '@/components/cinema';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { getCoordinates } from './keepsake';
import { useToggleLike } from '@/lib/hooks/use-reactions';

const ACCENT_TINT = 'rgba(139,124,255,0.10)';

const heroControlSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 32,
  width: 32,
  borderRadius: '50%',
  bgcolor: 'rgba(11,11,15,0.55)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${CIN.hairline}`,
  color: CIN.text,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': { bgcolor: 'rgba(11,11,15,0.8)' },
} as const;

interface PostCardProps {
  post: Post;
  /** Position within a list — drives the orchestrated entrance stagger. */
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [saveCount, setSaveCount] = useState(post.saveCount ?? 0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // The ReportDialog self-manages its open state via its trigger element. We keep
  // that trigger OUTSIDE the Menu (so closing the Menu doesn't unmount the dialog)
  // and click it programmatically from the in-menu "Report" row.
  const reportTriggerRef = useRef<HTMLButtonElement>(null);
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const toggleSave = useToggleSave();
  const toggleLike = useToggleLike();

  const photoCount = post.mediaUrls.length;
  // Feed cards use the generated thumbnail to save bandwidth; the full-res
  // mediaUrls image is reserved for the post detail lightbox. PhotoTile
  // resolves relative /uploads paths against the API origin itself.
  const photoSource = post.mediaThumbnails?.[photoIdx] || post.mediaUrls[photoIdx] || '';

  const locationDetail = [post.locationCity, post.locationCountry]
    .filter(Boolean)
    .join(', ');

  // The backend redacts hidden locations: lat/lng arrive as null while
  // city/country remain. Such posts get a muted "Approximate location"
  // microlabel instead of coordinates and no map affordances.
  const coords = getCoordinates(post.locationLat, post.locationLng);
  const isApproximateLocation =
    !coords && !!(post.locationCity || post.locationCountry);

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
    borderRadius: '8px',
    transition: 'color 0.2s, background-color 0.2s',
    border: 'none',
    bgcolor: 'transparent',
    cursor: 'pointer',
    color: CIN.textMuted,
    '&:hover': { color: CIN.accent, bgcolor: ACCENT_TINT },
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

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    toggleLike.mutate(post.id, {
      onError: () => {
        setLiked(wasLiked);
        setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
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

  function goToPhoto(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIdx(Math.max(0, Math.min(photoCount - 1, idx)));
  }

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        delay: Math.min(index, 8) * 0.05,
      }}
    >
      <CinemaCard
        sx={{
          // Photo-hover treatment: the tile image breathes while the card glows.
          '& .pc-photo img': {
            transition: reduceMotion
              ? 'none'
              : 'transform 0.5s cubic-bezier(0.2, 0.65, 0.4, 0.95)',
          },
          '&:hover .pc-photo img': {
            transform: reduceMotion ? 'none' : 'scale(1.02)',
          },
        }}
      >
        {/* Header: avatar + name + time + traveling + more menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 1.75, pb: 1.5 }}>
          {post.user && (
            <UserAvatar
              src={post.user.avatar}
              username={post.user.username}
              displayName={post.user.displayName}
              size="md"
              link={true}
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
                        color: CIN.text,
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
                      color: CIN.textMuted,
                      fontSize: '0.8125rem',
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
                    <Typography sx={{ color: CIN.textMuted, opacity: 0.6 }}>&middot;</Typography>
                    <Typography
                      suppressHydrationWarning
                      sx={{ color: CIN.textMuted, fontSize: '0.75rem', flexShrink: 0 }}
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
                      ...eyebrowSx,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      border: `1px solid rgba(139,124,255,0.4)`,
                      color: CIN.accent,
                      bgcolor: ACCENT_TINT,
                      borderRadius: '9999px',
                      px: 1,
                      py: 0.25,
                      fontSize: '0.5625rem',
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
                  borderRadius: '8px',
                  color: CIN.textMuted,
                  flexShrink: 0,
                  transition: 'color 0.2s, background-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: CIN.text },
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
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: '12px',
                      minWidth: 160,
                      bgcolor: CIN.surface2,
                      border: `1px solid ${CIN.hairline}`,
                    },
                  },
                }}
              >
                <MuiMenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    reportTriggerRef.current?.click();
                  }}
                  sx={{ fontSize: '0.875rem', borderRadius: '8px', mx: 0.5, color: CIN.danger }}
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

        {/* Full-bleed photo: the light source. Location + date live on the vignette. */}
        {photoSource && (
          <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <Box className="pc-photo">
              <PhotoTile
                src={photoSource}
                alt={post.caption || 'Travel photo'}
                rounded={0}
                sx={{ aspectRatio: '4 / 3', maxHeight: 600, width: '100%' }}
              >
                {/* Photo count badge */}
                {photoCount > 1 && (
                  <Box
                    component="span"
                    sx={{
                      ...eyebrowSx,
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'rgba(11,11,15,0.6)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${CIN.hairline}`,
                      color: CIN.text,
                      px: 1,
                      py: 0.4,
                      borderRadius: '9999px',
                      fontSize: '0.625rem',
                    }}
                  >
                    {photoIdx + 1}/{photoCount}
                  </Box>
                )}

                {/* Multi-photo prev/next */}
                {photoCount > 1 && photoIdx > 0 && (
                  <Box
                    component="button"
                    type="button"
                    aria-label="Previous photo"
                    onClick={(e) => goToPhoto(e, photoIdx - 1)}
                    sx={{
                      ...heroControlSx,
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <ChevronLeft style={{ height: 16, width: 16 }} />
                  </Box>
                )}
                {photoCount > 1 && photoIdx < photoCount - 1 && (
                  <Box
                    component="button"
                    type="button"
                    aria-label="Next photo"
                    onClick={(e) => goToPhoto(e, photoIdx + 1)}
                    sx={{
                      ...heroControlSx,
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <ChevronRight style={{ height: 16, width: 16 }} />
                  </Box>
                )}

                {/* Bottom-vignette caption: location name + city + date */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    px: 2,
                    pb: photoCount > 1 ? 3.25 : 1.75,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    pointerEvents: 'none',
                  }}
                >
                  {post.locationName && (
                    <Typography
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 12px rgba(11,11,15,0.6)',
                      }}
                    >
                      {post.locationName}
                    </Typography>
                  )}
                  <Box
                    component="span"
                    suppressHydrationWarning
                    sx={{
                      ...eyebrowSx,
                      display: 'inline-flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 0.75,
                      color: 'rgba(255,255,255,0.78)',
                      fontSize: '0.625rem',
                      textShadow: '0 1px 8px rgba(11,11,15,0.6)',
                    }}
                  >
                    {locationDetail && (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <MapPin style={{ height: 10, width: 10, flexShrink: 0 }} />
                        {locationDetail}
                      </Box>
                    )}
                    {locationDetail && fullDate && <Box component="span">&middot;</Box>}
                    {fullDate && <Box component="span">{fullDate}</Box>}
                    {isApproximateLocation && (
                      <>
                        <Box component="span">&middot;</Box>
                        {/* Redacted coordinates: muted microlabel, no map affordances */}
                        <Box component="span" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                          Approximate location
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>

                {/* Dot indicators */}
                {photoCount > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    {post.mediaUrls.map((_, idx) => (
                      <Box
                        key={idx}
                        component="button"
                        type="button"
                        aria-label={`Go to photo ${idx + 1}`}
                        onClick={(e) => goToPhoto(e, idx)}
                        sx={{
                          borderRadius: '9999px',
                          border: 'none',
                          cursor: 'pointer',
                          p: 0,
                          transition: 'all 0.2s',
                          ...(idx === photoIdx
                            ? { width: 18, height: 6, bgcolor: CIN.accent }
                            : {
                                width: 6,
                                height: 6,
                                bgcolor: 'rgba(255,255,255,0.45)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.75)' },
                              }),
                        }}
                      />
                    ))}
                  </Box>
                )}
              </PhotoTile>
            </Box>
          </Link>
        )}

        {/* Body: caption, tags, quiet action row */}
        <Box sx={{ px: 2, pt: photoSource ? 1.5 : 0.5, pb: 1.75 }}>
          {/* No photo: still surface the place + date so the card stands alone */}
          {!photoSource && (post.locationName || locationDetail || fullDate) && (
            <Box
              component="span"
              sx={{
                ...eyebrowSx,
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.75,
                mb: 1,
                fontSize: '0.625rem',
              }}
            >
              {(post.locationName || locationDetail) && (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <MapPin style={{ height: 10, width: 10, flexShrink: 0 }} />
                  {[post.locationName, locationDetail].filter(Boolean).join(', ')}
                </Box>
              )}
              {fullDate && <Box component="span">{fullDate}</Box>}
              {isApproximateLocation && (
                <Box component="span" sx={{ opacity: 0.7 }}>
                  Approximate location
                </Box>
              )}
            </Box>
          )}

          {/* Caption */}
          {post.caption && (
            <Link href={`/post/${post.id}`} style={{ display: 'block', textDecoration: 'none' }}>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  color: CIN.text,
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
              {post.tags.map((tag) => (
                <Typography
                  key={tag}
                  sx={{ fontSize: '0.75rem', color: CIN.accent, fontWeight: 600 }}
                >
                  #{tag}
                </Typography>
              ))}
            </Box>
          )}

          {/* Quiet action row — accent on active save */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: 1.25,
              ml: -1,
              pt: 1.25,
              borderTop: `1px solid ${CIN.hairline}`,
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

            {/* Like — heart fills red when active, springy press */}
            <Box
              component={motion.button}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              onClick={handleLike}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              aria-pressed={liked}
              sx={{
                ...quietAction,
                color: liked ? '#EF4444' : CIN.textMuted,
                '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.10)' },
              }}
            >
              <Heart
                style={{
                  height: 18,
                  width: 18,
                  fill: liked ? 'currentColor' : 'none',
                }}
              />
              {likeCount > 0 && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {likeCount}
                </Typography>
              )}
            </Box>

            {/* Save/Bookmark — accent when active, springy press */}
            <Box
              component={motion.button}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              onClick={handleSave}
              aria-label={saved ? 'Unsave post' : 'Save post'}
              sx={{
                ...quietAction,
                color: saved ? CIN.accent : CIN.textMuted,
              }}
            >
              <Bookmark
                style={{ height: 18, width: 18, fill: saved ? 'currentColor' : 'none' }}
              />
              {saveCount > 0 && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {saveCount}
                </Typography>
              )}
            </Box>

            {/* Share */}
            <Box
              component={motion.button}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              onClick={handleShare}
              aria-label="Share post"
              sx={quietAction}
            >
              <Share2 style={{ height: 18, width: 18 }} />
            </Box>
          </Box>
        </Box>
      </CinemaCard>
    </motion.article>
  );
}
