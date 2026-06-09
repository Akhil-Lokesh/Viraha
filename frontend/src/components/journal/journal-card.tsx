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

const GOLD = 'var(--viraha-gold, #D4A843)';

/** Cloth-weave texture for the cover — two crossed fine gradients, no asset files. */
const clothTexture =
  'repeating-linear-gradient(0deg, rgba(34,28,24,0.03) 0px, rgba(34,28,24,0.03) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)';

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

// ─── Card: a cloth-bound journal, custom color as the cover/spine ──────
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
    journal.summary?.startsWith('"') || journal.summary?.startsWith('“');

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
      whileHover={{ y: -4, rotate: -0.5 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <Link
        href={`/journals/${journal.id}`}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: bg,
            backgroundImage: clothTexture,
            // book silhouette: tight spine edge, rounded fore-edge
            borderRadius: '3px 10px 10px 3px',
            border: '1px solid',
            borderColor: divider,
            boxShadow: '3px 3px 0 rgba(34,28,24,0.12)',
            p: { xs: 2.5, md: 3 },
            pl: { xs: 4, md: 4.5 },
            minHeight: { xs: 260, md: 320 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'box-shadow 0.3s',
            '&:hover': { boxShadow: '4px 5px 0 rgba(34,28,24,0.18)' },
          }}
        >
          {/* Spine: darker band with a gold tooling rule */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 14,
              bgcolor: accent,
              opacity: 0.35,
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 14,
              width: '1px',
              bgcolor: GOLD,
              opacity: 0.7,
            }}
          />
          {/* Gold tooling frame inset on the cover */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bottom: 8,
              left: 22,
              border: `1px solid ${GOLD}`,
              opacity: 0.35,
              borderRadius: '2px 8px 8px 2px',
              pointerEvents: 'none',
            }}
          />

          {/* Top row: location stamp + icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 2,
              position: 'relative',
            }}
          >
            {/* Location — passport stamp */}
            {location ? (
              <Box
                sx={{
                  transform: 'rotate(-1.5deg)',
                  border: '1.5px solid',
                  borderColor: text,
                  borderRadius: '4px',
                  px: 1,
                  py: 0.4,
                  opacity: 0.85,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'var(--font-brand)',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
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

          {/* Date eyebrow */}
          <Typography
            sx={{
              fontFamily: 'var(--font-brand)',
              fontSize: '0.62rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: accent,
              mb: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              position: 'relative',
            }}
          >
            {dateStr}
            {journal.status === 'draft' && (
              <Box
                component="span"
                sx={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  border: `1.5px solid ${GOLD}`,
                  color: GOLD,
                  borderRadius: '3px',
                  transform: 'rotate(2deg)',
                  px: 0.75,
                  py: 0.2,
                }}
              >
                DRAFT
              </Box>
            )}
          </Typography>

          {/* Title — gold-tooled display serif */}
          <Typography
            sx={{
              fontFamily: 'var(--font-accent)',
              fontSize: { xs: '1.4rem', md: '1.65rem' },
              lineHeight: 1.2,
              color: text,
              mb: 1.5,
              position: 'relative',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              // gold rule under the title, like foil tooling
              pb: 1,
              backgroundImage: `linear-gradient(${GOLD}, ${GOLD})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '48px 1.5px',
              backgroundPosition: 'left bottom',
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
                position: 'relative',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                ...(isQuote ? { fontStyle: 'italic' } : {}),
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
              position: 'relative',
            }}
          />

          {/* Footer: stats + arrow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {wordCount && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Pen style={{ width: 12, height: 12, color: accent, opacity: 0.6 }} />
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      color: accent,
                      opacity: 0.75,
                      letterSpacing: '0.08em',
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
                      fontFamily: 'var(--font-brand)',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      color: accent,
                      opacity: 0.75,
                      letterSpacing: '0.08em',
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
