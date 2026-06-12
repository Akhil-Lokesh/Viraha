'use client';

import { Button, type ButtonProps } from '@mui/material';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';

type GlowButtonProps<C extends React.ElementType = 'button'> = Omit<
  ButtonProps<C>,
  'variant'
> & {
  variant?: 'solid' | 'ghost';
  component?: C;
};

/** The app's primary action button: solid accent w/ glow, or quiet ghost. */
export function GlowButton<C extends React.ElementType = 'button'>({
  variant = 'solid',
  sx,
  ...rest
}: GlowButtonProps<C>) {
  const solid = variant === 'solid';
  return (
    <Button
      disableElevation
      {...rest}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: '10px',
        px: 2.5,
        py: 1,
        bgcolor: solid ? CIN.accent : 'transparent',
        color: solid ? '#0B0B0F' : CIN.text,
        border: solid ? 'none' : `1px solid ${CIN.hairline}`,
        transition: 'box-shadow .2s ease, background-color .2s ease',
        '&:hover': {
          bgcolor: solid ? CIN.accent : 'rgba(255,255,255,0.04)',
          boxShadow: solid ? glowRing(0) : 'none',
        },
        ...sx,
      }}
    />
  );
}
