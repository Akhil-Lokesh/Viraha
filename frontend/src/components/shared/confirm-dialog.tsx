'use client';

import Dialog from '@mui/material/Dialog';
import { Box, Typography } from '@mui/material';
import { GlowButton } from '@/components/cinema';
import { CIN, displaySx } from '@/lib/design/cinema-tokens';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Dark-cinematic confirmation for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      slotProps={{
        paper: {
          sx: { bgcolor: CIN.surface, border: `1px solid ${CIN.hairline}`, maxWidth: 420, width: '100%' },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography id="confirm-dialog-title" component="h2" sx={{ ...displaySx, fontSize: '1.375rem', mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: CIN.textMuted, fontSize: '0.9rem', mb: 3 }}>{description}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <GlowButton variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </GlowButton>
          <GlowButton
            onClick={onConfirm}
            disabled={pending}
            sx={{ bgcolor: CIN.danger, color: CIN.bg, '&:hover': { bgcolor: CIN.danger, boxShadow: 'none' } }}
          >
            {pending ? 'Deleting…' : confirmLabel}
          </GlowButton>
        </Box>
      </Box>
    </Dialog>
  );
}
