'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

const TRAVEL_QUOTES = [
  { text: 'The world is a book and those who do not travel read only one page.', author: 'Saint Augustine' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'Travel makes one modest. You see what a tiny place you occupy in the world.', author: 'Gustave Flaubert' },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  { text: 'To travel is to live.', author: 'Hans Christian Andersen' },
  { text: 'Adventure is worthwhile in itself.', author: 'Amelia Earhart' },
  { text: 'The journey not the arrival matters.', author: 'T.S. Eliot' },
];

export function QuoteWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const [index, setIndex] = useState(0);
  const isSmall = size.cols <= 1;
  const isBanner = size.cols >= 4;

  useEffect(() => {
    setIndex(Math.floor(Math.random() * TRAVEL_QUOTES.length));
  }, []);

  const quote = TRAVEL_QUOTES[index];

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: isBanner ? 'row' : 'column',
        alignItems: isBanner ? 'center' : 'flex-start',
        justifyContent: isBanner ? 'center' : 'space-between',
        gap: isBanner ? 3 : 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: isBanner ? 2 : 0,
          flexDirection: isBanner ? 'row' : 'column',
          flex: isBanner ? 1 : undefined,
        }}
      >
        {/* Decorative quote mark */}
        <Typography
          component="span"
          sx={{
            fontSize: isBanner ? '48px' : '36px',
            lineHeight: 1,
            color: c.accent,
            opacity: 0.2,
            fontFamily: 'Georgia, serif',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          &ldquo;
        </Typography>
        <Typography
          sx={{
            fontSize: isBanner ? '17px' : isSmall ? '13px' : '15px',
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'text.primary',
            mt: isBanner ? 1 : 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: isSmall ? 3 : undefined,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {quote.text}
        </Typography>
      </Box>
      {!isSmall && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: isBanner ? 0 : 1.5,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textAlign: 'right',
            alignSelf: isBanner ? 'center' : 'flex-end',
          }}
        >
          &mdash; {quote.author}
        </Typography>
      )}
    </Box>
  );
}
