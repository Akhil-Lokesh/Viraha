'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  usePendingFollowRequests,
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from '@/lib/hooks/use-follows';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { FollowRequest } from '@/lib/api/follows';
import { KEEPSAKE, eyebrowSx, fadeUpItem } from './keepsake';

interface FollowRequestStampProps {
  request: FollowRequest;
  rotation: number;
}

/** A pending follow request styled as a passport entry stamp. */
function FollowRequestStamp({ request, rotation }: FollowRequestStampProps) {
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
        bgcolor: KEEPSAKE.paper,
        border: '1.5px solid',
        borderColor: KEEPSAKE.gold,
        borderRadius: '4px',
        transform: `rotate(${rotation}deg)`,
        boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.08)',
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
        <Typography variant="body2" sx={{ color: KEEPSAKE.ink }}>
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
        <Typography sx={{ ...eyebrowSx, fontSize: '10px', color: KEEPSAKE.gold }}>
          Entry requested
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Button
          variant="contained"
          size="small"
          disableElevation
          sx={{
            borderRadius: '4px',
            px: 2,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            bgcolor: KEEPSAKE.gold,
            color: '#221C18',
            '&:hover': { bgcolor: '#C39A38' },
          }}
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
        </Button>
        <Button
          variant="outlined"
          size="small"
          disableElevation
          sx={{
            borderRadius: '4px',
            px: 2,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: KEEPSAKE.ink,
            borderColor: KEEPSAKE.hairline,
            '&:hover': { borderColor: KEEPSAKE.ink, bgcolor: 'transparent' },
          }}
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
        </Button>
      </Box>
    </Box>
  );
}

/**
 * Pending follow requests rendered as a stack of passport stamps. Hidden
 * while loading, on error, or when empty — it is a supplementary panel above
 * the main feed and should not show its own error UI.
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
    <Box component={motion.div} variants={fadeUpItem} sx={{ mb: 4 }}>
      <Typography
        component="h2"
        sx={{ ...eyebrowSx, color: 'text.secondary', px: { xs: 2, md: 0 }, mb: 1.25 }}
      >
        Entry requests
        <Box component="span" sx={{ ml: 1, color: KEEPSAKE.gold }}>
          ({requests.length})
        </Box>
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, px: { xs: 2, md: 0 } }}>
        {requests.map((request, index) => (
          <FollowRequestStamp
            key={request.followId}
            request={request}
            rotation={index % 2 === 0 ? -0.8 : 0.8}
          />
        ))}
        {hasNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Button
              variant="text"
              disableElevation
              size="small"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              sx={{ color: KEEPSAKE.gold }}
            >
              {isFetchingNextPage ? (
                <Loader2
                  style={{ height: 16, width: 16, animation: 'spin 1s linear infinite', marginRight: 8 }}
                />
              ) : null}
              Load more requests
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
