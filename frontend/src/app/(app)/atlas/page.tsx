'use client';

import { Box, Typography, LinearProgress, Skeleton, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Globe, MapPin, Camera, BookOpen, Compass, Sparkles } from 'lucide-react';
import { useAtlas } from '@/lib/hooks/use-atlas';

const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica'];

const CONTINENT_COLORS: Record<string, string> = {
  'North America': '#3B82F6',
  'South America': '#10B981',
  'Europe': '#8B5CF6',
  'Asia': '#F59E0B',
  'Africa': '#EF4444',
  'Oceania': '#06B6D4',
  'Antarctica': '#94A3B8',
};

export default function AtlasPage() {
  const { data: atlas, isLoading } = useAtlas();

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: '16px' }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!atlas) return null;

  const { stats, countries, cities, travelStyle } = atlas;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Globe style={{ width: 24, height: 24 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            The Atlas
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
          Your personal travel DNA
        </Typography>
      </Box>

      {/* Travel Style Badge */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: '20px',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 100%)',
          border: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Sparkles style={{ width: 24, height: 24, color: '#8B5CF6', margin: '0 auto' }} />
        <Typography sx={{ mt: 1, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B5CF6' }}>
          Travel Style
        </Typography>
        <Typography sx={{ mt: 0.5, fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2 }}>
          {travelStyle}
        </Typography>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        {[
          { label: 'Countries', value: stats.totalCountries, icon: Globe, color: '#3B82F6' },
          { label: 'Cities', value: stats.totalCities, icon: MapPin, color: '#10B981' },
          { label: 'Posts', value: stats.totalPosts, icon: Camera, color: '#F59E0B' },
          { label: 'Journals', value: stats.totalJournals, icon: BookOpen, color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Box
            key={label}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              border: 1,
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <Icon style={{ width: 20, height: 20, color }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>
              {value}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.25 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Continent Progress */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
          Continent Progress
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {CONTINENTS.filter((c) => c !== 'Antarctica').map((continent) => {
            const visited = stats.continentsVisited.includes(continent);
            const color = CONTINENT_COLORS[continent] || '#888';
            return (
              <Box key={continent} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ width: 120, fontSize: '13px', fontWeight: 500, color: visited ? 'text.primary' : 'text.disabled' }}>
                  {continent}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={visited ? 100 : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(color, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                    }}
                  />
                </Box>
                {visited && (
                  <Chip
                    label="Visited"
                    size="small"
                    sx={{ height: 20, fontSize: '10px', fontWeight: 600, bgcolor: alpha(color, 0.1), color }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Countries List */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
          Countries ({countries.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {countries.map((c) => (
            <Chip
              key={c.country}
              label={`${c.country} · ${c.cityCount} ${c.cityCount === 1 ? 'city' : 'cities'}`}
              size="small"
              sx={{
                height: 28,
                fontSize: '12px',
                fontWeight: 500,
                bgcolor: alpha(CONTINENT_COLORS[c.continent] || '#888', 0.08),
                border: 1,
                borderColor: alpha(CONTINENT_COLORS[c.continent] || '#888', 0.2),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Top Cities */}
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
          Most Visited Cities
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {cities.slice(0, 10).map((c, i) => (
            <Box
              key={`${c.city}-${c.country}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.disabled', width: 24 }}>
                {i + 1}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                  {c.city}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
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
