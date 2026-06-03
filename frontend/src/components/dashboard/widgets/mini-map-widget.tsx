'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef, useEffect, useMemo } from 'react';
import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MapPin } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { usePlaceResonance } from '@/lib/hooks/use-viraha';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#2563EB';

interface MapCity {
  name: string;
  lng: number;
  lat: number;
}

export function MiniMapWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isFull = size.cols >= 4 && size.rows >= 4;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  const { data: resonance, isLoading, isError } = usePlaceResonance();

  // Real source of truth — the user's visited places (with coords) from place resonance.
  const cities = useMemo<MapCity[]>(
    () =>
      (resonance ?? [])
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
        .map((r) => ({
          name: r.locationCity || r.locationName || r.locationCountry || 'Visited place',
          lng: Number(r.lng),
          lat: Number(r.lat),
        })),
    [resonance],
  );

  useEffect(() => {
    let map: import('maplibre-gl').Map | null = null;
    let cancelled = false;

    async function init() {
      if (!mapContainerRef.current || mapRef.current || cities.length === 0) return;

      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !mapContainerRef.current) return;

      const style = theme.palette.mode === 'dark'
        ? 'https://tiles.openfreemap.org/styles/dark'
        : 'https://tiles.openfreemap.org/styles/positron';

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [cities[0].lng, cities[0].lat],
        zoom: cities.length === 1 ? 3 : 1,
        interactive: isFull,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        cities.forEach((city) => {
          const el = document.createElement('div');
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.backgroundColor = hex;
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.boxShadow = `0 0 6px ${alpha(hex, 0.5)}`;
          el.style.cursor = 'pointer';

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([city.lng, city.lat])
            .addTo(map!);

          if (isFull) {
            const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
              .setText(city.name);
            marker.setPopup(popup);
          }
        });
      });

      if (isFull) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      }
    }

    init();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  // Re-init when the visited cities change (e.g. after first load) or layout interactivity flips.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, isFull]);

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          height: '100%',
          bgcolor: c.bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <MapPin style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Couldn&apos;t load your map
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Please try again in a moment
        </Typography>
      </Box>
    );
  }

  if (cities.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          height: '100%',
          bgcolor: c.bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <MapPin style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          No places on your map yet
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Share a trip to start pinning your world
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
      }}
    >
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />

      {!isFull && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            px: 1.5,
            py: 0.5,
            borderRadius: '20px',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>
            View Map &rarr;
          </Typography>
        </Box>
      )}
    </Box>
  );
}
