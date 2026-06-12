'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { useTheme } from '@mui/material/styles';
import { register as registerUser } from '@/lib/api/auth';
import { fetchCsrfToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GlowButton } from '@/components/cinema';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { toast } from 'sonner';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import {
  authStagger,
  authItem,
  authFieldSx,
  authLinkSx,
  authDividerSx,
} from '../auth-styles';

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

const STRENGTH_EMPTY = 'rgba(255,255,255,0.10)';

interface StrengthPalette {
  error: string;
  warning: string;
  success: string;
  successDark: string;
  empty: string;
}

function getPasswordStrength(
  password: string,
  palette: StrengthPalette,
): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: palette.empty };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: palette.error };
  if (score <= 2) return { score: 2, label: 'Fair', color: palette.warning };
  if (score <= 3) return { score: 3, label: 'Good', color: palette.warning };
  if (score <= 4) return { score: 4, label: 'Strong', color: palette.success };
  return { score: 5, label: 'Very strong', color: palette.successDark };
}

export default function SignUpPage() {
  const router = useRouter();
  const theme = useTheme();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const strengthPalette: StrengthPalette = {
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    successDark: theme.palette.success.dark,
    empty: STRENGTH_EMPTY,
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);
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
  const strength = useMemo(
    () => getPasswordStrength(passwordValue, strengthPalette),
    [passwordValue, strengthPalette],
  );

  async function onSubmit(values: SignUpValues) {
    setLoading(true);
    try {
      await fetchCsrfToken();
      const res = await registerUser(values);
      setUser(res.user);
      toast.success('Account created!');
      router.push('/home');
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
      variants={authStagger}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      {/* Heading */}
      <Box component={motion.div} variants={authItem}>
        <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>Sign up</Typography>
        <Typography
          variant="h4"
          sx={{ ...displaySx, fontSize: '2.25rem' }}
        >
          Create your account
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mt: 1 }}>
          Start preserving your travel memories
        </Typography>
      </Box>

      {/* Social sign-in — Google is wired when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set */}
      <Box
        component={motion.div}
        variants={authItem}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <GoogleSignInButton label="Sign up with Google" />
      </Box>

      {/* Divider */}
      <Box component={motion.div} variants={authItem}>
        <Divider sx={authDividerSx}>or continue with email</Divider>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Box component={motion.div} variants={authItem}>
          <TextField
            label="Username"
            placeholder="traveler"
            fullWidth
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            sx={authFieldSx}
          />
        </Box>

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
          <TextField
            label="Display Name (optional)"
            placeholder="Your Name"
            fullWidth
            {...register('displayName')}
            sx={authFieldSx}
          />
        </Box>

        <Box component={motion.div} variants={authItem}>
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
                      bgcolor: level <= strength.score ? strength.color : STRENGTH_EMPTY,
                    }}
                  />
                ))}
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--cin-text-muted)', mt: 0.5 }}>
                Password strength:{' '}
                <Typography
                  component="span"
                  sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cin-text)' }}
                >
                  {strength.label}
                </Typography>
              </Typography>
            </Box>
          )}
        </Box>

        <Box component={motion.div} variants={authItem}>
          <GlowButton
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ height: 48, fontSize: '1rem' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </GlowButton>
        </Box>
      </Box>

      {/* Link to sign in */}
      <Typography
        component={motion.p}
        variants={authItem}
        sx={{
          fontSize: '0.875rem',
          textAlign: 'center',
          color: 'var(--cin-text-muted)',
        }}
      >
        Already have an account?{' '}
        <Link
          href="/sign-in"
          style={{ textDecoration: 'none' }}
        >
          <Typography component="span" sx={authLinkSx}>
            Sign in
          </Typography>
        </Link>
      </Typography>
    </Box>
  );
}
