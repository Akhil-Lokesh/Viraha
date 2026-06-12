'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Loader2, BookOpen, Navigation, X, Pin, Sparkles } from 'lucide-react';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePlaceResonance } from '@/lib/hooks/use-viraha';
import { useWantToGo } from '@/lib/hooks/use-want-to-go';
import { useNearbyFeed } from '@/lib/hooks/use-travel';
import { useTravelStore } from '@/lib/stores/travel-store';
import { LocationBadge } from '@/components/shared/location-badge';
import { TimelineScrubber } from '@/components/map/timeline-scrubber';
import { PlaceHistoryDrawer } from '@/components/map/place-history-drawer';
import { ResonancePin } from '@/components/map/resonance-pin';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { GlowButton, PhotoTile } from '@/components/cinema';
import type { MapMarkerData, Post } from '@/lib/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

// The app is pinned to dark mode — when a Mapbox token is configured, both
// theme slots resolve to the dark basemap. Without a token, ui/map falls back
// to the default Carto Dark Matter style (free, no key).
const mapboxStyleUrls = MAPBOX_TOKEN
  ? {
      light: `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`,
      dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`,
    }
  : undefined;

// Floating chrome shares one frosted dark-surface treatment.
const chromeSurfaceSx = {
  bgcolor: 'rgba(20,20,25,0.92)',
  backdropFilter: 'blur(16px)',
  borderRadius: '10px',
  border: `1px solid ${CIN.hairline}`,
} as const;

// ─── Dynamic map components ──────────────────────────
// MapLibre (~350KB) is loaded only on the client, keeping it out of the
// initial bundle. All consumers of @/components/ui/map are dynamic so the
// maplibre-gl module is not pulled in statically.

function MapSkeleton() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: CIN.bg,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Loader2 style={{ height: 32, width: 32, animation: 'spin 1s linear infinite', color: CIN.accent }} />
        <Typography variant="body2" sx={{ color: CIN.textMuted }}>Loading map...</Typography>
      </Box>
    </Box>
  );
}

const Map = dynamic(() => import('@/components/ui/map').then((m) => m.Map), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
const MapMarker = dynamic(() => import('@/components/ui/map').then((m) => m.MapMarker), { ssr: false });
const MarkerContent = dynamic(() => import('@/components/ui/map').then((m) => m.MarkerContent), { ssr: false });
const MarkerPopup = dynamic(() => import('@/components/ui/map').then((m) => m.MarkerPopup), { ssr: false });
const MapControls = dynamic(() => import('@/components/ui/map').then((m) => m.MapControls), { ssr: false });

// ─── Filter types ────────────────────────────────────

type TypeFilter = 'all' | 'post' | 'journal';
type ScopeFilter = 'everyone' | 'mine';

// ─── Filter pills (animated accent pill via layoutId) ─

function FilterPillGroup<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <Box
      sx={{
        ...chromeSurfaceSx,
        p: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Box
            key={opt.value}
            component="button"
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            sx={{
              position: 'relative',
              px: 1.5,
              py: 0.75,
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              bgcolor: 'transparent',
              color: active ? CIN.bg : CIN.textMuted,
              transition: 'color 0.2s ease',
              '&:hover': { color: active ? CIN.bg : CIN.text },
            }}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: CIN.accent,
                  boxShadow: `0 0 14px ${CIN.accentGlow}`,
                }}
              />
            )}
            <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
              {opt.label}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Filter bar ──────────────────────────────────────

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'post', label: 'Posts' },
  { value: 'journal', label: 'Journals' },
];

const SCOPE_OPTIONS: readonly { value: ScopeFilter; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'mine', label: 'My Content' },
];

function FilterBar({
  typeFilter,
  onTypeChange,
  scopeFilter,
  onScopeChange,
}: {
  typeFilter: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  scopeFilter: ScopeFilter;
  onScopeChange: (s: ScopeFilter) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Box
      component={motion.div}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      sx={{
        position: 'absolute',
        top: 16,
        left: { xs: 16, md: 24 },
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <FilterPillGroup
        options={TYPE_OPTIONS}
        value={typeFilter}
        onChange={onTypeChange}
        layoutId="map-type-pill"
      />
      <FilterPillGroup
        options={SCOPE_OPTIONS}
        value={scopeFilter}
        onChange={onScopeChange}
        layoutId="map-scope-pill"
      />
    </Box>
  );
}

// ─── Marker pin ──────────────────────────────────────

function MarkerPin({ marker }: { marker: MapMarkerData }) {
  const resolved = marker.thumbnail ? resolveImageUrl(marker.thumbnail) : null;
  const isJournal = marker.type === 'journal';

  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover .pin-img': {
          transform: 'scale(1.08)',
          boxShadow: `0 0 0 1px ${CIN.accent}, 0 0 22px ${CIN.accentGlow}`,
        },
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          pointerEvents: 'none',
          bgcolor: CIN.accentGlow,
        }}
      />
      <Box
        className="pin-img"
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `2px solid ${CIN.accent}`,
          boxShadow: `0 0 14px ${CIN.accentGlow}`,
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          bgcolor: CIN.surface2,
        }}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={marker.title || marker.locationName || 'Location'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: CIN.surface2,
              color: CIN.accent,
            }}
          >
            {isJournal ? (
              <BookOpen style={{ height: 16, width: 16 }} />
            ) : (
              <MapPin style={{ height: 16, width: 16 }} />
            )}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 8,
          height: 8,
          bgcolor: CIN.accent,
        }}
      />
    </Box>
  );
}

// ─── Popup content ───────────────────────────────────

function MarkerPopupContent({
  marker,
  onViewPlaceHistory,
}: {
  marker: MapMarkerData;
  onViewPlaceHistory: (marker: MapMarkerData) => void;
}) {
  const isJournal = marker.type === 'journal';
  const href = isJournal
    ? `/journals/${marker.journalId}`
    : `/post/${marker.id}`;

  return (
    <Box sx={{ width: 256 }}>
      {marker.thumbnail && (
        <Link href={href}>
          <PhotoTile
            src={marker.thumbnail}
            alt={marker.title || 'Travel photo'}
            rounded={8}
            sx={{ aspectRatio: '16/10', mb: 1 }}
          >
            {isJournal && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  bgcolor: CIN.accent,
                  color: CIN.bg,
                  fontSize: '10px',
                  fontWeight: 700,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <BookOpen style={{ height: 10, width: 10 }} />
                Journal
              </Box>
            )}
          </PhotoTile>
        </Link>
      )}

      {marker.title && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: CIN.text,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.75,
          }}
        >
          {marker.title}
        </Typography>
      )}

      {marker.locationName && (
        <LocationBadge location={marker.locationName} variant="subtle" />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box
            sx={{
              display: 'block',
              fontSize: '0.75rem',
              color: CIN.accent,
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {isJournal ? 'View journal' : 'View post'}
          </Box>
        </Link>
        <Box
          component="button"
          type="button"
          onClick={() => onViewPlaceHistory(marker)}
          sx={{
            display: 'block',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            p: 0,
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: CIN.textMuted,
            fontWeight: 500,
            transition: 'color 0.15s ease',
            '&:hover': { color: CIN.accent, textDecoration: 'underline' },
          }}
        >
          View place history
        </Box>
      </Box>
    </Box>
  );
}

// ─── Nearby feed panel ───────────────────────────────

const NEARBY_RADIUS_KM = 50;

function NearbyPostRow({ post }: { post: Post }) {
  const reduceMotion = useReducedMotion();
  const thumbnail = post.mediaThumbnails[0] || post.mediaUrls[0] || null;
  const place =
    post.locationName ||
    [post.locationCity, post.locationCountry].filter(Boolean).join(', ') ||
    'Unknown location';

  return (
    <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.div whileHover={reduceMotion ? undefined : { x: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1,
            borderRadius: '10px',
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        >
          {thumbnail ? (
            <PhotoTile
              src={thumbnail}
              alt={post.caption || place}
              rounded={8}
              vignette={false}
              sx={{ width: 56, height: 56, flexShrink: 0 }}
            />
          ) : (
            <Box
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: '8px',
                bgcolor: CIN.surface2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: CIN.textMuted,
              }}
            >
              <MapPin style={{ height: 18, width: 18 }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {post.caption && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: CIN.text,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.caption}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: CIN.textMuted, display: 'block', mt: 0.25 }}>
              {place}
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Link>
  );
}

function NearbyPanel({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const currentLat = useTravelStore((s) => s.currentLat);
  const currentLng = useTravelStore((s) => s.currentLng);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNearbyFeed(currentLat, currentLng, NEARBY_RADIUS_KM);

  const hasCoords = currentLat != null && currentLng != null;
  const posts = useMemo(
    () => (data ? data.pages.flatMap((page) => page.items) : []),
    [data]
  );

  return (
    <Box
      component={motion.div}
      initial={reduceMotion ? false : { x: 32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: { xs: '100%', sm: 360 },
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(17,17,22,0.97)',
        backdropFilter: 'blur(16px)',
        borderLeft: `1px solid ${CIN.hairline}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${CIN.hairline}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Navigation style={{ height: 14, width: 14, color: CIN.accent }} />
          <Typography sx={{ ...eyebrowSx, fontWeight: 700 }}>
            Nearby
          </Typography>
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          aria-label="Close nearby panel"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            p: 0.5,
            borderRadius: '8px',
            color: CIN.textMuted,
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': { color: CIN.text, bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          <X style={{ height: 16, width: 16 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
        {!hasCoords ? (
          <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text, mb: 0.5 }}>
              Location unavailable
            </Typography>
            <Typography variant="caption" sx={{ color: CIN.textMuted }}>
              Set your travel location to discover posts around you.
            </Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 4 }}>
            <Loader2
              style={{ height: 24, width: 24, animation: 'spin 1s linear infinite', color: CIN.accent }}
            />
            <Typography variant="caption" sx={{ color: CIN.textMuted }}>
              Finding posts nearby...
            </Typography>
          </Box>
        ) : isError ? (
          <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text, mb: 1 }}>
              Couldn&apos;t load nearby posts.
            </Typography>
            <GlowButton variant="ghost" size="small" onClick={() => refetch()}>
              Retry
            </GlowButton>
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text, mb: 0.5 }}>
              Nothing nearby yet.
            </Typography>
            <Typography variant="caption" sx={{ color: CIN.textMuted }}>
              No posts within {NEARBY_RADIUS_KM}km of your location.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {posts.map((post) => (
              <NearbyPostRow key={post.id} post={post} />
            ))}
            {hasNextPage && (
              <GlowButton
                variant="ghost"
                size="small"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{ mt: 1, mx: 1 }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </GlowButton>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Resonance matching ──────────────────────────────

// The resonance endpoint groups posts by city and returns an AVG(lat/lng)
// centroid per city, so a per-marker exact-coordinate key never matches the
// centroid. Markers in the same city instead fall within a city-sized radius
// of the centroid, so each marker is matched to the nearest resonance centroid
// within this tolerance.
const RESONANCE_MATCH_RADIUS_KM = 30;
const EARTH_RADIUS_KM = 6371;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

interface ResonanceCentroid {
  lat: number;
  lng: number;
  city: string;
  country: string;
  resonance: number;
}

// Resolve a marker to its city's resonance score by nearest centroid within
// the city radius. Returns undefined when no resonant city is close enough.
function resolveResonance(
  marker: MapMarkerData,
  centroids: readonly ResonanceCentroid[]
): number | undefined {
  let best: { resonance: number; distanceKm: number } | undefined;
  for (const centroid of centroids) {
    const distanceKm = haversineKm(marker.lat, marker.lng, centroid.lat, centroid.lng);
    if (distanceKm > RESONANCE_MATCH_RADIUS_KM) continue;
    if (!best || distanceKm < best.distanceKm) {
      best = { resonance: centroid.resonance, distanceKm };
    }
  }
  return best?.resonance;
}

// ─── Page ────────────────────────────────────────────

// Wide initial bounds to fetch all markers globally
const GLOBAL_BOUNDS = {
  swLat: -90,
  swLng: -180,
  neLat: 90,
  neLng: 180,
};

export default function MapPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('everyone');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [placeDrawer, setPlaceDrawer] = useState<{
    open: boolean;
    lat: number | null;
    lng: number | null;
    locationName: string | null;
  }>({ open: false, lat: null, lng: null, locationName: null });
  const [nearbyOpen, setNearbyOpen] = useState(false);

  const handleMarkerClick = useCallback((marker: MapMarkerData) => {
    setPlaceDrawer({
      open: true,
      lat: marker.lat,
      lng: marker.lng,
      locationName: marker.locationName,
    });
  }, []);

  const handleDateRangeChange = useCallback((start: string | null, end: string | null) => {
    setDateStart(start);
    setDateEnd(end);
  }, []);

  // Build query params for the markers API
  const queryParams = useMemo(() => {
    return {
      ...GLOBAL_BOUNDS,
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(scopeFilter === 'mine' && user?.id ? { userId: user.id } : {}),
      ...(dateStart ? { startDate: dateStart } : {}),
      ...(dateEnd ? { endDate: dateEnd } : {}),
    };
  }, [typeFilter, scopeFilter, user?.id, dateStart, dateEnd]);

  const { data: markers, isLoading, isError, refetch } = useMapMarkers(queryParams);
  const { data: resonanceData } = usePlaceResonance();
  const { data: wantToGoItems } = useWantToGo();

  const markerList = markers ?? [];

  // Resonance is grouped by city on the backend (AVG(lat/lng) centroid keyed by
  // city + country), so markers are matched to a city's resonance by proximity
  // to that centroid rather than by exact coordinates. Only used in "My Content"
  // scope, where every marker in a resonant city renders a ResonancePin.
  const resonanceCentroids = useMemo<ResonanceCentroid[]>(() => {
    if (!resonanceData) return [];
    return resonanceData.map((place) => ({
      lat: place.lat,
      lng: place.lng,
      city: place.locationCity,
      country: place.locationCountry,
      resonance: place.resonance,
    }));
  }, [resonanceData]);
  const markerCount = markerList.length;

  // Determine the label for the count badge
  const countLabel = useMemo(() => {
    if (typeFilter === 'journal') {
      return markerCount === 1 ? 'journal entry' : 'journal entries';
    }
    if (typeFilter === 'post') {
      return markerCount === 1 ? 'post' : 'posts';
    }
    return markerCount === 1 ? 'memory' : 'memories';
  }, [typeFilter, markerCount]);

  const handleTypeChange = useCallback((t: TypeFilter) => {
    setTypeFilter(t);
  }, []);

  const handleScopeChange = useCallback((s: ScopeFilter) => {
    setScopeFilter(s);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        top: { xs: 56, md: 0 },
        bottom: { xs: 64, md: 0 },
        left: { xs: 0, md: '96px' },
        zIndex: 10,
        bgcolor: CIN.bg,
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {isLoading ? (
          <MapSkeleton />
        ) : isError ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: CIN.bg,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, maxWidth: 320, textAlign: 'center', px: 3 }}>
              <Typography variant="body2" sx={{ color: CIN.text, fontWeight: 500 }}>
                Couldn&apos;t load map data.
              </Typography>
              <GlowButton variant="ghost" size="small" onClick={() => refetch()}>
                Retry
              </GlowButton>
            </Box>
          </Box>
        ) : (
          <Map
            center={[20, 30]}
            zoom={2}
            styles={mapboxStyleUrls}
            className="map-container"
          >
            {markerList.map((marker) => {
              const resonance =
                scopeFilter === 'mine'
                  ? resolveResonance(marker, resonanceCentroids)
                  : undefined;
              return (
                <MapMarker
                  key={`${marker.type}-${marker.id}`}
                  longitude={marker.lng}
                  latitude={marker.lat}
                >
                  <MarkerContent>
                    <Box sx={{ cursor: 'pointer' }}>
                      {resonance !== undefined ? (
                        <ResonancePin marker={marker} resonance={resonance} />
                      ) : (
                        <MarkerPin marker={marker} />
                      )}
                    </Box>
                  </MarkerContent>
                  <MarkerPopup closeButton>
                    <MarkerPopupContent marker={marker} onViewPlaceHistory={handleMarkerClick} />
                  </MarkerPopup>
                </MapMarker>
              );
            })}

            {/* Want to Go pins */}
            {wantToGoItems?.filter((w) => w.status !== 'visited').map((item) => (
              <MapMarker
                key={`wtg-${item.id}`}
                longitude={item.locationLng}
                latitude={item.locationLat}
              >
                <MarkerContent>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'rgba(20,20,25,0.92)',
                        border: `2px dashed ${CIN.accent}`,
                        boxShadow: `0 0 12px ${CIN.accentGlow}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: CIN.accent,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: `0 0 20px ${CIN.accentGlow}`,
                        },
                      }}
                    >
                      {item.status === 'planned' ? (
                        <Pin style={{ width: 14, height: 14 }} />
                      ) : (
                        <Sparkles style={{ width: 14, height: 14 }} />
                      )}
                    </Box>
                  </Box>
                </MarkerContent>
                <MarkerPopup closeButton>
                  <Box sx={{ width: 200, p: 0.5 }}>
                    <Typography sx={{ ...eyebrowSx, fontSize: 10, fontWeight: 700, color: CIN.accent, mb: 0.5 }}>
                      {item.status === 'planned' ? 'Planned' : 'Want to Go'}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: CIN.text }}>
                      {item.locationName || item.locationCity || 'Unnamed place'}
                    </Typography>
                    {item.notes && (
                      <Typography sx={{ fontSize: '12px', color: CIN.textMuted, mt: 0.5 }}>
                        {item.notes}
                      </Typography>
                    )}
                  </Box>
                </MarkerPopup>
              </MapMarker>
            ))}

            <MapControls
              position="bottom-right"
              showZoom
              showLocate
              showCompass
              showFullscreen
            />
          </Map>
        )}

        {/* Filter bar */}
        <FilterBar
          typeFilter={typeFilter}
          onTypeChange={handleTypeChange}
          scopeFilter={scopeFilter}
          onScopeChange={handleScopeChange}
        />

        {/* Timeline scrubber */}
        <TimelineScrubber
          startDate={dateStart}
          endDate={dateEnd}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Empty state -- shown when no markers match filters */}
        {!isLoading && !isError && markerCount === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              pointerEvents: 'none',
              maxWidth: 360,
              px: 3,
              py: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(20,20,25,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${CIN.hairline}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text, mb: 0.5 }}>
              No memories match these filters.
            </Typography>
            <Typography variant="caption" sx={{ color: CIN.textMuted }}>
              Try widening your date range or removing filters.
            </Typography>
          </Box>
        )}

        {/* Marker count badge + Nearby toggle */}
        <Box
          component={motion.div}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
          sx={{
            position: 'absolute',
            top: 16,
            right: { xs: 16, md: 24 },
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setNearbyOpen((prev) => !prev)}
            aria-pressed={nearbyOpen}
            sx={{
              ...chromeSurfaceSx,
              ...(nearbyOpen
                ? {
                    bgcolor: CIN.accent,
                    color: CIN.bg,
                    boxShadow: `0 0 16px ${CIN.accentGlow}`,
                  }
                : { color: CIN.text }),
              px: 1.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': nearbyOpen
                ? { boxShadow: `0 0 22px ${CIN.accentGlow}` }
                : { borderColor: 'rgba(139,124,255,0.45)', color: CIN.accent },
            }}
          >
            <Navigation style={{ height: 14, width: 14 }} />
            Nearby
          </Box>
          <Box
            sx={{
              ...chromeSurfaceSx,
              px: 1.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: CIN.accent,
                boxShadow: `0 0 8px ${CIN.accentGlow}`,
                '@keyframes vmapBadgePulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
                animation: 'vmapBadgePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, color: CIN.text }}>
              <Box component="span" sx={{ color: CIN.accent, fontWeight: 700 }}>
                {markerCount}
              </Box>{' '}
              {countLabel}
            </Typography>
          </Box>
        </Box>

        {/* Nearby feed panel */}
        {nearbyOpen && <NearbyPanel onClose={() => setNearbyOpen(false)} />}
      </Box>

      <PlaceHistoryDrawer
        open={placeDrawer.open}
        onClose={() => setPlaceDrawer((prev) => ({ ...prev, open: false }))}
        lat={placeDrawer.lat}
        lng={placeDrawer.lng}
        locationName={placeDrawer.locationName}
      />
    </Box>
  );
}
