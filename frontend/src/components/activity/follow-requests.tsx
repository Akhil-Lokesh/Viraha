'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  usePendingFollowRequests,
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from '@/lib/hooks/use-follows';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CinemaCard, GlowButton } from '@/components/cinema';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { staggerItem } from '@/lib/animations';
import type { FollowRequest } from '@/lib/api/follows';

const compactButtonSx = {
  px: 1.75,
  py: 0.5,
  fontSize: '0.78rem',
  minWidth: 76,
} as const;

interface FollowRequestRowProps {
  request: FollowRequest;
}

/** A pending follow request: quiet dark row with accept / decline actions. */
function FollowRequestRow({ request }: FollowRequestRowProps) {
  const accept = useAcceptFollowRequest();
  const reject = useRejectFollowRequest();
  const pending = accept.isPending || reject.isPending;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        '&:not(:first-of-type)': {
          borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
        },
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <UserAvatar
          src={request.avatar}
          username={request.username}
          displayName={request.displayName}
          size="sm"
          link
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: 'var(--cin-text, #F4F4F6)' }}>
          <Link
            href={`/profile/${request.username}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              component="span"
              sx={{ fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
            >
              {request.displayName || request.username}
            </Box>
          </Link>
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'var(--cin-text-muted, #9A9AA6)', display: 'block' }}
        >
          Requested to follow you
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <GlowButton
          variant="solid"
          size="small"
          sx={compactButtonSx}
          onClick={() => {
            accept.mutate(request.followId, {
              onSuccess: () => toast.success(`Accepted @${request.username}`),
              onError: () => toast.error('Could not accept request'),
            });
          }}
          disabled={pending}
        >
          {accept.isPending ? (
            <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite' }} />
          ) : (
            'Accept'
          )}
        </GlowButton>
        <GlowButton
          variant="ghost"
          size="small"
          sx={compactButtonSx}
          onClick={() => {
            reject.mutate(request.followId, {
              onSuccess: () => toast.success('Request declined'),
              onError: () => toast.error('Could not decline request'),
            });
          }}
          disabled={pending}
        >
          {reject.isPending ? (
            <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite' }} />
          ) : (
            'Decline'
          )}
        </GlowButton>
      </Box>
    </Box>
  );
}

/**
 * Pending follow requests in a dark cinema panel. Hidden while loading, on
 * error, or when empty — it is a supplementary panel above the main feed and
 * should not show its own error UI.
 */
export function FollowRequestsSection() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePendingFollowRequests();

  const requests = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  if (isLoading || isError || requests.length === 0) return null;

  return (
    <Box component={motion.div} variants={staggerItem} sx={{ mb: 4 }}>
      <CinemaCard hover={false}>
        <Typography
          component="h2"
          sx={{
            ...eyebrowSx,
            px: 2,
            pt: 2,
            pb: 1.25,
          }}
        >
          Follow requests
          <Box component="span" sx={{ ml: 1, color: CIN.accent }}>
            ({requests.length})
          </Box>
        </Typography>
        <Box
          sx={{
            borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          }}
        >
          {requests.map((request) => (
            <FollowRequestRow key={request.followId} request={request} />
          ))}
        </Box>
        {hasNextPage && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 1,
              borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
            }}
          >
            <GlowButton
              variant="ghost"
              size="small"
              sx={{ ...compactButtonSx, border: 'none' }}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2
                  style={{ height: 14, width: 14, animation: 'spin 1s linear infinite', marginRight: 8 }}
                />
              ) : null}
              Load more requests
            </GlowButton>
          </Box>
        )}
      </CinemaCard>
    </Box>
  );
}
