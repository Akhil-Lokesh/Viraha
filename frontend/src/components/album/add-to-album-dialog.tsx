'use client';

import { useState } from 'react';
import axios from 'axios';
import { Loader2, Plus, Check, Images } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { useAlbums, useAddPostToAlbum, useRemovePostFromAlbum } from '@/lib/hooks/use-albums';
import type { Album } from '@/lib/types';
import { GlowButton } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';

interface AddToAlbumDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getAlbumActionError(error: unknown, wasInAlbum: boolean): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 409) {
      return 'This post is already in that album.';
    }
    const serverMessage = error.response?.data?.error?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage;
    }
  }
  return wasInAlbum
    ? 'Could not remove post from album. Please try again.'
    : 'Could not add post to album. Please try again.';
}

export function AddToAlbumDialog({ postId, open, onOpenChange }: AddToAlbumDialogProps) {
  const { data, isLoading } = useAlbums();
  const addPost = useAddPostToAlbum();
  const removePost = useRemovePostFromAlbum();

  const [pendingAlbumId, setPendingAlbumId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const albums = data?.pages.flatMap((page) => page.items) ?? [];

  const isPostInAlbum = (album: Album): boolean => {
    if (!album.albumPosts) return false;
    return album.albumPosts.some((ap) => ap.postId === postId);
  };

  const handleToggle = async (album: Album) => {
    setPendingAlbumId(album.id);
    setActionError(null);
    const wasInAlbum = isPostInAlbum(album);
    try {
      if (wasInAlbum) {
        await removePost.mutateAsync({ albumId: album.id, postId });
      } else {
        await addPost.mutateAsync({ albumId: album.id, postId });
      }
    } catch (error: unknown) {
      // Surface the failure (including a backend 409) to the user instead of
      // silently swallowing it.
      setActionError(getAlbumActionError(error, wasInAlbum));
    } finally {
      setPendingAlbumId(null);
    }
  };

  return (
    <MuiDialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: CIN.surface,
          backgroundImage: 'none',
          border: `1px solid ${CIN.hairline}`,
        },
      }}
    >
      <MuiDialogContent sx={{ pt: 2 }}>
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontFamily: 'Posterama, var(--font-body)', fontWeight: 700, color: CIN.text }}
          >
            Add to Album
          </Typography>
          <Typography variant="body2" sx={{ color: CIN.textMuted, mt: 0.5 }}>
            Select an album to add this post to.
          </Typography>
        </Box>

        {actionError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Typography role="alert" variant="body2" sx={{ color: CIN.danger, fontSize: '0.8125rem' }}>
              {actionError}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: CIN.textMuted }} />
            </Box>
          ) : albums.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, textAlign: 'center' }}>
              <Images style={{ width: 40, height: 40, color: CIN.textMuted, marginBottom: 12 }} />
              <Typography sx={{ fontSize: '0.875rem', color: CIN.textMuted, mb: 1.5 }}>
                You have no albums yet.
              </Typography>
              <GlowButton
                variant="ghost"
                size="small"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/create/album';
                }}
              >
                <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                Create Album
              </GlowButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {albums.map((album) => {
                const inAlbum = isPostInAlbum(album);
                const isPending = pendingAlbumId === album.id;

                return (
                  <Box
                    key={album.id}
                    component="button"
                    type="button"
                    onClick={() => handleToggle(album)}
                    disabled={isPending}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      borderRadius: '10px',
                      px: 1.5,
                      py: 1.25,
                      textAlign: 'left',
                      bgcolor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, transform 0.2s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', transform: 'translateX(2px)' },
                      '&:disabled': { opacity: 0.5 },
                      '@media (prefers-reduced-motion: reduce)': {
                        '&:hover': { transform: 'none' },
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: CIN.text,
                        }}
                      >
                        {album.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: CIN.textMuted }}>
                        {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
                      </Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      {isPending ? (
                        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: CIN.textMuted }} />
                      ) : inAlbum ? (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '6px',
                            bgcolor: CIN.accent,
                            boxShadow: `0 0 12px ${CIN.accentGlow}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check style={{ width: 14, height: 14, color: '#0B0B0F' }} />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </MuiDialogContent>
    </MuiDialog>
  );
}
