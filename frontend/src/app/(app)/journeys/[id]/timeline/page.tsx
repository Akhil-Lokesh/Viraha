'use client';

import { use } from 'react';
import { Box, Typography, IconButton, Chip, Button, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Check, Edit3, Route } from 'lucide-react';
import { useJourney, useConfirmJourney, useUpdateJourney } from '@/lib/hooks/use-journeys';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function JourneyTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: journey, isLoading } = useJourney(id);
  const confirm = useConfirmJourney();

  const handleConfirm = () => {
    confirm.mutate(id, {
      onSuccess: () => toast.success('Journey confirmed'),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', px: 3, py: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: '16px' }} />
      </Box>
    );
  }

  if (!journey) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Journey not found</Typography>
      </Box>
    );
  }

  const posts = journey.journeyPosts || [];

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Link href="/journeys" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Journeys</Typography>
          </Box>
        </Link>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {journey.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar style={{ width: 13, height: 13, opacity: 0.5 }} />
                <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
                  {format(new Date(journey.startDate), 'MMM d')}
                  {journey.endDate && ` — ${format(new Date(journey.endDate), 'MMM d, yyyy')}`}
                </Typography>
              </Box>
              <Chip
                label={`${posts.length} stops`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '11px' }}
              />
            </Box>
          </Box>

          {journey.status === 'auto' && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Check style={{ width: 14, height: 14 }} />}
              onClick={handleConfirm}
              disabled={confirm.isPending}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              Confirm
            </Button>
          )}
        </Box>
      </Box>

      {/* Timeline */}
      <Box sx={{ position: 'relative', pl: 4 }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: 'absolute',
            left: 14,
            top: 8,
            bottom: 8,
            width: 2,
            bgcolor: 'divider',
            borderRadius: 1,
          }}
        />

        {posts.map((jp, i) => {
          const post = jp.post;
          if (!post) return null;
          const image = post.mediaThumbnails?.[0] || post.mediaUrls?.[0];
          const isFirst = i === 0;
          const isLast = i === posts.length - 1;

          return (
            <Box key={jp.id} sx={{ position: 'relative', mb: 3 }}>
              {/* Timeline dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -26,
                  top: 8,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: isFirst || isLast ? 'primary.main' : 'background.paper',
                  border: 2,
                  borderColor: isFirst || isLast ? 'primary.main' : 'divider',
                  zIndex: 2,
                }}
              />

              <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    borderRadius: '14px',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 2, borderColor: 'transparent' },
                  }}
                >
                  {image && (
                    <Box sx={{ width: 100, height: 100, borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <Image src={resolveImageUrl(image)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.disabled', mb: 0.5 }}>
                      {format(new Date(post.postedAt), 'MMM d, yyyy · h:mm a')}
                    </Typography>
                    {post.caption && (
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.4, mb: 0.75, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {post.caption}
                      </Typography>
                    )}
                    {post.locationName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MapPin style={{ width: 11, height: 11, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                          {post.locationName}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Link>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
