'use client';

import { useState } from 'react';
import { Loader2, Plus, Check, Images } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { useAlbums, useAddPostToAlbum, useRemovePostFromAlbum } from '@/lib/hooks/use-albums';
import type { Album } from '@/lib/types';
import Button from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';

interface AddToAlbumDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToAlbumDialog({ postId, open, onOpenChange }: AddToAlbumDialogProps) {
  const { data, isLoading } = useAlbums();
  const addPost = useAddPostToAlbum();
  const removePost = useRemovePostFromAlbum();

  const [pendingAlbumId, setPendingAlbumId] = useState<string | null>(null);

  const albums = data?.pages.flatMap((page) => page.items) ?? [];

  const isPostInAlbum = (album: Album): boolean => {
    if (!album.albumPosts) return false;
    return album.albumPosts.some((ap) => ap.postId === postId);
  };

  const handleToggle = async (album: Album) => {
    setPendingAlbumId(album.id);
    try {
      if (isPostInAlbum(album)) {
        await removePost.mutateAsync({ albumId: album.id, postId });
      } else {
        await addPost.mutateAsync({ albumId: album.id, postId });
      }
    } catch {
      // Error handled by React Query
    } finally {
      setPendingAlbumId(null);
    }
  };

  return (
    <MuiDialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <MuiDialogContent sx={{ pt: 2 }}>
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>Add to Album</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select an album to add this post to.
          </Typography>
        </Box>

        <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
            </Box>
          ) : albums.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, textAlign: 'center' }}>
              <Images style={{ width: 40, height: 40, color: 'var(--mui-palette-text-secondary)', marginBottom: 12 }} />
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1.5 }}>
                You have no albums yet.
              </Typography>
              <Button
                variant="outlined"
                disableElevation
                size="small"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/create/album';
                }}
              >
                <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                Create Album
              </Button>
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
                      borderRadius: 2,
                      px: 1.5,
                      py: 1.25,
                      textAlign: 'left',
                      bgcolor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:disabled': { opacity: 0.5 },
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
                          color: 'text.primary',
                        }}
                      >
                        {album.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {album.postCount} {album.postCount === 1 ? 'post' : 'posts'}
                      </Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      {isPending ? (
                        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: 'var(--mui-palette-text-secondary)' }} />
                      ) : inAlbum ? (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check style={{ width: 14, height: 14, color: 'var(--mui-palette-primary-contrastText)' }} />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
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
