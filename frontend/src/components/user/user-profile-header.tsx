'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Settings, UserPlus, UserCheck, Loader2, Ban, Clock } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { UserAvatar, resolveAvatarUrl } from '@/components/shared/user-avatar';
import Button from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { useFollowUser, useUnfollowUser } from '@/lib/hooks/use-follows';
import { useBlockUser } from '@/lib/hooks/use-user';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { FollowListDialog } from './follow-list-dialog';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

const GOLD = 'var(--viraha-gold, #D4A843)';
const INK = 'var(--viraha-ink, #221C18)';
const PAPER = 'var(--viraha-paper, #FAF6EE)';

// Subtle paper-grain texture (CSS-only, per design brief — no asset files).
const PAPER_GRAIN =
  'repeating-linear-gradient(0deg, rgba(34,28,24,0.03) 0px, rgba(34,28,24,0.03) 1px, transparent 1px, transparent 3px)';

// `isPending` is set by the backend when the viewer has an outstanding follow
// request to a private account (follow.status === 'pending'). It is not yet part
// of the shared UserProfile type, so read it through a narrowed accessor.
function readPendingFlag(user: UserProfile): boolean {
  const value = (user as { isPending?: unknown }).isPending;
  return value === true;
}

interface StatStampProps {
  value: string;
  label: string;
  rotation: number;
  ariaLabel?: string;
  onActivate?: () => void;
}

/** Follower/following/post counts rendered as passport-stamp chips. */
function StatStamp({ value, label, rotation, ariaLabel, onActivate }: StatStampProps) {
  const interactive = Boolean(onActivate);

  return (
    <Box
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onActivate}
      onKeyDown={
        interactive
          ? (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate?.();
              }
            }
          : undefined
      }
      sx={(theme) => ({
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 1,
        border: '1.5px solid',
        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(212,168,67,0.55)' : 'rgba(212,168,67,0.7)',
        borderRadius: '7px',
        transform: `rotate(${rotation}deg)`,
        bgcolor:
          theme.palette.mode === 'dark' ? 'rgba(212,168,67,0.06)' : 'rgba(212,168,67,0.08)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        '&:hover': interactive
          ? { transform: 'rotate(0deg) scale(1.03)', borderColor: GOLD }
          : undefined,
        '&:focus-visible': {
          outline: `2px solid ${GOLD}`,
          outlineOffset: 2,
        },
      })}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: 'var(--font-accent, serif)',
          fontSize: '1.5rem',
          lineHeight: 1.2,
          color: 'text.primary',
        }}
      >
        {value}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: 'var(--font-brand, sans-serif)',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: GOLD,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export function UserProfileHeader({ user, isOwnProfile = false }: UserProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [isPending, setIsPending] = useState(() => readPendingFlag(user));
  const [followerCount, setFollowerCount] = useState(user.followerCount ?? 0);
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  // Re-sync local state when the profile prop changes (cross-screen follow updates,
  // cached profile refreshes, navigating between profiles).
  useEffect(() => {
    setIsFollowing(user.isFollowing ?? false);
  }, [user.isFollowing]);

  const pendingFromProp = readPendingFlag(user);
  useEffect(() => {
    setIsPending(pendingFromProp);
  }, [pendingFromProp]);

  useEffect(() => {
    setFollowerCount(user.followerCount ?? 0);
  }, [user.followerCount]);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const blockMutation = useBlockUser();
  const router = useRouter();
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  function closeBlockDialog() {
    if (blockMutation.isPending) return;
    setBlockConfirmOpen(false);
  }

  function handleConfirmBlock() {
    if (blockMutation.isPending) return;
    blockMutation.mutate(user.id, {
      onSuccess: () => {
        setBlockConfirmOpen(false);
        toast.success(`Blocked @${user.username}`);
        router.push('/feed');
      },
      onError: () => {
        setBlockConfirmOpen(false);
        toast.error('Could not block user');
      },
    });
  }

  const homeLocation = [user.homeCity, user.homeCountry]
    .filter(Boolean)
    .join(', ');

  const postCount = user.postCount ?? user._count?.posts ?? 0;
  const followingCount = user.followingCount ?? 0;

  // Adjust displayed follower count based on optimistic follow/unfollow
  const displayedFollowerCount = (() => {
    if (user.isFollowing && !isFollowing) return Math.max(0, followerCount - 1);
    if (!user.isFollowing && isFollowing) return followerCount + 1;
    return followerCount;
  })();

  function handleFollowToggle() {
    if (isFollowLoading) return;

    // A pending request to a private account is cancelled through the same
    // unfollow endpoint; treat "following" and "requested" as the active state.
    if (isFollowing || isPending) {
      const wasPending = isPending;
      setIsFollowing(false);
      setIsPending(false);
      unfollowMutation.mutate(user.id, {
        onError: () => {
          if (wasPending) {
            setIsPending(true);
          } else {
            setIsFollowing(true);
          }
        },
      });
    } else {
      setIsFollowing(true);
      followMutation.mutate(user.id, {
        onError: () => setIsFollowing(false),
      });
    }
  }

  function formatCount(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return count.toString();
  }

  return (
    <Box>
      {/* Cover — passport-spread top page: avatar wash or warm paper, grain + flight path */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          height: { xs: 192, md: 264 },
          width: '100%',
          overflow: 'hidden',
          borderRadius: 0,
          borderBottom: '1.5px solid',
          borderColor:
            theme.palette.mode === 'dark' ? 'rgba(212,168,67,0.35)' : 'rgba(212,168,67,0.5)',
        })}
      >
        {user.avatar ? (
          <>
            <Box
              component="img"
              src={resolveAvatarUrl(user.avatar)}
              alt=""
              sx={{
                position: 'absolute',
                inset: 0,
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                transform: 'scale(1.1)',
                filter: 'blur(16px) saturate(0.85)',
              }}
            />
            <Box
              sx={(theme) => ({
                position: 'absolute',
                inset: 0,
                bgcolor:
                  theme.palette.mode === 'dark' ? 'rgba(22,18,31,0.55)' : 'rgba(34,28,24,0.28)',
              })}
            />
          </>
        ) : (
          <Box
            sx={(theme) => ({
              position: 'absolute',
              inset: 0,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1C1628 0%, var(--viraha-ink-plum, #16121F) 55%, rgba(212,168,67,0.16) 100%)'
                  : `linear-gradient(135deg, #F2E8D2 0%, ${PAPER} 55%, rgba(212,168,67,0.28) 100%)`,
            })}
          />
        )}

        {/* Paper grain over the whole cover */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: PAPER_GRAIN, pointerEvents: 'none' }} />

        {/* Flight-path motif: dashed gold route with endpoint dots */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left: '6%',
            right: '6%',
            top: '38%',
            borderTop: '1.5px dashed rgba(212,168,67,0.65)',
            transform: 'rotate(-3deg)',
            pointerEvents: 'none',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: -4,
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: GOLD,
            },
            '&::before': { left: 0 },
            '&::after': { right: 0 },
          }}
        />

        {/* Soft fade into the page below */}
        <Box
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(to top, rgba(22,18,31,0.65), transparent 55%)'
                : 'linear-gradient(to top, rgba(34,28,24,0.25), transparent 55%)',
          })}
        />
      </Box>

      {/* Profile Info — overlapping the cover, staggered reveal */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{
          marginTop: -64,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          {/* Avatar in a pasted-photo paper frame */}
          <motion.div variants={staggerItem} style={{ display: 'inline-block' }}>
            <Box
              sx={{
                display: 'inline-block',
                transform: 'rotate(-1.5deg)',
                transition: 'transform 0.25s ease',
                '&:hover': { transform: 'rotate(0deg)' },
              }}
            >
              <UserAvatar
                src={user.avatar}
                username={user.username}
                displayName={user.displayName}
                size="xl"
                link={false}
                sx={(theme) => ({
                  border: '5px solid',
                  borderColor: theme.palette.mode === 'dark' ? '#241D31' : PAPER,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '3px 3px 0 rgba(0,0,0,0.45)'
                      : '3px 3px 0 rgba(34,28,24,0.18)',
                })}
              />
            </Box>
          </motion.div>

          {/* Eyebrow + display-serif name */}
          <motion.div variants={staggerItem}>
            <Typography
              sx={{
                mt: 2,
                fontFamily: 'var(--font-brand, sans-serif)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: GOLD,
                fontWeight: 500,
              }}
            >
              @{user.username}
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'var(--font-accent, serif)',
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.15,
                color: 'text.primary',
                mt: 0.5,
              }}
            >
              {user.displayName || user.username}
            </Typography>
          </motion.div>

          {/* Home base as a passport stamp */}
          {homeLocation && (
            <motion.div variants={staggerItem}>
              <Box
                sx={(theme) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 1.5,
                  px: 1.5,
                  py: 0.5,
                  border: '1.5px solid',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(212,168,67,0.55)'
                      : 'rgba(212,168,67,0.7)',
                  borderRadius: '6px',
                  transform: 'rotate(-1.5deg)',
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(212,168,67,0.06)'
                      : 'rgba(212,168,67,0.08)',
                })}
              >
                <MapPin style={{ height: 12, width: 12, color: 'var(--viraha-gold, #D4A843)' }} />
                <Typography
                  component="span"
                  sx={{
                    fontFamily: 'var(--font-brand, sans-serif)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'text.primary',
                    fontWeight: 500,
                  }}
                >
                  Home base · {homeLocation}
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Bio as a journal note — TT Chocolates italic on paper */}
          {user.bio && (
            <motion.div variants={staggerItem}>
              <Box
                sx={(theme) => ({
                  position: 'relative',
                  maxWidth: 460,
                  mt: 2,
                  px: 2,
                  py: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(250,246,238,0.04)' : '#FFFDF6',
                  border: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(212,168,67,0.25)'
                      : 'rgba(212,168,67,0.4)',
                  borderLeft: `3px solid ${GOLD}`,
                  borderRadius: '4px',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '2px 2px 0 rgba(0,0,0,0.35)'
                      : '2px 2px 0 rgba(34,28,24,0.08)',
                  backgroundImage: PAPER_GRAIN,
                })}
              >
                <Typography
                  sx={{
                    fontFamily: 'var(--font-body, sans-serif)',
                    fontStyle: 'italic',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    color: 'text.primary',
                    opacity: 0.9,
                  }}
                >
                  {user.bio}
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Stats as stamp chips */}
          <motion.div variants={staggerItem}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
              <StatStamp value={formatCount(postCount)} label="posts" rotation={-1.5} />
              <StatStamp
                value={formatCount(displayedFollowerCount)}
                label="followers"
                rotation={1}
                ariaLabel="View followers"
                onActivate={() => setFollowDialog('followers')}
              />
              <StatStamp
                value={formatCount(followingCount)}
                label="following"
                rotation={-0.75}
                ariaLabel="View following"
                onActivate={() => setFollowDialog('following')}
              />
            </Box>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={staggerItem}>
            <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
              {isOwnProfile ? (
                <Button
                  variant="outlined"
                  disableElevation
                  component={Link}
                  href="/settings"
                  sx={{
                    gap: 1,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: 'rgba(212,168,67,0.7)',
                    '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
                  }}
                >
                  <Settings style={{ height: 16, width: 16 }} />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing || isPending ? 'outlined' : 'contained'}
                    disableElevation
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    sx={
                      isFollowing || isPending
                        ? {
                            gap: 1,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            color: 'text.primary',
                            borderColor: 'rgba(212,168,67,0.7)',
                            '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
                          }
                        : {
                            gap: 1,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: GOLD,
                            color: INK,
                            '&:hover': { bgcolor: '#C2973A' },
                          }
                    }
                  >
                    {isFollowLoading ? (
                      <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} />
                    ) : isPending ? (
                      <Clock style={{ height: 16, width: 16 }} />
                    ) : isFollowing ? (
                      <UserCheck style={{ height: 16, width: 16 }} />
                    ) : (
                      <UserPlus style={{ height: 16, width: 16 }} />
                    )}
                    {isPending ? 'Requested' : isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disableElevation
                    sx={{ gap: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                    onClick={() => setBlockConfirmOpen(true)}
                    disabled={blockMutation.isPending}
                    aria-label={`Block ${user.username}`}
                  >
                    <Ban style={{ height: 16, width: 16 }} />
                    Block
                  </Button>
                </>
              )}
            </Box>
          </motion.div>
        </Box>
      </motion.div>

      <FollowListDialog
        open={followDialog !== null}
        onClose={() => setFollowDialog(null)}
        userId={user.id}
        type={followDialog ?? 'followers'}
      />

      {/* Block confirmation dialog (window.confirm is unreliable in WebViews) */}
      <MuiDialog
        open={blockConfirmOpen}
        onClose={closeBlockDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(239,68,68,0.1)',
            }}
          >
            <Ban style={{ height: 24, width: 24, color: 'var(--mui-palette-error-main)' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Block @{user.username}?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
            They will be removed from your followers and following, and you&apos;ll no
            longer see each other&apos;s content.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            type="button"
            variant="contained"
            color="error"
            disableElevation
            onClick={handleConfirmBlock}
            disabled={blockMutation.isPending}
            sx={{ width: '100%' }}
          >
            {blockMutation.isPending ? 'Blocking...' : `Block @${user.username}`}
          </Button>
          <Button
            type="button"
            variant="text"
            disableElevation
            onClick={closeBlockDialog}
            disabled={blockMutation.isPending}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Box>
  );
}
