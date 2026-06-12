'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAtlas } from '@/lib/hooks/use-atlas';
import { EmptyState } from '@/components/shared/empty-state';
import { GlowButton, StatPill, SectionLabel, CinemaCard } from '@/components/cinema';
import { CIN, eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';
import { staggerContainer, staggerItem, easeNative } from '@/lib/animations';

const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica'];

const SKELETON_SX = { bgcolor: 'var(--cin-surface-2, #1C1C24)' } as const;

function AtlasSkeleton() {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
      <Skeleton variant="text" animation="pulse" sx={{ ...SKELETON_SX, width: 120, height: 18 }} />
      <Skeleton variant="text" animation="pulse" sx={{ ...SKELETON_SX, width: 240, height: 48, mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 110, borderRadius: '14px' }} />
        ))}
      </Box>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 40, borderRadius: '10px', mb: 1.5 }} />
      ))}
    </Box>
  );
}

/** Oversized stat that counts up from 0 on first view; respects reduced motion. */
function CountUpNumber({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, reducedMotion]);

  return <>{display}</>;
}

/** Continent row: dark track bar, accent fill animating to width on load. */
function ContinentBar({
  continent,
  visited,
  count,
  pct,
  index,
}: {
  continent: string;
  visited: boolean;
  count: number;
  pct: number;
  index: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <Box
      component={motion.div}
      whileHover={{ x: 2 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.25,
        px: 1,
        borderRadius: '8px',
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Typography
        sx={{
          ...eyebrowSx,
          fontSize: 12,
          color: visited ? 'var(--cin-text, #F4F4F6)' : 'var(--cin-text-muted, #9A9AA6)',
          minWidth: { xs: 110, md: 150 },
        }}
      >
        {continent}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 6,
          borderRadius: '999px',
          bgcolor: 'var(--cin-surface-2, #1C1C24)',
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.div}
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: easeNative, delay: 0.2 + index * 0.06 }}
          sx={{
            height: '100%',
            borderRadius: '999px',
            bgcolor: 'var(--cin-accent, #8B7CFF)',
            boxShadow: visited ? '0 0 12px var(--cin-accent-glow, rgba(139,124,255,0.35))' : 'none',
          }}
        />
      </Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          minWidth: 88,
          textAlign: 'right',
          color: visited ? 'var(--cin-text, #F4F4F6)' : 'var(--cin-text-muted, #9A9AA6)',
        }}
      >
        {visited ? `${count} ${count === 1 ? 'country' : 'countries'}` : 'Not yet'}
      </Typography>
    </Box>
  );
}

export default function AtlasPage() {
  const { data: atlas, isLoading, error, refetch } = useAtlas();

  if (isLoading) {
    return <AtlasSkeleton />;
  }

  if (error || !atlas) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
        <EmptyState
          icon="compass"
          title="Could not load your atlas"
          description="Something went wrong loading your travel data. Please try again."
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6 }}>
          <GlowButton variant="ghost" onClick={() => refetch()}>
            Try Again
          </GlowButton>
        </Box>
      </Box>
    );
  }

  const { stats, countries, cities, travelStyle } = atlas;

  const heroStats = [
    { label: 'Countries', value: stats.totalCountries },
    { label: 'Cities', value: stats.totalCities },
    { label: 'Continents', value: stats.totalContinents },
  ];

  const countryCountByContinent = countries.reduce<Record<string, number>>(
    (acc, c) => ({ ...acc, [c.continent]: (acc[c.continent] ?? 0) + 1 }),
    {}
  );
  const maxContinentCount = Math.max(1, ...Object.values(countryCountByContinent));

  const topCities = cities.slice(0, 10);

  return (
    <Box
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}
    >
      {/* Header */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 4 }}>
        <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>Travel DNA</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 36, md: 48 } }}>
          The Atlas
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', fontSize: 14, mt: 1 }}>
          Every place you have been, in one dark room.
        </Typography>
      </Box>

      {/* Hero count-up numbers */}
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 3, sm: 2 },
          mb: 4,
          py: 3,
          borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          borderBottom: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
        }}
      >
        {heroStats.map(({ label, value }) => (
          <Box key={label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ ...displaySx, fontSize: { xs: 56, md: 72 } }}>
              <CountUpNumber value={value} />
            </Typography>
            <Typography sx={{ ...eyebrowSx, mt: 1 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Travel style — glowing accent chip + secondary stats */}
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <SectionLabel>Travel Style</SectionLabel>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2.5,
              py: 1.25,
              borderRadius: '999px',
              border: '1px solid var(--cin-accent, #8B7CFF)',
              bgcolor: 'rgba(139,124,255,0.10)',
              boxShadow: '0 0 24px var(--cin-accent-glow, rgba(139,124,255,0.35))',
            }}
          >
            <Sparkles size={14} color={CIN.accent} />
            <Typography
              sx={{
                fontFamily: 'Posterama, var(--font-body)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.04em',
                color: 'var(--cin-accent, #8B7CFF)',
              }}
            >
              {travelStyle}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <StatPill value={stats.totalPosts} label="Posts" />
          <StatPill value={stats.totalJournals} label="Journals" />
        </Box>
      </Box>

      {/* Continent progress — dark tracks, accent fill */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 5 }}>
        <SectionLabel>Continents</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {CONTINENTS.filter((c) => c !== 'Antarctica').map((continent, i) => {
            const visited = stats.continentsVisited.includes(continent);
            const count = countryCountByContinent[continent] ?? 0;
            const pct = visited ? Math.max((count / maxContinentCount) * 100, 10) : 0;
            return (
              <ContinentBar
                key={continent}
                continent={continent}
                visited={visited}
                count={count}
                pct={pct}
                index={i}
              />
            );
          })}
        </Box>
      </Box>

      {/* Countries — quiet dark chips */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 5 }}>
        <SectionLabel>Countries · {countries.length}</SectionLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {countries.map((c) => (
            <Box
              component={motion.div}
              whileHover={{ y: -2 }}
              key={c.country}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: '999px',
                bgcolor: 'var(--cin-surface, #141419)',
                border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--cin-text, #F4F4F6)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  borderColor: 'var(--cin-accent, #8B7CFF)',
                  bgcolor: 'rgba(139,124,255,0.08)',
                },
              }}
            >
              {c.country}
              <Box component="span" sx={{ color: 'var(--cin-text-muted, #9A9AA6)', ml: 0.75, fontWeight: 400 }}>
                {c.cityCount} {c.cityCount === 1 ? 'city' : 'cities'}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Top cities — dark ranked list */}
      <Box component={motion.div} variants={staggerItem}>
        <SectionLabel>Most Visited Cities</SectionLabel>
        <CinemaCard hover={false}>
          {topCities.map((c, i) => (
            <Box
              component={motion.div}
              whileHover={{ x: 2 }}
              key={`${c.city}-${c.country}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                px: 2,
                borderBottom:
                  i < topCities.length - 1
                    ? '1px solid var(--cin-hairline, rgba(255,255,255,0.08))'
                    : 'none',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <Typography
                sx={{
                  ...displaySx,
                  fontSize: 20,
                  width: 32,
                  textAlign: 'center',
                  color: i === 0 ? 'var(--cin-accent, #8B7CFF)' : 'var(--cin-text-muted, #9A9AA6)',
                }}
              >
                {i + 1}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'var(--cin-text, #F4F4F6)' }}>
                  {c.city}
                </Typography>
                <Typography sx={{ ...eyebrowSx, fontSize: 10 }}>{c.country}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--cin-text-muted, #9A9AA6)' }}>
                {c.postCount} {c.postCount === 1 ? 'post' : 'posts'}
              </Typography>
            </Box>
          ))}
        </CinemaCard>
      </Box>
    </Box>
  );
}
