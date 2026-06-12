'use client';

// MapLibre CSS lives here, next to the only consumer in the explore route.
// This component is loaded via next/dynamic, so the ~20 KB stylesheet ships
// only when the xl-breakpoint side rail actually renders the map.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Typography, GlobalStyles } from '@mui/material';
import { Maximize2 } from 'lucide-react';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';

// ─── Map custom styles — dark-room chrome ────────────
const mapStyles = (
  <GlobalStyles
    styles={{
      '.maplibregl-ctrl-group': {
        background: 'rgba(20,20,25,0.72) !important',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px !important',
        border: '1px solid rgba(255,255,255,0.08) !important',
        boxShadow: 'none !important',
        overflow: 'hidden',
      },
      '.maplibregl-ctrl-group button': {
        width: '32px !important',
        height: '32px !important',
        borderColor: 'rgba(255,255,255,0.08) !important',
      },
      '.maplibregl-ctrl-group button .maplibregl-ctrl-icon': {
        filter: 'invert(1)',
      },
      '.maplibregl-popup-content': {
        background: '#1C1C24 !important',
        color: '#F4F4F6 !important',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px !important',
        padding: '8px 12px !important',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5) !important',
        fontSize: '13px',
      },
      '.maplibregl-popup-anchor-bottom .maplibregl-popup-tip': {
        borderTopColor: '#1C1C24 !important',
      },
      '.maplibregl-popup-anchor-top .maplibregl-popup-tip': {
        borderBottomColor: '#1C1C24 !important',
      },
      '.maplibregl-popup-anchor-left .maplibregl-popup-tip': {
        borderRightColor: '#1C1C24 !important',
      },
      '.maplibregl-popup-anchor-right .maplibregl-popup-tip': {
        borderLeftColor: '#1C1C24 !important',
      },
    }}
  />
);

// ─── Side-rail Map ───────────────────────────────────
export default function SidebarMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<import('maplibre-gl').Marker[]>([]);

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

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        // App is pinned to dark mode — always the dark basemap.
        style: 'https://tiles.openfreemap.org/styles/dark',
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
  }, []);

  // Add markers when data loads
  useEffect(() => {
    if (!markers || markers.length === 0 || !mapInstanceRef.current) return;

    async function addMarkers() {
      const maplibregl = (await import('maplibre-gl')).default;
      const map = mapInstanceRef.current as import('maplibre-gl').Map;

      markers!.forEach((m) => {
        const el = document.createElement('div');
        const color = m.type === 'post' ? CIN.accent : CIN.text;
        el.style.cssText = `
          width: 14px; height: 14px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid ${CIN.bg};
          box-shadow: 0 0 0 2px ${color}40, 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.5)';
          el.style.boxShadow = `0 0 0 4px ${color}30, 0 4px 12px rgba(0,0,0,0.6)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = `0 0 0 2px ${color}40, 0 2px 8px rgba(0,0,0,0.5)`;
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
        position: 'relative',
        height: '100%',
        minHeight: 220,
        bgcolor: 'var(--cin-surface)',
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
          background: 'linear-gradient(to bottom, rgba(11,11,15,0.5), transparent)',
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
            borderRadius: '10px',
            bgcolor: 'rgba(11,11,15,0.65)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${CIN.hairline}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            zIndex: 2,
            transition: 'border-color 0.2s, background-color 0.2s',
            '&:hover': {
              bgcolor: 'rgba(11,11,15,0.85)',
              borderColor: 'var(--cin-accent)',
            },
          }}
        >
          <Maximize2 style={{ width: 13, height: 13, color: CIN.accent }} />
          <Typography sx={{ ...eyebrowSx, fontSize: 10, color: CIN.text }}>
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
            borderRadius: '10px',
            bgcolor: 'rgba(11,11,15,0.65)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${CIN.hairline}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'var(--cin-accent)',
              boxShadow: `0 0 6px ${CIN.accentGlow}`,
            }}
          />
          <Typography sx={{ ...eyebrowSx, fontSize: 10, color: CIN.text }}>
            {markers.length} places
          </Typography>
        </Box>
      )}
    </Box>
  );
}
