'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { resetPassword } from '@/lib/api/auth';
import { fetchCsrfToken } from '@/lib/api/client';
import { CinemaCard, GlowButton } from '@/components/cinema';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { toast } from 'sonner';
import {
  authStagger,
  authItem,
  authFieldSx,
  authLinkSx,
  statusChipSx,
} from '../auth-styles';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  async function onSubmit(values: ResetValues) {
    if (!token) return;
    setLoading(true);
    try {
      await fetchCsrfToken();
      await resetPassword(token, values.newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Failed to reset password. The link may be invalid or expired.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Box
        component={motion.div}
        variants={authStagger}
        initial="hidden"
        animate="visible"
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <Box
          component={motion.div}
          variants={authItem}
          sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ ...displaySx, fontSize: '1.5rem' }}
          >
            Invalid reset link
          </Typography>
          <Typography sx={{ color: 'var(--cin-text-muted)' }}>
            This password reset link is invalid. Please request a new one.
          </Typography>
          <Link
            href="/forgot-password"
            style={{ textDecoration: 'none' }}
          >
            <Typography sx={authLinkSx}>
              Request new reset link
            </Typography>
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={authStagger}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <Box component={motion.div} variants={authItem}>
        <Link
          href="/sign-in"
          style={{ textDecoration: 'none' }}
        >
          <Box
            component={motion.span}
            whileHover={{ x: 2 }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.875rem',
              color: 'var(--cin-text-muted)',
              mb: 3,
              '&:hover': { color: 'var(--cin-text)' },
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to sign in
          </Box>
        </Link>
        <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>Account recovery</Typography>
        <Typography
          variant="h4"
          sx={{ ...displaySx, fontSize: '2.25rem' }}
        >
          New password
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mt: 1 }}>
          Choose a strong password for your account
        </Typography>
      </Box>

      {success ? (
        <Box component={motion.div} variants={authItem}>
          <CinemaCard
            hover={false}
            sx={{
              p: 4,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ ...statusChipSx, color: 'var(--cin-accent)' }}>
              <CheckCircle style={{ width: 24, height: 24, color: 'inherit' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--cin-text)',
              }}
            >
              Password updated
            </Typography>
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'var(--cin-text-muted)',
                maxWidth: 320,
              }}
            >
              Your password has been reset. You can now sign in with your new password.
            </Typography>
            <Link
              href="/sign-in"
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={{ ...authLinkSx, mt: 1 }}>
                Sign in
              </Typography>
            </Link>
          </CinemaCard>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Box component={motion.div} variants={authItem}>
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              fullWidth
              {...register('newPassword')}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        sx={{ color: 'var(--cin-text-muted)' }}
                      >
                        {showPassword ? (
                          <EyeOff style={{ width: 20, height: 20 }} />
                        ) : (
                          <Eye style={{ width: 20, height: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={authFieldSx}
            />
          </Box>

          <Box component={motion.div} variants={authItem}>
            <TextField
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              fullWidth
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={authFieldSx}
            />
          </Box>

          <Box component={motion.div} variants={authItem}>
            <GlowButton
              type="submit"
              fullWidth
              disabled={loading}
              sx={{ height: 48, fontSize: '1rem' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </GlowButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress size={24} sx={{ color: 'var(--cin-accent)' }} />
        </Box>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
