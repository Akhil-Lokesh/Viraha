'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { MapPin } from 'lucide-react';
import { LocationBadge } from '@/components/shared/location-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { hasMapCoordinates } from '@/components/post/keepsake';
import { PhotoTile } from '@/components/cinema';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';
import type { Post } from '@/lib/types';

// ─── Dynamic map components ──────────────────────────
// MapLibre (~350KB) loads only on the client, keeping it out of the initial
// bundle. Every consumer of @/components/ui/map is dynamic so the maplibre-gl
// module is not statically pulled in.

function MapSkeleton() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: CIN.surface,
      }}
    >
      <Typography variant="body2" sx={{ color: CIN.textMuted }}>
        Loading map...
      </Typography>
    </Box>
  );
}

const MapComponent = dynamic(() => import('@/components/ui/map').then((m) => m.Map), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
const MapMarker = dynamic(() => import('@/components/ui/map').then((m) => m.MapMarker), { ssr: false });
const MarkerContent = dynamic(() => import('@/components/ui/map').then((m) => m.MarkerContent), { ssr: false });
const MarkerPopup = dynamic(() => import('@/components/ui/map').then((m) => m.MarkerPopup), { ssr: false });
const MapControls = dynamic(() => import('@/components/ui/map').then((m) => m.MapControls), { ssr: false });

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

interface ProfileMapTabProps {
  posts: Post[];
}

export default function ProfileMapTab({ posts }: ProfileMapTabProps) {
  // The backend nulls lat/lng on redacted locations — those posts can't be
  // plotted, and must never fall back to 0/0 (the Gulf of Guinea).
  const locatedPosts = (posts ?? []).filter(hasMapCoordinates);
  const firstLocated = locatedPosts[0];

  if (!firstLocated) {
    return (
      <EmptyState
        icon="map"
        title="No locations yet"
        description="Posts with location data will appear here on an interactive map."
      />
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${CIN.hairline}`,
        height: 500,
      }}
    >
      <MapComponent
        center={[firstLocated.locationLng, firstLocated.locationLat]}
        zoom={locatedPosts.length === 1 ? 8 : 2}
        styles={mapboxStyleUrls}
        className="map-container"
      >
        {locatedPosts.map((post) => {
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
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `2px solid ${CIN.text}`,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    transition: 'box-shadow .2s ease, transform .2s ease',
                    '&:hover': {
                      transform: 'scale(1.08)',
                      boxShadow: `0 0 0 2px ${CIN.accent}, 0 4px 14px rgba(0,0,0,0.5)`,
                    },
                  }}
                >
                  {resolved ? (
                    <img
                      src={resolved}
                      alt={post.locationName || 'Location'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: CIN.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin style={{ height: 14, width: 14, color: CIN.bg }} />
                    </Box>
                  )}
                </Box>
              </MarkerContent>
              <MarkerPopup closeButton>
                <Box sx={{ width: 224 }}>
                  {post.mediaUrls[0] && (
                    <Link href={`/post/${post.id}`}>
                      <PhotoTile
                        src={post.mediaUrls[0]}
                        alt={post.caption || 'Travel photo'}
                        rounded={6}
                        sx={{
                          aspectRatio: '16/10',
                          mb: 1,
                          transition: 'box-shadow .25s ease',
                          '& img': { transition: 'transform .3s ease' },
                          '&:hover': { boxShadow: glowRing(1) },
                          '&:hover img': { transform: 'scale(1.03)' },
                        }}
                      />
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
                      sx={{ display: 'block', mt: 1, fontSize: '0.75rem', color: CIN.accent, fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
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
  );
}
