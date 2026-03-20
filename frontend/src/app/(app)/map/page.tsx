'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { MapPin, Loader2, BookOpen } from 'lucide-react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePlaceResonance } from '@/lib/hooks/use-viraha';
import { useWantToGo } from '@/lib/hooks/use-want-to-go';
import { LocationBadge } from '@/components/shared/location-badge';
import { TimelineScrubber } from '@/components/map/timeline-scrubber';
import { PlaceHistoryDrawer } from '@/components/map/place-history-drawer';
import { ResonancePin } from '@/components/map/resonance-pin';
import type { MapMarkerData } from '@/lib/types';

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

// ─── Filter types ────────────────────────────────────

type TypeFilter = 'all' | 'post' | 'journal';
type ScopeFilter = 'everyone' | 'mine';

// ─── Filter bar ──────────────────────────────────────

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
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'post', label: 'Posts' },
    { value: 'journal', label: 'Journals' },
  ];

  const scopeOptions: { value: ScopeFilter; label: string }[] = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'mine', label: 'My Content' },
  ];

  return (
    <Box
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
      {/* Type filter pills */}
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(31,21,48,0.9)'
              : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '8px',
          border: 1,
          borderColor: 'divider',
          boxShadow: 1,
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
        }}
      >
        {typeOptions.map((opt) => (
          <Box
            key={opt.value}
            component="button"
            onClick={() => onTypeChange(opt.value)}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              ...(typeFilter === opt.value
                ? { bgcolor: 'primary.main', color: 'white', boxShadow: 1 }
                : { bgcolor: 'transparent', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }),
            }}
          >
            {opt.label}
          </Box>
        ))}
      </Box>

      {/* Scope filter pills */}
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(31,21,48,0.9)'
              : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '8px',
          border: 1,
          borderColor: 'divider',
          boxShadow: 1,
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
        }}
      >
        {scopeOptions.map((opt) => (
          <Box
            key={opt.value}
            component="button"
            onClick={() => onScopeChange(opt.value)}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              ...(scopeFilter === opt.value
                ? { bgcolor: 'primary.main', color: 'white', boxShadow: 1 }
                : { bgcolor: 'transparent', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }),
            }}
          >
            {opt.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Marker pin ──────────────────────────────────────

function MarkerPin({ marker }: { marker: MapMarkerData }) {
  const resolved = marker.thumbnail ? resolveImageUrl(marker.thumbnail) : null;
  const isJournal = marker.type === 'journal';

  return (
    <Box sx={{ position: 'relative', '&:hover .pin-img': { transform: 'scale(1.1)' } }}>
      <Box
        component="span"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          pointerEvents: 'none',
          bgcolor: isJournal
            ? 'rgba(168,85,247,0.2)'
            : 'rgba(var(--mui-palette-primary-mainChannel) / 0.2)',
        }}
      />
      <Box
        className="pin-img"
        sx={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 2,
          borderColor: isJournal ? '#A78BFA' : 'white',
          boxShadow: 3,
          overflow: 'hidden',
          transition: 'transform 0.2s',
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
              bgcolor: isJournal ? '#8B5CF6' : 'primary.main',
            }}
          >
            {isJournal ? (
              <BookOpen style={{ height: 16, width: 16, color: 'white' }} />
            ) : (
              <MapPin style={{ height: 16, width: 16, color: 'var(--mui-palette-primary-contrastText)' }} />
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
          boxShadow: 1,
          bgcolor: isJournal ? '#A78BFA' : 'white',
        }}
      />
    </Box>
  );
}

// ─── Popup content ───────────────────────────────────

function MarkerPopupContent({ marker }: { marker: MapMarkerData }) {
  const imageUrl = marker.thumbnail
    ? resolveImageUrl(marker.thumbnail)
    : null;

  const isJournal = marker.type === 'journal';
  const href = isJournal
    ? `/journals/${marker.journalId}`
    : `/post/${marker.id}`;

  return (
    <Box sx={{ width: 256 }}>
      {imageUrl && (
        <Link href={href}>
          <Box sx={{ position: 'relative', aspectRatio: '16/10', borderRadius: '6px', overflow: 'hidden', mb: 1 }}>
            <img
              src={imageUrl}
              alt={marker.title || 'Travel photo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s',
              }}
            />
            {isJournal && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  bgcolor: 'rgba(139,92,246,0.9)',
                  backdropFilter: 'blur(4px)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 500,
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
          </Box>
        </Link>
      )}

      {marker.title && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
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

      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          sx={{
            display: 'block',
            mt: 1,
            fontSize: '0.75rem',
            color: 'secondary.main',
            fontWeight: 500,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {isJournal ? 'View journal' : 'View post'}
        </Box>
      </Link>
    </Box>
  );
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

  const { data: markers, isLoading } = useMapMarkers(queryParams);
  const { data: resonanceData } = usePlaceResonance();
  const { data: wantToGoItems } = useWantToGo();

  const markerList = markers ?? [];

  // Build a resonance lookup by city for "My Content" scope
  const resonanceLookup = useMemo(() => {
    const result: Record<string, number> = {};
    if (!resonanceData) return result;
    for (const place of resonanceData) {
      result[`${place.lat.toFixed(2)},${place.lng.toFixed(2)}`] = place.resonance;
    }
    return result;
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
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {isLoading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Loader2 style={{ height: 32, width: 32, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading map...</Typography>
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
              const resonanceKey = `${marker.lat.toFixed(2)},${marker.lng.toFixed(2)}`;
              const resonance = scopeFilter === 'mine' ? resonanceLookup[resonanceKey] : undefined;
              return (
                <MapMarker
                  key={`${marker.type}-${marker.id}`}
                  longitude={marker.lng}
                  latitude={marker.lat}
                >
                  <MarkerContent>
                    <Box onClick={() => handleMarkerClick(marker)} sx={{ cursor: 'pointer' }}>
                      {resonance !== undefined ? (
                        <ResonancePin marker={marker} resonance={resonance} />
                      ) : (
                        <MarkerPin marker={marker} />
                      )}
                    </Box>
                  </MarkerContent>
                  <MarkerPopup closeButton>
                    <MarkerPopupContent marker={marker} />
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
                        bgcolor: item.status === 'planned' ? '#3B82F6' : '#E11D48',
                        border: '2px dashed white',
                        boxShadow: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ fontSize: '14px' }}>
                        {item.status === 'planned' ? '📌' : '✨'}
                      </Typography>
                    </Box>
                  </Box>
                </MarkerContent>
                <MarkerPopup closeButton>
                  <Box sx={{ width: 200, p: 0.5 }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#E11D48', mb: 0.5 }}>
                      Want to Go
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                      {item.locationName || item.locationCity || 'Unnamed place'}
                    </Typography>
                    {item.notes && (
                      <Typography sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
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

        {/* Marker count badge */}
        <Box sx={{ position: 'absolute', top: 16, right: { xs: 16, md: 24 }, zIndex: 20 }}>
          <Box
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(31,21,48,0.9)'
                  : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '8px',
              border: 1,
              borderColor: 'divider',
              boxShadow: 1,
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
                bgcolor: '#10B981',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {markerCount} {countLabel}
            </Typography>
          </Box>
        </Box>
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
