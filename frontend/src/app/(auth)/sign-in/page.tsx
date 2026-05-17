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
import Button from '@mui/material/Button';
import { toast } from 'sonner';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

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
          Welcome back
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>
          Sign in to continue your journey
        </Typography>
      </Box>

      {/* Social sign-in — Google is wired when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set */}
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <GoogleSignInButton />
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

        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Link
            href="/forgot-password"
            style={{ textDecoration: 'none' }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'warning.main',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Forgot password?
            </Typography>
          </Link>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
      </Box>

      {/* Link to sign up */}
      <Typography
        component={motion.p}
        variants={staggerItem}
        sx={{
          fontSize: '0.875rem',
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
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
            Sign up
          </Typography>
        </Link>
      </Typography>
    </Box>
  );
}
