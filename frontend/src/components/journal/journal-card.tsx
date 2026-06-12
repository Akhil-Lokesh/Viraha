'use client';

import Link from 'next/link';
import { MapPin, ArrowRight, Lock } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import type { Journal } from '@/lib/types';
import { CinemaCard } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import {
  useJournalColorsStore,
  getJournalColor,
} from '@/lib/stores/journal-colors-store';

function estimateWordCount(summary: string | null): string {
  if (!summary) return '';
  const words = summary.trim().split(/\s+/).length;
  if (words < 100) return '';
  if (words >= 1000) return `${(words / 1000).toFixed(1)}K words`;
  return `${words} words`;
}

const microlabelSx = {
  ...eyebrowSx,
  fontSize: 10,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
} as const;

/** Journal card: dark CinemaCard with a 3px spine in the journal's custom color. */
export function JournalCard({ journal }: { journal: Journal }) {
  const colorKey = useJournalColorsStore((s) => s.getColor(journal.id));
  const color = getJournalColor(colorKey);
  const spine = color.accentDark;

  const wordCount = estimateWordCount(journal.summary);
  const dateStr = format(new Date(journal.updatedAt), 'MMM yyyy').toUpperCase();

  // Extract location from first entry if available
  const firstEntry = journal.entries?.[0];
  const location =
    firstEntry?.locationCountry ||
    firstEntry?.locationCity ||
    firstEntry?.locationName ||
    null;

  return (
    <Link
      href={`/journals/${journal.id}`}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <CinemaCard
        sx={{
          position: 'relative',
          p: { xs: 2.5, md: 3 },
          pl: { xs: 3, md: 3.5 },
          minHeight: { xs: 200, md: 232 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Spine — the journal's custom color, kept from the color picker */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '3px',
            bgcolor: spine,
          }}
        />

        {/* Top row: date eyebrow + draft chip / privacy */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="span" suppressHydrationWarning sx={{ ...eyebrowSx, fontSize: 10 }}>
              {dateStr}
            </Typography>
            {journal.status === 'draft' && (
              <Box
                component="span"
                sx={{
                  ...eyebrowSx,
                  fontSize: 9,
                  fontWeight: 700,
                  color: CIN.accent,
                  border: `1px solid ${CIN.accent}`,
                  borderRadius: '6px',
                  px: 0.75,
                  py: 0.2,
                  lineHeight: 1.4,
                }}
              >
                Draft
              </Box>
            )}
          </Box>
          {journal.privacy !== 'public' && (
            <Lock
              aria-label="Private journal"
              style={{ width: 13, height: 13, color: CIN.textMuted, flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          sx={{
            ...displaySx,
            fontSize: { xs: '1.2rem', md: '1.35rem' },
            lineHeight: 1.15,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {journal.title}
        </Typography>

        {/* Preview text */}
        {journal.summary && (
          <Typography
            sx={{
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: CIN.textMuted,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {journal.summary}
          </Typography>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Hairline divider */}
        <Box sx={{ borderBottom: `1px solid ${CIN.hairline}`, mt: 2, mb: 1.5 }} />

        {/* Footer: muted microlabels + arrow */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minWidth: 0,
              flexWrap: 'wrap',
            }}
          >
            {journal.entryCount > 0 && (
              <Typography component="span" sx={microlabelSx}>
                {journal.entryCount} {journal.entryCount === 1 ? 'entry' : 'entries'}
              </Typography>
            )}
            {wordCount && (
              <Typography component="span" sx={microlabelSx}>
                {wordCount}
              </Typography>
            )}
            {location && (
              <Typography
                component="span"
                sx={{
                  ...microlabelSx,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 140,
                }}
              >
                <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                {location}
              </Typography>
            )}
          </Box>

          <ArrowRight
            aria-hidden
            style={{ width: 16, height: 16, color: CIN.accent, opacity: 0.7, flexShrink: 0 }}
          />
        </Box>
      </CinemaCard>
    </Link>
  );
}
