'use client';

import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, ArrowLeft, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { MutedUser } from '@/lib/types';
import { useMutedUsers, useUnmuteUser } from '@/lib/hooks/use-mutes';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN, displaySx } from '@/lib/design/cinema-tokens';
import { easeNative } from '@/lib/animations';
import { rowHoverSx } from '@/components/settings/cinema-settings';

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
        px: 1,
        mx: -1,
        '& + &': { borderTop: `1px solid ${CIN.hairline}` },
        ...rowHoverSx,
      }}
    >
      <UserAvatar
        src={user.avatar ?? null}
        username={user.username}
        displayName={user.displayName}
        size="md"
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: CIN.text }}>
          {user.displayName || user.username}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: CIN.textMuted }}>
          @{user.username}
        </Typography>
      </Box>
      <GlowButton
        variant="ghost"
        size="small"
        onClick={() =>
          unmute.mutate(user.username, {
            onSuccess: () => toast.success(`Unmuted @${user.username}`),
            onError: () => toast.error('Could not unmute'),
          })
        }
        disabled={unmute.isPending}
        sx={{ flexShrink: 0, px: 1.5, py: 0.5, fontSize: '0.8125rem' }}
      >
        Unmute
      </GlowButton>
    </Box>
  );
}

export default function MutedUsersPage() {
  const { data: muted, isLoading } = useMutedUsers();
  const reduceMotion = useReducedMotion();

  return (
    <Box
      component={motion.div}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeNative }}
      sx={{ maxWidth: 640, mx: 'auto', py: { xs: 2, md: 4 } }}
    >
      <Box
        component={Link}
        href="/settings?tab=privacy"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          fontSize: '0.875rem',
          color: CIN.textMuted,
          textDecoration: 'none',
          mb: 2,
          transition: 'color .2s ease',
          '&:hover': { color: CIN.text },
        }}
      >
        <ArrowLeft size={16} />
        Back to settings
      </Box>
      <SectionLabel>Privacy</SectionLabel>
      <Typography component="h1" sx={{ ...displaySx, fontSize: '1.75rem', mb: 0.5 }}>
        Muted accounts
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: CIN.textMuted, mb: 3 }}>
        Muted users won&apos;t appear in your feed or explore. They aren&apos;t notified, can still
        see your content, and can still follow you.
      </Typography>

      <CinemaCard hover={false} sx={{ p: 2.5 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <Loader2
              style={{
                height: 20,
                width: 20,
                animation: 'spin 1s linear infinite',
                color: CIN.textMuted,
              }}
            />
          </Box>
        ) : !muted || muted.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: CIN.textMuted }}>
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
      </CinemaCard>
    </Box>
  );
}
