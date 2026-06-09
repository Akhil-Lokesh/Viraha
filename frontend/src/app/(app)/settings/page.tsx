'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
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
  Download,
  Trash2,
  UserX,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/settings/section-eyebrow';
import { TicketDivider } from '@/components/settings/ticket-divider';
import { paperPanelSx, VIRAHA_GOLD } from '@/components/settings/paper-panel';
import { SessionsSection } from '@/components/settings/sessions-section';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateProfile, exportData, deleteAccount } from '@/lib/api/users';
import { changePassword, logoutApi } from '@/lib/api/auth';
import { uploadAvatar } from '@/lib/api/media';
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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Avatar section */}
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={paperPanelSx}
      >
        <SectionEyebrow gold>Traveler</SectionEyebrow>
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

      <TicketDivider />

      {/* Form fields */}
      <Box
        component={motion.div}
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ ...paperPanelSx, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <SectionEyebrow gold>About you</SectionEyebrow>
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
          {errors.displayName && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {errors.displayName.message}
            </Typography>
          )}
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
          {errors.bio && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {errors.bio.message}
            </Typography>
          )}
        </Box>
      </Box>

      <TicketDivider />

      {/* Home location */}
      <Box
        component={motion.div}
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={paperPanelSx}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapPin style={{ height: 14, width: 14, color: VIRAHA_GOLD, marginBottom: 8 }} />
          <SectionEyebrow gold>Home base</SectionEyebrow>
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
            {errors.homeCity && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {errors.homeCity.message}
              </Typography>
            )}
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
            {errors.homeCountry && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {errors.homeCountry.message}
              </Typography>
            )}
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
            borderRadius: '10px',
            bgcolor: 'secondary.main',
            fontWeight: 500,
            boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.18)',
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
        sx={paperPanelSx}
      >
        <SectionEyebrow gold>Theme</SectionEyebrow>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Choose how your journal looks.
        </Typography>
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
                  borderRadius: '10px',
                  border: '1.5px solid',
                  p: 2,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  bgcolor: isActive ? 'rgba(212, 168, 67, 0.08)' : 'transparent',
                  borderColor: isActive ? VIRAHA_GOLD : 'divider',
                  ...(isActive
                    ? {
                        boxShadow: '2px 2px 0 rgba(212, 168, 67, 0.25)',
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
                      ? { bgcolor: 'rgba(212, 168, 67, 0.12)', color: VIRAHA_GOLD }
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
                    sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', bgcolor: VIRAHA_GOLD }}
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
  const [showLocation, setShowLocation] = useState(user?.showLocation ?? true);
  const [saving, setSaving] = useState(false);
  const [confirmPrivateOpen, setConfirmPrivateOpen] = useState(false);

  async function persistPrivate(value: boolean) {
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

  function handlePrivateChange(value: boolean) {
    // Optimistic toggle, then confirm before persisting when switching ON.
    setIsPrivate(value);
    if (value) {
      setConfirmPrivateOpen(true);
      return;
    }
    void persistPrivate(value);
  }

  function handleConfirmPrivate() {
    setConfirmPrivateOpen(false);
    void persistPrivate(true);
  }

  function handleCancelPrivate() {
    setConfirmPrivateOpen(false);
    setIsPrivate(false);
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
        sx={{ ...paperPanelSx, display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <SectionEyebrow gold>Visibility</SectionEyebrow>
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

        <Box sx={{ borderTop: '1px dashed', borderColor: 'divider' }} />

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

      <TicketDivider />

      {/* Muted & blocked accounts */}
      <Box
        component={motion.div}
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ ...paperPanelSx, p: 2 }}
      >
        <Box sx={{ px: 1, pt: 0.5 }}>
          <SectionEyebrow gold>Muted &amp; blocked</SectionEyebrow>
        </Box>
        <Box
          component={Link}
          href="/settings/muted"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <VolumeX style={{ height: 18, width: 18, color: 'var(--mui-palette-text-secondary)' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Muted accounts
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Hidden from your feed — they&apos;re never notified.
            </Typography>
          </Box>
          <ChevronRight style={{ height: 18, width: 18, color: 'var(--mui-palette-text-secondary)' }} />
        </Box>
        <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', mx: 1.5 }} />
        <Box
          component={Link}
          href="/settings/blocked"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <UserX style={{ height: 18, width: 18, color: 'var(--mui-palette-text-secondary)' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Blocked accounts
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Manage the accounts you&apos;ve blocked.
            </Typography>
          </Box>
          <ChevronRight style={{ height: 18, width: 18, color: 'var(--mui-palette-text-secondary)' }} />
        </Box>
      </Box>

      <MuiDialog
        open={confirmPrivateOpen}
        onClose={handleCancelPrivate}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(245,158,11,0.1)',
            }}
          >
            <Shield style={{ height: 24, width: 24, color: '#D97706' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Switch to a private account?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
            Switching to private means your future posts won&apos;t appear in public
            feeds. Followers will continue to see them.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            type="button"
            variant="contained"
            disableElevation
            onClick={handleConfirmPrivate}
            disabled={saving}
            sx={{ width: '100%', bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            {saving ? 'Saving...' : 'Make account private'}
          </Button>
          <Button
            type="button"
            variant="text"
            disableElevation
            onClick={handleCancelPrivate}
            disabled={saving}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Box>
  );
}

function AccountTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
      toast.success('Your data export has started downloading');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Failed to export your data';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteConfirm('');
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm !== user.username) return;
    setDeleting(true);
    try {
      await deleteAccount(deleteConfirm);
      // Best-effort server logout; the account row is already gone either way.
      try {
        await logoutApi();
      } catch {
        // Account is deleted; ignore a failed logout call.
      }
      logout();
      toast.success('Your account has been deleted');
      router.replace('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Failed to delete your account';
      toast.error(message);
      setDeleting(false);
    }
  }

  const deleteEnabled = !!user && deleteConfirm === user.username && !deleting;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component={motion.div}
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ ...paperPanelSx, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box>
          <SectionEyebrow gold>Security</SectionEyebrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Change Password</Typography>
          </Box>
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
            borderRadius: '10px',
            bgcolor: 'secondary.main',
            fontWeight: 500,
            boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.18)',
            '&:hover': { bgcolor: 'secondary.dark' },
          }}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </Box>

      <TicketDivider />

      {/* Active sessions */}
      <Box
        component={motion.div}
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <SessionsSection />
      </Box>

      <TicketDivider />

      {/* Download your data */}
      <Box
        component={motion.div}
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ ...paperPanelSx, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box>
          <SectionEyebrow gold>Your data</SectionEyebrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Download style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Download your data</Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Export a copy of your posts, journals, albums, saves, and account details as a JSON file.
        </Typography>
        <Button
          type="button"
          variant="outlined"
          disableElevation
          onClick={handleExport}
          disabled={exporting}
          startIcon={<Download style={{ height: 16, width: 16 }} />}
          sx={{ alignSelf: 'flex-start', borderRadius: '12px' }}
        >
          {exporting ? 'Preparing...' : 'Download your data'}
        </Button>
      </Box>

      <TicketDivider />

      {/* Danger Zone */}
      <Box
        component={motion.div}
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        sx={{ ...paperPanelSx, borderColor: 'error.main', boxShadow: '2px 2px 0 rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Trash2 style={{ height: 16, width: 16, color: 'var(--mui-palette-error-main)' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>Danger Zone</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </Typography>
        <Button
          type="button"
          variant="outlined"
          color="error"
          disableElevation
          onClick={() => setDeleteOpen(true)}
          startIcon={<Trash2 style={{ height: 16, width: 16 }} />}
          sx={{ alignSelf: 'flex-start', borderRadius: '12px' }}
        >
          Delete account
        </Button>
      </Box>

      {/* Delete confirmation dialog */}
      <MuiDialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(239,68,68,0.1)',
            }}
          >
            <Trash2 style={{ height: 24, width: 24, color: 'var(--mui-palette-error-main)' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Delete your account?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
            This permanently deletes your account, posts, journals, and saved memories. This
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="deleteConfirm" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>
              Type <Box component="strong" sx={{ color: 'text.primary' }}>{user?.username}</Box> to confirm
            </FormLabel>
            <TextField
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user?.username || 'your username'}
              variant="outlined"
              size="small"
              fullWidth
              autoComplete="off"
              disabled={deleting}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            type="button"
            variant="contained"
            color="error"
            disableElevation
            onClick={handleDeleteAccount}
            disabled={!deleteEnabled}
            sx={{ width: '100%' }}
          >
            {deleting ? 'Deleting...' : 'Permanently delete account'}
          </Button>
          <Button
            type="button"
            variant="text"
            disableElevation
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Box>
  );
}

const VALID_TABS = ['profile', 'appearance', 'privacy', 'account'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : 'profile';

  function handleTabChange(value: string) {
    if (!isSettingsTab(value)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

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
          animate={{ scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '8px',
            border: '1.5px solid',
            borderColor: VIRAHA_GOLD,
          }}
        >
          <Settings style={{ height: 20, width: 20, color: 'var(--viraha-gold, #D4A843)' }} />
        </Box>
        <Box>
          <Box
            component="p"
            sx={{
              m: 0,
              fontFamily: 'var(--font-brand, Posterama, sans-serif)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            The keepsake · Your account
          </Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'var(--font-accent, var(--font-heading))', fontWeight: 600, color: 'text.primary' }}
          >
            Settings
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <MuiTabs
          value={activeTab}
          onChange={(_, v) => handleTabChange(v)}
          sx={{
            minHeight: 36,
            mb: 3,
            bgcolor: 'action.hover',
            borderRadius: '12px',
            p: 0.5,
            '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', px: 2 },
            '& .MuiTabs-indicator': { display: 'none' },
            '& .Mui-selected': {
              bgcolor: 'background.paper',
              borderRadius: '8px',
              boxShadow: '1px 1px 0 rgba(34, 28, 24, 0.12)',
              color: `${VIRAHA_GOLD} !important`,
            },
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
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
