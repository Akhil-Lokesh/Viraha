'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import MuiSwitch from '@mui/material/Switch';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { motion } from 'framer-motion';
import { useThemeMode } from '@/lib/providers/mui-theme-provider';
import {
  Settings,
  User,
  Palette,
  Shield,
  Lock,
  Sun,
  Moon,
  Monitor,
  Camera,
  MapPin,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateProfile } from '@/lib/api/users';
import { changePassword } from '@/lib/api/auth';
import { uploadAvatar } from '@/lib/api/media';
import { AuthGuard } from '@/components/auth/auth-guard';
import { toast } from 'sonner';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordValues = z.infer<typeof passwordSchema>;

const profileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  homeCity: z.string().max(100).optional(),
  homeCountry: z.string().max(100).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      homeCity: user?.homeCity || '',
      homeCountry: user?.homeCountry || '',
    },
  });

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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Avatar section */}
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3 }}
      >
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
                bgcolor: 'action.selected',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: 2,
                borderColor: 'divider',
              }}
            >
              {user?.avatar ? (
                <img
                  src={
                    user.avatar.startsWith('http')
                      ? user.avatar
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar}`
                  }
                  alt={user.displayName || user.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User style={{ height: 32, width: 32, color: 'var(--mui-palette-text-secondary)' }} />
              )}
              {avatarUploading && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.4)',
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
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
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
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
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
            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user?.displayName || user?.username || 'Your Profile'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              @{user?.username || 'username'}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              disableElevation
              size="small"
              sx={{ mt: 1, borderRadius: '8px', fontSize: '0.75rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Form fields */}
      <Box
        component={motion.div}
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="displayName" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
            Display Name
          </FormLabel>
          <TextField
            id="displayName"
            placeholder="Your display name"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            {...register('displayName')}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="bio" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, resize: 'none' }}
            {...register('bio')}
          />
        </Box>
      </Box>

      {/* Home location */}
      <Box
        component={motion.div}
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MapPin style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Home Base</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="homeCity" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
              City
            </FormLabel>
            <TextField
              id="homeCity"
              placeholder="e.g. Barcelona"
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              {...register('homeCity')}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="homeCountry" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
              Country
            </FormLabel>
            <TextField
              id="homeCountry"
              placeholder="e.g. Spain"
              variant="outlined"
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              {...register('homeCountry')}
            />
          </Box>
        </Box>
      </Box>

      {/* Save button */}
      <Box
        component={motion.div}
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={loading}
          sx={{
            width: '100%',
            height: 44,
            borderRadius: '12px',
            bgcolor: 'secondary.main',
            color: 'white',
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(var(--mui-palette-secondary-mainChannel) / 0.2)',
            '&:hover': { bgcolor: 'secondary.dark' },
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}

function AppearanceTab() {
  const { mode: theme, setMode: setTheme } = useThemeMode();

  const themes = [
    {
      id: 'light' as const,
      label: 'Light',
      description: 'Clean and bright',
      icon: Sun,
    },
    {
      id: 'dark' as const,
      label: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
    },
    {
      id: 'system' as const,
      label: 'System',
      description: 'Match your device',
      icon: Monitor,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 2 }}>Theme</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <Box
                key={t.id}
                component={motion.button}
                type="button"
                onClick={() => setTheme(t.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  border: 1,
                  p: 2,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  bgcolor: isActive ? 'secondary.light' : 'transparent',
                  borderColor: isActive ? 'secondary.main' : 'divider',
                  ...(isActive
                    ? {
                        boxShadow: 1,
                      }
                    : {
                        '&:hover': { borderColor: 'divider', bgcolor: 'action.hover' },
                      }),
                }}
              >
                <Box
                  sx={{
                    mx: 'auto',
                    mb: 1,
                    display: 'flex',
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    ...(isActive
                      ? { bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.1)', color: 'secondary.main' }
                      : { bgcolor: 'action.selected', color: 'text.secondary' }),
                  }}
                >
                  <Icon style={{ height: 20, width: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{t.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
                  {t.description}
                </Typography>
                {isActive && (
                  <Box
                    component={motion.div}
                    layoutId="theme-indicator"
                    sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function PrivacyTab() {
  const { user, setUser } = useAuthStore();
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);
  const [showLocation, setShowLocation] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handlePrivateChange(value: boolean) {
    setIsPrivate(value);
    setSaving(true);
    try {
      const updated = await updateProfile({ isPrivate: value });
      setUser(updated);
      toast.success(value ? 'Account set to private' : 'Account set to public');
    } catch {
      setIsPrivate(!value);
      toast.error('Failed to update privacy setting');
    } finally {
      setSaving(false);
    }
  }

  async function handleShowLocationChange(value: boolean) {
    setShowLocation(value);
    setSaving(true);
    try {
      const updated = await updateProfile({ showLocation: value } as Parameters<typeof updateProfile>[0]);
      setUser(updated);
      toast.success(value ? 'Location visible on profile' : 'Location hidden from profile');
    } catch {
      setShowLocation(!value);
      toast.error('Failed to update location setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* Private Account */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: 'rgba(245,158,11,0.1)',
                mt: 0.25,
              }}
            >
              <Shield style={{ height: 18, width: 18, color: '#D97706' }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Private Account
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, maxWidth: 320, display: 'block' }}>
                When enabled, only approved followers can see your posts and travel memories.
              </Typography>
            </Box>
          </Box>
          <MuiSwitch
            checked={isPrivate}
            onChange={(e) => handlePrivateChange(e.target.checked)}
            disabled={saving}
          />
        </Box>

        <Box sx={{ height: 1, bgcolor: 'divider', opacity: 0.5 }} />

        {/* Show Location */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: 'rgba(16,185,129,0.1)',
                mt: 0.25,
              }}
            >
              <Eye style={{ height: 18, width: 18, color: '#059669' }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Show Location
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, maxWidth: 320, display: 'block' }}>
                Display your home city on your profile. Other travelers can find you by location.
              </Typography>
            </Box>
          </Box>
          <MuiSwitch
            checked={showLocation}
            onChange={(e) => handleShowLocationChange(e.target.checked)}
            disabled={saving}
          />
        </Box>
      </Box>
    </Box>
  );
}

function AccountTab() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(values: PasswordValues) {
    setLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Lock style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Change Password</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="currentPassword" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
            Current Password
          </FormLabel>
          <TextField
            id="currentPassword"
            type="password"
            placeholder="Enter current password"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>{errors.currentPassword.message}</Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="newPassword" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
            New Password
          </FormLabel>
          <TextField
            id="newPassword"
            type="password"
            placeholder="At least 8 characters"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>{errors.newPassword.message}</Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel htmlFor="confirmPassword" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', color: 'text.secondary' }}>
            Confirm New Password
          </FormLabel>
          <TextField
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>{errors.confirmPassword.message}</Typography>
          )}
        </Box>
      </Box>

      <Box
        component={motion.div}
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={loading}
          sx={{
            width: '100%',
            height: 44,
            borderRadius: '12px',
            bgcolor: 'secondary.main',
            color: 'white',
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(var(--mui-palette-secondary-mainChannel) / 0.2)',
            '&:hover': { bgcolor: 'secondary.dark' },
          }}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </Box>
    </Box>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      sx={{ maxWidth: 672, mx: 'auto' }}
    >
      {/* Page heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box
          component={motion.div}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: 'rgba(100,116,139,0.1)',
          }}
        >
          <Settings style={{ height: 20, width: 20, color: '#64748b' }} />
        </Box>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'text.primary' }}>
          Settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <MuiTabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            mb: 3,
            bgcolor: 'action.hover',
            borderRadius: '12px',
            p: 0.5,
            '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', px: 2 },
            '& .MuiTabs-indicator': { display: 'none' },
            '& .Mui-selected': { bgcolor: 'background.paper', borderRadius: '8px', boxShadow: 1 },
            width: { xs: '100%', sm: 'auto' },
            position: { xs: 'sticky', md: 'relative' },
            top: { xs: 52, md: 'auto' },
            zIndex: { xs: 40, md: 'auto' },
          }}
        >
          <MuiTab value="profile" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><User style={{ height: 16, width: 16 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Profile</Box></Box>} sx={{ borderRadius: '8px' }} />
          <MuiTab value="appearance" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Palette style={{ height: 16, width: 16 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Appearance</Box></Box>} sx={{ borderRadius: '8px' }} />
          <MuiTab value="privacy" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Shield style={{ height: 16, width: 16 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Privacy</Box></Box>} sx={{ borderRadius: '8px' }} />
          <MuiTab value="account" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Lock style={{ height: 16, width: 16 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Account</Box></Box>} sx={{ borderRadius: '8px' }} />
        </MuiTabs>

        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'account' && <AccountTab />}
      </Box>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
