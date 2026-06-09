'use client';

import { Box, Typography, Skeleton } from '@mui/material';
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAtlas } from '@/lib/hooks/use-atlas';
import { EmptyState } from '@/components/shared/empty-state';
import { grain } from '@/components/post/keepsake';
import { staggerContainer, staggerItem } from '@/lib/animations';

const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica'];

const GOLD = 'var(--viraha-gold, #D4A843)';

const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD,
} as const;

const inkSx = (theme: { palette: { mode: string } }) =>
  theme.palette.mode === 'dark'
    ? 'var(--viraha-ink-dark, #F2EAD9)'
    : 'var(--viraha-ink, #221C18)';

function AtlasSkeleton() {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
      <Skeleton variant="text" width={120} height={18} />
      <Skeleton variant="text" width={240} height={48} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={140} sx={{ borderRadius: '4px', mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: '4px' }} />
        ))}
      </Box>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} variant="rounded" height={40} sx={{ borderRadius: '4px', mb: 1.5 }} />
      ))}
    </Box>
  );
}

/** Passport stamp: visited = gold stamp, unvisited = faint dashed outline. */
function ContinentStamp({ visited }: { visited: boolean }) {
  if (visited) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          transform: 'rotate(-2deg)',
          border: `1.5px solid ${GOLD}`,
          color: GOLD,
          borderRadius: '4px',
          px: 1.25,
          py: 0.4,
          fontFamily: 'var(--font-brand)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          bgcolor: 'rgba(212,168,67,0.08)',
        }}
      >
        <Check style={{ width: 11, height: 11 }} />
        Stamped
      </Box>
    );
  }
  return (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        transform: 'rotate(1.5deg)',
        border: '1px dashed',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.25)' : 'rgba(34,28,24,0.25)',
        color: 'text.disabled',
        borderRadius: '4px',
        px: 1.25,
        py: 0.4,
        fontFamily: 'var(--font-brand)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      })}
    >
      Not yet
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4 }}>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => refetch()}
            sx={{
              borderRadius: '4px',
              borderColor: GOLD,
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
            }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  const { stats, countries, cities, travelStyle } = atlas;

  const bigStats = [
    { label: 'Countries', value: stats.totalCountries },
    { label: 'Cities', value: stats.totalCities },
    { label: 'Posts', value: stats.totalPosts },
    { label: 'Journals', value: stats.totalJournals },
  ];

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
        <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>Passport — Travel DNA</Typography>
        <Typography
          component="h1"
          sx={(theme) => ({
            fontFamily: 'var(--font-accent)',
            fontSize: { xs: '2.25rem', md: '3rem' },
            lineHeight: 1.05,
            color: inkSx(theme),
          })}
        >
          The Atlas
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '14px', mt: 1 }}>
          Every place you have been, pressed into one page.
        </Typography>
      </Box>

      {/* Travel Style — grand stamp */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={(theme) => ({
            transform: 'rotate(-1.5deg)',
            border: `2px solid ${GOLD}`,
            borderRadius: '6px',
            px: { xs: 3, md: 6 },
            py: 2.5,
            textAlign: 'center',
            position: 'relative',
            backgroundImage: grain(theme.palette.mode === 'dark'),
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(212,168,67,0.06)'
                : 'rgba(212,168,67,0.07)',
            // inner tooling line, like a double-struck stamp
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 5,
              border: `1px solid ${GOLD}`,
              borderRadius: '4px',
              opacity: 0.55,
              pointerEvents: 'none',
            },
          })}
        >
          <Typography sx={{ ...eyebrowSx, fontSize: '10px' }}>Travel Style</Typography>
          <Typography
            sx={(theme) => ({
              mt: 0.5,
              fontFamily: 'var(--font-accent)',
              fontSize: { xs: '1.6rem', md: '2rem' },
              lineHeight: 1.15,
              color: inkSx(theme),
            })}
          >
            {travelStyle}
          </Typography>
        </Box>
      </Box>

      {/* Stats strip — oversized numbers with ticket-stub dividers */}
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          mb: 5,
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor:
            theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.14)' : 'rgba(34,28,24,0.14)',
        })}
      >
        {bigStats.map(({ label, value }, i) => (
          <Box
            key={label}
            sx={(theme) => ({
              py: 2.5,
              px: 1,
              textAlign: 'center',
              // perforation divider between stats
              borderLeft: i > 0 ? '1px dashed' : 'none',
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.18)' : 'rgba(34,28,24,0.18)',
              ...(i === 2 ? { borderLeft: { xs: 'none', md: '1px dashed' } } : {}),
            })}
          >
            <Typography
              sx={(theme) => ({
                fontFamily: 'var(--font-accent)',
                fontSize: { xs: '2.5rem', md: '3.25rem' },
                lineHeight: 1,
                color: inkSx(theme),
              })}
            >
              {value}
            </Typography>
            <Typography sx={{ ...eyebrowSx, mt: 0.75 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Continent Progress — stamped passport rows */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 5 }}>
        <Typography sx={{ ...eyebrowSx, mb: 2 }}>Continents</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {CONTINENTS.filter((c) => c !== 'Antarctica').map((continent) => {
            const visited = stats.continentsVisited.includes(continent);
            return (
              <Box
                key={continent}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  sx={(theme) => ({
                    fontFamily: 'var(--font-brand)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: visited ? inkSx(theme) : 'text.disabled',
                    minWidth: { xs: 120, md: 150 },
                  })}
                >
                  {continent}
                </Typography>
                {/* flight-path leader line */}
                <Box
                  sx={{
                    flex: 1,
                    height: 0,
                    borderBottom: `1px dashed ${visited ? GOLD : 'rgba(136,136,136,0.3)'}`,
                  }}
                />
                <ContinentStamp visited={visited} />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Countries — passport stamp wall */}
      <Box component={motion.div} variants={staggerItem} sx={{ mb: 5 }}>
        <Typography sx={{ ...eyebrowSx, mb: 2 }}>Countries · {countries.length}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          {countries.map((c, i) => (
            <Box
              key={c.country}
              sx={(theme) => ({
                transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                border: '1.5px solid',
                borderColor: i % 3 === 0 ? GOLD : theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.35)' : 'rgba(34,28,24,0.35)',
                borderRadius: '4px',
                px: 1.25,
                py: 0.6,
                fontFamily: 'var(--font-brand)',
                fontSize: '10.5px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'text.primary',
                backgroundImage: grain(theme.palette.mode === 'dark'),
              })}
            >
              {c.country} · {c.cityCount} {c.cityCount === 1 ? 'city' : 'cities'}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Top Cities — ledger rows with display-serif numbers */}
      <Box component={motion.div} variants={staggerItem}>
        <Typography sx={{ ...eyebrowSx, mb: 2 }}>Most Visited Cities</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {cities.slice(0, 10).map((c, i) => (
            <Box
              key={`${c.city}-${c.country}`}
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.25,
                px: 1,
                borderBottom: '1px dashed',
                borderColor:
                  theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.12)' : 'rgba(34,28,24,0.12)',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(212,168,67,0.06)' },
              })}
            >
              <Typography
                sx={{
                  fontFamily: 'var(--font-accent)',
                  fontSize: '1.4rem',
                  lineHeight: 1,
                  color: GOLD,
                  width: 32,
                  textAlign: 'center',
                }}
              >
                {i + 1}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{c.city}</Typography>
                <Typography
                  sx={{
                    fontFamily: 'var(--font-brand)',
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                  }}
                >
                  {c.country}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary' }}>
                {c.postCount} {c.postCount === 1 ? 'post' : 'posts'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
