'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Lock, Unlock, Clock, MapPin, Gift, Plus, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { useTimeCapsules, useOpenTimeCapsule } from '@/lib/hooks/use-time-capsules';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { DepartureRitualDialog } from '@/components/travel/departure-ritual-dialog';
import type { WidgetGridSize } from '@/lib/types/dashboard';
import type { TimeCapsule } from '@/lib/api/timeCapsules';

const DEFAULT_COLOR = '#6366F1';

export function TimeCapsuleWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isTall = size.rows >= 4;

  const { data: capsules, isLoading, isError } = useTimeCapsules(true);
  const openMutation = useOpenTimeCapsule();

  const [sealOpen, setSealOpen] = useState(false);
  const [revealed, setRevealed] = useState<TimeCapsule | null>(null);

  const sealed = (capsules ?? []).filter((cap) => !cap.isOpened);
  const openable = (capsules ?? []).filter((cap) => cap.isOpenable);
  const opened = (capsules ?? []).filter((cap) => cap.isOpened && !cap.isOpenable);

  const handleOpen = async (id: string) => {
    try {
      const result = await openMutation.mutateAsync(id);
      setRevealed(result);
    } catch {
      toast.error("Couldn't open this capsule. Please try again.");
    }
  };

  const sealButton = (
    <IconButton
      size="small"
      aria-label="Seal a memory"
      onClick={() => setSealOpen(true)}
      sx={{ width: 24, height: 24, color: c.accent, '&:hover': { bgcolor: alpha(hex, 0.1) } }}
    >
      <Plus style={{ width: 14, height: 14 }} />
    </IconButton>
  );

  const sealDialog = (
    <DepartureRitualDialog
      open={sealOpen}
      onClose={() => setSealOpen(false)}
      locationName={null}
    />
  );

  const revealDialog = (
    <Dialog
      open={!!revealed}
      onClose={() => setRevealed(null)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Unlock style={{ width: 18, height: 18, color: hex }} />
          Memory unsealed
        </Box>
        <IconButton size="small" aria-label="Close" onClick={() => setRevealed(null)}>
          <X style={{ width: 16, height: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {revealed?.locationName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <MapPin style={{ width: 13, height: 13, color: hex }} />
            <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>{revealed.locationName}</Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {revealed?.content || 'This capsule has no message.'}
        </Typography>
        {revealed?.sealedAt && (
          <Typography sx={{ fontSize: '11px', color: 'text.disabled', mt: 2 }}>
            Sealed {format(new Date(revealed.sealedAt), 'MMM d, yyyy')}
          </Typography>
        )}
      </DialogContent>
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
        <Lock style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Couldn&apos;t load your capsules
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Please try again in a moment
        </Typography>
      </Box>
    );
  }

  if (!capsules || capsules.length === 0) {
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
        <Lock style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          No time capsules
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Seal a memory to open it later
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus style={{ width: 14, height: 14 }} />}
          onClick={() => setSealOpen(true)}
          sx={{ mt: 0.5, borderRadius: '10px', textTransform: 'none' }}
        >
          Seal a memory
        </Button>
        {sealDialog}
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
          <Lock style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Time Capsules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {sealed.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Lock style={{ width: 9, height: 9, color: hex, opacity: 0.6 }} />
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>{sealed.length}</Typography>
            </Box>
          )}
          {openable.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Gift style={{ width: 9, height: 9, color: '#10B981' }} />
              <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>{openable.length} ready</Typography>
            </Box>
          )}
          {sealButton}
        </Box>
      </Box>

      {/* Capsule list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pb: 1.5 }}>
        {/* Openable capsules first (highlighted, clickable) */}
        {openable.map((cap) => (
          <Box
            key={cap.id}
            role="button"
            tabIndex={0}
            aria-label="Open ready time capsule"
            onClick={() => handleOpen(cap.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen(cap.id);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 1,
              px: 1,
              my: 0.5,
              borderRadius: '10px',
              bgcolor: alpha('#10B981', 0.08),
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
              cursor: openMutation.isPending ? 'wait' : 'pointer',
              opacity: openMutation.isPending ? 0.6 : 1,
              transition: 'background 0.2s, opacity 0.2s',
              '&:hover': { bgcolor: alpha('#10B981', 0.14) },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: alpha('#10B981', 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <Gift style={{ width: 15, height: 15, color: '#10B981' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                {openMutation.isPending ? 'Opening…' : 'Tap to open'}
              </Typography>
              {cap.locationName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                  <MapPin style={{ width: 9, height: 9, opacity: 0.5 }} />
                  <Typography sx={{ fontSize: '10px', color: 'text.secondary' }}>{cap.locationName}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {/* Sealed capsules */}
        {sealed.filter((cap) => !cap.isOpenable).map((cap) => {
          const opensIn = formatDistanceToNow(new Date(cap.openAt));
          return (
            <Box
              key={cap.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 0.75,
                px: 0.75,
                borderRadius: '8px',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: alpha(hex, 0.06) },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: c.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock style={{ width: 12, height: 12, color: hex }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {cap.locationName && (
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cap.locationName}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Clock style={{ width: 9, height: 9, opacity: 0.4 }} />
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                    Opens in {opensIn}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                {cap.type === 'letter_to_self' ? 'Letter' : 'Departure'}
              </Typography>
            </Box>
          );
        })}

        {/* Recent opened capsules — content is available post-open */}
        {isTall && opened.slice(0, 3).map((cap) => (
          <Box
            key={cap.id}
            role="button"
            tabIndex={0}
            aria-label="Re-read opened time capsule"
            onClick={() => setRevealed(cap)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setRevealed(cap);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 0.75,
              px: 0.75,
              borderRadius: '8px',
              opacity: 0.7,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1, bgcolor: alpha(hex, 0.06) },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: alpha(hex, 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Unlock style={{ width: 12, height: 12, color: hex, opacity: 0.4 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '11px', color: 'text.secondary', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                {cap.content ? `${cap.content.slice(0, 60)}…` : 'Opened memory'}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                Opened {cap.openedAt ? format(new Date(cap.openedAt), 'MMM d') : ''}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {sealDialog}
      {revealDialog}
    </Box>
  );
}
