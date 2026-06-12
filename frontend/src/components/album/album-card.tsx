'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import type { Album } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CinemaCard, PhotoTile } from '@/components/cinema';

/** Album card: 4:3 cover tile inside a CinemaCard, title over the vignette. */
export function AlbumCard({ album }: { album: Album }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Link
        href={`/albums/${album.id}`}
        aria-label={album.title}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        <CinemaCard>
          <PhotoTile
            src={album.coverImage ?? ''}
            alt={album.title}
            rounded={0}
            sx={{ aspectRatio: '4 / 3' }}
          >
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 1.5,
              }}
            >
              {/* Top row: owner chip + privacy lock indicator */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                {album.user ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      bgcolor: 'rgba(11,11,15,0.55)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
                      borderRadius: '9999px',
                      pl: 0.25,
                      pr: 1.25,
                      py: 0.25,
                      minWidth: 0,
                    }}
                  >
                    <UserAvatar
                      src={album.user.avatar}
                      username={album.user.username}
                      displayName={album.user.displayName}
                      size="sm"
                      link={false}
                      sx={{ outline: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <Typography
                      sx={{
                        color: 'var(--cin-text, #F4F4F6)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 100,
                      }}
                    >
                      {album.user.displayName || album.user.username}
                    </Typography>
                  </Box>
                ) : (
                  <Box />
                )}

                {album.privacy !== 'public' && (
                  <Box
                    aria-label="Private album"
                    sx={{
                      flexShrink: 0,
                      bgcolor: 'rgba(11,11,15,0.55)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
                      borderRadius: '9999px',
                      p: 0.75,
                      display: 'flex',
                    }}
                  >
                    <Lock style={{ width: 13, height: 13, color: 'var(--cin-text, #F4F4F6)' }} />
                  </Box>
                )}
              </Box>

              {/* Bottom: title over the vignette + muted post count */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: 'Posterama, var(--font-body)',
                    fontWeight: 700,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    lineHeight: 1.2,
                    color: '#FFFFFF',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {album.title}
                </Typography>
                {album.description && (
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.78rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mt: 0.5,
                    }}
                  >
                    {album.description}
                  </Typography>
                )}
                <Typography
                  sx={{
                    color: 'var(--cin-text-muted, #9A9AA6)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    mt: 0.75,
                  }}
                >
                  {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
                </Typography>
              </Box>
            </Box>
          </PhotoTile>
        </CinemaCard>
      </Link>
    </motion.div>
  );
}
