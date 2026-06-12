'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Box, Typography, Skeleton } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePersonalizedFeed, useDiscoverFeed } from '@/lib/hooks/use-feed';
import { useSearchPosts } from '@/lib/hooks/use-posts';
import { useSearchUsers } from '@/lib/hooks/use-user';
import { useTrendingLocations } from '@/lib/hooks/use-explore';
import { PostCard } from '@/components/post/post-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { CIN, eyebrowSx, displaySx, glowRing } from '@/lib/design/cinema-tokens';
import { PhotoTile, GlowButton, CinemaCard } from '@/components/cinema';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

// ─── Side-rail Map ───────────────────────────────────
// Loaded dynamically (like map/page.tsx does for @/components/ui/map) so the
// maplibre-gl module + CSS stay out of the bundle for the ~95% of visitors
// below the xl breakpoint who never see the side rail.
const SidebarMap = dynamic(() => import('@/components/explore/sidebar-map'), {
  ssr: false,
  loading: () => (
    <Skeleton
      variant="rounded"
      animation="pulse"
      sx={{ height: '100%', minHeight: 220, borderRadius: 0, bgcolor: 'var(--cin-surface-2)' }}
    />
  ),
});

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Feed skeleton — dark surface placeholders ───────
function FeedSkeleton() {
  const bone = 'var(--cin-surface-2)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            bgcolor: 'var(--cin-surface)',
            border: `1px solid ${CIN.hairline}`,
            borderRadius: '16px',
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
          <Box sx={{ mt: 1.75 }}>
            <Skeleton
              variant="rectangular"
              animation="pulse"
              sx={{ aspectRatio: '4/3', height: 'auto', width: '100%', bgcolor: bone }}
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

// ─── Trending rail — small PhotoTiles, name on vignette ──
function TrendingRail({ reduceMotion }: { reduceMotion: boolean }) {
  const { data: locations } = useTrendingLocations();
  const spots = locations?.slice(0, 8) ?? [];

  if (spots.length === 0) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography component="h2" sx={eyebrowSx}>
          Trending locations
        </Typography>
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <Typography
            sx={{
              ...eyebrowSx,
              fontSize: 10,
              '&:hover': { color: 'var(--cin-accent)' },
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
          gap: 1.5,
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
            whileHover={reduceMotion ? undefined : { scale: 1.025 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            sx={{
              flexShrink: 0,
              borderRadius: '14px',
              transition: 'box-shadow 0.2s ease',
              '&:hover': { boxShadow: glowRing(1) },
            }}
          >
            <PhotoTile
              src={spot.photo ?? ''}
              alt={`${spot.city}, ${spot.country}`}
              rounded={14}
              sx={{ width: 184, aspectRatio: '16/10' }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: CIN.text,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {spot.city}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    color: CIN.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {spot.country}
                  <Box component="span" sx={{ color: 'var(--cin-accent)', fontWeight: 600, ml: 0.75 }}>
                    {spot.count} {spot.count === 1 ? 'post' : 'posts'}
                  </Box>
                </Typography>
              </Box>
            </PhotoTile>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Page ────────────────────────────────────────────
export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion() ?? false;
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

  // ── Infinite scroll — sentinel auto-fetch + Load-more fallback ──
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '480px 0px' },
    );
    observerRef.current.observe(node);
  }, []);

  // Unauthenticated empty state
  if (!isAuthenticated && posts.length === 0 && !isLoading) {
    return (
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial={reduceMotion ? 'visible' : 'hidden'}
        animate="visible"
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
        <motion.div variants={staggerItem}>
          <Typography sx={eyebrowSx}>Letterboxd for travel</Typography>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: '2.5rem', md: '3rem' }, mt: -2 }}>
            Viraha
          </Typography>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Typography variant="body1" sx={{ color: CIN.textMuted, maxWidth: 448 }}>
            The ache of separation from what you love. Preserve your travel
            memories and share your journey with the world.
          </Typography>
        </motion.div>
        <Box component={motion.div} variants={staggerItem} sx={{ display: 'flex', gap: 1.5 }}>
          <GlowButton component={Link} href="/sign-up">
            Get Started
          </GlowButton>
          <GlowButton variant="ghost" component={Link} href="/sign-in">
            Sign In
          </GlowButton>
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
      {/* ── Main column — centered cinematic feed ── */}
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial={reduceMotion ? 'visible' : 'hidden'}
        animate="visible"
        sx={{
          width: '100%',
          maxWidth: 680,
          minWidth: 0,
          pt: { xs: 1, md: 4 },
        }}
      >
        {/* Header */}
        <motion.div variants={staggerItem}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography sx={{ ...eyebrowSx, mb: 1 }}>Explore</Typography>
              <Typography
                component="h1"
                sx={{ ...displaySx, fontSize: { xs: '2rem', md: '2.6rem' } }}
              >
                Discovery Feed
              </Typography>
              <Typography sx={{ color: CIN.textMuted, fontSize: '0.9rem', mt: 1 }}>
                Personalized recommendations for you
              </Typography>
            </Box>

            {/* Tab toggles — motion layoutId accent pill */}
            <Box
              role="tablist"
              aria-label="Feed"
              sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                flexShrink: 0,
                bgcolor: 'var(--cin-surface)',
                border: `1px solid ${CIN.hairline}`,
                borderRadius: '12px',
              }}
            >
              {(['following', 'forYou'] as const)
                .filter((tab) => tab !== 'following' || isAuthenticated)
                .map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <Box
                      key={tab}
                      component="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab)}
                      sx={{
                        position: 'relative',
                        px: 2,
                        py: 0.75,
                        border: 'none',
                        borderRadius: '9px',
                        bgcolor: 'transparent',
                        cursor: 'pointer',
                        '&:focus-visible': {
                          outline: `2px solid ${CIN.accent}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="explore-tab-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 420, damping: 34 }
                          }
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 9,
                            background: CIN.accent,
                            boxShadow: `0 2px 16px ${CIN.accentGlow}`,
                          }}
                        />
                      )}
                      <Typography
                        component="span"
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          color: isActive ? CIN.bg : CIN.textMuted,
                          transition: 'color 0.2s',
                          '&:hover': { color: isActive ? CIN.bg : CIN.text },
                        }}
                      >
                        {tab === 'following' ? 'Following' : 'For You'}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </motion.div>

        {/* Search Bar — dark inset field */}
        <motion.div variants={staggerItem}>
          <Box
            sx={{
              position: 'sticky',
              top: { xs: 52, md: 0 },
              zIndex: 40,
              py: 1,
              bgcolor: 'var(--cin-bg)',
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
                  color: CIN.textMuted,
                }}
              />
              <Box
                component="input"
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                placeholder="Search destinations, travelers…"
                aria-label="Search destinations and travelers"
                sx={{
                  width: '100%',
                  height: 46,
                  borderRadius: '12px',
                  pl: 6,
                  pr: 6,
                  bgcolor: 'var(--cin-surface-2)',
                  border: `1px solid ${CIN.hairline}`,
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  color: CIN.text,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  '&::placeholder': {
                    color: CIN.textMuted,
                    opacity: 0.8,
                  },
                  '&:focus': {
                    borderColor: CIN.accent,
                    boxShadow: `0 0 0 3px ${CIN.accentGlow}`,
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
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: 26,
                    width: 26,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
                    transition: 'background-color 0.2s',
                  }}
                  aria-label="Clear search"
                >
                  <X style={{ height: 14, width: 14, color: CIN.textMuted }} />
                </Box>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* Trending locations — horizontal PhotoTile rail */}
        <motion.div variants={staggerItem}>
          {!isSearchActive && <TrendingRail reduceMotion={reduceMotion} />}
        </motion.div>

        {/* Content area */}
        <motion.div variants={staggerItem}>
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
                    <Loader2
                      style={{ height: 24, width: 24, animation: 'spin 1s linear infinite', color: CIN.accent }}
                    />
                  </Box>
                ) : searchResults.length === 0 && userResults.length === 0 && debouncedQuery ? (
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
                      py: 8,
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--cin-accent)',
                        bgcolor: 'var(--cin-surface)',
                        border: `1px solid ${CIN.hairline}`,
                        boxShadow: `0 0 48px ${CIN.accentGlow}`,
                        mb: 2.5,
                      }}
                    >
                      <Search style={{ width: 26, height: 26 }} />
                    </Box>
                    <Typography sx={{ ...eyebrowSx, mb: 1 }}>Nothing found</Typography>
                    <Typography sx={{ color: CIN.text, fontWeight: 600 }}>
                      No results for &ldquo;{debouncedQuery}&rdquo;
                    </Typography>
                    <Typography variant="body2" sx={{ color: CIN.textMuted, mt: 0.5 }}>
                      Try searching for a destination, country, or tag.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {/* User results */}
                    {userResults.length > 0 && (
                      <Box>
                        <Typography sx={{ ...eyebrowSx, mb: 2 }}>
                          People &middot;{' '}
                          <Box component="span" sx={{ color: 'var(--cin-accent)', fontWeight: 600 }}>
                            {userResults.length}
                          </Box>
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            overflowX: 'auto',
                            pb: 1,
                            px: 0.5,
                            pt: 0.5,
                            '&::-webkit-scrollbar': { display: 'none' },
                          }}
                        >
                          {userResults.map((u) => (
                            <Link
                              key={u.id}
                              href={`/profile/${u.username}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Box
                                component={motion.div}
                                whileHover={reduceMotion ? undefined : { y: -2 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                sx={{
                                  flexShrink: 0,
                                  width: 160,
                                  borderRadius: '16px',
                                  border: `1px solid ${CIN.hairline}`,
                                  bgcolor: 'var(--cin-surface)',
                                  p: 2,
                                  textAlign: 'center',
                                  transition: 'box-shadow 0.2s ease',
                                  '&:hover': { boxShadow: glowRing(1) },
                                }}
                              >
                                <UserAvatar
                                  src={u.avatar}
                                  username={u.username}
                                  displayName={u.displayName}
                                  size="lg"
                                  sx={{ mx: 'auto', mb: 1 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: CIN.text,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {u.displayName || u.username}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: CIN.textMuted,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                  }}
                                >
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
                        <Typography sx={{ ...eyebrowSx, mb: 2 }}>
                          Posts &middot;{' '}
                          <Box component="span" sx={{ color: 'var(--cin-accent)', fontWeight: 600 }}>
                            {searchResults.length}
                          </Box>
                        </Typography>
                        <Box
                          component={motion.div}
                          sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                          variants={staggerContainer}
                          initial={reduceMotion ? 'visible' : 'hidden'}
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
                            <GlowButton
                              variant="ghost"
                              onClick={() => searchFetchNext()}
                              disabled={searchFetching}
                              startIcon={
                                searchFetching ? (
                                  <Loader2
                                    style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }}
                                  />
                                ) : undefined
                              }
                            >
                              {searchFetching ? 'Loading…' : 'Load more'}
                            </GlowButton>
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
                    <GlowButton onClick={() => refetch()} sx={{ mt: -6 }}>
                      Try Again
                    </GlowButton>
                  </Box>
                ) : posts.length === 0 ? (
                  <EmptyState
                    icon="compass"
                    title={activeTab === 'following' ? 'Your feed is empty' : 'No posts yet'}
                    description={
                      activeTab === 'following'
                        ? 'Follow travelers to see their stories here'
                        : 'Be the first to share a travel memory!'
                    }
                    actionLabel={activeTab === 'following' ? undefined : 'Share a memory'}
                    actionHref={activeTab === 'following' ? undefined : '/create/post'}
                  />
                ) : (
                  <Box
                    component={motion.div}
                    variants={staggerContainer}
                    initial={reduceMotion ? 'visible' : 'hidden'}
                    animate="visible"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                  >
                    {posts.map((post) => (
                      <motion.div key={post.id} variants={staggerItem}>
                        <PostCard post={post} />
                      </motion.div>
                    ))}

                    {hasNextPage && (
                      <Box
                        ref={sentinelRef}
                        sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
                      >
                        <GlowButton
                          variant="ghost"
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          startIcon={
                            isFetchingNextPage ? (
                              <Loader2
                                style={{ height: 14, width: 14, animation: 'spin 1s linear infinite' }}
                              />
                            ) : undefined
                          }
                        >
                          {isFetchingNextPage ? 'Loading…' : 'Load more'}
                        </GlowButton>
                      </Box>
                    )}
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
        <Typography component="h2" sx={eyebrowSx}>
          The map room
        </Typography>
        <CinemaCard hover={false} sx={{ height: 420 }}>
          <SidebarMap />
        </CinemaCard>
      </Box>

      {/* ── Create Post FAB ────────────────────────────── */}
      <Link href="/create/post" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          component={motion.div}
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            bgcolor: CIN.accent,
            color: CIN.bg,
            borderRadius: '14px',
            boxShadow: `0 8px 30px ${CIN.accentGlow}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: glowRing(1) },
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
