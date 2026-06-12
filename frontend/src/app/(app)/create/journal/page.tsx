'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, InputBase, Skeleton, CircularProgress } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/journal/color-picker';
import { GlowButton } from '@/components/cinema';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { useCreateJournal, useCreateEntry } from '@/lib/hooks/use-journals';
import { useJournalColorsStore, DEFAULT_COLOR } from '@/lib/stores/journal-colors-store';
import { sanitizeHtml } from '@/lib/utils/sanitize-html';

// Tiptap (~180KB) loads only on the client, keeping it out of the initial
// bundle. The editor module is referenced solely through this dynamic import.
const RichTextEditor = dynamic(
  () => import('@/components/journal/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        variant="rounded"
        animation="pulse"
        sx={{ height: 320, width: '100%', borderRadius: '12px', bgcolor: 'var(--cin-surface-2, #1C1C24)' }}
      />
    ),
  },
);

// Plain-text excerpt derived from editor HTML. Kept local so this page does
// not statically import the Tiptap-heavy editor module.
function getPlainTextExcerpt(html: string, maxLength = 200): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return '';
  div.innerHTML = sanitizeHtml(html);
  const text = div.textContent || div.innerText || '';
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '...' : text;
}

export default function CreateJournalPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
            component={motion.span}
            whileHover={reduceMotion ? undefined : { x: -2 }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.875rem',
              color: 'var(--cin-text-muted, #9A9AA6)',
              '&:hover': { color: 'var(--cin-text, #F4F4F6)' },
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Journals
          </Box>
        </Link>
        <GlowButton
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save'}
        </GlowButton>
      </Box>

      {/* Eyebrow */}
      <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>New Journal</Typography>

      {/* Title */}
      <InputBase
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        fullWidth
        autoFocus
        sx={{
          ...displaySx,
          fontSize: '2.25rem',
          '& input': { color: 'var(--cin-text, #F4F4F6)' },
          '& input::placeholder': { color: 'var(--cin-text-muted, #9A9AA6)', opacity: 0.6 },
        }}
      />

      {/* Date */}
      <Typography
        suppressHydrationWarning
        sx={{ color: 'var(--cin-text-muted, #9A9AA6)', fontSize: '0.875rem', mt: 0.5, mb: 2 }}
      >
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
