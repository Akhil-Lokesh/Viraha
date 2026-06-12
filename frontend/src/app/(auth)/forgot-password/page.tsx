'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { forgotPassword } from '@/lib/api/auth';
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

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(values: ForgotValues) {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setSent(true);
      toast.success('Check your email for a reset link');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Reset password
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mt: 1 }}>
          Enter your email and we&apos;ll send you a reset link
        </Typography>
      </Box>

      {sent ? (
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
              <Mail style={{ width: 24, height: 24, color: 'inherit' }} />
            </Box>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--cin-text)',
              }}
            >
              Check your inbox
            </Typography>
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'var(--cin-text-muted)',
                maxWidth: 320,
              }}
            >
              If an account with that email exists, we&apos;ve sent a password reset link.
            </Typography>
            <Link
              href="/sign-in"
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={{ ...authLinkSx, mt: 1 }}>
                Return to sign in
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
              label="Email"
              type="email"
              placeholder="you@example.com"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </GlowButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
