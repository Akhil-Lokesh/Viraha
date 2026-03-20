import { MapPin } from 'lucide-react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface LocationBadgeProps {
  location: string;
  variant?: 'default' | 'overlay' | 'subtle';
  sx?: SxProps<Theme>;
}

export function LocationBadge({
  location,
  variant = 'default',
  sx: sxProp,
}: LocationBadgeProps) {
  const variantStyles: Record<string, SxProps<Theme>> = {
    overlay: {
      bgcolor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      color: '#fff',
      px: 1.25,
      py: 0.5,
      borderRadius: '9999px',
    },
    default: {
      color: 'text.secondary',
    },
    subtle: {
      bgcolor: 'action.hover',
      color: 'text.secondary',
      px: 1,
      py: 0.25,
      borderRadius: '9999px',
    },
  };

  return (
    <Box
      component="span"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        variantStyles[variant] as any,
        ...(Array.isArray(sxProp) ? sxProp : sxProp ? [sxProp] : []),
      ]}
    >
      <MapPin style={{ width: 12, height: 12 }} />
      {location}
    </Box>
  );
}
