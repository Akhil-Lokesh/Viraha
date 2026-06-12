'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, MotionConfig } from 'framer-motion';
import { MapPin, Settings, UserPlus, UserCheck, Loader2, Ban, Clock } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PhotoTile, StatPill, GlowButton } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import { useFollowUser, useUnfollowUser } from '@/lib/hooks/use-follows';
import { useBlockUser } from '@/lib/hooks/use-user';
import type { UserProfile } from '@/lib/types';
import { FollowListDialog } from './follow-list-dialog';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// `isPending` is set by the backend when the viewer has an outstanding follow
// request to a private account (follow.status === 'pending'). It is not yet part
// of the shared UserProfile type, so read it through a narrowed accessor.
function readPendingFlag(user: UserProfile): boolean {
  const value = (user as { isPending?: unknown }).isPending;
  return value === true;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return count.toString();
}

interface ProfileStatProps {
  value: number;
  label: string;
  ariaLabel?: string;
  onActivate?: () => void;
}

/**
 * StatPill with a count-up on first view (skipped under prefers-reduced-motion)
 * and the same click/keyboard interactivity the stats had before.
 */
function ProfileStat({ value, label, ariaLabel, onActivate }: ProfileStatProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value]);

  const interactive = Boolean(onActivate);

  return (
    <motion.div whileHover={interactive ? { y: -2 } : undefined} style={{ display: 'inline-block' }}>
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
        sx={{
          display: 'inline-block',
          borderRadius: '12px',
          cursor: interactive ? 'pointer' : 'default',
          outline: 'none',
          '& > div': { transition: 'border-color .2s ease, box-shadow .2s ease' },
          ...(interactive && {
            '&:hover > div': {
              borderColor: CIN.accent,
              boxShadow: `0 0 24px ${CIN.accentGlow}`,
            },
          }),
          '&:focus-visible': {
            outline: `2px solid ${CIN.accent}`,
            outlineOffset: 2,
          },
        }}
      >
        <StatPill value={formatCount(display)} label={label} />
      </Box>
    </motion.div>
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

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {/* Cover — the user's own photo is the light source: blurred avatar, full bleed */}
        {user.avatar ? (
          <PhotoTile
            src={user.avatar}
            alt=""
            rounded={0}
            fallback="gradient"
            sx={{
              height: { xs: 200, md: 280 },
              width: '100%',
              borderBottom: `1px solid ${CIN.hairline}`,
              '& img': {
                filter: 'blur(22px) saturate(0.85) brightness(0.75)',
                transform: 'scale(1.15)',
              },
            }}
          >
            {/* Blend the cover into the dark room below */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(11,11,15,0.9) 0%, rgba(11,11,15,0.2) 45%, rgba(11,11,15,0.4) 100%)',
                pointerEvents: 'none',
              }}
            />
          </PhotoTile>
        ) : (
          <Box
            sx={{
              height: { xs: 200, md: 280 },
              width: '100%',
              borderBottom: `1px solid ${CIN.hairline}`,
              background: `radial-gradient(120% 100% at 50% 0%, ${CIN.accentGlow} 0%, ${CIN.surface} 45%, ${CIN.bg} 100%)`,
            }}
          />
        )}

        {/* Profile info — avatar overlaps the cover's bottom edge, staggered reveal */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{
            marginTop: -56,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <Box sx={{ px: { xs: 2, md: 4 } }}>
            <motion.div variants={staggerItem} style={{ display: 'inline-block' }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{ display: 'inline-block', borderRadius: '50%' }}
              >
                <UserAvatar
                  src={user.avatar}
                  username={user.username}
                  displayName={user.displayName}
                  size="xl"
                  link={false}
                  sx={{
                    border: `4px solid ${CIN.bg}`,
                    boxShadow: `0 0 0 1px ${CIN.hairline}`,
                    bgcolor: CIN.surface2,
                    color: CIN.accent,
                    transition: 'box-shadow .25s ease',
                    '&:hover': { boxShadow: glowRing(1) },
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Eyebrow handle + Posterama display name */}
            <motion.div variants={staggerItem}>
              <Typography sx={{ ...eyebrowSx, mt: 2 }}>@{user.username}</Typography>
              <Typography
                component="h1"
                sx={{ ...displaySx, fontSize: { xs: 30, md: 40 }, mt: 0.75 }}
              >
                {user.displayName || user.username}
              </Typography>
            </motion.div>

            {/* Home base — quiet hairline chip */}
            {homeLocation && (
              <motion.div variants={staggerItem}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mt: 1.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '999px',
                    border: `1px solid ${CIN.hairline}`,
                    bgcolor: CIN.surface,
                  }}
                >
                  <MapPin style={{ height: 12, width: 12, color: CIN.accent }} />
                  <Typography component="span" sx={{ ...eyebrowSx, fontSize: 10 }}>
                    Home base · {homeLocation}
                  </Typography>
                </Box>
              </motion.div>
            )}

            {/* Bio — muted body text */}
            {user.bio && (
              <motion.div variants={staggerItem}>
                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 560,
                    color: CIN.textMuted,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                  }}
                >
                  {user.bio}
                </Typography>
              </motion.div>
            )}

            {/* Stats — StatPills with count-up; follower/following open the dialogs */}
            <motion.div variants={staggerItem}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
                <ProfileStat value={postCount} label="posts" />
                <ProfileStat
                  value={displayedFollowerCount}
                  label="followers"
                  ariaLabel="View followers"
                  onActivate={() => setFollowDialog('followers')}
                />
                <ProfileStat
                  value={followingCount}
                  label="following"
                  ariaLabel="View following"
                  onActivate={() => setFollowDialog('following')}
                />
              </Box>
            </motion.div>

            {/* Actions */}
            <motion.div variants={staggerItem}>
              <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
                {isOwnProfile ? (
                  <GlowButton
                    variant="ghost"
                    component={Link}
                    href="/settings"
                    sx={{ gap: 1 }}
                  >
                    <Settings style={{ height: 16, width: 16 }} />
                    Edit Profile
                  </GlowButton>
                ) : (
                  <>
                    <GlowButton
                      variant={isFollowing || isPending ? 'ghost' : 'solid'}
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      sx={{
                        gap: 1,
                        minWidth: 124,
                        '&.Mui-disabled': {
                          opacity: 0.6,
                          color: isFollowing || isPending ? CIN.text : CIN.bg,
                          ...(isFollowing || isPending ? {} : { bgcolor: CIN.accent }),
                        },
                      }}
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
                    </GlowButton>
                    <GlowButton
                      variant="ghost"
                      onClick={() => setBlockConfirmOpen(true)}
                      disabled={blockMutation.isPending}
                      aria-label={`Block ${user.username}`}
                      sx={{
                        gap: 1,
                        color: CIN.danger,
                        border: '1px solid rgba(255,107,107,0.35)',
                        '&:hover': {
                          bgcolor: 'rgba(255,107,107,0.08)',
                          borderColor: CIN.danger,
                        },
                        '&.Mui-disabled': { opacity: 0.6, color: CIN.danger },
                      }}
                    >
                      <Ban style={{ height: 16, width: 16 }} />
                      Block
                    </GlowButton>
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
          PaperProps={{
            sx: {
              borderRadius: '16px',
              bgcolor: CIN.surface,
              backgroundImage: 'none',
              border: `1px solid ${CIN.hairline}`,
            },
          }}
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
                bgcolor: 'rgba(255,107,107,0.12)',
                boxShadow: '0 0 40px rgba(255,107,107,0.25)',
              }}
            >
              <Ban style={{ height: 24, width: 24, color: CIN.danger }} />
            </Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{ ...displaySx, fontSize: 20, textAlign: 'center' }}
            >
              Block @{user.username}?
            </Typography>
          </Box>
          <MuiDialogContent sx={{ pt: 2 }}>
            <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: CIN.textMuted }}>
              They will be removed from your followers and following, and you&apos;ll no
              longer see each other&apos;s content.
            </Typography>
          </MuiDialogContent>
          <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
            <GlowButton
              type="button"
              onClick={handleConfirmBlock}
              disabled={blockMutation.isPending}
              sx={{
                width: '100%',
                bgcolor: CIN.danger,
                color: CIN.bg,
                '&:hover': {
                  bgcolor: '#FF5A5A',
                  boxShadow: `0 0 0 1px ${CIN.danger}, 0 8px 40px rgba(255,107,107,0.35)`,
                },
                '&.Mui-disabled': { opacity: 0.6, bgcolor: CIN.danger, color: CIN.bg },
              }}
            >
              {blockMutation.isPending ? 'Blocking...' : `Block @${user.username}`}
            </GlowButton>
            <GlowButton
              type="button"
              variant="ghost"
              onClick={closeBlockDialog}
              disabled={blockMutation.isPending}
              sx={{ width: '100%' }}
            >
              Cancel
            </GlowButton>
          </MuiDialogActions>
        </MuiDialog>
      </Box>
    </MotionConfig>
  );
}
