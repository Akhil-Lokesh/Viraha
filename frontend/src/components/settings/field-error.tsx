'use client';

import { Typography } from '@mui/material';
import { CIN } from '@/lib/design/cinema-tokens';

/** Inline form-field validation message in the danger color. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Typography variant="caption" sx={{ color: CIN.danger }}>
      {message}
    </Typography>
  );
}
