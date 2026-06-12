'use client';

import { useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Map,
  Bookmark,
  Grid3X3,
  FolderOpen,
  BookOpen,
  MoreVertical,
  Flag,
  VolumeX,
  Volume2,
} from 'lucide-react';
import { useUserProfile } from '@/lib/hooks/use-user';
import { useAuth } from '@/lib/hooks/use-auth';
import { getPosts } from '@/lib/api/posts';
import { useSavedPosts } from '@/lib/hooks/use-saves';
import { useAlbums } from '@/lib/hooks/use-albums';
import { useJournals } from '@/lib/hooks/use-journals';
import { useMutedUsers, useMuteUser, useUnmuteUser } from '@/lib/hooks/use-mutes';
import { UserProfileHeader } from '@/components/user/user-profile-header';
import { PostGrid } from '@/components/post/post-grid';
import { hasMapCoordinates } from '@/components/post/keepsake';
import { AlbumGrid } from '@/components/album/album-grid';
import { JournalGrid } from '@/components/journal/journal-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { ReportDialog } from '@/components/shared/report-dialog';
import { GlowButton } from '@/components/cinema';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';
import ProfileMapTab from './profile-map-tab';

/** Tab label with the shared motion accent underline (layoutId slides between tabs). */
function TabLabel({
  active,
  icon,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      {children}
      {active && (
        <motion.div
          layoutId="profile-tab-accent"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -14,
            height: 2,
            borderRadius: 2,
            background: CIN.accent,
            boxShadow: `0 0 12px ${CIN.accentGlow}`,
          }}
        />
      )}
    </Box>
  );
}

function GridSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          variant="rounded"
          animation="pulse"
          key={i}
          sx={{ aspectRatio: '4/3', borderRadius: '14px', bgcolor: CIN.surface }}
        />
      ))}
    </Box>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);
  // The ReportDialog self-manages its open state via its trigger element. We keep
  // that trigger OUTSIDE the Menu (so closing the Menu doesn't unmount the dialog)
  // and click it programmatically from the in-menu "Report" row.
  const reportTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserProfile(username);

  const isOwnProfile = !!(authUser && user && authUser.username === user.username);

  // Mute state (one-way — the target is never notified).
  const { data: mutedUsers } = useMutedUsers(!!authUser && !isOwnProfile);
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const isMuted = !!user && !!mutedUsers?.some((m) => m.id === user.id);

  function handleMuteToggle() {
    setOverflowAnchor(null);
    if (!user) return;
    if (isMuted) {
      unmuteUser.mutate(user.username, {
        onSuccess: () => toast.success(`Unmuted @${user.username}`),
        onError: () => toast.error('Could not unmute'),
      });
    } else {
      muteUser.mutate(user.username, {
        onSuccess: () =>
          toast.success(`Muted @${user.username} — their posts won't show in your feed`),
        onError: () => toast.error('Could not mute'),
      });
    }
  }

  // Fetch posts filtered by userId on the backend
  const {
    data: postsData,
    isLoading: postsLoading,
  } = useQuery({
    queryKey: ['posts', 'user', user?.id],
    queryFn: () => getPosts(undefined, user!.id),
    enabled: !!user?.id,
  });

  const userPosts = postsData?.items || [];

  // Posts with redacted (nulled) coordinates can't be plotted on the map.
  const mapPosts = useMemo(
    () => userPosts.filter(hasMapCoordinates),
    [userPosts]
  );

  // Fetch saved posts (only for own profile)
  const {
    data: savedData,
    isLoading: savedLoading,
    fetchNextPage: fetchNextSaved,
    hasNextPage: hasMoreSaved,
  } = useSavedPosts();

  const savedPosts = isOwnProfile
    ? savedData?.pages.flatMap((page) => page.items) || []
    : [];

  // Fetch user's albums
  const {
    data: albumsData,
    isLoading: albumsLoading,
  } = useAlbums(user?.id);

  const userAlbums = albumsData?.pages.flatMap((page) => page.items) || [];

  // Fetch user's journals
  const {
    data: journalsData,
    isLoading: journalsLoading,
  } = useJournals(user?.id);

  const userJournals = journalsData?.pages.flatMap((page) => page.items) || [];

  // Loading skeleton
  if (userLoading) {
    return (
      <Box sx={{ maxWidth: 896, mx: 'auto' }}>
        {/* Cover skeleton */}
        <Skeleton
          variant="rounded"
          animation="pulse"
          sx={{ height: { xs: 200, md: 280 }, width: '100%', borderRadius: 0, bgcolor: CIN.surface }}
        />
        {/* Avatar + info skeleton */}
        <Box sx={{ mt: -7, px: { xs: 2, md: 4 }, position: 'relative', zIndex: 10 }}>
          <Skeleton
            variant="rounded"
            animation="pulse"
            sx={{
              height: 96,
              width: 96,
              borderRadius: '50%',
              bgcolor: CIN.surface2,
              outline: `4px solid ${CIN.bg}`,
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 28, width: 192, bgcolor: CIN.surface }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 128, bgcolor: CIN.surface }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 256, bgcolor: CIN.surface }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                animation="pulse"
                sx={{ height: 64, width: 92, borderRadius: '12px', bgcolor: CIN.surface }}
              />
            ))}
          </Box>
        </Box>
        {/* Content grid skeleton */}
        <Box sx={{ mt: 5, px: { xs: 2, md: 4 } }}>
          <GridSkeleton />
        </Box>
      </Box>
    );
  }

  if (userError || !user) {
    return (
      <EmptyState
        icon="compass"
        title="User not found"
        description="The profile you are looking for does not exist."
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Box sx={{ maxWidth: 896, mx: 'auto', pb: 6 }}>
        <Box sx={{ position: 'relative' }}>
          <UserProfileHeader user={user} isOwnProfile={isOwnProfile} />

          {!isOwnProfile && (
            <>
              <Box
                component="button"
                type="button"
                aria-label="More options"
                onClick={(e) => setOverflowAnchor(e.currentTarget)}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  border: `1px solid ${CIN.hairline}`,
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  color: CIN.text,
                  bgcolor: 'rgba(11,11,15,0.55)',
                  backdropFilter: 'blur(6px)',
                  transition: 'background-color 0.2s, box-shadow 0.2s',
                  '&:hover': { bgcolor: 'rgba(11,11,15,0.8)', boxShadow: glowRing(1) },
                  '&:focus-visible': { outline: `2px solid ${CIN.accent}`, outlineOffset: 2 },
                }}
              >
                <MoreVertical style={{ height: 18, width: 18 }} />
              </Box>
              <Menu
                anchorEl={overflowAnchor}
                open={Boolean(overflowAnchor)}
                onClose={() => setOverflowAnchor(null)}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: '12px',
                      minWidth: 160,
                      border: `1px solid ${CIN.hairline}`,
                      bgcolor: CIN.surface2,
                      backgroundImage: 'none',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                    },
                  },
                }}
              >
                <MuiMenuItem
                  onClick={handleMuteToggle}
                  disabled={muteUser.isPending || unmuteUser.isPending}
                  sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5, color: CIN.text }}
                >
                  {isMuted ? (
                    <Volume2 size={16} style={{ marginRight: 8 }} />
                  ) : (
                    <VolumeX size={16} style={{ marginRight: 8 }} />
                  )}
                  {isMuted ? 'Unmute' : 'Mute'}
                </MuiMenuItem>
                <MuiMenuItem
                  onClick={() => {
                    setOverflowAnchor(null);
                    reportTriggerRef.current?.click();
                  }}
                  sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5, color: CIN.danger }}
                >
                  <Flag size={16} style={{ marginRight: 8 }} />
                  Report
                </MuiMenuItem>
              </Menu>
              {/* Report dialog — trigger lives outside the Menu so closing the Menu does
                  not unmount the open dialog. It is activated via reportTriggerRef. */}
              <ReportDialog
                targetType="user"
                targetId={user.id}
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
            </>
          )}
        </Box>

        {/* Tabs — motion accent underline slides between sections */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
          <Box sx={{ mt: 5, px: { xs: 2, md: 4 } }}>
            <Box>
              <MuiTabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons={false}
                TabIndicatorProps={{ sx: { display: 'none' } }}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderBottom: `1px solid ${CIN.hairline}`,
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'rgba(11,11,15,0.85)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 10,
                  mb: 4,
                  minHeight: 44,
                  '& .MuiTab-root': {
                    minHeight: 44,
                    overflow: 'visible',
                    textTransform: 'uppercase',
                    fontFamily: 'Posterama, var(--font-body)',
                    fontWeight: 500,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    px: 2,
                    color: CIN.textMuted,
                    transition: 'color 0.2s',
                    '&:hover': { color: CIN.text },
                    '&.Mui-selected': { color: CIN.text },
                  },
                }}
              >
                <MuiTab
                  value="posts"
                  label={
                    <TabLabel active={activeTab === 'posts'} icon={<Grid3X3 style={{ height: 16, width: 16 }} />}>
                      Posts
                    </TabLabel>
                  }
                />
                <MuiTab
                  value="albums"
                  label={
                    <TabLabel active={activeTab === 'albums'} icon={<FolderOpen style={{ height: 16, width: 16 }} />}>
                      Albums
                    </TabLabel>
                  }
                />
                <MuiTab
                  value="journals"
                  label={
                    <TabLabel active={activeTab === 'journals'} icon={<BookOpen style={{ height: 16, width: 16 }} />}>
                      Journals
                    </TabLabel>
                  }
                />
                <MuiTab
                  value="map"
                  label={
                    <TabLabel active={activeTab === 'map'} icon={<Map style={{ height: 16, width: 16 }} />}>
                      Map
                    </TabLabel>
                  }
                />
                {isOwnProfile && (
                  <MuiTab
                    value="saved"
                    label={
                      <TabLabel active={activeTab === 'saved'} icon={<Bookmark style={{ height: 16, width: 16 }} />}>
                        Saved
                      </TabLabel>
                    }
                  />
                )}
              </MuiTabs>

              {activeTab === 'posts' && (
                postsLoading ? <GridSkeleton /> : <PostGrid posts={userPosts} />
              )}

              {activeTab === 'albums' && (
                albumsLoading ? <GridSkeleton /> : <AlbumGrid albums={userAlbums} />
              )}

              {activeTab === 'journals' && (
                journalsLoading ? <GridSkeleton /> : <JournalGrid journals={userJournals} />
              )}

              {activeTab === 'map' && (
                mapPosts.length === 0 ? (
                  <EmptyState
                    icon="map"
                    title="No locations yet"
                    description="Posts with location data will appear here on an interactive map."
                  />
                ) : (
                  <ProfileMapTab posts={mapPosts} />
                )
              )}

              {activeTab === 'saved' && (
                isOwnProfile ? (
                  savedLoading ? (
                    <GridSkeleton />
                  ) : savedPosts.length > 0 ? (
                    <Box>
                      <PostGrid posts={savedPosts} />
                      {hasMoreSaved && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                          <GlowButton variant="ghost" onClick={() => fetchNextSaved()}>
                            Load more
                          </GlowButton>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <EmptyState
                      icon="compass"
                      title="No saved memories yet"
                      description="When you save travel memories from other explorers, they will appear here for easy access."
                    />
                  )
                ) : (
                  <EmptyState
                    icon="compass"
                    title="Saved posts are private"
                    description="You can only view your own saved posts."
                  />
                )
              )}
            </Box>
          </Box>
        </motion.div>
      </Box>
    </MotionConfig>
  );
}
