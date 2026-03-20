'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Bookmark,
  Star,
  Sun,
  Snowflake,
  Compass,
  Anchor,
  Mountain,
  ArrowRight,
  Pen,
  Camera,
  Lock,
} from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import type { Journal } from '@/lib/types';
import {
  useJournalColorsStore,
  getJournalColor,
} from '@/lib/stores/journal-colors-store';

// ─── Decorative icons ─────────────────────────────────
const DECORATIVE_ICONS = [MapPin, Bookmark, Star, Sun, Snowflake, Compass, Anchor, Mountain];

function getDecorativeIcon(journalId: string) {
  let hash = 0;
  for (let i = 0; i < journalId.length; i++) {
    hash = (hash << 5) - hash + journalId.charCodeAt(i);
    hash |= 0;
  }
  return DECORATIVE_ICONS[Math.abs(hash) % DECORATIVE_ICONS.length];
}

function estimateWordCount(summary: string | null): string {
  if (!summary) return '';
  const words = summary.trim().split(/\s+/).length;
  if (words < 100) return '';
  if (words >= 1000) return `${(words / 1000).toFixed(1)}K words`;
  return `${words} words`;
}

// ─── Card ─────────────────────────────────────────────
export function JournalCard({ journal }: { journal: Journal }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const colorKey = useJournalColorsStore((s) => s.getColor(journal.id));
  const color = getJournalColor(colorKey);

  const bg = isDark ? color.bgDark : color.bg;
  const text = isDark ? color.textDark : color.text;
  const accent = isDark ? color.accentDark : color.accent;
  const divider = isDark ? color.dividerDark : color.divider;

  const Icon = getDecorativeIcon(journal.id);
  const wordCount = estimateWordCount(journal.summary);
  const dateStr = format(new Date(journal.updatedAt), 'MMM yyyy').toUpperCase();
  const isQuote =
    journal.summary?.startsWith('"') || journal.summary?.startsWith('\u201C');

  // Extract location from first entry if available
  const firstEntry = journal.entries?.[0];
  const location =
    firstEntry?.locationCountry ||
    firstEntry?.locationCity ||
    firstEntry?.locationName ||
    null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/journals/${journal.id}`}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: bg,
            borderRadius: '16px',
            p: { xs: 2.5, md: 3 },
            minHeight: { xs: 260, md: 320 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'box-shadow 0.3s, transform 0.3s',
            '&:hover': {
              boxShadow: isDark
                ? '0 12px 40px rgba(0,0,0,0.4)'
                : '0 12px 40px rgba(0,0,0,0.12)',
            },
          }}
        >
          {/* Top row: location badge + icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            {/* Location badge */}
            {location ? (
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '6px',
                  px: 1.25,
                  py: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: text,
                  }}
                >
                  {location}
                </Typography>
              </Box>
            ) : (
              <Box />
            )}

            {/* Decorative icon + privacy */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {journal.privacy !== 'public' && (
                <Lock
                  style={{
                    width: 14,
                    height: 14,
                    color: accent,
                    opacity: 0.6,
                  }}
                />
              )}
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  color: accent,
                  opacity: 0.5,
                }}
              />
            </Box>
          </Box>

          {/* Date */}
          <Typography
            sx={{
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: accent,
              mb: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            {dateStr}
            {journal.status === 'draft' && (
              <Box
                component="span"
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.5)',
                  borderRadius: '4px',
                  px: 0.75,
                  py: 0.25,
                }}
              >
                DRAFT
              </Box>
            )}
          </Typography>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: { xs: '1.35rem', md: '1.6rem' },
              lineHeight: 1.2,
              color: text,
              mb: 1.5,
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
                color: accent,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                ...(isQuote
                  ? { fontStyle: 'italic' }
                  : {}),
              }}
            >
              {journal.summary}
            </Typography>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Divider */}
          <Box
            sx={{
              width: '100%',
              height: '1px',
              bgcolor: divider,
              mt: 2,
              mb: 1.5,
            }}
          />

          {/* Footer: stats + arrow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {wordCount && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Pen style={{ width: 12, height: 12, color: accent, opacity: 0.6 }} />
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: accent,
                      opacity: 0.7,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {wordCount}
                  </Typography>
                </Box>
              )}
              {journal.entryCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Camera
                    style={{ width: 12, height: 12, color: accent, opacity: 0.6 }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: accent,
                      opacity: 0.7,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {journal.entryCount}
                  </Typography>
                </Box>
              )}
            </Box>

            <ArrowRight
              style={{
                width: 18,
                height: 18,
                color: accent,
                opacity: 0.5,
              }}
            />
          </Box>
        </Box>
      </Link>
    </motion.div>
  );
}
