'use client';

import { Box, Typography } from '@mui/material';

const moods = [
  { value: 'adventurous', label: 'Adventurous', emoji: '🧭' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🧘' },
  { value: 'exhausted', label: 'Exhausted', emoji: '😴' },
  { value: 'inspired', label: 'Inspired', emoji: '✨' },
  { value: 'reflective', label: 'Reflective', emoji: '🌙' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

export function MoodSelector({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (mood: string | undefined) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {moods.map((mood) => (
        <Box
          key={mood.value}
          component="button"
          type="button"
          onClick={() => onChange(value === mood.value ? undefined : mood.value)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            borderRadius: '9999px',
            px: 1.5,
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: '1px solid',
            ...(value === mood.value
              ? {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main',
                  boxShadow: 1,
                }
              : {
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  color: 'text.primary',
                  opacity: 0.8,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'text.secondary',
                  },
                }),
          }}
        >
          <span>{mood.emoji}</span>
          {mood.label}
        </Box>
      ))}
    </Box>
  );
}

export function MoodBadge({ mood }: { mood: string }) {
  const found = moods.find((m) => m.value === mood);
  if (!found) return null;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        borderRadius: '9999px',
        bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
        px: 1.25,
        py: 0.25,
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'primary.main',
      }}
    >
      <span>{found.emoji}</span>
      {found.label}
    </Box>
  );
}
