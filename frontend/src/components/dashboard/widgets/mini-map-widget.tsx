'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#2563EB';

const MOCK_CITIES = [
  { name: 'Tokyo', lng: 139.6917, lat: 35.6895 },
  { name: 'Paris', lng: 2.3522, lat: 48.8566 },
  { name: 'Bali', lng: 115.1889, lat: -8.4095 },
  { name: 'New York', lng: -74.006, lat: 40.7128 },
  { name: 'Barcelona', lng: 2.1734, lat: 41.3851 },
  { name: 'Sydney', lng: 151.2093, lat: -33.8688 },
];

export function MiniMapWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isFull = size.cols >= 4 && size.rows >= 4;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let map: import('maplibre-gl').Map | null = null;

    async function init() {
      if (!mapContainerRef.current || mapRef.current) return;

      const maplibregl = (await import('maplibre-gl')).default;

      const style = theme.palette.mode === 'dark'
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [20, 20],
        zoom: 1,
        interactive: isFull,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        MOCK_CITIES.forEach((city) => {
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
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
