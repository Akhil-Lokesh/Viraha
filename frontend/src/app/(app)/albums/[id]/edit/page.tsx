'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import Skeleton from '@mui/material/Skeleton';
import { useAlbum, useUpdateAlbum } from '@/lib/hooks/use-albums';
import { useAuthStore } from '@/lib/stores/auth-store';
import { fadeInUp } from '@/lib/animations';
import type { UpdateAlbumInput } from '@/lib/types';

function getSubmitError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage;
    }
  }
  return 'Failed to save changes. Please try again.';
}

function EditAlbumSkeleton() {
  return (
    <Box sx={{ maxWidth: 576, mx: 'auto', pb: 6, pt: { xs: 2, md: 4 } }}>
      <Skeleton variant="rounded" animation="pulse" sx={{ height: 36, width: 240, mb: 1 }} />
      <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 320, mb: 4 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 96 }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 40, width: '100%', borderRadius: 3 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: album, isLoading, isError } = useAlbum(id);
  const updateAlbum = useUpdateAlbum();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [coverImage, setCoverImage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seed the form once the album loads. Guarded by `album.id` so user edits
  // are not clobbered on background refetches.
  useEffect(() => {
    if (!album) return;
    setTitle(album.title);
    setDescription(album.description ?? '');
    setPrivacy(album.privacy || 'public');
    setCoverImage(album.coverImage ?? '');
  }, [album?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <EditAlbumSkeleton />;
  }

  if (isError || !album) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>Album not found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The album you are trying to edit does not exist or has been removed.
          </Typography>
          <Button variant="outlined" disableElevation onClick={() => router.push('/albums')}>
            Back to Albums
          </Button>
        </Box>
      </Box>
    );
  }

  const isOwner = !!user && user.id === album.userId;

  if (!isOwner) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>You cannot edit this album</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Only the owner can change an album&apos;s details.
          </Typography>
          <Button variant="outlined" disableElevation onClick={() => router.push(`/albums/${album.id}`)}>
            Back to Album
          </Button>
        </Box>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const trimmedDescription = description.trim();
    const trimmedCover = coverImage.trim();

    // Send `null` to clear a previously set optional field; omit fields that
    // are unchanged is not required (PATCH is idempotent), but normalize empties.
    const input: UpdateAlbumInput = {
      title: trimmedTitle,
      description: trimmedDescription || null,
      coverImage: trimmedCover || null,
      privacy,
    };

    setSubmitError(null);
    try {
      const updated = await updateAlbum.mutateAsync({ id: album.id, input });
      router.push(`/albums/${updated.id}`);
    } catch (error: unknown) {
      setSubmitError(getSubmitError(error));
    }
  };

  return (
    <Box sx={{ maxWidth: 576, mx: 'auto', pb: 6 }}>
      <Box
        component={motion.div}
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <Button
          variant="text"
          disableElevation
          onClick={() => router.push(`/albums/${album.id}`)}
          sx={{ mb: 2, minWidth: 'auto', px: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <ArrowLeft style={{ width: 16, height: 16, marginRight: 6 }} />
          Back to Album
        </Button>
        <Typography
          sx={{
            fontFamily: 'var(--font-brand)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--viraha-gold, #D4A843)',
            mb: 0.75,
          }}
        >
          The Shelf — Collections
        </Typography>
        <Typography
          component="h1"
          sx={(theme) => ({
            fontFamily: 'var(--font-accent)',
            fontSize: { xs: '1.875rem', md: '2.5rem' },
            lineHeight: 1.1,
            color:
              theme.palette.mode === 'dark'
                ? 'var(--viraha-ink-dark, #F2EAD9)'
                : 'var(--viraha-ink, #221C18)',
            mb: 1,
          })}
        >
          Edit Album
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          Update the details of your collection.
        </Typography>
      </Box>

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

        {/* Cover image */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="coverImage" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Cover image URL (optional)</FormLabel>
          <TextField
            id="coverImage"
            placeholder="https://… or /uploads/…"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 2048 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
          />
        </Box>

        {/* Privacy */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="privacy" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Privacy</FormLabel>
          <TextField
            select
            id="privacy"
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
        {submitError && (
          <Typography role="alert" sx={{ fontSize: '0.875rem', color: 'error.main' }}>
            {submitError}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            type="button"
            variant="outlined"
            disableElevation
            onClick={() => router.push(`/albums/${album.id}`)}
            disabled={updateAlbum.isPending}
            sx={{ borderRadius: '4px', flex: 1, borderColor: 'divider', color: 'text.secondary' }}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            sx={{
              borderRadius: '4px',
              flex: 1,
              bgcolor: 'var(--viraha-gold, #D4A843)',
              color: 'var(--viraha-ink, #221C18)',
              fontWeight: 700,
              '&:hover': { bgcolor: '#C09934' },
            }}
            size="large"
            disabled={!title.trim() || updateAlbum.isPending}
          >
            {updateAlbum.isPending ? (
              <>
                <Loader2 style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Box>
      </motion.form>
    </Box>
  );
}
