'use client';

import { useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Box, Typography } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { useUserProfile } from '@/lib/hooks/use-user';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/lib/api/posts';
import { useSavedPosts } from '@/lib/hooks/use-saves';
import { useAlbums } from '@/lib/hooks/use-albums';
import { useJournals } from '@/lib/hooks/use-journals';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { UserProfileHeader } from '@/components/user/user-profile-header';
import { PostGrid } from '@/components/post/post-grid';
import { AlbumGrid } from '@/components/album/album-grid';
import { JournalGrid } from '@/components/journal/journal-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { LocationBadge } from '@/components/shared/location-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ReportDialog } from '@/components/shared/report-dialog';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import {
  Map as MapComponent,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import { Map, Bookmark, Grid3X3, FolderOpen, BookOpen, Lock, MoreVertical, Flag, VolumeX, Volume2 } from 'lucide-react';
import { useMutedUsers, useMuteUser, useUnmuteUser } from '@/lib/hooks/use-mutes';
import { toast } from 'sonner';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const GOLD = 'var(--viraha-gold, #D4A843)';

// Subtle paper-grain texture (CSS-only, per design brief — no asset files).
const PAPER_GRAIN =
  'repeating-linear-gradient(0deg, rgba(34,28,24,0.03) 0px, rgba(34,28,24,0.03) 1px, transparent 1px, transparent 3px)';

/** Dashed-gold passport-stamp roundel used by the restyled error/private states. */
function StampRoundel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        width: 88,
        height: 88,
        borderRadius: '50%',
        border: '1.5px dashed rgba(212,168,67,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(-4deg)',
        bgcolor:
          theme.palette.mode === 'dark' ? 'rgba(212,168,67,0.06)' : 'rgba(212,168,67,0.1)',
        backgroundImage: PAPER_GRAIN,
        mb: 3,
      })}
    >
      <Box
        sx={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,168,67,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const mapboxStyleUrls = MAPBOX_TOKEN
  ? {
      light: `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${MAPBOX_TOKEN}`,
      dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`,
    }
  : undefined;

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

  const mapPosts = useMemo(
    () => userPosts.filter((p) => p.locationLat && p.locationLng),
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
        <Skeleton variant="rounded" animation="pulse" sx={{ height: { xs: 192, md: 264 }, width: '100%', borderRadius: 0 }} />
        {/* Avatar + info skeleton */}
        <Box sx={{ mt: -8, px: { xs: 2, md: 4 }, position: 'relative', zIndex: 10 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 96, width: 96, borderRadius: '50%', outline: '4px solid', outlineColor: 'background.default' }} />
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 28, width: 192 }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 128 }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 256 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 48, mx: 'auto' }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 64 }} />
              </Box>
            ))}
          </Box>
        </Box>
        {/* Content grid skeleton */}
        <Box sx={{ mt: 5, px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton variant="rounded" animation="pulse" key={i} sx={{ aspectRatio: '4/3', borderRadius: '12px' }} />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (userError || !user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 10,
          px: 2,
        }}
      >
        <StampRoundel>
          <MapPin style={{ width: 28, height: 28, color: 'var(--viraha-gold, #D4A843)' }} />
        </StampRoundel>
        <Typography
          sx={{
            fontFamily: 'var(--font-brand, sans-serif)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: GOLD,
            fontWeight: 500,
            mb: 1,
          }}
        >
          No stamp on record
        </Typography>
        <Typography sx={{ fontFamily: 'var(--font-accent, serif)', fontSize: '1.75rem', color: 'text.primary' }}>
          User not found
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', maxWidth: 384 }}>
          The profile you are looking for does not exist.
        </Typography>
      </Box>
    );
  }

  return (
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
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
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
                  sx: (theme) => ({
                    borderRadius: '10px',
                    minWidth: 160,
                    border: '1px solid',
                    borderColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(212,168,67,0.3)'
                        : 'rgba(212,168,67,0.45)',
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'var(--viraha-ink-plum, #16121F)'
                        : 'var(--viraha-paper, #FAF6EE)',
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '3px 3px 0 rgba(0,0,0,0.4)'
                        : '3px 3px 0 rgba(34,28,24,0.12)',
                  }),
                },
              }}
            >
              <MuiMenuItem
                onClick={handleMuteToggle}
                disabled={muteUser.isPending || unmuteUser.isPending}
                sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5 }}
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
                sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5, color: 'error.main' }}
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

      {/* Tabs — journal tabs with a gold stamp underline */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
      <Box sx={{ mt: 5, px: { xs: 2, md: 4 } }}>
        <Box>
          <MuiTabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons={false}
            sx={(theme) => ({
              width: '100%',
              justifyContent: 'flex-start',
              borderBottom: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(212,168,67,0.25)'
                  : 'rgba(212,168,67,0.4)',
              position: 'sticky',
              top: 0,
              bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.95)',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
              mb: 4,
              minHeight: 40,
              '& .MuiTabs-indicator': {
                backgroundColor: GOLD,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-brand, sans-serif)',
                fontWeight: 500,
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                px: 2,
                color: 'text.secondary',
                '&.Mui-selected': { color: 'text.primary' },
              },
            })}
          >
            <MuiTab value="posts" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Grid3X3 style={{ height: 16, width: 16 }} /> Posts</Box>} />
            <MuiTab value="map" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Map style={{ height: 16, width: 16 }} /> Map</Box>} />
            <MuiTab value="albums" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FolderOpen style={{ height: 16, width: 16 }} /> Albums</Box>} />
            <MuiTab value="journals" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BookOpen style={{ height: 16, width: 16 }} /> Journals</Box>} />
            {isOwnProfile && (
              <MuiTab value="saved" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Bookmark style={{ height: 16, width: 16 }} /> Saved</Box>} />
            )}
          </MuiTabs>

          {activeTab === 'posts' && (
            postsLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton variant="rounded" animation="pulse" key={i} sx={{ aspectRatio: '4/3', borderRadius: '12px' }} />
                ))}
              </Box>
            ) : (
              <PostGrid posts={userPosts} />
            )
          )}

          {activeTab === 'map' && (
            mapPosts.length === 0 ? (
              <EmptyState
                icon="compass"
                title="No locations yet"
                description="Posts with location data will appear here on an interactive map."
              />
            ) : (
              <Box
                sx={(theme) => ({
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(212,168,67,0.3)'
                      : 'rgba(212,168,67,0.45)',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '3px 3px 0 rgba(0,0,0,0.35)'
                      : '3px 3px 0 rgba(34,28,24,0.1)',
                  height: 500,
                })}
              >
                <MapComponent
                  center={[
                    Number(mapPosts[0]?.locationLng ?? 0),
                    Number(mapPosts[0]?.locationLat ?? 0),
                  ]}
                  zoom={mapPosts.length === 1 ? 8 : 2}
                  styles={mapboxStyleUrls}
                  className="map-container"
                >
                  {mapPosts.map((post) => {
                    const thumb = post.mediaThumbnails[0] || post.mediaUrls[0];
                    const resolved = thumb ? resolveImageUrl(thumb) : null;
                    const locationLabel = [post.locationCity, post.locationCountry]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <MapMarker
                        key={post.id}
                        longitude={post.locationLng}
                        latitude={post.locationLat}
                      >
                        <MarkerContent>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', border: 2, borderColor: 'white', boxShadow: 3, overflow: 'hidden' }}>
                            {resolved ? (
                              <img
                                src={resolved}
                                alt={post.locationName || 'Location'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Box sx={{ width: '100%', height: '100%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin style={{ height: 14, width: 14, color: 'var(--mui-palette-primary-contrastText)' }} />
                              </Box>
                            )}
                          </Box>
                        </MarkerContent>
                        <MarkerPopup closeButton>
                          <Box sx={{ width: 224 }}>
                            {post.mediaUrls[0] && (
                              <Link href={`/post/${post.id}`}>
                                <Box sx={{ position: 'relative', aspectRatio: '16/10', borderRadius: '6px', overflow: 'hidden', mb: 1 }}>
                                  <img
                                    src={resolveImageUrl(post.mediaUrls[0])}
                                    alt={post.caption || 'Travel photo'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                  />
                                </Box>
                              </Link>
                            )}
                            {post.caption && (
                              <Typography variant="body2" sx={{ color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.75 }}>
                                {post.caption}
                              </Typography>
                            )}
                            {locationLabel && (
                              <LocationBadge location={locationLabel} variant="subtle" />
                            )}
                            <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Box
                                sx={{ display: 'block', mt: 1, fontSize: '0.75rem', color: 'secondary.main', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                              >
                                View post
                              </Box>
                            </Link>
                          </Box>
                        </MarkerPopup>
                      </MapMarker>
                    );
                  })}
                  <MapControls
                    position="bottom-right"
                    showZoom
                    showCompass
                  />
                </MapComponent>
              </Box>
            )
          )}

          {activeTab === 'albums' && (
            albumsLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton variant="rounded" animation="pulse" key={i} sx={{ aspectRatio: '4/3', borderRadius: '12px' }} />
                ))}
              </Box>
            ) : (
              <AlbumGrid albums={userAlbums} />
            )
          )}

          {activeTab === 'journals' && (
            journalsLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton variant="rounded" animation="pulse" key={i} sx={{ aspectRatio: '4/3', borderRadius: '12px' }} />
                ))}
              </Box>
            ) : (
              <JournalGrid journals={userJournals} />
            )
          )}

          {activeTab === 'saved' && (
            isOwnProfile ? (
              savedLoading ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton variant="rounded" animation="pulse" key={i} sx={{ aspectRatio: '4/3', borderRadius: '12px' }} />
                  ))}
                </Box>
              ) : savedPosts.length > 0 ? (
                <Box>
                  <PostGrid posts={savedPosts} />
                  {hasMoreSaved && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Box
                        component="button"
                        onClick={() => fetchNextSaved()}
                        sx={{
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                          bgcolor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          '&:hover': { color: 'text.primary' },
                          transition: 'color 0.2s',
                        }}
                      >
                        Load more
                      </Box>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, textAlign: 'center' }}>
                <StampRoundel>
                  <Lock style={{ width: 26, height: 26, color: 'var(--viraha-gold, #D4A843)' }} />
                </StampRoundel>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-brand, sans-serif)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: GOLD,
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  Sealed page
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-accent, serif)', fontSize: '1.5rem', color: 'text.primary', mb: 1 }}>
                  Saved posts are private
                </Typography>
                <Typography sx={{ color: 'text.secondary', maxWidth: 384, fontStyle: 'italic' }}>
                  You can only view your own saved posts.
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>
      </motion.div>
    </Box>
  );
}
