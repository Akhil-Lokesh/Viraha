'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Calendar, Type, FileText } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import { useCreateEntry, useUpdateEntry } from '@/lib/hooks/use-journals';
import { uploadPhotos } from '@/lib/api/media';
import { PhotoUpload } from '@/components/post/photo-upload';
import { GlowButton } from '@/components/cinema';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { MoodSelector } from './mood-selector';
import { toast } from 'sonner';
import type { JournalEntry, CreateJournalEntryInput } from '@/lib/types';

interface Props {
  journalId: string;
  entry?: JournalEntry;
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: 'var(--cin-surface-2, #1C1C24)',
    color: CIN.text,
    '& fieldset': { borderColor: CIN.hairline },
    '&:hover fieldset': { borderColor: 'rgba(139,124,255,0.4)' },
    '&.Mui-focused fieldset': { borderColor: CIN.accent },
  },
} as const;

const labelSx = { ...eyebrowSx, display: 'flex', alignItems: 'center', gap: 0.5, userSelect: 'none' } as const;

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
    borderRadius: '16px',
    border: `1px solid ${CIN.hairline}`,
    bgcolor: 'var(--cin-surface, #141419)',
    p: 3,
  };

  const sectionHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    mb: 2,
  };

  const iconBoxSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '8px',
    bgcolor: 'rgba(139,124,255,0.12)',
  };

  const iconStyle = { height: 16, width: 16, color: CIN.accent };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={sectionSx}>
          <Box sx={sectionHeaderSx}>
            <Box sx={iconBoxSx}>
              <Type style={iconStyle} />
            </Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: CIN.text }}>Title & Date</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="title" sx={labelSx}>Title (optional)</FormLabel>
              <TextField
                id="title"
                placeholder="e.g. Arriving in Buenos Aires"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 200 } }}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="date" sx={labelSx}>Date</FormLabel>
              <TextField
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                sx={inputSx}
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
            <Box sx={iconBoxSx}>
              <FileText style={iconStyle} />
            </Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: CIN.text }}>Your Story</Typography>
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
            sx={{ ...inputSx, resize: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
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
            <Box sx={iconBoxSx}>
              <Calendar style={iconStyle} />
            </Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: CIN.text }}>Photos</Typography>
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
          <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>
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
            <Box sx={iconBoxSx}>
              <MapPin style={iconStyle} />
            </Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: CIN.text }}>Location</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <TextField
              placeholder="Location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
            />
            <TextField
              placeholder="City"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
            />
            <TextField
              placeholder="Country"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
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
        <GlowButton
          type="submit"
          sx={{ width: '100%', height: 48 }}
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
        </GlowButton>
      </motion.div>
    </Box>
  );
}
