'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { Loader2, MonitorSmartphone, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthSession } from '@/lib/types';
import { useSessions, useRevokeSession, useRevokeOtherSessions } from '@/lib/hooks/use-sessions';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { describeUserAgent, formatLastUsed } from './session-utils';
import { dialogPaperSx, dangerOutlineSx } from './cinema-settings';

function CurrentDeviceChip() {
  return (
    <Box
      component="span"
      data-testid="current-session-stamp"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        border: '1px solid rgba(139,124,255,0.45)',
        bgcolor: 'rgba(139,124,255,0.10)',
        color: CIN.accent,
        borderRadius: '999px',
        fontFamily: 'Posterama, var(--font-body)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      This device
    </Box>
  );
}

function SessionRow({ session }: { session: AuthSession }) {
  const revoke = useRevokeSession();

  function handleRevoke() {
    revoke.mutate(session.id, {
      onSuccess: () => toast.success('Session signed out'),
      onError: () => toast.error('Could not sign out that session'),
    });
  }

  return (
    <Box
      data-testid="session-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.75,
        px: 1,
        mx: -1,
        borderRadius: '10px',
        transition: 'background-color .2s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
        '& + &': { borderTop: `1px solid ${CIN.hairline}` },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '10px',
          bgcolor: 'var(--cin-surface-2, #1C1C24)',
          border: `1px solid ${CIN.hairline}`,
          color: CIN.textMuted,
        }}
      >
        <MonitorSmartphone style={{ height: 18, width: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: CIN.text }}>
            {describeUserAgent(session.userAgent)}
          </Typography>
          {session.current && <CurrentDeviceChip />}
        </Box>
        <Typography suppressHydrationWarning sx={{ fontSize: '0.75rem', color: CIN.textMuted }}>
          {session.ip ? `${session.ip} · ` : ''}
          {session.current ? 'Active now' : formatLastUsed(session.lastUsedAt)}
        </Typography>
      </Box>
      {!session.current && (
        <GlowButton
          variant="ghost"
          size="small"
          onClick={handleRevoke}
          disabled={revoke.isPending}
          sx={{ flexShrink: 0, px: 1.5, py: 0.5, fontSize: '0.8125rem' }}
        >
          {revoke.isPending ? 'Signing out...' : 'Sign out'}
        </GlowButton>
      )}
    </Box>
  );
}

/**
 * "Sessions" security section: lists signed-in devices, marks the current
 * one with an accent chip, and offers per-session revoke plus a confirmed
 * "sign out all other devices" action.
 */
export function SessionsSection() {
  const { data: sessions, isLoading, isError } = useSessions();
  const revokeAll = useRevokeOtherSessions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const otherCount = sessions?.filter((s) => !s.current).length ?? 0;

  function handleRevokeAll() {
    revokeAll.mutate(undefined, {
      onSuccess: (revoked) => {
        setConfirmOpen(false);
        toast.success(
          revoked === 1 ? 'Signed out 1 other device' : `Signed out ${revoked} other devices`
        );
      },
      onError: () => {
        setConfirmOpen(false);
        toast.error('Could not sign out other devices');
      },
    });
  }

  return (
    <Box>
      <SectionLabel>Sessions</SectionLabel>
      <CinemaCard hover={false} sx={{ p: 3 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: CIN.textMuted, mb: 1 }}>
          Devices currently signed in to your account.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Loader2
              style={{
                height: 20,
                width: 20,
                animation: 'spin 1s linear infinite',
                color: CIN.textMuted,
              }}
            />
          </Box>
        ) : isError ? (
          <Typography sx={{ py: 3, fontSize: '0.875rem', color: CIN.textMuted, textAlign: 'center' }}>
            Couldn&apos;t load your sessions. Please try again later.
          </Typography>
        ) : !sessions || sessions.length === 0 ? (
          <Typography sx={{ py: 3, fontSize: '0.875rem', color: CIN.textMuted, textAlign: 'center' }}>
            No active sessions found.
          </Typography>
        ) : (
          <Box>
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </Box>
        )}

        {otherCount > 0 && (
          <GlowButton
            type="button"
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            disabled={revokeAll.isPending}
            startIcon={<LogOut style={{ height: 16, width: 16 }} />}
            sx={{ mt: 2, ...dangerOutlineSx }}
          >
            Sign out all other devices
          </GlowButton>
        )}
      </CinemaCard>

      <MuiDialog
        open={confirmOpen}
        onClose={() => !revokeAll.isPending && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
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
              bgcolor: 'rgba(255,107,107,0.12)',
            }}
          >
            <LogOut style={{ height: 22, width: 22, color: CIN.danger }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, textAlign: 'center', color: CIN.text }}>
            Sign out all other devices?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: CIN.textMuted }}>
            {otherCount === 1
              ? 'This signs out 1 other device.'
              : `This signs out ${otherCount} other devices.`}{' '}
            You&apos;ll stay signed in here. Anyone using your account elsewhere will need to log
            in again.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <GlowButton
            type="button"
            onClick={handleRevokeAll}
            disabled={revokeAll.isPending}
            sx={{
              width: '100%',
              bgcolor: CIN.danger,
              color: '#0B0B0F',
              '&:hover': {
                bgcolor: CIN.danger,
                boxShadow: `0 0 0 1px ${CIN.danger}, 0 8px 32px rgba(255,107,107,0.35)`,
              },
            }}
          >
            {revokeAll.isPending ? 'Signing out...' : 'Sign out other devices'}
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={() => setConfirmOpen(false)}
            disabled={revokeAll.isPending}
            sx={{ width: '100%' }}
          >
            Cancel
          </GlowButton>
        </MuiDialogActions>
      </MuiDialog>
    </Box>
  );
}
