'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { useAuthStore } from '@/lib/stores/auth-store';
import { exportData, deleteAccount } from '@/lib/api/users';
import { changePassword, logoutApi } from '@/lib/api/auth';
import { SessionsSection } from './sessions-section';
import {
  inputSx,
  labelSx,
  dialogPaperSx,
  dangerOutlineSx,
  settingsStagger,
  settingsItem,
} from './cinema-settings';
import { FieldError } from './field-error';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountTab() {
  const reduceMotion = useReducedMotion();
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
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      variants={settingsStagger}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Change password */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <SectionLabel>Security</SectionLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock style={{ height: 16, width: 16, color: CIN.textMuted }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text }}>
                Change Password
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="currentPassword" sx={labelSx}>
              Current Password
            </FormLabel>
            <TextField
              id="currentPassword"
              type="password"
              placeholder="Enter current password"
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
              {...register('currentPassword')}
            />
            <FieldError message={errors.currentPassword?.message} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="newPassword" sx={labelSx}>
              New Password
            </FormLabel>
            <TextField
              id="newPassword"
              type="password"
              placeholder="At least 8 characters"
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
              {...register('newPassword')}
            />
            <FieldError message={errors.newPassword?.message} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="confirmPassword" sx={labelSx}>
              Confirm New Password
            </FormLabel>
            <TextField
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              variant="outlined"
              size="small"
              fullWidth
              sx={inputSx}
              {...register('confirmPassword')}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </Box>
        </CinemaCard>
      </motion.div>

      <motion.div variants={settingsItem}>
        <GlowButton type="submit" disabled={loading} sx={{ width: '100%', height: 44 }}>
          {loading ? 'Changing...' : 'Change Password'}
        </GlowButton>
      </motion.div>

      {/* Active sessions */}
      <motion.div variants={settingsItem}>
        <SessionsSection />
      </motion.div>

      {/* Download your data */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <SectionLabel>Your data</SectionLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Download style={{ height: 16, width: 16, color: CIN.textMuted }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text }}>
                Download your data
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: CIN.textMuted }}>
            Export a copy of your posts, journals, albums, saves, and account details as a JSON file.
          </Typography>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={handleExport}
            disabled={exporting}
            startIcon={<Download style={{ height: 16, width: 16 }} />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {exporting ? 'Preparing...' : 'Download your data'}
          </GlowButton>
        </CinemaCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={settingsItem}>
        <CinemaCard
          hover={false}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderColor: 'rgba(255,107,107,0.35)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trash2 style={{ height: 16, width: 16, color: CIN.danger }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: CIN.danger }}>
              Danger Zone
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: CIN.textMuted }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Typography>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            startIcon={<Trash2 style={{ height: 16, width: 16 }} />}
            sx={{ alignSelf: 'flex-start', ...dangerOutlineSx }}
          >
            Delete account
          </GlowButton>
        </CinemaCard>
      </motion.div>

      {/* Delete confirmation dialog */}
      <MuiDialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
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
              bgcolor: 'rgba(255,107,107,0.12)',
            }}
          >
            <Trash2 style={{ height: 24, width: 24, color: CIN.danger }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, textAlign: 'center', color: CIN.text }}>
            Delete your account?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: CIN.textMuted, mb: 2 }}>
            This permanently deletes your account, posts, journals, and saved memories. This
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormLabel htmlFor="deleteConfirm" sx={labelSx}>
              Type <Box component="strong" sx={{ color: CIN.text }}>{user?.username}</Box> to confirm
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
              sx={inputSx}
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <GlowButton
            type="button"
            onClick={handleDeleteAccount}
            disabled={!deleteEnabled}
            sx={{
              width: '100%',
              bgcolor: CIN.danger,
              color: '#0B0B0F',
              '&:hover': {
                bgcolor: CIN.danger,
                boxShadow: `0 0 0 1px ${CIN.danger}, 0 8px 32px rgba(255,107,107,0.35)`,
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Permanently delete account'}
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{ width: '100%' }}
          >
            Cancel
          </GlowButton>
        </MuiDialogActions>
      </MuiDialog>
    </motion.form>
  );
}
