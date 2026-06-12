'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { format } from 'date-fns';
import { MapPin, Calendar, Pencil } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import type { JournalEntry } from '@/lib/types';
import { PhotoTile } from '@/components/cinema';
import { CIN, eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import { MoodBadge } from './mood-selector';
import { fadeInUp } from '@/lib/animations';

interface Props {
  entry: JournalEntry;
  journalId: string;
}

export function JournalEntryCard({ entry, journalId }: Props) {
  const reducedMotion = useReducedMotion();
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
        borderRadius: 16,
        border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
        backgroundColor: 'var(--cin-surface, #141419)',
        overflow: 'hidden',
      }}
    >
      {/* Header: Date + Edit */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {entry.date && (
            <Typography
              component="span"
              suppressHydrationWarning
              sx={{
                ...eyebrowSx,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Calendar style={{ width: 12, height: 12 }} />
              {format(new Date(entry.date), 'MMM d, yyyy')}
            </Typography>
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
              color: CIN.textMuted,
              borderRadius: '9999px',
              px: 1.25,
              py: 0.5,
              transition: 'all 0.2s',
              '&:hover': {
                color: CIN.accent,
                bgcolor: 'rgba(139,124,255,0.08)',
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
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: CIN.text, px: 3, pt: 1.5 }}>
          {entry.title}
        </Typography>
      )}

      {/* Content */}
      {entry.content && (
        <Typography
          sx={{
            fontSize: '0.95rem',
            color: CIN.text,
            opacity: 0.85,
            lineHeight: 1.7,
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
              <motion.div
                key={i}
                whileHover={
                  reducedMotion ? undefined : { scale: 1.02, boxShadow: glowRing(1) }
                }
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{ borderRadius: 12 }}
              >
                <PhotoTile
                  src={url}
                  alt={`${entry.title || 'Entry'} photo ${i + 1}`}
                  rounded={12}
                  sx={{ aspectRatio: '4/3' }}
                />
              </motion.div>
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
              color: CIN.textMuted,
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
