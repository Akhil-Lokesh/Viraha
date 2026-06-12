'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import { motion, useReducedMotion } from 'framer-motion';
import { User, Camera, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateProfile } from '@/lib/api/users';
import { uploadAvatar } from '@/lib/api/media';
import { inputSx, labelSx, settingsStagger, settingsItem } from './cinema-settings';
import { FieldError } from './field-error';

const profileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  homeCity: z.string().max(100).optional(),
  homeCountry: z.string().max(100).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileTab() {
  const reduceMotion = useReducedMotion();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // A dead avatar URL must degrade to the person icon, not browser breakage.
  const [avatarFailed, setAvatarFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const updatedUser = await uploadAvatar(file);
      setUser(updatedUser);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      homeCity: user?.homeCity || '',
      homeCountry: user?.homeCountry || '',
    },
  });

  // The persisted store holds only a partial user, so bio/home* arrive later
  // when /me repopulates the store. Reinitialize the form when fresh server data
  // arrives — but only while the form is pristine, so we never clobber edits the
  // user is actively typing (e.g. if an avatar upload or /me refresh fires setUser
  // mid-edit, isDirty stays true and the reset is skipped).
  useEffect(() => {
    if (isDirty) return;
    reset({
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      homeCity: user?.homeCity || '',
      homeCountry: user?.homeCountry || '',
    });
  }, [user, reset, isDirty]);

  async function onSubmit(values: ProfileValues) {
    setLoading(true);
    try {
      const updated = await updateProfile(values);
      setUser(updated);
      toast.success('Profile updated!');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      variants={settingsStagger}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Avatar section */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Traveler</SectionLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '16px',
                  bgcolor: 'var(--cin-surface-2, #1C1C24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: `1px solid ${CIN.hairline}`,
                }}
              >
                {user?.avatar && !avatarFailed ? (
                  <img
                    src={
                      user.avatar.startsWith('http')
                        ? user.avatar
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar}`
                    }
                    alt={user.displayName || user.username}
                    onError={() => setAvatarFailed(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <User style={{ height: 32, width: 32, color: CIN.textMuted }} />
                )}
                {avatarUploading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(11,11,15,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: 2,
                        borderColor: 'rgba(255,255,255,0.25)',
                        borderTopColor: CIN.accent,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                  </Box>
                )}
              </Box>
              <Box
                component="button"
                type="button"
                aria-label="Change profile photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: CIN.accent,
                  color: '#0B0B0F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${CIN.accentGlow}`,
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 },
                  transition: 'opacity 0.2s',
                }}
              >
                <Camera style={{ height: 14, width: 14 }} />
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, color: CIN.text }}>
                {user?.displayName || user?.username || 'Your Profile'}
              </Typography>
              <Typography variant="body2" sx={{ color: CIN.textMuted }}>
                @{user?.username || 'username'}
              </Typography>
              <GlowButton
                type="button"
                variant="ghost"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                sx={{ mt: 1, px: 1.5, py: 0.5, fontSize: '0.75rem' }}
              >
                {avatarUploading ? 'Uploading...' : 'Change Photo'}
              </GlowButton>
            </Box>
          </Box>
        </CinemaCard>
      </motion.div>

      {/* About you */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionLabel>About you</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="displayName" sx={labelSx}>
              Display Name
            </FormLabel>
            <TextField
              id="displayName"
              placeholder="Your display name"
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
              {...register('displayName')}
            />
            <FieldError message={errors.displayName?.message} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="bio" sx={labelSx}>
              Bio
            </FormLabel>
            <TextField
              id="bio"
              multiline
              rows={3}
              placeholder="Tell the world about your travels..."
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
              {...register('bio')}
            />
            <FieldError message={errors.bio?.message} />
          </Box>
        </CinemaCard>
      </motion.div>

      {/* Home location */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin style={{ height: 13, width: 13, color: CIN.accent, marginBottom: 12 }} />
            <SectionLabel>Home base</SectionLabel>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="homeCity" sx={labelSx}>
                City
              </FormLabel>
              <TextField
                id="homeCity"
                placeholder="e.g. Barcelona"
                variant="outlined"
                size="small"
                fullWidth
                sx={inputSx}
                {...register('homeCity')}
              />
              <FieldError message={errors.homeCity?.message} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormLabel htmlFor="homeCountry" sx={labelSx}>
                Country
              </FormLabel>
              <TextField
                id="homeCountry"
                placeholder="e.g. Spain"
                variant="outlined"
                size="small"
                fullWidth
                sx={inputSx}
                {...register('homeCountry')}
              />
              <FieldError message={errors.homeCountry?.message} />
            </Box>
          </Box>
        </CinemaCard>
      </motion.div>

      {/* Save button */}
      <motion.div variants={settingsItem}>
        <GlowButton type="submit" disabled={loading} sx={{ width: '100%', height: 44 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </GlowButton>
      </motion.div>
    </motion.form>
  );
}
