'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Drawer, IconButton, Skeleton, TextField } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { X, MapPin, BookOpen, Camera, Calendar, Heart, Edit3, Check } from 'lucide-react';
import { usePlaceHistory, useUpsertPlaceNote } from '@/lib/hooks/use-viraha';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { PhotoTile } from '@/components/cinema';

interface PlaceHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
}

const sectionLabelSx = { ...eyebrowSx, fontWeight: 700 } as const;

function HistoryRow({
  href,
  image,
  imageAlt,
  children,
}: {
  href: string;
  image: string | null;
  imageAlt: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.div whileHover={reduceMotion ? undefined : { x: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1,
            borderRadius: '10px',
            border: '1px solid transparent',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.04)',
              borderColor: CIN.hairline,
            },
          }}
        >
          {image && (
            <PhotoTile
              src={image}
              alt={imageAlt}
              rounded={8}
              vignette={false}
              sx={{ width: 64, height: 64, flexShrink: 0 }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </Box>
      </motion.div>
    </Link>
  );
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

  const handleSaveNote = useCallback(async () => {
    if (!lat || !lng) return;
    try {
      await upsertNote.mutateAsync({
        locationLat: lat,
        locationLng: lng,
        locationName: locationName || undefined,
        note: noteText,
      });
      setEditingNote(false);
      toast.success('Note saved');
    } catch (err: unknown) {
      // Keep the editor open so the user does not lose their text on failure.
      const message = err instanceof Error ? err.message : 'Could not save note';
      toast.error(message);
    }
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
          bgcolor: CIN.bg,
          backgroundImage: 'none',
          borderLeft: `1px solid ${CIN.hairline}`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${CIN.hairline}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <MapPin style={{ width: 18, height: 18, color: CIN.accent, flexShrink: 0 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 700, fontSize: '1.1rem', color: CIN.text }}
            >
              {locationName || 'This Place'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close place history"
            sx={{ color: CIN.textMuted, '&:hover': { color: CIN.text, bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <X style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>

        {/* Stats */}
        {history && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
            {history.stats.firstVisit && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar style={{ width: 12, height: 12, color: CIN.accent, opacity: 0.8 }} />
                <Typography suppressHydrationWarning sx={{ fontSize: '11px', color: CIN.textMuted }}>
                  First visit: {format(new Date(history.stats.firstVisit), 'MMM d, yyyy')}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Heart style={{ width: 12, height: 12, color: CIN.accent, opacity: 0.8 }} />
              <Typography sx={{ fontSize: '11px', color: CIN.textMuted }}>
                <Box component="span" sx={{ color: CIN.accent, fontWeight: 700 }}>
                  {history.stats.totalVisits}
                </Box>{' '}
                {history.stats.totalVisits === 1 ? 'memory' : 'memories'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {/* Private Place Note */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={sectionLabelSx}>
                Private Note
              </Typography>
              {!editingNote && (
                <IconButton
                  size="small"
                  onClick={handleEditNote}
                  aria-label="Edit private note"
                  sx={{
                    width: 24,
                    height: 24,
                    color: CIN.textMuted,
                    '&:hover': { color: CIN.accent, bgcolor: 'rgba(139,124,255,0.12)' },
                  }}
                >
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
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '13px',
                      bgcolor: CIN.surface,
                      color: CIN.text,
                    },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: CIN.hairline },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(139,124,255,0.45)' },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: CIN.accent },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSaveNote}
                  disabled={upsertNote.isPending}
                  sx={{
                    alignSelf: 'flex-end',
                    color: CIN.accent,
                    '&:hover': { bgcolor: 'rgba(139,124,255,0.12)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.18)' },
                  }}
                  aria-label="Save note"
                >
                  <Check style={{ width: 16, height: 16 }} />
                </IconButton>
              </Box>
            ) : history?.placeNote ? (
              <Typography sx={{ fontSize: '13px', color: CIN.text, fontStyle: 'italic', lineHeight: 1.5 }}>
                &ldquo;{history.placeNote.note}&rdquo;
              </Typography>
            ) : (
              <Typography
                component="button"
                onClick={handleEditNote}
                sx={{
                  fontSize: '12px',
                  color: CIN.textMuted,
                  cursor: 'pointer',
                  border: 'none',
                  bgcolor: 'transparent',
                  p: 0,
                  transition: 'color 0.15s ease',
                  '&:hover': { color: CIN.accent },
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
                <Camera style={{ width: 14, height: 14, color: CIN.accent, opacity: 0.8 }} />
                <Typography sx={sectionLabelSx}>
                  Posts ({history.posts.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {history.posts.map((post) => {
                  const image = post.mediaThumbnails[0] || post.mediaUrls[0] || null;
                  return (
                    <HistoryRow
                      key={post.id}
                      href={`/post/${post.id}`}
                      image={image}
                      imageAlt={post.caption || 'Post photo'}
                    >
                      {post.caption && (
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: CIN.text, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {post.caption}
                        </Typography>
                      )}
                      <Typography suppressHydrationWarning sx={{ fontSize: '11px', color: CIN.textMuted, mt: 0.5 }}>
                        {format(new Date(post.postedAt), 'MMM d, yyyy')}
                      </Typography>
                    </HistoryRow>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Journal Entries */}
          {history && history.journalEntries.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <BookOpen style={{ width: 14, height: 14, color: CIN.accent, opacity: 0.8 }} />
                <Typography sx={sectionLabelSx}>
                  Journal Entries ({history.journalEntries.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {history.journalEntries.map((entry) => {
                  const image = entry.mediaUrls[0] || null;
                  return (
                    <HistoryRow
                      key={entry.id}
                      href={`/journals/${entry.journalId}`}
                      image={image}
                      imageAlt={entry.title || 'Journal entry photo'}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: CIN.accent,
                            boxShadow: `0 0 6px ${CIN.accentGlow}`,
                          }}
                        />
                        <Typography sx={{ ...eyebrowSx, fontSize: 10, fontWeight: 700, color: CIN.accent }}>
                          Journal
                        </Typography>
                      </Box>
                      {entry.title && (
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: CIN.text, lineHeight: 1.3 }}>
                          {entry.title}
                        </Typography>
                      )}
                      {entry.contentPreview && (
                        <Typography sx={{ fontSize: '12px', color: CIN.textMuted, lineHeight: 1.4, mt: 0.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {entry.contentPreview}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {entry.date && (
                          <Typography suppressHydrationWarning sx={{ fontSize: '11px', color: CIN.textMuted }}>
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </Typography>
                        )}
                        {entry.mood && (
                          <Typography sx={{ fontSize: '11px', color: CIN.text }}>
                            {entry.mood}
                          </Typography>
                        )}
                      </Box>
                    </HistoryRow>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Empty state */}
          {history && history.stats.totalVisits === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: CIN.textMuted }}>
              <MapPin style={{ width: 32, height: 32, opacity: 0.35, margin: '0 auto' }} />
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
