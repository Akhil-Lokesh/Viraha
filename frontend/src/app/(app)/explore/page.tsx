'use client';

// MapLibre CSS is imported statically here because the map (SidebarMap) is
// defined inline in this module rather than in a separately code-split
// component. A dynamic import() of a `.css` path does not type-check (no CSS
// module declaration), and a CDN <link> would add an external/CSP dependency,
// so per the C20 escape hatch ("otherwise leave") it stays a static import.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Typography, Skeleton, useTheme, GlobalStyles } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  MapPin,
  Compass,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePersonalizedFeed, useDiscoverFeed } from '@/lib/hooks/use-feed';
import { useSearchPosts } from '@/lib/hooks/use-posts';
import { useSearchUsers } from '@/lib/hooks/use-user';
import { useTrendingLocations } from '@/lib/hooks/use-explore';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { PostCard } from '@/components/post/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/empty-state';
import {
  GOLD,
  paper,
  ink,
  inkMuted,
  hairline,
  hardShadow,
  grain,
  EYEBROW_SX,
} from '@/components/post/keepsake';
import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  staggerItem,
} from '@/lib/animations';
import Button from '@mui/material/Button';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

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
function SidebarMap() {
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

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Feed skeleton — postcard-shaped ─────────────────
function FeedSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bone = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,28,24,0.07)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            bgcolor: paper(isDark),
            border: `1px solid ${hairline(isDark)}`,
            borderRadius: '6px',
            boxShadow: hardShadow(isDark),
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, px: 2.25, pt: 2, alignItems: 'center' }}>
            <Skeleton variant="circular" animation="pulse" sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: bone }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" animation="pulse" sx={{ width: 110, height: 16, bgcolor: bone }} />
              <Skeleton variant="text" animation="pulse" sx={{ width: 70, height: 12, bgcolor: bone }} />
            </Box>
          </Box>
          <Box sx={{ px: 1.5, mt: 1.75 }}>
            <Skeleton
              variant="rounded"
              animation="pulse"
              sx={{ aspectRatio: '4/3', height: 'auto', width: '100%', borderRadius: '3px', bgcolor: bone }}
            />
          </Box>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Skeleton variant="text" animation="pulse" sx={{ width: 140, height: 12, bgcolor: bone, mb: 1 }} />
            <Skeleton variant="text" animation="pulse" sx={{ width: '85%', height: 16, bgcolor: bone }} />
            <Skeleton variant="text" animation="pulse" sx={{ width: '55%', height: 16, bgcolor: bone }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ─── Trending stamp rail ─────────────────────────────
function TrendingStampRail() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: locations } = useTrendingLocations();
  const spots = locations?.slice(0, 8) ?? [];

  if (spots.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ ...EYEBROW_SX, color: GOLD }}>Trending stamps</Typography>
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <Typography
            sx={{
              ...EYEBROW_SX,
              fontSize: '0.625rem',
              color: inkMuted(isDark),
              '&:hover': { color: GOLD },
              transition: 'color 0.2s',
            }}
          >
            See map →
          </Typography>
        </Link>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1.5,
          pt: 0.5,
          px: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {spots.map((spot, i) => (
          <Box
            key={`${spot.city}-${spot.country}-${i}`}
            component={motion.div}
            whileHover={{ rotate: 0, scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 1,
              border: `1.5px solid ${GOLD}`,
              borderRadius: '4px',
              bgcolor: paper(isDark),
              backgroundImage: grain(isDark),
              transform: `rotate(${i % 2 === 0 ? -1.5 : 1.2}deg)`,
              boxShadow: hardShadow(isDark),
            }}
          >
            {/* Photo */}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '3px',
                overflow: 'hidden',
                flexShrink: 0,
                border: `1px solid ${hairline(isDark)}`,
              }}
            >
              {spot.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImageUrl(spot.photo)}
                  alt={spot.city}
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
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(34,28,24,0.05)',
                  }}
                >
                  <MapPin style={{ width: 16, height: 16, color: GOLD }} />
                </Box>
              )}
            </Box>

            {/* Info */}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  ...EYEBROW_SX,
                  fontSize: '0.625rem',
                  color: ink(isDark),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 130,
                }}
              >
                {spot.city}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: inkMuted(isDark),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 130,
                }}
              >
                {spot.country}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: GOLD, fontWeight: 600 }}>
                {spot.count} {spot.count === 1 ? 'post' : 'posts'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Page ────────────────────────────────────────────
export default function ExplorePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'following' | 'forYou'>('forYou');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const following = usePersonalizedFeed();
  const discover = useDiscoverFeed();

  // Guests never have a Following tab, so always read from the discover feed.
  // (The personalized query still fires for guests but its 401 is contained
  //  in this unused branch — see use-feed.ts for full enabled-gating.)
  const active = activeTab === 'following' && isAuthenticated ? following : discover;
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = active;

  const posts = data?.pages.flatMap((page) => page.items || []).filter(Boolean) || [];

  // Search
  const {
    data: searchData,
    isLoading: searchLoading,
    isFetchingNextPage: searchFetching,
    hasNextPage: searchHasNext,
    fetchNextPage: searchFetchNext,
  } = useSearchPosts(debouncedQuery);
  const { data: userResults = [], isLoading: usersLoading } = useSearchUsers(debouncedQuery);

  const searchResults = searchData?.pages.flatMap((page) => page.items) ?? [];
  const isSearchActive = searchInput.length > 0;

  const stampButton = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    px: 3,
    py: 1.25,
    borderRadius: '4px',
    border: `1.5px solid ${GOLD}`,
    ...EYEBROW_SX,
    color: ink(isDark),
    bgcolor: 'transparent',
    cursor: 'pointer',
    '&:hover': { bgcolor: isDark ? 'rgba(212,168,67,0.1)' : 'rgba(212,168,67,0.12)' },
    transition: 'background-color 0.2s',
    '&:disabled': { opacity: 0.5 },
  } as const;

  // Unauthenticated empty state
  if (!isAuthenticated && posts.length === 0 && !isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <Typography sx={{ ...EYEBROW_SX, color: GOLD }}>The travel keepsake</Typography>
        <Typography
          variant="h3"
          sx={{ fontFamily: 'var(--font-accent)', fontWeight: 400, color: ink(isDark), mt: -2 }}
        >
          Viraha
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 448 }}>
          The ache of separation from what you love. Preserve your travel
          memories and share your journey with the world.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="contained" disableElevation component={Link} href="/sign-up">
            Get Started
          </Button>
          <Button variant="outlined" disableElevation component={Link} href="/sign-in">
            Sign In
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: { xl: 6 },
        pb: 10,
      }}
    >
      {mapStyles}

      {/* ── Main column — full-width editorial postcard feed ── */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          minWidth: 0,
          pt: { xs: 1, md: 4 },
        }}
      >
        {/* Header */}
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          sx={{ mb: 4 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1 }}>
                Field notes
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '2.25rem', md: '3rem' },
                  fontFamily: 'var(--font-accent)',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.05,
                  color: ink(isDark),
                }}
              >
                Discovery Feed
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  mt: 1,
                }}
              >
                Personalized recommendations for you
              </Typography>
            </Box>

            {/* Tab toggles — journal-tab stamps */}
            <Box sx={{ display: 'flex', gap: 1.25, flexShrink: 0 }}>
              {(['following', 'forYou'] as const)
                .filter((tab) => tab !== 'following' || isAuthenticated)
                .map((tab, i) => (
                <Box
                  key={tab}
                  component="button"
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    ...EYEBROW_SX,
                    px: 2,
                    py: 0.9,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ...(activeTab === tab
                      ? {
                          border: `1.5px solid ${GOLD}`,
                          color: ink(isDark),
                          bgcolor: isDark ? 'rgba(212,168,67,0.1)' : 'rgba(212,168,67,0.12)',
                          transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                        }
                      : {
                          border: `1px solid ${hairline(isDark)}`,
                          color: inkMuted(isDark),
                          bgcolor: 'transparent',
                          '&:hover': { color: ink(isDark), borderColor: GOLD },
                        }),
                  }}
                >
                  {tab === 'following' ? 'Following' : 'For You'}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Flight-path divider */}
          <Box
            sx={{
              mt: 3,
              borderTop: `1px dashed ${isDark ? 'rgba(212,168,67,0.3)' : 'rgba(212,168,67,0.5)'}`,
            }}
          />
        </Box>

        {/* Search Bar — field-notes input */}
        <Box
          sx={{
            position: 'sticky',
            top: { xs: 52, md: 0 },
            zIndex: 40,
            py: 1,
            bgcolor: 'background.default',
            mb: 3,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 18,
                width: 18,
                color: '#D4A843',
                opacity: 0.8,
              }}
            />
            <Box
              component="input"
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              placeholder="SEARCH DESTINATIONS, TRAVELERS…"
              sx={{
                width: '100%',
                height: 48,
                borderRadius: '4px',
                pl: 6,
                pr: 6,
                bgcolor: paper(isDark),
                backgroundImage: grain(isDark),
                border: `1px solid ${hairline(isDark)}`,
                borderBottom: `2px solid ${isDark ? 'rgba(212,168,67,0.45)' : 'rgba(212,168,67,0.6)'}`,
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                color: ink(isDark),
                '&::placeholder': {
                  fontFamily: 'var(--font-brand)',
                  letterSpacing: '0.12em',
                  fontSize: '0.75rem',
                  color: inkMuted(isDark),
                  opacity: 0.7,
                },
                '&:focus': {
                  borderColor: GOLD,
                  borderBottomColor: GOLD,
                  boxShadow: isDark
                    ? '0 0 0 3px rgba(212,168,67,0.12)'
                    : '0 0 0 3px rgba(212,168,67,0.15)',
                },
              }}
            />
            {searchInput && (
              <Box
                component="button"
                onClick={() => {
                  setSearchInput('');
                  inputRef.current?.focus();
                }}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 26,
                  width: 26,
                  borderRadius: '50%',
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(34,28,24,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(34,28,24,0.12)' },
                  transition: 'background-color 0.2s',
                }}
                aria-label="Clear search"
              >
                <X style={{ height: 14, width: 14, color: 'var(--mui-palette-text-secondary)' }} />
              </Box>
            )}
          </Box>
        </Box>

        {/* Trending locations — horizontal stamp rail */}
        {!isSearchActive && <TrendingStampRail />}

        {/* Content area */}
        <AnimatePresence mode="wait">
          {isSearchActive ? (
            /* ── Search Results ─────────────────────────────── */
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {(searchLoading && usersLoading) && debouncedQuery ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                  <Loader2 style={{ height: 24, width: 24, animation: 'spin 1s linear infinite', color: '#D4A843' }} />
                </Box>
              ) : searchResults.length === 0 && userResults.length === 0 && debouncedQuery ? (
                <Box
                  component={motion.div}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '4px',
                      border: `1.5px dashed ${GOLD}`,
                      transform: 'rotate(-2deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                    }}
                  >
                    <Search style={{ width: 28, height: 28, color: '#D4A843' }} />
                  </Box>
                  <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1 }}>No stamps found</Typography>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    No results for &ldquo;{debouncedQuery}&rdquo;
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7, mt: 0.5 }}>
                    Try searching for a destination, country, or tag.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {/* User results */}
                  {userResults.length > 0 && (
                    <Box>
                      <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 2 }}>
                        People &middot; {userResults.length}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          overflowX: 'auto',
                          pb: 1,
                          '&::-webkit-scrollbar': { display: 'none' },
                        }}
                      >
                        {userResults.map((u) => (
                          <Link key={u.id} href={`/profile/${u.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Box
                              sx={{
                                flexShrink: 0,
                                width: 160,
                                borderRadius: '6px',
                                border: `1px solid ${hairline(isDark)}`,
                                bgcolor: paper(isDark),
                                backgroundImage: grain(isDark),
                                boxShadow: hardShadow(isDark),
                                p: 2,
                                textAlign: 'center',
                                '&:hover': { borderColor: GOLD },
                                transition: 'border-color 0.2s',
                              }}
                            >
                              <UserAvatar
                                src={u.avatar}
                                username={u.username}
                                displayName={u.displayName}
                                size="lg"
                                sx={{ mx: 'auto', mb: 1 }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500, color: ink(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.displayName || u.username}
                              </Typography>
                              <Typography variant="caption" sx={{ color: inkMuted(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                @{u.username}
                              </Typography>
                            </Box>
                          </Link>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Post results */}
                  {searchResults.length > 0 && (
                    <Box>
                      <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 2 }}>
                        Posts &middot; {searchResults.length}
                      </Typography>
                      <Box
                        component={motion.div}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {searchResults.map((post) => (
                          <motion.div key={post.id} variants={staggerItem}>
                            <PostCard post={post} />
                          </motion.div>
                        ))}
                      </Box>

                      {searchHasNext && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                          <Box
                            component="button"
                            onClick={() => searchFetchNext()}
                            disabled={searchFetching}
                            sx={stampButton}
                          >
                            {searchFetching ? (
                              <>
                                <Loader2 style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }} />
                                Loading...
                              </>
                            ) : (
                              'Load more'
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </motion.div>
          ) : (
            /* ── Feed Content ───────────────────────────────── */
            <motion.div
              key="feed-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <FeedSkeleton />
              ) : isError ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <EmptyState
                    icon="compass"
                    title="Couldn't load your feed"
                    description="Something went wrong while loading posts. Please try again."
                  />
                  <Box component="button" onClick={() => refetch()} sx={{ ...stampButton, mt: -4 }}>
                    Try Again
                  </Box>
                </Box>
              ) : posts.length === 0 ? (
                <Box
                  component={motion.div}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 10,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 88,
                      height: 88,
                      borderRadius: '4px',
                      border: `1.5px dashed ${GOLD}`,
                      transform: 'rotate(-2deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    <Compass style={{ width: 36, height: 36, color: '#D4A843' }} />
                  </Box>
                  <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1 }}>No stamps yet</Typography>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                    {activeTab === 'following' ? 'Your feed is empty' : 'No posts yet'}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', maxWidth: 320 }}>
                    {activeTab === 'following'
                      ? 'Follow travelers to see their stories here'
                      : 'Be the first to share a travel memory!'}
                  </Typography>
                </Box>
              ) : (
                <Box
                  component={motion.div}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  {posts.map((post) => (
                    <motion.div key={post.id} variants={staggerItem}>
                      <PostCard post={post} />
                    </motion.div>
                  ))}

                  {hasNextPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <Box
                        component="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        sx={stampButton}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }} />
                            Loading...
                          </>
                        ) : (
                          'Load more'
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ── Side rail (xl) — the map room ───────────────── */}
      <Box
        sx={{
          display: { xs: 'none', xl: 'flex' },
          flexDirection: 'column',
          gap: 1.5,
          width: 360,
          flexShrink: 0,
          position: 'sticky',
          top: 24,
          alignSelf: 'flex-start',
          pt: 4,
        }}
      >
        <Typography sx={{ ...EYEBROW_SX, color: GOLD }}>The map room</Typography>
        <Box sx={{ height: 420 }}>
          <SidebarMap />
        </Box>
      </Box>

      {/* ── Create Post FAB ────────────────────────────── */}
      <Link href="/create/post" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          component={motion.div}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: '16px',
            boxShadow: isDark
              ? '0 4px 20px rgba(165,148,249,0.3), 0 0 0 1px rgba(165,148,249,0.2)'
              : '0 4px 20px rgba(123,104,238,0.3), 0 0 0 1px rgba(123,104,238,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            transition: 'box-shadow 0.2s',
            '&:hover': {
              boxShadow: isDark
                ? '0 8px 32px rgba(165,148,249,0.4), 0 0 0 1px rgba(165,148,249,0.3)'
                : '0 8px 32px rgba(123,104,238,0.4), 0 0 0 1px rgba(123,104,238,0.2)',
            },
            zIndex: 50,
          }}
        >
          <Plus style={{ width: 18, height: 18 }} />
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Create Post
          </Typography>
        </Box>
      </Link>
    </Box>
  );
}
