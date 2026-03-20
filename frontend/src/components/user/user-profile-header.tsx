'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Settings, UserPlus, UserCheck, MessageCircle, Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { fadeInUp } from '@/lib/animations';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LocationBadge } from '@/components/shared/location-badge';
import Button from '@mui/material/Button';
import { useFollowUser, useUnfollowUser } from '@/lib/hooks/use-follows';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { FollowListDialog } from './follow-list-dialog';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

export function UserProfileHeader({ user, isOwnProfile = false }: UserProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const homeLocation = [user.homeCity, user.homeCountry]
    .filter(Boolean)
    .join(', ');

  const postCount = user.postCount ?? user._count?.posts ?? 0;
  const followerCount = user.followerCount ?? 0;
  const followingCount = user.followingCount ?? 0;

  // Adjust displayed follower count based on optimistic follow/unfollow
  const displayedFollowerCount = (() => {
    if (user.isFollowing && !isFollowing) return Math.max(0, followerCount - 1);
    if (!user.isFollowing && isFollowing) return followerCount + 1;
    return followerCount;
  })();

  function handleFollowToggle() {
    if (isFollowLoading) return;

    if (isFollowing) {
      setIsFollowing(false);
      unfollowMutation.mutate(user.id, {
        onError: () => setIsFollowing(true),
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
      {/* Cover -- gradient background using the user's avatar colors or a default gradient */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 224, md: 320 },
          width: '100%',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        {user.avatar ? (
          <>
            <Box
              component="img"
              src={user.avatar}
              alt=""
              sx={{
                position: 'absolute',
                inset: 0,
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                transform: 'scale(1.1)',
                filter: 'blur(16px)',
              }}
            />
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.2)' }} />
          </>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom right, rgba(var(--mui-palette-primary-mainChannel) / 0.6), rgba(var(--mui-palette-primary-mainChannel) / 0.3), #1F1530)'
                  : 'linear-gradient(to bottom right, rgba(var(--mui-palette-primary-mainChannel) / 0.6), rgba(var(--mui-palette-primary-mainChannel) / 0.3), #fff2e5)',
            }}
          />
        )}
        {/* Gradient overlay at the bottom */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          }}
        />
      </Box>

      {/* Profile Info -- overlapping the cover */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        style={{
          marginTop: -64,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          {/* Avatar with ring */}
          <UserAvatar
            src={user.avatar}
            username={user.username}
            displayName={user.displayName}
            size="xl"
            link={false}
            sx={{
              outline: '4px solid',
              outlineColor: 'background.default',
              boxShadow: 3,
            }}
          />

          {/* Name & Bio */}
          <Typography sx={{ fontSize: '1.875rem', fontWeight: 700, mt: 2 }}>
            {user.displayName || user.username}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>@{user.username}</Typography>
          {user.bio && (
            <Typography sx={{ fontSize: '0.875rem', maxWidth: 448, mt: 1, color: 'text.primary', opacity: 0.8 }}>
              {user.bio}
            </Typography>
          )}

          {/* Home location */}
          {homeLocation && (
            <Box sx={{ mt: 1 }}>
              <LocationBadge location={homeLocation} variant="default" />
            </Box>
          )}

          {/* Stats Row */}
          <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: 'text.primary' }}>
                {formatCount(postCount)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '10px',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                posts
              </Typography>
            </Box>
            <Box sx={{ height: 40, width: 1, bgcolor: 'divider' }} />
            <Box
              onClick={() => setFollowDialog('followers')}
              sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}
            >
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: 'text.primary' }}>
                {formatCount(displayedFollowerCount)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '10px',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                followers
              </Typography>
            </Box>
            <Box sx={{ height: 40, width: 1, bgcolor: 'divider' }} />
            <Box
              onClick={() => setFollowDialog('following')}
              sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}
            >
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: 'text.primary' }}>
                {formatCount(followingCount)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '10px',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                following
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
            {isOwnProfile ? (
              <Button variant="outlined" disableElevation sx={{ gap: 1 }} component={Link} href="/settings">
                <Settings style={{ height: 16, width: 16 }} />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  sx={{ gap: 1 }}
                  variant={isFollowing ? 'outlined' : 'contained'}
                  disableElevation
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} />
                  ) : isFollowing ? (
                    <UserCheck style={{ height: 16, width: 16 }} />
                  ) : (
                    <UserPlus style={{ height: 16, width: 16 }} />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outlined" disableElevation sx={{ gap: 1 }}>
                  <MessageCircle style={{ height: 16, width: 16 }} />
                  Message
                </Button>
              </>
            )}
          </Box>
        </Box>
      </motion.div>

      <FollowListDialog
        open={followDialog !== null}
        onClose={() => setFollowDialog(null)}
        userId={user.id}
        type={followDialog ?? 'followers'}
      />
    </Box>
  );
}
