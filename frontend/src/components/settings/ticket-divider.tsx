'use client';

import { Box } from '@mui/material';

/**
 * Ticket-stub section divider: a perforation line of dots with notched
 * half-circles on each edge, per the Keepsake design brief.
 */
export function TicketDivider() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        height: 16,
        my: 0.5,
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      {/* Perforation dots */}
      <Box
        sx={{
          flex: 1,
          height: '2px',
          mx: 2,
          backgroundImage:
            'repeating-linear-gradient(to right, var(--viraha-gold, #D4A843) 0 4px, transparent 4px 12px)',
          opacity: 0.55,
          borderRadius: '1px',
        }}
      />
      {/* Edge notches */}
      <Box
        sx={{
          position: 'absolute',
          left: -4,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: '1.5px solid',
          borderColor: 'var(--viraha-gold, #D4A843)',
          opacity: 0.55,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: -4,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: '1.5px solid',
          borderColor: 'var(--viraha-gold, #D4A843)',
          opacity: 0.55,
        }}
      />
    </Box>
  );
}
