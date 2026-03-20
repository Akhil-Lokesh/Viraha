'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Drawer, IconButton, Skeleton, TextField } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { X, MapPin, BookOpen, Camera, Calendar, Heart, Edit3, Check } from 'lucide-react';
import { usePlaceHistory, useUpsertPlaceNote } from '@/lib/hooks/use-viraha';
import { format } from 'date-fns';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface PlaceHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
}

export function PlaceHistoryDrawer({ open, onClose, lat, lng, locationName }: PlaceHistoryDrawerProps) {
  const { data: history, isLoading } = usePlaceHistory(open ? lat : null, open ? lng : null);
  const upsertNote = useUpsertPlaceNote();

  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleEditNote = useCallback(() => {
    setNoteText(history?.placeNote?.note || '');
    setEditingNote(true);
  }, [history?.placeNote?.note]);

  const handleSaveNote = useCallback(() => {
    if (!lat || !lng) return;
    upsertNote.mutate({
      locationLat: lat,
      locationLng: lng,
      locationName: locationName || undefined,
      note: noteText,
    });
    setEditingNote(false);
  }, [lat, lng, locationName, noteText, upsertNote]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 400 },
          maxWidth: '100vw',
          bgcolor: 'background.default',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin style={{ width: 18, height: 18 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {locationName || 'This Place'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>

        {/* Stats */}
        {history && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
            {history.stats.firstVisit && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar style={{ width: 12, height: 12, opacity: 0.5 }} />
                <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                  First visit: {format(new Date(history.stats.firstVisit), 'MMM d, yyyy')}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Heart style={{ width: 12, height: 12, opacity: 0.5 }} />
              <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                {history.stats.totalVisits} {history.stats.totalVisits === 1 ? 'memory' : 'memories'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '12px' }} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {/* Private Place Note */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
                Private Note
              </Typography>
              {!editingNote && (
                <IconButton size="small" onClick={handleEditNote} sx={{ width: 24, height: 24 }}>
                  <Edit3 style={{ width: 12, height: 12 }} />
                </IconButton>
              )}
            </Box>
            {editingNote ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="What does this place mean to you?"
                  sx={{ '& .MuiInputBase-root': { fontSize: '13px' } }}
                />
                <IconButton size="small" onClick={handleSaveNote} color="primary" sx={{ alignSelf: 'flex-end' }}>
                  <Check style={{ width: 16, height: 16 }} />
                </IconButton>
              </Box>
            ) : history?.placeNote ? (
              <Typography sx={{ fontSize: '13px', color: 'text.primary', fontStyle: 'italic', lineHeight: 1.5 }}>
                &ldquo;{history.placeNote.note}&rdquo;
              </Typography>
            ) : (
              <Typography
                component="button"
                onClick={handleEditNote}
                sx={{
                  fontSize: '12px',
                  color: 'text.disabled',
                  cursor: 'pointer',
                  border: 'none',
                  bgcolor: 'transparent',
                  p: 0,
                  '&:hover': { color: 'text.secondary' },
                }}
              >
                Write what this place means to you...
              </Typography>
            )}
          </Box>

          {/* Posts */}
          {history && history.posts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <Camera style={{ width: 14, height: 14, opacity: 0.6 }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
                  Posts ({history.posts.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {history.posts.map((post) => {
                  const image = post.mediaThumbnails[0] || post.mediaUrls[0];
                  return (
                    <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 1,
                          borderRadius: '10px',
                          transition: 'background 0.2s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {image && (
                          <Box sx={{ width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                            <Image src={resolveImageUrl(image)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {post.caption && (
                            <Typography sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {post.caption}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: '11px', color: 'text.secondary', mt: 0.5 }}>
                            {format(new Date(post.postedAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    </Link>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Journal Entries */}
          {history && history.journalEntries.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <BookOpen style={{ width: 14, height: 14, opacity: 0.6 }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
                  Journal Entries ({history.journalEntries.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {history.journalEntries.map((entry) => {
                  const image = entry.mediaUrls[0];
                  return (
                    <Link key={entry.id} href={`/journals/${entry.journalId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 1,
                          borderRadius: '10px',
                          transition: 'background 0.2s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {image && (
                          <Box sx={{ width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                            <Image src={resolveImageUrl(image)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#8B5CF6' }} />
                            <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase' }}>
                              Journal
                            </Typography>
                          </Box>
                          {entry.title && (
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
                              {entry.title}
                            </Typography>
                          )}
                          {entry.contentPreview && (
                            <Typography sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4, mt: 0.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {entry.contentPreview}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {entry.date && (
                              <Typography sx={{ fontSize: '11px', color: 'text.disabled' }}>
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </Typography>
                            )}
                            {entry.mood && (
                              <Typography sx={{ fontSize: '11px' }}>
                                {entry.mood}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Link>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Empty state */}
          {history && history.stats.totalVisits === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <MapPin style={{ width: 32, height: 32, opacity: 0.3, margin: '0 auto' }} />
              <Typography sx={{ mt: 1, fontSize: '13px' }}>
                No memories here yet
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
}
