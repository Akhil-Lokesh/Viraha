'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Skeleton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Compass, MapPin, Star, CheckCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useWantToGo,
  useCreateWantToGo,
  useDeleteWantToGo,
} from '@/lib/hooks/use-want-to-go';
import { usePlaceResonance } from '@/lib/hooks/use-viraha';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';
import type { PlaceResonanceItem } from '@/lib/api/viraha';

const DEFAULT_COLOR = '#F59E0B';

const STATUS_ICONS: Record<string, { icon: typeof Star; color: string }> = {
  dreaming: { icon: Star, color: '#F59E0B' },
  planned: { icon: MapPin, color: '#3B82F6' },
  visited: { icon: CheckCircle, color: '#10B981' },
};

interface PlaceOption {
  label: string;
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  name: string | null;
}

function toPlaceOption(p: PlaceResonanceItem): PlaceOption {
  const label = [p.locationName, p.locationCity, p.locationCountry].filter(Boolean).join(', ') || 'Visited place';
  return {
    label,
    lat: Number(p.lat),
    lng: Number(p.lng),
    city: p.locationCity,
    country: p.locationCountry,
    name: p.locationName,
  };
}

export function WantToGoWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;

  const { data: items, isLoading, isError } = useWantToGo();
  const createMutation = useCreateWantToGo();
  const deleteMutation = useDeleteWantToGo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [notes, setNotes] = useState('');

  const { data: resonance } = usePlaceResonance();
  const placeOptions: PlaceOption[] = (resonance ?? [])
    .filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
    .map(toPlaceOption);

  const dreaming = (items ?? []).filter((i) => i.status === 'dreaming');
  const planned = (items ?? []).filter((i) => i.status === 'planned');
  const visited = (items ?? []).filter((i) => i.status === 'visited');
  const display = [...dreaming, ...planned].slice(0, isWide ? 5 : 3);

  const handleCreate = async () => {
    if (!selectedPlace) return;
    try {
      await createMutation.mutateAsync({
        locationLat: selectedPlace.lat,
        locationLng: selectedPlace.lng,
        locationName: selectedPlace.name ?? undefined,
        locationCity: selectedPlace.city ?? undefined,
        locationCountry: selectedPlace.country ?? undefined,
        notes: notes.trim() || undefined,
      });
      toast.success('Added to your wish list');
      setDialogOpen(false);
      setSelectedPlace(null);
      setNotes('');
    } catch {
      toast.error("Couldn't add this place. Please try again.");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Removed from your wish list');
    } catch {
      toast.error("Couldn't remove this place. Please try again.");
    }
  };

  const addButton = (
    <IconButton
      size="small"
      aria-label="Add to want to go"
      onClick={() => setDialogOpen(true)}
      sx={{ width: 24, height: 24, color: c.accent, '&:hover': { bgcolor: alpha(hex, 0.1) } }}
    >
      <Plus style={{ width: 14, height: 14 }} />
    </IconButton>
  );

  const dialog = (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Add to Want to Go</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={placeOptions}
          value={selectedPlace}
          onChange={(_, value) => setSelectedPlace(value)}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.lat === b.lat && a.lng === b.lng}
          noOptionsText="Visit places to build your suggestions"
          renderInput={(params) => (
            <TextField {...params} label="Place" placeholder="Pick a place" margin="dense" />
          )}
        />
        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          margin="dense"
          multiline
          minRows={2}
          placeholder="Why do you dream of going here?"
        />
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', mt: 1 }}>
          Suggestions come from places you&apos;ve already pinned. Add more from the map to grow this list.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!selectedPlace || createMutation.isPending}
        >
          {createMutation.isPending ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <Compass style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Couldn&apos;t load your wish list
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Please try again in a moment
        </Typography>
      </Box>
    );
  }

  if (display.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <Compass style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Where do you dream of going?
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Build your wish list of places to explore
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus style={{ width: 14, height: 14 }} />}
          onClick={() => setDialogOpen(true)}
          sx={{ mt: 0.5, borderRadius: '10px', textTransform: 'none' }}
        >
          Add a place
        </Button>
        {dialog}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Compass style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Want to Go
          </Typography>
        </Box>

        {/* Summary counters + add */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {dreaming.length > 0 && (
            <Typography sx={{ fontSize: '10px', color: '#F59E0B', fontWeight: 600 }}>
              {dreaming.length} dreaming
            </Typography>
          )}
          {visited.length > 0 && (
            <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>
              {visited.length} visited
            </Typography>
          )}
          {addButton}
        </Box>
      </Box>

      {/* Places list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pb: 1.5 }}>
        {display.map((item) => {
          const statusInfo = STATUS_ICONS[item.status] || STATUS_ICONS.dreaming;
          const Icon = statusInfo.icon;
          const placeName = item.locationName || item.locationCity || 'Unknown';

          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 0.75,
                px: 0.75,
                borderRadius: '8px',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: alpha(hex, 0.06) },
                '&:hover .remove-btn': { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(statusInfo.color, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: 13, height: 13, color: statusInfo.color }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {placeName}
                </Typography>
                {item.locationCountry && (
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                    {item.locationCountry}
                  </Typography>
                )}
              </Box>

              {item.notes && (
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: 'text.disabled',
                    fontStyle: 'italic',
                    maxWidth: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.notes}
                </Typography>
              )}

              <IconButton
                className="remove-btn"
                size="small"
                aria-label={`Remove ${placeName} from want to go`}
                disabled={deleteMutation.isPending}
                onClick={() => handleRemove(item.id)}
                sx={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'text.disabled',
                  '&:hover': { color: '#EF4444' },
                }}
              >
                <X style={{ width: 12, height: 12 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {dialog}
    </Box>
  );
}
