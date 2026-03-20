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
import Button from '@mui/material/Button';
import { toast } from 'sonner';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetValues = z.infer<typeof resetSchema>;

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

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
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Invalid reset link
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            This password reset link is invalid. Please request a new one.
          </Typography>
          <Link
            href="/forgot-password"
            style={{ textDecoration: 'none' }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'primary.main',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
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
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <Box component={motion.div} variants={staggerItem}>
        <Link
          href="/sign-in"
          style={{ textDecoration: 'none' }}
        >
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
            Back to sign in
          </Box>
        </Link>
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.875rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          New password
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>
          Choose a strong password for your account
        </Typography>
      </Box>

      {success ? (
        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{
            borderRadius: 4,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle style={{ width: 24, height: 24, color: '#059669' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Password updated
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              maxWidth: 320,
            }}
          >
            Your password has been reset. You can now sign in with your new password.
          </Typography>
          <Link
            href="/sign-in"
            style={{ textDecoration: 'none' }}
          >
            <Typography
              sx={{
                mt: 1,
                fontSize: '0.875rem',
                color: 'primary.main',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign in
            </Typography>
          </Link>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Box component={motion.div} variants={staggerItem}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 48,
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <Box component={motion.div} variants={staggerItem}>
            <TextField
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              fullWidth
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 48,
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <Box component={motion.div} variants={staggerItem}>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                width: '100%',
                height: 48,
                borderRadius: 3,
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: 'warning.dark',
                },
              }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
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
          <CircularProgress size={24} />
        </Box>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
