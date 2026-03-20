'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
import {
  Map as MapComponent,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import { Map, Bookmark, Grid3X3, FolderOpen, BookOpen, Lock } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserProfile(username);

  const isOwnProfile = !!(authUser && user && authUser.username === user.username);

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
        <Skeleton variant="rounded" animation="pulse" sx={{ height: { xs: 192, md: 288 }, width: '100%', borderRadius: 0 }} />
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
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
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="h6">User not found</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>The profile you are looking for does not exist.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 896, mx: 'auto', pb: 6 }}>
      <UserProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Tabs */}
      <Box sx={{ mt: 4, px: { xs: 2, md: 4 } }}>
        <Box>
          <MuiTabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons={false} sx={{ width: '100%', justifyContent: 'flex-start', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.95)', backdropFilter: 'blur(4px)', zIndex: 10, mb: 3, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', px: 2 } }}>
            <MuiTab value="posts" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Grid3X3 style={{ height: 16, width: 16 }} /> Posts</Box>} />
            <MuiTab value="map" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Map style={{ height: 16, width: 16 }} /> Map</Box>} />
            <MuiTab value="albums" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FolderOpen style={{ height: 16, width: 16 }} /> Albums</Box>} />
            <MuiTab value="journals" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BookOpen style={{ height: 16, width: 16 }} /> Journals</Box>} />
            {(isOwnProfile || authUser) && (
              <MuiTab value="saved" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Bookmark style={{ height: 16, width: 16 }} /> Saved</Box>} />
            )}
          </MuiTabs>

          {activeTab === 'posts' && (
            postsLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
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
              <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: 1, borderColor: 'divider', height: 500 }}>
                <MapComponent
                  center={[
                    Number(mapPosts[0].locationLng),
                    Number(mapPosts[0].locationLat),
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
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
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'action.selected',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Lock style={{ width: 40, height: 40, color: 'var(--mui-palette-text-secondary)' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Saved posts are private</Typography>
                <Typography sx={{ color: 'text.secondary', maxWidth: 384 }}>
                  You can only view your own saved posts.
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
