'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Images } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import type { Album } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const GOLD = 'var(--viraha-gold, #D4A843)';

/** Subtle paper-grain texture, no asset files. */
const grain =
  'repeating-linear-gradient(0deg, rgba(34,28,24,0.02) 0px, rgba(34,28,24,0.02) 1px, transparent 1px, transparent 3px)';

export function AlbumCard({ album }: { album: Album }) {
  const hasCover = !!album.coverImage;
  const coverUrl = album.coverImage ? resolveImageUrl(album.coverImage) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, rotate: -0.6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <Link href={`/albums/${album.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        {/* Stack wrapper — leaves room for the photos peeking out underneath */}
        <Box sx={{ position: 'relative', pt: '10px', px: '8px' }}>
          {/* Photo stack: two layered prints behind the top photo */}
          <Box
            aria-hidden
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              left: 14,
              right: 14,
              height: '60%',
              transform: 'rotate(-2.5deg)',
              borderRadius: '4px',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.16)' : 'rgba(34,28,24,0.16)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'var(--viraha-paper-dark, #1D1828)'
                  : 'var(--viraha-paper, #FAF6EE)',
              backgroundImage: grain,
            })}
          />
          <Box
            aria-hidden
            sx={(theme) => ({
              position: 'absolute',
              top: 4,
              left: 10,
              right: 10,
              height: '60%',
              transform: 'rotate(1.8deg)',
              borderRadius: '4px',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.2)' : 'rgba(34,28,24,0.2)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'var(--viraha-paper-dark, #221C30)'
                  : '#FFFDF6',
              backgroundImage: grain,
            })}
          />

          {/* Top photo — polaroid: image + thick paper bottom */}
          <Box
            sx={(theme) => ({
              position: 'relative',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.22)' : 'rgba(34,28,24,0.25)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'var(--viraha-paper-dark, #1D1828)'
                  : '#FFFDF6',
              backgroundImage: grain,
              boxShadow: '3px 3px 0 rgba(34,28,24,0.12)',
              transition: 'box-shadow 0.3s',
              '&:hover': { boxShadow: '4px 5px 0 rgba(34,28,24,0.16)' },
              '&:hover .album-img': { transform: 'scale(1.04)' },
            })}
          >
            {/* Photo area */}
            <Box sx={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', m: '8px', mb: 0, borderRadius: '2px' }}>
              {hasCover && coverUrl ? (
                <Box
                  component="img"
                  className="album-img"
                  src={coverUrl}
                  alt={album.title}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s',
                  }}
                />
              ) : (
                <Box
                  sx={(theme) => ({
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed',
                    borderColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(242,234,217,0.25)'
                        : 'rgba(34,28,24,0.25)',
                    borderRadius: '2px',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(212,168,67,0.05)'
                        : 'rgba(212,168,67,0.08)',
                  })}
                >
                  <Images style={{ width: 40, height: 40, color: GOLD, opacity: 0.55 }} />
                </Box>
              )}

              {/* Top-left: User avatar pill */}
              {album.user && (
                <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      bgcolor: 'rgba(20,16,12,0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '9999px',
                      pl: 0.25,
                      pr: 1.5,
                      py: 0.25,
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
                        color: '#fff',
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
                </Box>
              )}

              {/* Top-right: privacy */}
              {album.privacy !== 'public' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    bgcolor: 'rgba(20,16,12,0.5)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '9999px',
                    p: 0.75,
                    display: 'flex',
                  }}
                >
                  <Lock style={{ width: 14, height: 14, color: '#fff' }} />
                </Box>
              )}
            </Box>

            {/* Polaroid bottom: title + count stamp */}
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={(theme) => ({
                    fontFamily: 'var(--font-accent)',
                    fontSize: { xs: '1.15rem', md: '1.3rem' },
                    lineHeight: 1.2,
                    color:
                      theme.palette.mode === 'dark'
                        ? 'var(--viraha-ink-dark, #F2EAD9)'
                        : 'var(--viraha-ink, #221C18)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  })}
                >
                  {album.title}
                </Typography>
                {album.description && (
                  <Typography
                    sx={{
                      color: 'text.secondary',
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
              </Box>

              {/* Post count — passport stamp chip */}
              <Box
                sx={{
                  flexShrink: 0,
                  transform: 'rotate(2deg)',
                  border: `1.5px solid ${GOLD}`,
                  color: GOLD,
                  borderRadius: '4px',
                  px: 1,
                  py: 0.4,
                  fontFamily: 'var(--font-brand)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  mt: 0.25,
                }}
              >
                {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
              </Box>
            </Box>
          </Box>
        </Box>
      </Link>
    </motion.div>
  );
}
