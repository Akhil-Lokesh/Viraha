'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, InputBase, GlobalStyles } from '@mui/material';
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
import { GlowButton } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { fadeInUp } from '@/lib/animations';

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
        sx={{ height: 320, width: '100%', borderRadius: '12px', bgcolor: 'var(--cin-surface, #141419)' }}
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

const contentStyles = (
  <GlobalStyles
    styles={{
      '.journal-content': {
        '& h1': {
          fontSize: '1.9rem',
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: '1.5em',
          marginBottom: '0.5em',
          color: 'var(--cin-text, #F4F4F6)',
        },
        '& h2': {
          fontSize: '1.45rem',
          fontWeight: 600,
          lineHeight: 1.3,
          marginTop: '1.25em',
          marginBottom: '0.5em',
          color: 'var(--cin-text, #F4F4F6)',
        },
        '& h3': {
          fontSize: '1.2rem',
          fontWeight: 600,
          lineHeight: 1.4,
          marginTop: '1em',
          marginBottom: '0.5em',
          color: 'var(--cin-text, #F4F4F6)',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 12,
          margin: '1em 0',
        },
        '& blockquote': {
          borderLeft: '2px solid var(--cin-accent, #8B7CFF)',
          paddingLeft: '1em',
          color: 'var(--cin-text-muted, #9A9AA6)',
          fontStyle: 'italic',
          margin: '1em 0',
        },
        '& ul, & ol': {
          paddingLeft: '1.5em',
        },
        '& a': {
          color: 'var(--cin-accent, #8B7CFF)',
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
    }}
  />
);

const backLinkSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: '0.875rem',
  color: CIN.textMuted,
  '&:hover': { color: CIN.text },
  transition: 'color 0.2s',
} as const;

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
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 80, mb: 3, borderRadius: '9999px', bgcolor: 'var(--cin-surface, #141419)' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 44, width: 320, mb: 1, bgcolor: 'var(--cin-surface, #141419)' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 18, width: 100, mb: 3, bgcolor: 'var(--cin-surface, #141419)' }} />
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 200, width: '100%', borderRadius: '12px', bgcolor: 'var(--cin-surface, #141419)' }} />
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
            <Box sx={{ ...backLinkSx, mb: 3 }}>
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
          <Box onClick={() => setEditing(false)} sx={{ ...backLinkSx, cursor: 'pointer' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Cancel
          </Box>
          <GlowButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </GlowButton>
        </Box>

        <InputBase
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          fullWidth
          autoFocus
          sx={{
            fontSize: '2.25rem',
            fontFamily: 'Posterama, var(--font-body)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: CIN.text,
            '& input::placeholder': { color: CIN.textMuted, opacity: 0.6 },
          }}
        />

        <Typography suppressHydrationWarning sx={{ ...eyebrowSx, mt: 0.75, mb: 2 }}>
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

  // Read mode — focused dark reading column
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
          mb: 4,
        }}
      >
        <Link href="/journals" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={backLinkSx}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Journals
          </Box>
        </Link>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isOwner && journal.status === 'draft' && (
            <GlowButton
              disabled={publishMutation.isPending}
              onClick={async () => {
                try {
                  await publishMutation.mutateAsync(journal.id);
                  toast.success('Journal published!');
                } catch {
                  toast.error('Failed to publish. Make sure you have at least one entry.');
                }
              }}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </GlowButton>
          )}
          {isOwner && (
            <GlowButton variant="ghost" onClick={startEditing} sx={{ gap: 0.75 }}>
              <Pencil style={{ width: 14, height: 14 }} />
              Edit
            </GlowButton>
          )}
        </Box>
      </Box>

      {/* Entry date eyebrow + draft chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Typography suppressHydrationWarning sx={eyebrowSx}>
          Entry — {format(new Date(journal.updatedAt), 'MMM d, yyyy')}
        </Typography>
        {journal.status === 'draft' && (
          <Box
            component="span"
            sx={{
              ...eyebrowSx,
              fontSize: 9,
              fontWeight: 700,
              color: CIN.accent,
              border: `1px solid ${CIN.accent}`,
              borderRadius: '6px',
              px: 0.75,
              py: 0.2,
              lineHeight: 1.4,
            }}
          >
            Draft
          </Box>
        )}
      </Box>

      <Typography
        component="h1"
        sx={{ ...displaySx, fontSize: { xs: '1.9rem', md: '2.4rem' }, lineHeight: 1.1 }}
      >
        {journal.title}
      </Typography>

      {/* Hairline divider between header and entry content */}
      <Box sx={{ borderBottom: `1px solid ${CIN.hairline}`, mt: 3, mb: 3 }} />

      {entry?.content ? (
        <Box
          className="journal-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
          sx={{
            lineHeight: 1.7,
            fontSize: '1.05rem',
            color: CIN.text,
          }}
        />
      ) : (
        <Typography sx={{ color: CIN.textMuted, fontStyle: 'italic' }}>
          No content yet. Click Edit to start writing.
        </Typography>
      )}
    </Box>
  );
}
