'use client';

import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, ArrowLeft, UserX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useBlockedUsers, useUnblockUser } from '@/lib/hooks/use-user';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN, displaySx } from '@/lib/design/cinema-tokens';
import { easeNative } from '@/lib/animations';
import { rowHoverSx } from '@/components/settings/cinema-settings';

interface BlockedEntry {
  id: string;
  user: { id: string; username: string; displayName: string | null; avatar: string | null };
}

function BlockedRow({ entry }: { entry: BlockedEntry }) {
  const unblock = useUnblockUser();
  return (
    <Box
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
        src={entry.user.avatar ?? null}
        username={entry.user.username}
        displayName={entry.user.displayName}
        size="md"
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: CIN.text }}>
          {entry.user.displayName || entry.user.username}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: CIN.textMuted }}>
          @{entry.user.username}
        </Typography>
      </Box>
      <GlowButton
        variant="ghost"
        size="small"
        onClick={() =>
          unblock.mutate(entry.user.id, {
            onSuccess: () => toast.success(`Unblocked @${entry.user.username}`),
            onError: () => toast.error('Could not unblock'),
          })
        }
        disabled={unblock.isPending}
        sx={{ flexShrink: 0, px: 1.5, py: 0.5, fontSize: '0.8125rem' }}
      >
        Unblock
      </GlowButton>
    </Box>
  );
}

export default function BlockedUsersPage() {
  const { data: blocked, isLoading } = useBlockedUsers();
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
        Blocked accounts
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: CIN.textMuted, mb: 3 }}>
        Blocked users can&apos;t see your content and don&apos;t appear in your feed, explore, or search.
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
        ) : !blocked || blocked.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: CIN.textMuted }}>
            <UserX size={32} style={{ marginInline: 'auto', opacity: 0.5 }} />
            <Typography sx={{ mt: 1.5, fontSize: '0.9rem' }}>
              You haven&apos;t blocked anyone.
            </Typography>
          </Box>
        ) : (
          <Box>
            {blocked.map((entry) => (
              <BlockedRow key={entry.id} entry={entry} />
            ))}
          </Box>
        )}
      </CinemaCard>
    </Box>
  );
}
