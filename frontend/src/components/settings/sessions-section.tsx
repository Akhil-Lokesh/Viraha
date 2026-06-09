'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { Loader2, MonitorSmartphone, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthSession } from '@/lib/types';
import { useSessions, useRevokeSession, useRevokeOtherSessions } from '@/lib/hooks/use-sessions';
import { describeUserAgent, formatLastUsed } from './session-utils';
import { SectionEyebrow } from './section-eyebrow';
import { paperPanelSx } from './paper-panel';

function CurrentDeviceStamp() {
  return (
    <Box
      component="span"
      data-testid="current-session-stamp"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        border: '1.5px solid',
        borderColor: 'var(--viraha-gold, #D4A843)',
        color: 'var(--viraha-gold, #D4A843)',
        borderRadius: '4px',
        transform: 'rotate(-2deg)',
        fontFamily: 'var(--font-brand, Posterama, sans-serif)',
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
        '& + &': { borderTop: '1px dashed', borderTopColor: 'divider' },
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
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          color: 'text.secondary',
        }}
      >
        <MonitorSmartphone style={{ height: 18, width: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
            {describeUserAgent(session.userAgent)}
          </Typography>
          {session.current && <CurrentDeviceStamp />}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {session.ip ? `${session.ip} · ` : ''}
          {session.current ? 'Active now' : formatLastUsed(session.lastUsedAt)}
        </Typography>
      </Box>
      {!session.current && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleRevoke}
          disabled={revoke.isPending}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', flexShrink: 0 }}
        >
          {revoke.isPending ? 'Signing out...' : 'Sign out'}
        </Button>
      )}
    </Box>
  );
}

/**
 * "Sessions" security section: lists signed-in devices, marks the current
 * one with a gold stamp, and offers per-session revoke plus a confirmed
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
      <SectionEyebrow gold>Sessions</SectionEyebrow>
      <Box sx={paperPanelSx}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1 }}>
          Devices currently signed in to your account.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Loader2
              style={{
                height: 20,
                width: 20,
                animation: 'spin 1s linear infinite',
                color: 'var(--mui-palette-text-secondary)',
              }}
            />
          </Box>
        ) : isError ? (
          <Typography sx={{ py: 3, fontSize: '0.875rem', color: 'text.secondary', textAlign: 'center' }}>
            Couldn&apos;t load your sessions. Please try again later.
          </Typography>
        ) : !sessions || sessions.length === 0 ? (
          <Typography sx={{ py: 3, fontSize: '0.875rem', color: 'text.secondary', textAlign: 'center' }}>
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
          <Button
            type="button"
            variant="outlined"
            color="error"
            disableElevation
            onClick={() => setConfirmOpen(true)}
            disabled={revokeAll.isPending}
            startIcon={<LogOut style={{ height: 16, width: 16 }} />}
            sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Sign out all other devices
          </Button>
        )}
      </Box>

      <MuiDialog
        open={confirmOpen}
        onClose={() => !revokeAll.isPending && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px' } }}
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
              border: '1.5px solid',
              borderColor: 'var(--viraha-gold, #D4A843)',
            }}
          >
            <LogOut style={{ height: 22, width: 22, color: 'var(--viraha-gold, #D4A843)' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Sign out all other devices?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
            {otherCount === 1
              ? 'This signs out 1 other device.'
              : `This signs out ${otherCount} other devices.`}{' '}
            You&apos;ll stay signed in here. Anyone using your account elsewhere will need to log
            in again.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            color="error"
            disableElevation
            onClick={handleRevokeAll}
            disabled={revokeAll.isPending}
            sx={{ width: '100%', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            {revokeAll.isPending ? 'Signing out...' : 'Sign out other devices'}
          </Button>
          <Button
            variant="text"
            disableElevation
            onClick={() => setConfirmOpen(false)}
            disabled={revokeAll.isPending}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Box>
  );
}
