'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Images } from 'lucide-react';
import { Box, Typography, Chip } from '@mui/material';
import type { Album } from '@/lib/types';
import { imageZoom } from '@/lib/animations';
import { UserAvatar } from '@/components/shared/user-avatar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function AlbumCard({ album }: { album: Album }) {
  const hasCover = !!album.coverImage;
  const coverUrl = album.coverImage ? resolveImageUrl(album.coverImage) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/albums/${album.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '4/3',
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: 'action.hover',
            transition: 'box-shadow 0.3s',
            '&:hover': {
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0,0,0,0.4)'
                  : '0 12px 40px rgba(0,0,0,0.12)',
            },
            '&:hover .album-img': { transform: 'scale(1.05)' },
          }}
        >
          {/* Cover image */}
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
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1A1035, #1F1530, #2D1F4E)'
                    : 'linear-gradient(135deg, #fff2e5, #faf8f5, #e7eaee)',
              }}
            >
              <Images
                style={{
                  width: 48,
                  height: 48,
                  color: 'rgba(var(--mui-palette-primary-mainChannel) / 0.3)',
                }}
              />
            </Box>
          )}

          {/* Gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.05) 70%, transparent)',
            }}
          />

          {/* Top-left: User avatar pill */}
          {album.user && (
            <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  bgcolor: 'rgba(0,0,0,0.4)',
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

          {/* Top-right: badges */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            {album.privacy !== 'public' && (
              <Box
                sx={{
                  bgcolor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '9999px',
                  p: 0.75,
                }}
              >
                <Lock style={{ width: 14, height: 14, color: '#fff' }} />
              </Box>
            )}
            <Chip
              label={`${album.postCount} ${album.postCount === 1 ? 'post' : 'posts'}`}
              size="small"
              sx={{
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.7rem',
                bgcolor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: 0,
                '& .MuiChip-label': { px: 1.25 },
              }}
            />
          </Box>

          {/* Bottom: Title + description */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              p: 2.5,
            }}
          >
            <Typography
              sx={{
                color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.15rem' },
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {album.title}
            </Typography>
            {album.description && (
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
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
        </Box>
      </Link>
    </motion.div>
  );
}
