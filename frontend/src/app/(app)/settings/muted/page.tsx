'use client';

import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Loader2, ArrowLeft, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { MutedUser } from '@/lib/types';
import { useMutedUsers, useUnmuteUser } from '@/lib/hooks/use-mutes';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SectionEyebrow } from '@/components/settings/section-eyebrow';
import { paperPanelSx } from '@/components/settings/paper-panel';

function MutedRow({ user }: { user: MutedUser }) {
  const unmute = useUnmuteUser();
  return (
    <Box
      data-testid="muted-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.75,
        '& + &': { borderTop: '1px dashed', borderTopColor: 'divider' },
      }}
    >
      <UserAvatar
        src={user.avatar ?? null}
        username={user.username}
        displayName={user.displayName}
        size="md"
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {user.displayName || user.username}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          @{user.username}
        </Typography>
      </Box>
      <Button
        size="small"
        variant="outlined"
        onClick={() =>
          unmute.mutate(user.username, {
            onSuccess: () => toast.success(`Unmuted @${user.username}`),
            onError: () => toast.error('Could not unmute'),
          })
        }
        disabled={unmute.isPending}
        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
      >
        Unmute
      </Button>
    </Box>
  );
}

export default function MutedUsersPage() {
  const { data: muted, isLoading } = useMutedUsers();

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: { xs: 2, md: 4 } }}>
      <Box
        component={Link}
        href="/settings?tab=privacy"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          fontSize: '0.875rem',
          color: 'text.secondary',
          textDecoration: 'none',
          mb: 2,
          '&:hover': { color: 'text.primary' },
        }}
      >
        <ArrowLeft size={16} />
        Back to settings
      </Box>
      <SectionEyebrow gold>Privacy</SectionEyebrow>
      <Typography
        sx={{ fontFamily: 'var(--font-accent, serif)', fontSize: '1.75rem', fontWeight: 700, mb: 0.5 }}
      >
        Muted accounts
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 3 }}>
        Muted users won&apos;t appear in your feed or explore. They aren&apos;t notified, can still
        see your content, and can still follow you.
      </Typography>

      <Box sx={paperPanelSx}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <Loader2
              style={{
                height: 20,
                width: 20,
                animation: 'spin 1s linear infinite',
                color: 'var(--mui-palette-text-secondary)',
              }}
            />
          </Box>
        ) : !muted || muted.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <VolumeX size={32} style={{ marginInline: 'auto', opacity: 0.5 }} />
            <Typography sx={{ mt: 1.5, fontSize: '0.9rem' }}>
              You haven&apos;t muted anyone — your feed is unfiltered.
            </Typography>
          </Box>
        ) : (
          <Box>
            {muted.map((user) => (
              <MutedRow key={user.id} user={user} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
