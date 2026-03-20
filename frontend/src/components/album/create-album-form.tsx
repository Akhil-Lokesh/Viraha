'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import { useCreateAlbum } from '@/lib/hooks/use-albums';
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
        <FormLabel htmlFor="title" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Title</FormLabel>
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
        />
      </Box>

      {/* Description */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="description" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Description (optional)</FormLabel>
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
        />
      </Box>

      {/* Privacy */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="privacy" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Privacy</FormLabel>
        <TextField
          select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          size="small"
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        >
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="followers">Followers only</MenuItem>
          <MenuItem value="private">Private</MenuItem>
        </TextField>
      </Box>

      {/* Error */}
      {createAlbum.isError && (
        <Typography sx={{ fontSize: '0.875rem', color: 'error.main' }}>
          Failed to create album. Please try again.
        </Typography>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="contained"
        disableElevation
        sx={{ width: '100%', borderRadius: '9999px' }}
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
      </Button>
    </motion.form>
  );
}
