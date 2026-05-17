'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthHydrated } from '@/lib/stores/auth-store';
import { resendVerification } from '@/lib/api/auth';

export function UnverifiedEmailBanner() {
  const { user, isAuthenticated } = useAuth();
  const hydrated = useAuthHydrated();
  const [sending, setSending] = useState(false);

  if (!hydrated || !isAuthenticated || !user || user.emailVerified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent. Check your inbox.');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Could not send verification email.';
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        bgcolor: 'rgba(234, 179, 8, 0.12)',
        borderBottom: 1,
        borderColor: 'rgba(234, 179, 8, 0.32)',
        ml: { xs: 0, md: '96px' },
      }}
    >
      <Mail size={18} style={{ flexShrink: 0, color: '#a16207' }} />
      <Typography sx={{ fontSize: '0.875rem', color: 'text.primary', flex: 1 }}>
        Verify your email to secure your account.
      </Typography>
      <Button
        size="small"
        variant="text"
        onClick={handleResend}
        disabled={sending}
        sx={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' }}
      >
        {sending ? 'Sending…' : 'Resend'}
      </Button>
    </Box>
  );
}
