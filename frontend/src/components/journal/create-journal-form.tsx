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
import { useCreateJournal } from '@/lib/hooks/use-journals';
import { fadeInUp } from '@/lib/animations';

export function CreateJournalForm() {
  const router = useRouter();
  const createJournal = useCreateJournal();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const journal = await createJournal.mutateAsync({
        title: title.trim(),
        summary: summary.trim() || undefined,
        privacy,
        status,
      });
      router.push(`/journals/${journal.id}`);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="title" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Title</FormLabel>
        <TextField
          id="title"
          placeholder="e.g. A Week in Patagonia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          variant="outlined"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 200 } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel htmlFor="summary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Summary (optional)</FormLabel>
        <TextField
          id="summary"
          placeholder="What is this journal about?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          multiline
          rows={3}
          variant="outlined"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 2000 } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Privacy</FormLabel>
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Status</FormLabel>
          <TextField
            select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </TextField>
        </Box>
      </Box>

      {createJournal.isError && (
        <Typography sx={{ fontSize: '0.875rem', color: 'error.main' }}>
          Failed to create journal. Please try again.
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        disableElevation
        sx={{ width: '100%', borderRadius: '9999px' }}
        size="large"
        disabled={!title.trim() || createJournal.isPending}
      >
        {createJournal.isPending ? (
          <>
            <Loader2 style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite' }} />
            Creating...
          </>
        ) : (
          'Create Journal'
        )}
      </Button>
    </motion.form>
  );
}
