'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import { useCreateAlbum } from '@/lib/hooks/use-albums';
import { GlowButton } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { darkFieldSx, fieldLabelSx } from './album-field-sx';
import { fadeInUp } from '@/lib/animations';

export function CreateAlbumForm() {
  const router = useRouter();
  const createAlbum = useCreateAlbum();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const album = await createAlbum.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        privacy,
      });
      router.push(`/albums/${album.id}`);
    } catch {
      // Error is handled by React Query
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Title */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="title" sx={fieldLabelSx}>Title</FormLabel>
        <TextField
          id="title"
          placeholder="e.g. Summer in Japan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          variant="outlined"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 100 } }}
          sx={darkFieldSx}
        />
      </Box>

      {/* Description */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="description" sx={fieldLabelSx}>Description (optional)</FormLabel>
        <TextField
          id="description"
          placeholder="What is this album about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          variant="outlined"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 500 } }}
          sx={darkFieldSx}
        />
      </Box>

      {/* Privacy */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="privacy" sx={fieldLabelSx}>Privacy</FormLabel>
        <TextField
          select
          id="privacy"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          size="small"
          fullWidth
          sx={darkFieldSx}
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="followers">Followers only</MenuItem>
          <MenuItem value="private">Private</MenuItem>
        </TextField>
      </Box>

      {/* Error */}
      {createAlbum.isError && (
        <Typography role="alert" sx={{ fontSize: '0.875rem', color: CIN.danger }}>
          Failed to create album. Please try again.
        </Typography>
      )}

      {/* Submit */}
      <GlowButton
        type="submit"
        variant="solid"
        sx={{ width: '100%' }}
        size="large"
        disabled={!title.trim() || createAlbum.isPending}
      >
        {createAlbum.isPending ? (
          <>
            <Loader2 style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite' }} />
            Creating...
          </>
        ) : (
          'Create Album'
        )}
      </GlowButton>
    </motion.form>
  );
}
