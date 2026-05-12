'use client';

import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { MapPin } from 'lucide-react';
import {
  Map as MapComponent,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import { LocationBadge } from '@/components/shared/location-badge';
import type { Post } from '@/lib/types';

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
  if (!posts || posts.length === 0) {
    return (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No locations to display</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: 1, borderColor: 'divider', height: 500 }}>
      <MapComponent
        center={[
          Number(posts[0]?.locationLng ?? 0),
          Number(posts[0]?.locationLat ?? 0),
        ]}
        zoom={posts.length === 1 ? 8 : 2}
        styles={mapboxStyleUrls}
        className="map-container"
      >
        {posts.map((post) => {
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
  );
}
