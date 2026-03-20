'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { MapPin, Calendar, Pencil } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import type { JournalEntry } from '@/lib/types';
import { MoodBadge } from './mood-selector';
import { fadeInUp } from '@/lib/animations';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface Props {
  entry: JournalEntry;
  journalId: string;
}

export function JournalEntryCard({ entry, journalId }: Props) {
  const hasPhotos = entry.mediaUrls && entry.mediaUrls.length > 0;
  const hasLocation = entry.locationName || entry.locationCity || entry.locationCountry;
  const locationText = [entry.locationName, entry.locationCity, entry.locationCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      style={{
        position: 'relative',
        borderRadius: 12,
        border: '1px solid var(--mui-palette-divider)',
        backgroundColor: 'var(--mui-palette-background-paper)',
        overflow: 'hidden',
      }}
    >
      {/* Header: Date + Edit */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {entry.date && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                borderRadius: '9999px',
                bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.1)',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'secondary.main',
              }}
            >
              <Calendar style={{ width: 12, height: 12 }} />
              {format(new Date(entry.date), 'MMM d, yyyy')}
            </Box>
          )}
          {entry.mood && <MoodBadge mood={entry.mood} />}
        </Box>

        <Link
          href={`/journals/${journalId}/entries/${entry.id}/edit`}
          style={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.75rem',
              color: 'text.secondary',
              borderRadius: '9999px',
              px: 1.25,
              py: 0.5,
              transition: 'all 0.2s',
              '&:hover': {
                color: 'secondary.main',
                bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.05)',
              },
            }}
          >
            <Pencil style={{ width: 12, height: 12 }} />
            Edit
          </Box>
        </Link>
      </Box>

      {/* Title */}
      {entry.title && (
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, px: 3, pt: 1.5 }}>
          {entry.title}
        </Typography>
      )}

      {/* Content */}
      {entry.content && (
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: 'text.primary',
            opacity: 0.8,
            lineHeight: 1.625,
            px: 3,
            pt: 1,
            whiteSpace: 'pre-line',
          }}
        >
          {entry.content}
        </Typography>
      )}

      {/* Photo Grid */}
      {hasPhotos && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns:
                entry.mediaUrls.length === 1
                  ? '1fr'
                  : entry.mediaUrls.length === 2
                    ? 'repeat(2, 1fr)'
                    : { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            }}
          >
            {entry.mediaUrls.map((url, i) => (
              <Box
                key={i}
                sx={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                }}
              >
                <Box
                  component="img"
                  src={resolveImageUrl(url)}
                  alt={`${entry.title || 'Entry'} photo ${i + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Footer: Location */}
      {hasLocation && (
        <Box sx={{ px: 3, pt: 1.5, pb: 2.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            <MapPin style={{ width: 12, height: 12 }} />
            {locationText}
          </Box>
        </Box>
      )}

      {/* Bottom padding when no location */}
      {!hasLocation && <Box sx={{ pb: 2.5 }} />}
    </motion.div>
  );
}
