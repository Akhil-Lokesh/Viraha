'use client';

import { useState, useEffect } from 'react';
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
import { login } from '@/lib/api/auth';
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

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(values: SignInValues) {
    setLoading(true);
    try {
      await fetchCsrfToken();
      const res = await login(values);
      setUser(res.user);
      toast.success('Welcome back!');
      router.push('/home');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
      const message = typeof errData === 'string' ? errData : errData?.message || 'Invalid credentials';
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
        <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>Sign in</Typography>
        <Typography
          variant="h4"
          sx={{ ...displaySx, fontSize: '2.25rem' }}
        >
          Welcome back
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mt: 1 }}>
          Sign in to continue your journey
        </Typography>
      </Box>

      {/* Social sign-in — Google is wired when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set */}
      <Box
        component={motion.div}
        variants={authItem}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <GoogleSignInButton />
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
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Your password"
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
        </Box>

        <Box
          component={motion.div}
          variants={authItem}
          sx={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Link
            href="/forgot-password"
            style={{ textDecoration: 'none' }}
          >
            <Typography sx={authLinkSx}>Forgot password?</Typography>
          </Link>
        </Box>

        <Box component={motion.div} variants={authItem}>
          <GlowButton
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ height: 48, fontSize: '1rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </GlowButton>
        </Box>
      </Box>

      {/* Link to sign up */}
      <Typography
        component={motion.p}
        variants={authItem}
        sx={{
          fontSize: '0.875rem',
          textAlign: 'center',
          color: 'var(--cin-text-muted)',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          style={{ textDecoration: 'none' }}
        >
          <Typography component="span" sx={authLinkSx}>
            Sign up
          </Typography>
        </Link>
      </Typography>
    </Box>
  );
}
