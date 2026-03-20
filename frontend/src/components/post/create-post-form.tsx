'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Camera,
  PenLine,
  MapPin,
  Tag,
  ChevronDown,
  Globe,
  Lock,
} from 'lucide-react';
import { Box, Typography, Collapse } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import { useCreatePost } from '@/lib/hooks/use-posts';
import { uploadPhotos } from '@/lib/api/media';
import { PhotoUpload } from './photo-upload';
import { toast } from 'sonner';

const createPostFormSchema = z.object({
  caption: z.string().max(2000).optional(),
  locationName: z.string().max(255).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountry: z.string().max(100).optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  tags: z.string().optional(),
  privacy: z.string().optional(),
});

type FormValues = z.infer<typeof createPostFormSchema>;

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function CreatePostForm() {
  const router = useRouter();
  const createPost = useCreatePost();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [captionLength, setCaptionLength] = useState(0);
  const [coordsOpen, setCoordsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      locationLat: 0,
      locationLng: 0,
      privacy: 'public',
    },
  });

  async function onSubmit(values: FormValues) {
    if (files.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setUploading(true);
    try {
      const { urls, thumbnails } = await uploadPhotos(files);
      const tags = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await createPost.mutateAsync({
        caption: values.caption || undefined,
        mediaUrls: urls,
        mediaThumbnails: thumbnails,
        locationLat: values.locationLat,
        locationLng: values.locationLng,
        locationName: values.locationName || undefined,
        locationCity: values.locationCity || undefined,
        locationCountry: values.locationCountry || undefined,
        privacy: values.privacy,
        tags,
      });

      toast.success('Post created!');
      router.push('/');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Failed to create post';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Section 1: Photos */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          borderRadius: 16,
          border: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          padding: 24,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
            }}
          >
            <Camera style={{ height: 16, width: 16, color: 'var(--mui-palette-primary-main)' }} />
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
            Photos
          </Typography>
        </Box>
        <PhotoUpload files={files} onChange={setFiles} />
      </motion.div>

      {/* Section 2: Your Story */}
      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          borderRadius: 16,
          border: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          padding: 24,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(100,116,139,0.1)',
            }}
          >
            <PenLine style={{ height: 16, width: 16, color: '#64748b' }} />
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
            Your Story
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            id="caption"
            placeholder="What made this moment special?"
            multiline
            rows={5}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 }, borderRadius: 4, resize: 'none', fontSize: '0.875rem' }}
            {...register('caption', {
              onChange: (e) => setCaptionLength(e.target.value.length),
            })}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color:
                  captionLength > 2000
                    ? 'error.main'
                    : captionLength > 1800
                      ? 'warning.main'
                      : 'text.disabled',
              }}
            >
              {captionLength}/2000
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Section 3: Location */}
      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          borderRadius: 16,
          border: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          padding: 24,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(16,185,129,0.1)',
            }}
          >
            <MapPin style={{ height: 16, width: 16, color: '#059669' }} />
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
            Location
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="locationName" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
                Location Name
              </FormLabel>
              <TextField
                id="locationName"
                placeholder="e.g. Eiffel Tower"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
                {...register('locationName')}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="locationCity" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
                City
              </FormLabel>
              <TextField
                id="locationCity"
                placeholder="e.g. Paris"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
                {...register('locationCity')}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="locationCountry" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
              Country
            </FormLabel>
            <TextField
              id="locationCountry"
              placeholder="e.g. France"
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
              {...register('locationCountry')}
            />
          </Box>

          {/* Collapsible coordinates */}
          <Box>
              <Box
                component="button"
                type="button"
                onClick={() => setCoordsOpen(!coordsOpen)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  p: 0,
                  '&:hover': { color: 'text.primary' },
                  transition: 'color 0.2s',
                }}
              >
                <ChevronDown
                  style={{
                    height: 16,
                    width: 16,
                    transition: 'transform 0.2s',
                    transform: coordsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
                <span>Advanced coordinates</span>
              </Box>
            <Collapse in={coordsOpen} sx={{ pt: coordsOpen ? 1.5 : 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormLabel htmlFor="locationLat" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
                    Latitude
                  </FormLabel>
                  <TextField
                    id="locationLat"
                    type="number"
                    placeholder="48.8584"
                    variant="outlined"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { step: 'any' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
                    {...register('locationLat', { valueAsNumber: true })}
                  />
                  {errors.locationLat && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>
                      {errors.locationLat.message}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormLabel htmlFor="locationLng" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
                    Longitude
                  </FormLabel>
                  <TextField
                    id="locationLng"
                    type="number"
                    placeholder="2.2945"
                    variant="outlined"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { step: 'any' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
                    {...register('locationLng', { valueAsNumber: true })}
                  />
                  {errors.locationLng && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>
                      {errors.locationLng.message}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>
        </Box>
      </motion.div>

      {/* Section 4: Details */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          borderRadius: 16,
          border: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          padding: 24,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(139,92,246,0.1)',
            }}
          >
            <Tag style={{ height: 16, width: 16, color: '#7c3aed' }} />
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
            Details
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="tags" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
              Tags
            </FormLabel>
            <TextField
              id="tags"
              placeholder="travel, europe, architecture"
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, borderRadius: 3 }}
              {...register('tags')}
            />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
              Separate with commas
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>Privacy</FormLabel>
            <Controller
              control={control}
              name="privacy"
              render={({ field }) => (
                <TextField
                  select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  <MenuItem value="public">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Globe style={{ height: 14, width: 14, color: 'var(--mui-palette-text-secondary)' }} />
                      <span>Public</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="private">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lock style={{ height: 14, width: 14, color: 'var(--mui-palette-text-secondary)' }} />
                      <span>Private</span>
                    </Box>
                  </MenuItem>
                </TextField>
              )}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Submit */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          type="submit"
          variant="contained"
          disableElevation
          sx={{
            width: '100%',
            height: 48,
            borderRadius: 4,
            bgcolor: 'primary.main',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(var(--mui-palette-primary-mainChannel) / 0.2)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
          disabled={uploading || createPost.isPending}
        >
          {uploading
            ? 'Uploading photos...'
            : createPost.isPending
              ? 'Creating memory...'
              : 'Share Memory'}
        </Button>
      </motion.div>
    </Box>
  );
}
