'use client';

import { useState } from 'react';
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
import Button from '@mui/material/Button';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
          Reset password
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>
          Enter your email and we&apos;ll send you a reset link
        </Typography>
      </Box>

      {sent ? (
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
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(159, 143, 204, 0.1)'
                  : 'rgba(123, 111, 160, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail style={{ width: 24, height: 24, color: 'inherit' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Check your inbox
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              maxWidth: 320,
            }}
          >
            If an account with that email exists, we&apos;ve sent a password reset link.
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
              Return to sign in
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
              label="Email"
              type="email"
              placeholder="you@example.com"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
