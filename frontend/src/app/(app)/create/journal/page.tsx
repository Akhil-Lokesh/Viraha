'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, InputBase } from '@mui/material';
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RichTextEditor, getPlainTextExcerpt } from '@/components/journal/rich-text-editor';
import { ColorPicker } from '@/components/journal/color-picker';
import { useCreateJournal, useCreateEntry } from '@/lib/hooks/use-journals';
import { useJournalColorsStore, DEFAULT_COLOR } from '@/lib/stores/journal-colors-store';
import { fadeInUp } from '@/lib/animations';

export default function CreateJournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [colorKey, setColorKey] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);

  const createJournal = useCreateJournal();
  const createEntry = useCreateEntry();
  const setJournalColor = useJournalColorsStore((s) => s.setColor);

  const handleSave = async () => {
    const trimmedTitle = title.trim() || 'Untitled';
    setSaving(true);

    try {
      const excerpt = getPlainTextExcerpt(html);
      const journal = await createJournal.mutateAsync({
        title: trimmedTitle,
        ...(excerpt ? { summary: excerpt } : {}),
        privacy: 'private',
        status: 'draft',
      });

      // Save the chosen color
      setJournalColor(journal.id, colorKey);

      await createEntry.mutateAsync({
        journalId: journal.id,
        input: { content: html || undefined },
      });

      toast.success('Journal saved');
      router.push(`/journals/${journal.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        || (err as Error)?.message
        || 'Failed to save journal';
      toast.error(msg);
      setSaving(false);
    }
  };

  return (
    <Box
      component={motion.div}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={{ maxWidth: 720, mx: 'auto', pb: 6 }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: { xs: 2, md: 4 },
          mb: 3,
        }}
      >
        <Link href="/journals" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.875rem',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Journals
          </Box>
        </Link>
        <Button
          variant="contained"
          disableElevation
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: '9999px',
            bgcolor: 'secondary.main',
            color: 'white',
            '&:hover': { bgcolor: 'secondary.dark' },
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Title */}
      <InputBase
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        fullWidth
        autoFocus
        sx={{
          fontSize: '2.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          '& input::placeholder': { color: 'text.disabled' },
        }}
      />

      {/* Date */}
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.5, mb: 2 }}>
        {format(new Date(), 'MMM d, yyyy')}
      </Typography>

      {/* Color picker */}
      <Box sx={{ mb: 3 }}>
        <ColorPicker selected={colorKey} onChange={setColorKey} />
      </Box>

      {/* Editor */}
      <RichTextEditor
        content=""
        onChange={setHtml}
        placeholder="Start writing your story..."
        autoFocus={false}
      />
    </Box>
  );
}
