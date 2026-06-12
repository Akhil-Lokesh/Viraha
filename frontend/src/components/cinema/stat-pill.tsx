'use client';

import { Box, Typography } from '@mui/material';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';

interface StatPillProps {
  value: number | string;
  label: string;
}

/** Number + muted label chip on a dark surface. */
export function StatPill({ value, label }: StatPillProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: '12px',
        bgcolor: CIN.surface,
        border: `1px solid ${CIN.hairline}`,
        minWidth: 92,
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Posterama, var(--font-body)',
          fontWeight: 700,
          fontSize: 24,
          color: CIN.text,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ ...eyebrowSx, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}
