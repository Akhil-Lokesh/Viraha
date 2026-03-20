'use client';

import { useCallback, useEffect } from 'react';
import { Plane, Home, Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import MuiSwitch from '@mui/material/Switch';
import { useTravelStore } from '@/lib/stores/travel-store';
import { useUpdateTravelMode } from '@/lib/hooks/use-travel';
import { useLocationDetection } from '@/lib/hooks/use-location-detection';
import type { SxProps, Theme } from '@mui/material';

interface TravelModeToggleProps {
  sx?: SxProps<Theme>;
}

export function TravelModeToggle({ sx }: TravelModeToggleProps) {
  const mode = useTravelStore((s) => s.mode);
  const isTraveling = mode === 'traveling';
  const updateMode = useUpdateTravelMode();
  const { lat, lng, loading: locationLoading, error: locationError, requestLocation } = useLocationDetection();

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Switching to traveling mode - request location first
        requestLocation();
      } else {
        // Switching back to local mode
        updateMode.mutate({ mode: 'local' });
      }
    },
    [requestLocation, updateMode]
  );

  // When location is successfully acquired after toggling on, send the update
  useEffect(() => {
    if (lat != null && lng != null && !locationLoading && !isTraveling) {
      updateMode.mutate({
        mode: 'traveling',
        currentLat: lat,
        currentLng: lng,
      });
    }
  }, [lat, lng, locationLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPending = updateMode.isPending || locationLoading;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, ...sx as object }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isTraveling ? (
          <Plane style={{ height: 16, width: 16, color: '#3b82f6' }} />
        ) : (
          <Home style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {isTraveling ? 'Traveling Mode' : 'Local Mode'}
          </Typography>
          {locationError && (
            <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>{locationError}</Typography>
          )}
          {isPending && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Updating...</Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPending && <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />}
        <MuiSwitch
          checked={isTraveling}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={isPending}
          inputProps={{ 'aria-label': 'Toggle traveling mode' }}
        />
      </Box>
    </Box>
  );
}
