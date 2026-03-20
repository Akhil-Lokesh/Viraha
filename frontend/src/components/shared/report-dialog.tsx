'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Box, Typography } from '@mui/material';
import { createReport } from '@/lib/api/reports';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
] as const;

type Reason = (typeof REASONS)[number]['value'];

interface Props {
  targetType: 'post' | 'comment' | 'user' | 'journal';
  targetId: string;
  trigger: React.ReactNode;
}

export function ReportDialog({ targetType, targetId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason(null);
    setDetails('');
  }

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      toast.success('Report submitted. Thank you for helping keep the community safe.');
      setOpen(false);
      reset();
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Box component="span" onClick={() => setOpen(true)} sx={{ cursor: 'pointer' }}>
        {trigger}
      </Box>
      <MuiDialog open={open} onClose={() => { setOpen(false); reset(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>Report {targetType}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Let us know why you are reporting this {targetType}. Our team will review it shortly.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Reason
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {REASONS.map((r) => (
                  <Box
                    component="button"
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    sx={(theme) => ({
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: reason === r.value ? 'primary.main' : 'divider',
                      px: 1.5,
                      py: 1,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      fontWeight: reason === r.value ? 500 : 400,
                      bgcolor: reason === r.value
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : `${theme.palette.primary.main}1A`
                        : 'background.paper',
                      color: reason === r.value ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        bgcolor: reason === r.value
                          ? undefined
                          : 'action.hover',
                      },
                    })}
                  >
                    {r.label}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Additional details (optional)
              </Typography>
              <TextField
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any additional context..."
                multiline
                rows={3}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1 }}>
              <Button variant="outlined" disableElevation onClick={() => setOpen(false)} sx={{ borderRadius: 3 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={handleSubmit}
                disabled={!reason || submitting}
                sx={{ borderRadius: 3 }}
              >
                {submitting ? 'Submitting...' : 'Submit report'}
              </Button>
            </Box>
          </Box>
        </MuiDialogContent>
      </MuiDialog>
    </>
  );
}
