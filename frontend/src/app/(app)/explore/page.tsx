'use client';

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
  Star,
  Compass,
  Loader2,
  Maximize2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePersonalizedFeed, useDiscoverFeed } from '@/lib/hooks/use-feed';
import { useSearchPosts } from '@/lib/hooks/use-posts';
import { useSearchUsers } from '@/lib/hooks/use-user';
import { useTrendingLocations } from '@/lib/hooks/use-explore';
import { useMapMarkers } from '@/lib/hooks/use-map';
import { PostCard } from '@/components/post/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
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
        borderRadius: '10px !important',
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
        borderRadius: '10px !important',
        padding: '8px 12px !important',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2) !important',
        fontSize: '13px',
      },
    }}
  />
);

// ─── Sidebar Map ─────────────────────────────────────
function SidebarMap() {
  const theme = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
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
        const color = m.type === 'post' ? '#10B981' : '#A594F9';
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

        new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map);
      });
    }

    const map = mapInstanceRef.current as import('maplibre-gl').Map;
    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }
  }, [markers]);

  return (
    <Box
      sx={{
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        minHeight: 220,
        boxShadow: isDark
          ? '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)',
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
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
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
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.02)' },
          }}
        >
          <Maximize2 style={{ width: 13, height: 13, color: 'white' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'white', letterSpacing: '0.02em' }}>
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
            borderRadius: '9999px',
            bgcolor: 'rgba(0,0,0,0.5)',
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
              bgcolor: '#10B981',
              boxShadow: '0 0 4px #10B981',
            }}
          />
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>
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

// ─── Feed skeleton ───────────────────────────────────
function FeedSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={i} sx={{ py: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="text" animation="pulse" sx={{ width: 120, height: 14, mb: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Skeleton variant="circular" animation="pulse" sx={{ width: 40, height: 40, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Skeleton variant="text" animation="pulse" sx={{ width: 96, height: 16 }} />
                <Skeleton variant="text" animation="pulse" sx={{ width: 64, height: 12 }} />
              </Box>
              <Skeleton variant="text" animation="pulse" sx={{ width: '100%', height: 16 }} />
              <Skeleton variant="text" animation="pulse" sx={{ width: '66%', height: 16 }} />
              <Skeleton variant="rounded" animation="pulse" sx={{ mt: 1.5, aspectRatio: '16/9', borderRadius: '16px' }} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ─── Top Rated Spots ─────────────────────────────────
function TopRatedSpots() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: locations } = useTrendingLocations();
  const spots = locations?.slice(0, 4) ?? [];

  if (spots.length === 0) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp style={{ width: 18, height: 18, color: isDark ? '#A594F9' : '#7B68EE' }} />
          <Typography
            sx={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: '1.15rem',
            }}
          >
            Top Rated Spots
          </Typography>
        </Box>
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              color: 'primary.main',
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.2s',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              See All
            </Typography>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </Box>
        </Link>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {spots.map((spot, i) => (
          <Box
            key={i}
            component={motion.div}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            {/* Rank number */}
            <Typography
              sx={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'primary.main',
                opacity: 0.5,
                width: 20,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </Typography>

            {/* Photo */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: isDark
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {spot.photo ? (
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
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <MapPin style={{ width: 18, height: 18, color: 'var(--mui-palette-text-secondary)' }} />
                </Box>
              )}
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {spot.city}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                <Star style={{ width: 11, height: 11, color: '#F59E0B', fill: '#F59E0B' }} />
                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#A594F9' : '#7B68EE', fontWeight: 600 }}>
                  {spot.count} {spot.count === 1 ? 'post' : 'posts'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.15 }}>
                {spot.country}
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

  const active = activeTab === 'following' ? following : discover;
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = active;

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
        <Typography
          variant="h3"
          sx={{ fontFamily: 'var(--font-brand)', fontWeight: 700, color: 'primary.main' }}
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
        mx: { lg: -3 },
        mt: { lg: -3 },
        mb: { lg: -3 },
        width: { xs: '100%', lg: 'calc(100% + 48px)' },
        minHeight: { lg: '100vh' },
      }}
    >
      {mapStyles}

      {/* ── Left Panel (desktop) ─── ~40% ──────────────── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          width: '40%',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100vh',
          borderRight: 1,
          borderColor: 'divider',
          p: 2.5,
          gap: 3,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 0 },
          // Subtle left panel background tint
          bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
        }}
      >
        {/* Map — takes ~50% of the panel */}
        <Box sx={{ height: '48%', flexShrink: 0 }}>
          <SidebarMap />
        </Box>

        {/* Top Rated Spots */}
        <TopRatedSpots />
      </Box>

      {/* ── Right Panel — Feed ─── ~60% ────────────────── */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, lg: 5 },
          py: { xs: 2, lg: 4 },
        }}
      >
        {/* Discovery Feed header */}
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          sx={{ mb: 3 }}
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
              <Typography
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.75rem' },
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  // Subtle gradient text
                  background: isDark
                    ? 'linear-gradient(135deg, #E8E3F3 0%, #A594F9 100%)'
                    : 'linear-gradient(135deg, #1A1A2E 0%, #7B68EE 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Discovery Feed
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  mt: 0.75,
                }}
              >
                Personalized recommendations for you
              </Typography>
            </Box>

            {/* Tab toggles */}
            <Box
              sx={{
                display: 'flex',
                borderRadius: '12px',
                p: 0.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                flexShrink: 0,
              }}
            >
              {(['following', 'forYou'] as const).map((tab) => (
                <Box
                  key={tab}
                  component="button"
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    px: 2.5,
                    py: 1,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ...(activeTab === tab
                      ? {
                          bgcolor: isDark ? 'primary.main' : 'primary.main',
                          color: 'white',
                          boxShadow: isDark
                            ? '0 2px 8px rgba(165,148,249,0.3)'
                            : '0 2px 8px rgba(123,104,238,0.3)',
                        }
                      : {
                          bgcolor: 'transparent',
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        }),
                  }}
                >
                  {tab === 'following' ? 'Following' : 'For You'}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Divider */}
          <Box
            sx={{
              height: 1,
              mt: 3,
              background: isDark
                ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)'
                : 'linear-gradient(to right, transparent, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent)',
            }}
          />
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            position: 'sticky',
            top: { xs: 52, md: 0 },
            zIndex: 40,
            py: 1,
            bgcolor: 'background.default',
            mb: 2,
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
                color: 'var(--mui-palette-text-secondary)',
                opacity: 0.6,
              }}
            />
            <Box
              component="input"
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              placeholder="Search destinations, travelers..."
              sx={{
                width: '100%',
                height: 48,
                borderRadius: '14px',
                pl: 6,
                pr: 6,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'text.primary',
                '&::placeholder': { color: 'text.secondary', opacity: 0.6 },
                '&:focus': {
                  borderColor: 'primary.main',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.01)',
                  boxShadow: isDark
                    ? '0 0 0 3px rgba(165,148,249,0.15), 0 4px 16px rgba(0,0,0,0.2)'
                    : '0 0 0 3px rgba(123,104,238,0.1), 0 4px 16px rgba(0,0,0,0.04)',
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
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
                  transition: 'background-color 0.2s',
                }}
                aria-label="Clear search"
              >
                <X style={{ height: 14, width: 14, color: 'var(--mui-palette-text-secondary)' }} />
              </Box>
            )}
          </Box>
        </Box>

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
                  <Loader2 style={{ height: 24, width: 24, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
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
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(165,148,249,0.1)' : 'rgba(123,104,238,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Search style={{ width: 28, height: 28, color: isDark ? '#A594F9' : '#7B68EE' }} />
                  </Box>
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
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'text.secondary',
                          mb: 2,
                        }}
                      >
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
                                borderRadius: '14px',
                                border: 1,
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                p: 2,
                                textAlign: 'center',
                                '&:hover': { borderColor: 'primary.main' },
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
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.displayName || u.username}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
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
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'text.secondary',
                          mb: 2,
                        }}
                      >
                        Posts &middot; {searchResults.length}
                      </Typography>
                      <Box
                        component={motion.div}
                        sx={{ display: 'flex', flexDirection: 'column' }}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {searchResults.map((post) => (
                          <motion.div key={post.id} variants={staggerItem}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                              <PostCard post={post} />
                            </Box>
                          </motion.div>
                        ))}
                      </Box>

                      {searchHasNext && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                          <Box
                            component="button"
                            onClick={() => searchFetchNext()}
                            disabled={searchFetching}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 3,
                              py: 1.25,
                              borderRadius: '12px',
                              border: 1,
                              borderColor: 'divider',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: 'text.primary',
                              bgcolor: 'transparent',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'background-color 0.2s',
                              '&:disabled': { opacity: 0.5 },
                            }}
                          >
                            {searchFetching ? (
                              <>
                                <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} />
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
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(165,148,249,0.1)' : 'rgba(123,104,238,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    <Compass style={{ width: 36, height: 36, color: isDark ? '#A594F9' : '#7B68EE' }} />
                  </Box>
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
                >
                  {posts.map((post) => (
                    <motion.div key={post.id} variants={staggerItem}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <PostCard post={post} />
                      </Box>
                    </motion.div>
                  ))}

                  {hasNextPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <Box
                        component="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 4,
                          py: 1.5,
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: isDark ? '#A594F9' : '#7B68EE',
                          bgcolor: isDark ? 'rgba(165,148,249,0.1)' : 'rgba(123,104,238,0.08)',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(165,148,249,0.15)' : 'rgba(123,104,238,0.12)',
                          },
                          transition: 'all 0.2s',
                          '&:disabled': { opacity: 0.5 },
                        }}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} />
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
