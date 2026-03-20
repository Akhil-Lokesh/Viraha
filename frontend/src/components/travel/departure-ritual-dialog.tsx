'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, TextField, Button, Dialog, DialogContent, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { X, Heart, Send } from 'lucide-react';
import { useCreateTimeCapsule } from '@/lib/hooks/use-time-capsules';
import { toast } from 'sonner';

interface DepartureRitualDialogProps {
  open: boolean;
  onClose: () => void;
  locationName: string | null;
  locationLat?: number;
  locationLng?: number;
}

export function DepartureRitualDialog({ open, onClose, locationName, locationLat, locationLng }: DepartureRitualDialogProps) {
  const [missText, setMissText] = useState('');
  const [letterText, setLetterText] = useState('');
  const [step, setStep] = useState<'miss' | 'letter' | 'done'>('miss');
  const createCapsule = useCreateTimeCapsule();

  const handleSubmitMiss = useCallback(() => {
    if (!missText.trim()) return;

    // Create a time capsule that opens in 30 days
    const openAt = new Date();
    openAt.setDate(openAt.getDate() + 30);

    createCapsule.mutate({
      content: `What I'll miss most about ${locationName || 'this place'}: ${missText}`,
      locationName: locationName || undefined,
      locationLat,
      locationLng,
      type: 'departure',
      openAt: openAt.toISOString(),
    }, {
      onSuccess: () => {
        setStep('letter');
      },
    });
  }, [missText, locationName, locationLat, locationLng, createCapsule]);

  const handleSubmitLetter = useCallback(() => {
    if (!letterText.trim()) {
      handleDone();
      return;
    }

    const openAt = new Date();
    openAt.setMonth(openAt.getMonth() + 6);

    createCapsule.mutate({
      content: letterText,
      locationName: locationName || undefined,
      locationLat,
      locationLng,
      type: 'letter_to_self',
      openAt: openAt.toISOString(),
    }, {
      onSuccess: () => handleDone(),
    });
  }, [letterText, locationName, locationLat, locationLng, createCapsule]);

  const handleDone = () => {
    setStep('done');
    toast.success('Memory sealed. Viraha will bring it back when the time is right.');
    setTimeout(() => {
      onClose();
      setStep('miss');
      setMissText('');
      setLetterText('');
    }, 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', overflow: 'hidden' },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header gradient */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.08) 100%)',
            position: 'relative',
          }}
        >
          <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', top: 12, right: 12 }}>
            <X style={{ width: 16, height: 16 }} />
          </IconButton>
          <Heart style={{ width: 24, height: 24, color: '#EC4899' }} />
          <Typography sx={{ mt: 1, fontWeight: 700, fontSize: '1.1rem' }}>
            {step === 'done' ? 'Memory sealed' : 'Heading home?'}
          </Typography>
          {locationName && step !== 'done' && (
            <Typography sx={{ fontSize: '13px', color: 'text.secondary', mt: 0.25 }}>
              Capture a last moment from {locationName}
            </Typography>
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {step === 'miss' && (
            <>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1.5 }}>
                What will you miss most?
              </Typography>
              <TextField
                value={missText}
                onChange={(e) => setMissText(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="The morning light, the cafe on the corner, the sound of..."
                sx={{
                  mb: 2,
                  '& .MuiInputBase-root': { fontSize: '14px', borderRadius: '12px' },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmitMiss}
                disabled={!missText.trim() || createCapsule.isPending}
                startIcon={<Send style={{ width: 14, height: 14 }} />}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                Seal this memory
              </Button>
              <Typography sx={{ fontSize: '11px', color: 'text.disabled', mt: 1, textAlign: 'center' }}>
                This will resurface in 30 days as a surprise
              </Typography>
            </>
          )}

          {step === 'letter' && (
            <>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
                Letter to future self
              </Typography>
              <Typography sx={{ fontSize: '12px', color: 'text.secondary', mb: 1.5 }}>
                Optional — Viraha will deliver this in 6 months
              </Typography>
              <TextField
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Dear future me..."
                sx={{
                  mb: 2,
                  '& .MuiInputBase-root': { fontSize: '14px', borderRadius: '12px' },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleDone}
                  sx={{ borderRadius: '12px', textTransform: 'none' }}
                >
                  Skip
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmitLetter}
                  disabled={createCapsule.isPending}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                >
                  Seal & send
                </Button>
              </Box>
            </>
          )}

          {step === 'done' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography sx={{ fontSize: '2rem' }}>✨</Typography>
              <Typography sx={{ fontSize: '14px', color: 'text.secondary', mt: 1 }}>
                Viraha remembers
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
