'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { sanitizeHtml } from '@/lib/utils/sanitize-html';
import { ColorPicker } from '@/components/journal/color-picker';
import { useJournalColorsStore } from '@/lib/stores/journal-colors-store';
import { EmptyState } from '@/components/shared/empty-state';
import { fadeInUp } from '@/lib/animations';

// Tiptap (~180KB) loads only on the client, keeping it out of the initial
// bundle. The editor module is referenced solely through this dynamic import.
const RichTextEditor = dynamic(
  () => import('@/components/journal/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <Skeleton variant="rounded" animation="pulse" sx={{ height: 320, width: '100%', borderRadius: '12px' }} />
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

const GOLD = 'var(--viraha-gold, #D4A843)';

const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD,
} as const;

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
          borderLeft: `2px solid var(--viraha-gold, #D4A843)`,
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
    } catch {
      // Error already surfaced to user via toast
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
              borderRadius: '4px',
              bgcolor: GOLD,
              color: 'var(--viraha-ink, #221C18)',
              fontWeight: 700,
              '&:hover': { bgcolor: '#C09934' },
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
            fontFamily: 'var(--font-accent)',
            lineHeight: 1.2,
            '& input::placeholder': { color: 'text.disabled' },
          }}
        />

        <Typography sx={{ ...eyebrowSx, mt: 0.75, mb: 2 }}>
          Entry — {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
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
                borderRadius: '4px',
                bgcolor: GOLD,
                color: 'var(--viraha-ink, #221C18)',
                fontWeight: 700,
                '&:hover': { bgcolor: '#C09934' },
              }}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outlined"
              disableElevation
              onClick={startEditing}
              sx={{
                borderRadius: '4px',
                gap: 0.75,
                borderColor: GOLD,
                color: 'text.primary',
                fontWeight: 600,
                '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
              }}
            >
              <Pencil style={{ width: 14, height: 14 }} />
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* The journal page: paper sheet with a flight-path margin rule */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.18)' : 'rgba(34,28,24,0.2)',
          borderRadius: '4px',
          bgcolor:
            theme.palette.mode === 'dark' ? 'var(--viraha-paper-dark, #1D1828)' : '#FFFDF6',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,28,24,0.015) 0px, rgba(34,28,24,0.015) 1px, transparent 1px, transparent 3px)',
          boxShadow: '3px 3px 0 rgba(34,28,24,0.08)',
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
        })}
      >
        {/* Date eyebrow with stamp dot + flight-path rule */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            aria-hidden
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: `1.5px solid ${GOLD}`,
              bgcolor: 'rgba(212,168,67,0.25)',
              flexShrink: 0,
            }}
          />
          <Typography sx={eyebrowSx}>
            Entry — {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
          </Typography>
          <Box aria-hidden sx={{ flex: 1, borderBottom: `1px dashed ${GOLD}`, opacity: 0.5 }} />
        </Box>

        <Typography
          component="h1"
          sx={(theme) => ({
            fontSize: { xs: '1.9rem', md: '2.4rem' },
            fontFamily: 'var(--font-accent)',
            lineHeight: 1.15,
            mb: 3,
            color:
              theme.palette.mode === 'dark'
                ? 'var(--viraha-ink-dark, #F2EAD9)'
                : 'var(--viraha-ink, #221C18)',
          })}
        >
          {journal.title}
        </Typography>

        {entry?.content ? (
          <Box
            className="journal-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
            sx={{
              lineHeight: 1.7,
              fontSize: '1rem',
              pl: { md: 2.5 },
              borderLeft: { md: `1px dashed ${GOLD}` },
            }}
          />
        ) : (
          <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No content yet. Click Edit to start writing.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
