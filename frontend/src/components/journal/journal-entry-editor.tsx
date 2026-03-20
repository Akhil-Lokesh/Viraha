'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Calendar, Type, FileText } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import { useCreateEntry, useUpdateEntry } from '@/lib/hooks/use-journals';
import { uploadPhotos } from '@/lib/api/media';
import { PhotoUpload } from '@/components/post/photo-upload';
import { MoodSelector } from './mood-selector';
import { toast } from 'sonner';
import type { JournalEntry, CreateJournalEntryInput } from '@/lib/types';

interface Props {
  journalId: string;
  entry?: JournalEntry;
}

export function JournalEntryEditor({ journalId, entry }: Props) {
  const router = useRouter();
  const createEntry = useCreateEntry();
  const updateEntryMutation = useUpdateEntry();
  const isEditing = !!entry;

  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [date, setDate] = useState(entry?.date ? entry.date.slice(0, 10) : '');
  const [mood, setMood] = useState<string | undefined>(entry?.mood || undefined);
  const [locationName, setLocationName] = useState(entry?.locationName || '');
  const [locationCity, setLocationCity] = useState(entry?.locationCity || '');
  const [locationCountry, setLocationCountry] = useState(entry?.locationCountry || '');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const isPending = createEntry.isPending || updateEntryMutation.isPending || uploading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setUploading(true);
    try {
      let mediaUrls = entry?.mediaUrls || [];

      if (files.length > 0) {
        const { urls } = await uploadPhotos(files);
        mediaUrls = [...mediaUrls, ...urls];
      }

      const input: CreateJournalEntryInput = {
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        date: date || undefined,
        mood,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        locationName: locationName.trim() || undefined,
        locationCity: locationCity.trim() || undefined,
        locationCountry: locationCountry.trim() || undefined,
      };

      if (isEditing) {
        await updateEntryMutation.mutateAsync({
          journalId,
          entryId: entry.id,
          input,
        });
        toast.success('Entry updated!');
      } else {
        await createEntry.mutateAsync({ journalId, input });
        toast.success('Entry added!');
      }

      router.push(`/journals/${journalId}`);
    } catch {
      toast.error(isEditing ? 'Failed to update entry' : 'Failed to create entry');
    } finally {
      setUploading(false);
    }
  }

  const sectionSx = {
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    p: 3,
  };

  const sectionHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    mb: 2,
  };

  const iconBoxSx = (bgColor: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 2,
    bgcolor: bgColor,
  });

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={sectionSx}>
          <Box sx={sectionHeaderSx}>
            <Box sx={iconBoxSx('rgba(var(--mui-palette-primary-mainChannel) / 0.1)')}>
              <Type style={{ height: 16, width: 16, color: 'var(--mui-palette-primary-main)' }} />
            </Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Title & Date</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="title" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Title (optional)</FormLabel>
              <TextField
                id="title"
                placeholder="e.g. Arriving in Buenos Aires"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 200 } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="date" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Date</FormLabel>
              <TextField
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
              />
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Box sx={sectionSx}>
          <Box sx={sectionHeaderSx}>
            <Box sx={iconBoxSx('rgba(100,116,139,0.1)')}>
              <FileText style={{ height: 16, width: 16, color: '#64748b' }} />
            </Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Your Story</Typography>
          </Box>
          <TextField
            placeholder="Write about this part of your journey... (supports markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={10}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3, resize: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
          />
        </Box>
      </motion.div>

      {/* Photos */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Box sx={sectionSx}>
          <Box sx={sectionHeaderSx}>
            <Box sx={iconBoxSx('rgba(139,92,246,0.1)')}>
              <Calendar style={{ height: 16, width: 16, color: '#7c3aed' }} />
            </Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Photos</Typography>
          </Box>
          <PhotoUpload files={files} onChange={setFiles} />
        </Box>
      </motion.div>

      {/* Mood */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Box sx={sectionSx}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary', mb: 1.5 }}>
            How are you feeling?
          </Typography>
          <MoodSelector value={mood} onChange={setMood} />
        </Box>
      </motion.div>

      {/* Location */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Box sx={sectionSx}>
          <Box sx={sectionHeaderSx}>
            <Box sx={iconBoxSx('rgba(16,185,129,0.1)')}>
              <MapPin style={{ height: 16, width: 16, color: '#059669' }} />
            </Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Location</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <TextField
              placeholder="Location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
            />
            <TextField
              placeholder="City"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
            />
            <TextField
              placeholder="Country"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          type="submit"
          variant="contained"
          disableElevation
          sx={{ width: '100%', height: 48, borderRadius: 4 }}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite' }} />
              {uploading ? 'Uploading photos...' : 'Saving...'}
            </>
          ) : isEditing ? (
            'Update Entry'
          ) : (
            'Add Entry'
          )}
        </Button>
      </motion.div>
    </Box>
  );
}
