'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import { register as registerUser } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import Button from '@mui/material/Button';
import { toast } from 'sonner';

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  displayName: z.string().max(100).optional(),
});

type SignUpValues = z.infer<typeof signUpSchema>;

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

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: 'grey.300' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#f97316' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#eab308' };
  if (score <= 4) return { score: 4, label: 'Strong', color: '#10b981' };
  return { score: 5, label: 'Very strong', color: '#059669' };
}

export default function SignUpPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch('password', '');
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  async function onSubmit(values: SignUpValues) {
    setLoading(true);
    try {
      const res = await registerUser(values);
      setUser(res.user);
      toast.success('Account created!');
      router.push('/');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Registration failed';
      toast.error(message);
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
      {/* Heading */}
      <Box component={motion.div} variants={staggerItem}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.875rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Create your account
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>
          Start preserving your travel memories
        </Typography>
      </Box>

      {/* Social buttons (mock, non-functional) */}
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <Button
          type="button"
          variant="outlined"
          disableElevation
          sx={{
            width: '100%',
            height: 48,
            borderRadius: 3,
            gap: 1.5,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
          disabled
        >
          <svg style={{ height: 20, width: 20 }} viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outlined"
          disableElevation
          sx={{
            width: '100%',
            height: 48,
            borderRadius: 3,
            gap: 1.5,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
          disabled
        >
          <svg style={{ height: 20, width: 20 }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </Button>
      </Box>

      {/* Divider */}
      <Box component={motion.div} variants={staggerItem}>
        <Divider
          sx={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            color: 'text.secondary',
            '&::before, &::after': {
              borderColor: 'divider',
            },
          }}
        >
          or continue with email
        </Divider>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Box component={motion.div} variants={staggerItem}>
          <TextField
            label="Username"
            placeholder="traveler"
            fullWidth
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
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
          <TextField
            label="Display Name (optional)"
            placeholder="Your Name"
            fullWidth
            {...register('displayName')}
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
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
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

          {/* Password strength indicator */}
          {passwordValue && (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 0.5, height: 6 }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Box
                    key={level}
                    sx={{
                      height: '100%',
                      flex: 1,
                      borderRadius: 3,
                      transition: 'background-color 0.3s',
                      bgcolor: level <= strength.score ? strength.color : 'action.disabledBackground',
                    }}
                  />
                ))}
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                Password strength:{' '}
                <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {strength.label}
                </Typography>
              </Typography>
            </Box>
          )}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>
      </Box>

      {/* Link to sign in */}
      <Typography
        component={motion.p}
        variants={staggerItem}
        sx={{
          fontSize: '0.875rem',
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        Already have an account?{' '}
        <Link
          href="/sign-in"
          style={{ textDecoration: 'none' }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: '0.875rem',
              color: 'warning.main',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Sign in
          </Typography>
        </Link>
      </Typography>
    </Box>
  );
}
