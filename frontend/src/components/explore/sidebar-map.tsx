'use client';

// MapLibre CSS lives here, next to the only consumer in the explore route.
// This component is loaded via next/dynamic, so the ~20 KB stylesheet ships
// only when the xl-breakpoint side rail actually renders the map.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Typography, useTheme, GlobalStyles } from '@mui/material';
import { Maximize2 } from 'lucide-react';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { GOLD, hairline, hardShadow, EYEBROW_SX } from '@/components/post/keepsake';

// ─── Map custom styles ───────────────────────────────
const mapStyles = (
  <GlobalStyles
    styles={{
      // Hide default MapLibre controls styling, restyle them
      '.maplibregl-ctrl-group': {
        background: 'rgba(0,0,0,0.5) !important',
        backdropFilter: 'blur(12px)',
        borderRadius: '6px !important',
        border: 'none !important',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2) !important',
        overflow: 'hidden',
      },
      '.maplibregl-ctrl-group button': {
        width: '32px !important',
        height: '32px !important',
        borderColor: 'rgba(255,255,255,0.1) !important',
      },
      '.maplibregl-ctrl-group button .maplibregl-ctrl-icon': {
        filter: 'invert(1)',
      },
      '.maplibregl-popup-content': {
        borderRadius: '6px !important',
        padding: '8px 12px !important',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2) !important',
        fontSize: '13px',
      },
    }}
  />
);

// ─── Side-rail Map ───────────────────────────────────
export default function SidebarMap() {
  const theme = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<import('maplibre-gl').Marker[]>([]);
  const isDark = theme.palette.mode === 'dark';

  const { data: markers } = useMapMarkers({
    swLat: -90,
    swLng: -180,
    neLat: 90,
    neLng: 180,
  });

  useEffect(() => {
    let map: import('maplibre-gl').Map | null = null;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const maplibregl = (await import('maplibre-gl')).default;

      const style = isDark
        ? 'https://tiles.openfreemap.org/styles/dark'
        : 'https://tiles.openfreemap.org/styles/positron';

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [20, 20],
        zoom: 1.4,
        interactive: true,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });

      mapInstanceRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        'bottom-right',
      );
    }

    init();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // Add markers when data loads
  useEffect(() => {
    if (!markers || markers.length === 0 || !mapInstanceRef.current) return;

    async function addMarkers() {
      const maplibregl = (await import('maplibre-gl')).default;
      const map = mapInstanceRef.current as import('maplibre-gl').Map;

      markers!.forEach((m) => {
        const el = document.createElement('div');
        const color = m.type === 'post' ? '#D4A843' : '#A594F9';
        el.style.cssText = `
          width: 14px; height: 14px;
          background: ${color};
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 0 0 2px ${color}40, 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.5)';
          el.style.boxShadow = `0 0 0 4px ${color}30, 0 4px 12px rgba(0,0,0,0.4)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = `0 0 0 2px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`;
        });

        const popup = new maplibregl.Popup({
          offset: 14,
          closeButton: false,
          maxWidth: '220px',
        }).setHTML(
          `<div style="font-weight:600;font-size:13px;line-height:1.3;">${m.title || m.locationName || 'Untitled'}</div>` +
            (m.locationName
              ? `<div style="font-size:11px;opacity:0.6;margin-top:3px;">${m.locationName}</div>`
              : ''),
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    const map = mapInstanceRef.current as import('maplibre-gl').Map;
    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }

    return () => {
      map.off('load', addMarkers);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [markers]);

  return (
    <Box
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        minHeight: 220,
        border: `1px solid ${hairline(isDark)}`,
        boxShadow: hardShadow(isDark),
      }}
    >
      {mapStyles}
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />

      {/* Gradient overlay at top for "Expand" button readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(to bottom, rgba(22,18,31,0.35), transparent)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Expand button */}
      <Link href="/map" style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            px: 1.5,
            py: 0.75,
            borderRadius: '4px',
            bgcolor: 'rgba(22,18,31,0.6)',
            backdropFilter: 'blur(12px)',
            border: `1px solid rgba(212,168,67,0.4)`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(22,18,31,0.8)', transform: 'scale(1.02)' },
          }}
        >
          <Maximize2 style={{ width: 13, height: 13, color: GOLD }} />
          <Typography sx={{ ...EYEBROW_SX, fontSize: '0.625rem', color: '#FAF6EE' }}>
            Explore Map
          </Typography>
        </Box>
      </Link>

      {/* Marker count badge */}
      {markers && markers.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            px: 1.25,
            py: 0.5,
            borderRadius: '4px',
            bgcolor: 'rgba(22,18,31,0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: GOLD,
              boxShadow: `0 0 4px ${GOLD}`,
            }}
          />
          <Typography sx={{ ...EYEBROW_SX, fontSize: '0.625rem', color: '#FAF6EE' }}>
            {markers.length} places
          </Typography>
        </Box>
      )}
    </Box>
  );
}
