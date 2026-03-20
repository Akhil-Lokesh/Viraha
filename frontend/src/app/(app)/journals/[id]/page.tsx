'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, InputBase, GlobalStyles } from '@mui/material';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useJournal, useJournalEntries, useUpdateJournal, useUpdateEntry, useCreateEntry, usePublishJournal } from '@/lib/hooks/use-journals';
import { useAuthStore } from '@/lib/stores/auth-store';
import { RichTextEditor, getPlainTextExcerpt } from '@/components/journal/rich-text-editor';
import { sanitizeHtml } from '@/lib/utils/sanitize-html';
import { ColorPicker } from '@/components/journal/color-picker';
import { useJournalColorsStore } from '@/lib/stores/journal-colors-store';
import { EmptyState } from '@/components/shared/empty-state';
import { fadeInUp } from '@/lib/animations';

const contentStyles = (
  <GlobalStyles
    styles={(theme) => ({
      '.journal-content': {
        '& h1': {
          fontSize: '2rem',
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: '1.5em',
          marginBottom: '0.5em',
        },
        '& h2': {
          fontSize: '1.5rem',
          fontWeight: 600,
          lineHeight: 1.3,
          marginTop: '1.25em',
          marginBottom: '0.5em',
        },
        '& h3': {
          fontSize: '1.25rem',
          fontWeight: 600,
          lineHeight: 1.4,
          marginTop: '1em',
          marginBottom: '0.5em',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 12,
          margin: '1em 0',
        },
        '& blockquote': {
          borderLeft: `3px solid ${theme.palette.divider}`,
          paddingLeft: '1em',
          color: theme.palette.text.secondary,
          fontStyle: 'italic',
          margin: '1em 0',
        },
        '& ul, & ol': {
          paddingLeft: '1.5em',
        },
        '& p': {
          marginTop: '0.75em',
          marginBottom: 0,
          lineHeight: 1.7,
        },
        '& p:first-of-type': {
          marginTop: 0,
        },
      },
    })}
  />
);

export default function JournalDetailPage() {
  const params = useParams<{ id: string }>();
  const journalId = params.id;

  const { data: journal, isLoading, isError } = useJournal(journalId);
  const { data: entriesData, isLoading: entriesLoading } = useJournalEntries(journalId);
  const updateJournal = useUpdateJournal();
  const updateEntry = useUpdateEntry();
  const publishMutation = usePublishJournal();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = journal && currentUser && journal.userId === currentUser.id;

  const entry = useMemo(() => {
    const entries = entriesData?.pages.flatMap((p) => p.items) ?? [];
    return entries[0] ?? null;
  }, [entriesData]);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);

  const colorKey = useJournalColorsStore((s) => s.getColor(journalId));
  const setJournalColor = useJournalColorsStore((s) => s.setColor);
  const [editColor, setEditColor] = useState(colorKey);

  const startEditing = () => {
    setTitle(journal?.title ?? '');
    setHtml(entry?.content ?? '');
    setEditColor(colorKey);
    setEditing(true);
  };

  const createEntry = useCreateEntry();

  const handleSave = async () => {
    if (!journal) return;
    const trimmedTitle = title.trim() || 'Untitled';
    setSaving(true);

    try {
      // Always save color locally (doesn't depend on API)
      setJournalColor(journal.id, editColor);

      await updateJournal.mutateAsync({
        id: journal.id,
        input: {
          title: trimmedTitle,
          summary: getPlainTextExcerpt(html) || undefined,
        },
      });

      if (entry) {
        // Update existing entry
        await updateEntry.mutateAsync({
          journalId: journal.id,
          entryId: entry.id,
          input: { content: html },
        });
      } else if (html) {
        // Create first entry if content was added
        await createEntry.mutateAsync({
          journalId: journal.id,
          input: { content: html },
        });
      }

      toast.success('Journal updated');
      setEditing(false);
    } catch (err) {
      console.error('Journal save error:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (isLoading || entriesLoading) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', pb: 6 }}>
        <Box sx={{ pt: { xs: 2, md: 4 }, mb: 3 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 80, mb: 3, borderRadius: '9999px' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 44, width: 320, mb: 1 }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 18, width: 100, mb: 3 }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 200, width: '100%', borderRadius: '12px' }} />
        </Box>
      </Box>
    );
  }

  // Not found
  if (isError || !journal) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', pb: 6 }}>
        <Box sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}>
          <Link href="/journals" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: '0.875rem',
                color: 'text.secondary',
                mb: 3,
                '&:hover': { color: 'text.primary' },
                transition: 'color 0.2s',
              }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Journals
            </Box>
          </Link>
        </Box>
        <EmptyState
          icon="compass"
          title="Journal not found"
          description="This journal may have been deleted or you don't have access to it."
          actionLabel="Browse Journals"
          actionHref="/journals"
        />
      </Box>
    );
  }

  // Edit mode
  if (editing) {
    return (
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        sx={{ maxWidth: 720, mx: 'auto', pb: 6 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: { xs: 2, md: 4 },
            mb: 3,
          }}
        >
          <Box
            onClick={() => setEditing(false)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.875rem',
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' },
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Cancel
          </Box>
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

        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.5, mb: 2 }}>
          {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <ColorPicker selected={editColor} onChange={setEditColor} />
        </Box>

        <RichTextEditor
          content={html}
          onChange={setHtml}
          placeholder="Start writing your story..."
        />
      </Box>
    );
  }

  // Read mode
  return (
    <Box
      component={motion.div}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={{ maxWidth: 720, mx: 'auto', pb: 6 }}
    >
      {contentStyles}

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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isOwner && journal.status === 'draft' && (
            <Button
              variant="contained"
              disableElevation
              disabled={publishMutation.isPending}
              onClick={async () => {
                try {
                  await publishMutation.mutateAsync(journal.id);
                  toast.success('Journal published!');
                } catch {
                  toast.error('Failed to publish. Make sure you have at least one entry.');
                }
              }}
              sx={{
                borderRadius: '9999px',
                bgcolor: 'secondary.main',
                color: 'white',
                '&:hover': { bgcolor: 'secondary.dark' },
              }}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          <Button
            variant="outlined"
            disableElevation
            onClick={startEditing}
            sx={{
              borderRadius: '9999px',
              gap: 0.75,
            }}
          >
            <Pencil style={{ width: 14, height: 14 }} />
            Edit
          </Button>
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: '2.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {journal.title}
      </Typography>

      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.5, mb: 3 }}>
        {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
      </Typography>

      {entry?.content ? (
        <Box
          className="journal-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
          sx={{ lineHeight: 1.7, fontSize: '1rem' }}
        />
      ) : (
        <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          No content yet. Click Edit to start writing.
        </Typography>
      )}
    </Box>
  );
}
