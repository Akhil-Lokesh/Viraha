'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronDown, Globe, Lock, Users } from 'lucide-react';
import {
  Box,
  Typography,
  Collapse,
  CircularProgress,
  Switch,
  FormControlLabel,
  type SxProps,
  type Theme,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import { useCreatePost } from '@/lib/hooks/use-posts';
import { uploadPhotos } from '@/lib/api/media';
import { CIN } from '@/lib/design/cinema-tokens';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { PhotoUpload } from './photo-upload';
import { LocationAutocomplete } from '@/components/shared/location-autocomplete';
import type { PlaceDetails, CreatePostInput } from '@/lib/types';
import { toast } from 'sonner';

const createPostFormSchema = z
  .object({
    caption: z.string().max(2000).optional(),
    locationName: z.string().max(255).optional(),
    locationCity: z.string().max(100).optional(),
    locationCountry: z.string().max(100).optional(),
    locationLat: z.number().min(-90).max(90),
    locationLng: z.number().min(-180).max(180),
    // Explicit flag instead of treating (0,0) as "no location" — a genuine
    // post at lat 0 / lng 0 (Gulf of Guinea) is a valid location.
    locationPicked: z.boolean(),
    tags: z.string().optional(),
    privacy: z.string().optional(),
    takenAt: z.string().optional(),
    travelMode: z.string().optional(),
    allowComments: z.boolean(),
    showLocation: z.boolean(),
  })
  .refine((data) => data.locationPicked, {
    message: 'Please pick a location',
    path: ['locationLat'],
  });

type FormValues = z.infer<typeof createPostFormSchema>;

/** Dark cinema treatment for every text input in the form. */
const fieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: 'var(--cin-surface-2, #1C1C24)',
    color: 'var(--cin-text, #F4F4F6)',
    '& fieldset': { borderColor: CIN.hairline },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--cin-accent, #8B7CFF)',
      borderWidth: '1px',
    },
  },
  '& .MuiOutlinedInput-input::placeholder, & textarea::placeholder': {
    color: 'var(--cin-text-muted, #9A9AA6)',
    opacity: 1,
  },
};

const labelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  fontSize: '0.8125rem',
  fontWeight: 500,
  userSelect: 'none',
  color: 'var(--cin-text-muted, #9A9AA6)',
  '&.Mui-focused': { color: 'var(--cin-text-muted, #9A9AA6)' },
};

const switchSx: SxProps<Theme> = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: CIN.accent },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: CIN.accent,
    opacity: 0.55,
  },
};

const menuPaperSx: SxProps<Theme> = {
  bgcolor: 'var(--cin-surface-2, #1C1C24)',
  backgroundImage: 'none',
  border: `1px solid ${CIN.hairline}`,
  boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
};

const menuItemSx: SxProps<Theme> = {
  fontSize: '0.875rem',
  color: 'var(--cin-text, #F4F4F6)',
  '&:hover': { bgcolor: 'rgba(139,124,255,0.10)' },
  '&.Mui-selected': { bgcolor: 'rgba(139,124,255,0.16)' },
  '&.Mui-selected:hover': { bgcolor: 'rgba(139,124,255,0.22)' },
};

const darkSelectSlotProps = {
  select: {
    MenuProps: { PaperProps: { sx: menuPaperSx } },
  },
} as const;

export function CreatePostForm() {
  const router = useRouter();
  const createPost = useCreatePost();
  const reduceMotion = useReducedMotion();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [captionLength, setCaptionLength] = useState(0);
  const [coordsOpen, setCoordsOpen] = useState(false);

  // One orchestrated page-load stagger: sections rise 10px and fade in.
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } },
  };
  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      locationLat: 0,
      locationLng: 0,
      locationPicked: false,
      privacy: 'public',
      takenAt: '',
      travelMode: '',
      allowComments: true,
      showLocation: true,
    },
  });

  function onInvalid(formErrors: typeof errors) {
    const firstMessage =
      formErrors.locationLat?.message ||
      formErrors.locationLng?.message ||
      formErrors.caption?.message ||
      'Please fix the highlighted fields';
    toast.error(firstMessage);
  }

  function handlePlaceSelect(place: PlaceDetails) {
    setValue('locationLat', place.lat);
    setValue('locationLng', place.lng);
    setValue('locationPicked', true, { shouldValidate: true });
    setValue('locationName', place.name);
    setValue('locationCity', place.city ?? '');
    setValue('locationCountry', place.country ?? '');
  }

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

      // showLocation is accepted by the create endpoint (backend
      // createPostSchema) but absent from the shared CreatePostInput type,
      // so the payload is typed as a widening intersection.
      const payload: CreatePostInput & { showLocation: boolean } = {
        caption: values.caption || undefined,
        mediaUrls: urls,
        mediaThumbnails: thumbnails,
        locationLat: values.locationLat,
        locationLng: values.locationLng,
        locationName: values.locationName || undefined,
        locationCity: values.locationCity || undefined,
        locationCountry: values.locationCountry || undefined,
        takenAt: values.takenAt
          ? new Date(`${values.takenAt}T00:00:00`).toISOString()
          : undefined,
        privacy: values.privacy,
        tags,
        travelMode:
          values.travelMode === 'local' || values.travelMode === 'traveling'
            ? values.travelMode
            : undefined,
        allowComments: values.allowComments,
        showLocation: values.showLocation,
      };

      const created = await createPost.mutateAsync(payload);

      toast.success('Post created!');
      router.push(created?.id ? `/post/${created.id}` : '/home');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Failed to create post';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  const isBusy = uploading || createPost.isPending;

  return (
    <Box
      component={motion.form}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      {/* Section 1: Photos */}
      <motion.div variants={itemVariants}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Photos</SectionLabel>
          <PhotoUpload files={files} onChange={setFiles} />
        </CinemaCard>
      </motion.div>

      {/* Section 2: Your Story */}
      <motion.div variants={itemVariants}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Your Story</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              id="caption"
              placeholder="What made this moment special?"
              multiline
              rows={5}
              variant="outlined"
              size="small"
              fullWidth
              sx={fieldSx}
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
                      ? CIN.danger
                      : captionLength > 1800
                        ? 'var(--cin-accent, #8B7CFF)'
                        : 'var(--cin-text-muted, #9A9AA6)',
                }}
              >
                {captionLength}/2000
              </Typography>
            </Box>
          </Box>
        </CinemaCard>
      </motion.div>

      {/* Section 3: Location */}
      <motion.div variants={itemVariants}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Location</SectionLabel>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel sx={labelSx}>Search for a place</FormLabel>
              <LocationAutocomplete onSelect={handlePlaceSelect} placeholder="Search for a place..." />
              {errors.locationLat && (
                <Typography sx={{ fontSize: '0.75rem', color: CIN.danger }}>
                  {errors.locationLat.message}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormLabel htmlFor="locationName" sx={labelSx}>
                  Location Name
                </FormLabel>
                <TextField
                  id="locationName"
                  placeholder="e.g. Eiffel Tower"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  {...register('locationName')}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormLabel htmlFor="locationCity" sx={labelSx}>
                  City
                </FormLabel>
                <TextField
                  id="locationCity"
                  placeholder="e.g. Paris"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  {...register('locationCity')}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="locationCountry" sx={labelSx}>
                Country
              </FormLabel>
              <TextField
                id="locationCountry"
                placeholder="e.g. France"
                variant="outlined"
                size="small"
                fullWidth
                sx={fieldSx}
                {...register('locationCountry')}
              />
            </Box>

            {/* Location privacy: hides exact coordinates from everyone but the author */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                borderTop: `1px solid ${CIN.hairline}`,
                pt: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cin-text, #F4F4F6)' }}>
                  Show exact location
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'var(--cin-text-muted, #9A9AA6)' }}>
                  When off, only you can see this post&apos;s coordinates on the map
                </Typography>
              </Box>
              <Controller
                control={control}
                name="showLocation"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    sx={switchSx}
                    inputProps={{ 'aria-label': 'Show exact location' }}
                  />
                )}
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
                  color: 'var(--cin-text-muted, #9A9AA6)',
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  p: 0,
                  '&:hover': { color: 'var(--cin-text, #F4F4F6)' },
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
                    <FormLabel htmlFor="locationLat" sx={labelSx}>
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
                      sx={fieldSx}
                      {...register('locationLat', {
                        valueAsNumber: true,
                        onChange: () => setValue('locationPicked', true, { shouldValidate: true }),
                      })}
                    />
                    {errors.locationLat && (
                      <Typography sx={{ fontSize: '0.75rem', color: CIN.danger }}>
                        {errors.locationLat.message}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormLabel htmlFor="locationLng" sx={labelSx}>
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
                      sx={fieldSx}
                      {...register('locationLng', {
                        valueAsNumber: true,
                        onChange: () => setValue('locationPicked', true, { shouldValidate: true }),
                      })}
                    />
                    {errors.locationLng && (
                      <Typography sx={{ fontSize: '0.75rem', color: CIN.danger }}>
                        {errors.locationLng.message}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Box>
        </CinemaCard>
      </motion.div>

      {/* Section 4: Details */}
      <motion.div variants={itemVariants}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Details</SectionLabel>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="tags" sx={labelSx}>
                Tags
              </FormLabel>
              <TextField
                id="tags"
                placeholder="travel, europe, architecture"
                variant="outlined"
                size="small"
                fullWidth
                sx={fieldSx}
                {...register('tags')}
              />
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--cin-text-muted, #9A9AA6)' }}>
                Separate with commas
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel sx={labelSx}>Privacy</FormLabel>
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
                    sx={fieldSx}
                    slotProps={darkSelectSlotProps}
                  >
                    <MenuItem value="public" sx={menuItemSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Globe style={{ height: 14, width: 14, color: 'var(--cin-text-muted, #9A9AA6)' }} />
                        <span>Public</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="followers" sx={menuItemSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users style={{ height: 14, width: 14, color: 'var(--cin-text-muted, #9A9AA6)' }} />
                        <span>Followers only</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="private" sx={menuItemSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock style={{ height: 14, width: 14, color: 'var(--cin-text-muted, #9A9AA6)' }} />
                        <span>Private</span>
                      </Box>
                    </MenuItem>
                  </TextField>
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="takenAt" sx={labelSx}>
                Date taken
              </FormLabel>
              <TextField
                id="takenAt"
                type="date"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ ...fieldSx, '& input': { colorScheme: 'dark' } }}
                {...register('takenAt')}
              />
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--cin-text-muted, #9A9AA6)' }}>
                Optional — when this memory happened
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel sx={labelSx}>Travel mode</FormLabel>
              <Controller
                control={control}
                name="travelMode"
                render={({ field }) => (
                  <TextField
                    select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    size="small"
                    fullWidth
                    sx={fieldSx}
                    slotProps={darkSelectSlotProps}
                  >
                    <MenuItem value="" sx={menuItemSx}>
                      Not set
                    </MenuItem>
                    <MenuItem value="local" sx={menuItemSx}>
                      Local — around home
                    </MenuItem>
                    <MenuItem value="traveling" sx={menuItemSx}>
                      Traveling — on a trip
                    </MenuItem>
                  </TextField>
                )}
              />
            </Box>
          </Box>

          <Box sx={{ borderTop: `1px solid ${CIN.hairline}`, mt: 2, pt: 1.5 }}>
            <Controller
              control={control}
              name="allowComments"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={switchSx}
                      inputProps={{ 'aria-label': 'Allow comments' }}
                    />
                  }
                  label="Allow comments"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      color: 'var(--cin-text, #F4F4F6)',
                    },
                  }}
                />
              )}
            />
          </Box>
        </CinemaCard>
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants}>
        <GlowButton
          type="submit"
          fullWidth
          disabled={isBusy}
          sx={{ height: 48, fontSize: '1rem' }}
          startIcon={
            isBusy ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined
          }
        >
          {uploading
            ? 'Uploading photos...'
            : createPost.isPending
              ? 'Creating memory...'
              : 'Share Memory'}
        </GlowButton>
      </motion.div>
    </Box>
  );
}
