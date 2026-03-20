'use client';

import { Plane, MapPin } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { useTravelStore } from '@/lib/stores/travel-store';
import { useUpdateTravelMode } from '@/lib/hooks/use-travel';

interface TravelModePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedLat: number;
  detectedLng: number;
  distanceKm: number;
}

export function TravelModePrompt({
  open,
  onOpenChange,
  detectedLat,
  detectedLng,
  distanceKm,
}: TravelModePromptProps) {
  const setHasPrompted = useTravelStore((s) => s.setHasPrompted);
  const updateMode = useUpdateTravelMode();

  const handleEnable = () => {
    updateMode.mutate(
      {
        mode: 'traveling',
        currentLat: detectedLat,
        currentLng: detectedLng,
      },
      {
        onSuccess: () => {
          setHasPrompted(true);
          onOpenChange(false);
        },
      }
    );
  };

  const handleDismiss = () => {
    setHasPrompted(true);
    onOpenChange(false);
  };

  return (
    <MuiDialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(59,130,246,0.1)',
            }}
          >
            <Plane style={{ height: 24, width: 24, color: '#3b82f6' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Looks like you&apos;re away from home
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            <Box component="span" sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
              <MapPin style={{ height: 14, width: 14 }} />
              <span>
                You&apos;re about{' '}
                <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  {Math.round(distanceKm)} km
                </Box>{' '}
                from your home location
              </span>
            </Box>
          </Typography>
      </Box>
      <MuiDialogContent sx={{ pt: 2 }}>
        <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
          Enable Traveling Mode to discover posts from people who have visited the
          places around you and get location-aware recommendations.
        </Typography>
      </MuiDialogContent>
      <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={handleEnable}
            disabled={updateMode.isPending}
            sx={{ width: '100%', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {updateMode.isPending ? 'Enabling...' : 'Enable Traveling Mode'}
          </Button>
          <Button
            variant="text"
            disableElevation
            onClick={handleDismiss}
            disabled={updateMode.isPending}
            sx={{ width: '100%' }}
          >
            Not Now
          </Button>
      </MuiDialogActions>
    </MuiDialog>
  );
}
