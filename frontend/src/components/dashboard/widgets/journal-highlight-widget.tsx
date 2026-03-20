'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, useTheme, Menu, MenuItem, ListItemText } from '@mui/material';
import Link from 'next/link';
import { Share2, Lock, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useJournals } from '@/lib/hooks/use-journals';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';
import type { Journal } from '@/lib/types';

const DEFAULT_COLOR = '#0D9488';

export function JournalHighlightWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isLarge = size.cols >= 4;

  const { data } = useJournals();
  const journals = data?.pages.flatMap((p) => p.items) ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const selected = selectedId ? journals.find((j) => j.id === selectedId) : null;

  const handleShare = async (e: React.MouseEvent, journal: Journal) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/journals/${journal.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: journal.title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  if (journals.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          height: '100%',
          bgcolor: c.bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          No journals yet
        </Typography>
      </Box>
    );
  }

  // If no journal selected, show picker
  if (!selected) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          bgcolor: c.bgTint,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.accent }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Journal Highlight
            </Typography>
          </Box>
          <Link href="/journals" style={{ textDecoration: 'none' }}>
            <Typography sx={{ fontSize: '0.75rem', color: c.accent, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              View All <ChevronRight style={{ width: 14, height: 14 }} />
            </Typography>
          </Link>
        </Box>

        {/* Selectable list */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', px: 1, pb: 1, overflow: 'auto' }}>
          <Typography sx={{ px: 1.5, py: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
            Choose a journal to feature:
          </Typography>
          {journals.map((journal, i) => (
            <Box
              key={journal.id}
              onClick={() => setSelectedId(journal.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'action.hover' },
                borderBottom: i < journals.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {journal.title}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
                  {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
                </Typography>
              </Box>
              {journal.privacy !== 'public' && (
                <Lock style={{ width: 12, height: 12, flexShrink: 0, color: 'var(--mui-palette-text-secondary)' }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Selected journal view
  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        bgcolor: c.bgTint,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with switcher */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 1 }}>
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            Journal Highlight
          </Typography>
          <ChevronDown style={{ width: 14, height: 14, color: 'var(--mui-palette-text-secondary)' }} />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { maxHeight: 240, minWidth: 200 } } }}
        >
          {journals.map((j) => (
            <MenuItem
              key={j.id}
              selected={j.id === selectedId}
              onClick={() => {
                setSelectedId(j.id);
                setAnchorEl(null);
              }}
            >
              <ListItemText
                primary={j.title}
                secondary={format(new Date(j.updatedAt), 'MMM d, yyyy')}
                slotProps={{
                  primary: { sx: { fontSize: '0.85rem', fontWeight: j.id === selectedId ? 600 : 400 } },
                  secondary: { sx: { fontSize: '0.7rem' } },
                }}
              />
            </MenuItem>
          ))}
        </Menu>
        <Link href="/journals" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.75rem', color: c.accent, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            View All <ChevronRight style={{ width: 14, height: 14 }} />
          </Typography>
        </Link>
      </Box>

      {/* Featured journal content */}
      <Link href={`/journals/${selected.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: 'action.hover' },
            height: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: isLarge ? '1.1rem' : '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.title}
            </Typography>
            {selected.privacy !== 'public' && (
              <Lock style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--mui-palette-text-secondary)' }} />
            )}
            <IconButton
              size="small"
              onClick={(e) => handleShare(e, selected)}
              sx={{ width: 30, height: 30, flexShrink: 0, color: 'text.secondary', '&:hover': { color: c.accent } }}
            >
              <Share2 style={{ width: 15, height: 15 }} />
            </IconButton>
          </Box>

          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
            {format(new Date(selected.updatedAt), 'MMM d, yyyy')}
          </Typography>

          {selected.summary && (
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: 'text.secondary',
                lineHeight: 1.6,
                fontStyle: 'italic',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: isLarge ? 5 : 3,
                WebkitBoxOrient: 'vertical',
                flex: 1,
              }}
            >
              &ldquo;{selected.summary}&rdquo;
            </Typography>
          )}

          <Typography sx={{ fontSize: '0.8rem', color: c.accent, fontWeight: 600, mt: 1.5 }}>
            Continue Reading &rarr;
          </Typography>
        </Box>
      </Link>
    </Box>
  );
}
