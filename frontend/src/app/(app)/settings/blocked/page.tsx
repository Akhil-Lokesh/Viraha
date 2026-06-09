'use client';

import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Loader2, ArrowLeft, UserX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useBlockedUsers, useUnblockUser } from '@/lib/hooks/use-user';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SectionEyebrow } from '@/components/settings/section-eyebrow';
import { paperPanelSx } from '@/components/settings/paper-panel';

function BlockedRow({ entry }: { entry: { id: string; user: { id: string; username: string; displayName: string | null; avatar: string | null } } }) {
  const unblock = useUnblockUser();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.75,
        '& + &': { borderTop: '1px dashed', borderTopColor: 'divider' },
      }}
    >
      <UserAvatar
        src={entry.user.avatar ?? null}
        username={entry.user.username}
        displayName={entry.user.displayName}
        size="md"
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {entry.user.displayName || entry.user.username}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          @{entry.user.username}
        </Typography>
      </Box>
      <Button
        size="small"
        variant="outlined"
        onClick={() =>
          unblock.mutate(entry.user.id, {
            onSuccess: () => toast.success(`Unblocked @${entry.user.username}`),
            onError: () => toast.error('Could not unblock'),
          })
        }
        disabled={unblock.isPending}
        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
      >
        Unblock
      </Button>
    </Box>
  );
}

export default function BlockedUsersPage() {
  const { data: blocked, isLoading } = useBlockedUsers();

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
        Blocked accounts
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 3 }}>
        Blocked users can&apos;t see your content and don&apos;t appear in your feed, explore, or search.
      </Typography>

      <Box sx={paperPanelSx}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <Loader2 style={{ height: 20, width: 20, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
          </Box>
        ) : !blocked || blocked.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <UserX size={32} style={{ marginInline: 'auto', opacity: 0.5 }} />
            <Typography sx={{ mt: 1.5, fontSize: '0.9rem' }}>You haven&apos;t blocked anyone.</Typography>
          </Box>
        ) : (
          <Box>
            {blocked.map((entry) => (
              <BlockedRow key={entry.id} entry={entry} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
