'use client';

import { useState } from 'react';
import { Box, Typography, Button, Chip, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Route, MapPin, Calendar, Sparkles, ChevronRight, Wand2 } from 'lucide-react';
import { useJourneys, useDetectJourneys } from '@/lib/hooks/use-journeys';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const STATUS_COLORS: Record<string, string> = {
  auto: '#8B5CF6',
  confirmed: '#10B981',
  edited: '#3B82F6',
};

export default function JourneysPage() {
  const { data: journeys, isLoading } = useJourneys();
  const detect = useDetectJourneys();

  const handleDetect = () => {
    detect.mutate(undefined, {
      onSuccess: (data) => {
        if (data.journeysCreated > 0) {
          toast.success(`Discovered ${data.journeysCreated} new ${data.journeysCreated === 1 ? 'journey' : 'journeys'}`);
        } else {
          toast.info('No new journeys detected');
        }
      },
      onError: () => {
        toast.error('Failed to detect journeys');
      },
    });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Route style={{ width: 24, height: 24 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Journeys
            </Typography>
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
            Your trips, automatically detected from your posts
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Wand2 style={{ width: 14, height: 14 }} />}
          onClick={handleDetect}
          disabled={detect.isPending}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          {detect.isPending ? 'Detecting...' : 'Detect Journeys'}
        </Button>
      </Box>

      {/* Journey List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: '16px' }} />
          ))}
        </Box>
      ) : !journeys || journeys.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Route style={{ width: 48, height: 48, opacity: 0.2, margin: '0 auto' }} />
          <Typography sx={{ mt: 2, fontWeight: 600, color: 'text.secondary' }}>
            No journeys yet
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: '14px', color: 'text.disabled' }}>
            Post photos from your travels and Viraha will connect the dots
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Wand2 style={{ width: 14, height: 14 }} />}
            onClick={handleDetect}
            disabled={detect.isPending}
            sx={{ mt: 3, borderRadius: '10px', textTransform: 'none' }}
          >
            Detect from existing posts
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {journeys.map((journey) => {
            const posts = journey.journeyPosts || [];
            const cities = [...new Set(posts.map((jp) => jp.post?.locationCity).filter(Boolean))];
            const photos = posts
              .map((jp) => jp.post?.mediaThumbnails?.[0] || jp.post?.mediaUrls?.[0])
              .filter(Boolean)
              .slice(0, 4) as string[];

            return (
              <Link key={journey.id} href={`/journeys/${journey.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box
                  sx={{
                    display: 'flex',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 3, borderColor: 'transparent' },
                  }}
                >
                  {/* Photo strip */}
                  <Box sx={{ display: 'flex', width: 200, flexShrink: 0 }}>
                    {photos.length > 0 ? (
                      photos.slice(0, 2).map((photo, i) => (
                        <Box key={i} sx={{ flex: 1, position: 'relative', height: 160 }}>
                          <Image src={resolveImageUrl(photo)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ width: '100%', height: 160, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Route style={{ width: 32, height: 32, opacity: 0.3 }} />
                      </Box>
                    )}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Chip
                        label={journey.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          bgcolor: alpha(STATUS_COLORS[journey.status] || '#888', 0.12),
                          color: STATUS_COLORS[journey.status] || '#888',
                        }}
                      />
                      <Typography sx={{ fontSize: '11px', color: 'text.disabled' }}>
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}>
                      {journey.title}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar style={{ width: 12, height: 12, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                          {format(new Date(journey.startDate), 'MMM d')}
                          {journey.endDate && ` — ${format(new Date(journey.endDate), 'MMM d, yyyy')}`}
                        </Typography>
                      </Box>
                    </Box>

                    {cities.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                        <MapPin style={{ width: 11, height: 11, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: '11px', color: 'text.disabled' }}>
                          {cities.slice(0, 4).join(' · ')}{cities.length > 4 ? ` +${cities.length - 4}` : ''}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                    <ChevronRight style={{ width: 20, height: 20, opacity: 0.3 }} />
                  </Box>
                </Box>
              </Link>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
