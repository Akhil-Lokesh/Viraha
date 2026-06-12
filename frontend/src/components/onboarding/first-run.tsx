'use client';

import { useEffect, useState } from 'react';
import { Box, Modal, Typography } from '@mui/material';
import Link from 'next/link';
import { Camera, Map, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CinemaCard } from '@/components/cinema/cinema-card';
import { GlowButton } from '@/components/cinema/glow-button';
import { SectionLabel } from '@/components/cinema/section-label';

const CARDS = [
  { title: 'Post your first memory', href: '/create/post', Icon: Camera },
  { title: 'Explore the world map', href: '/map', Icon: Map },
  { title: 'Find fellow travelers', href: '/explore', Icon: Users },
] as const;

/**
 * One-time welcome overlay for new users. Persists dismissal per user in
 * localStorage so it never nags; renders nothing once seen.
 */
export function FirstRun() {
  const userId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `viraha-onboarded:${userId}`;
    if (!localStorage.getItem(key)) setOpen(true);
  }, [userId]);

  const dismiss = () => {
    if (userId) localStorage.setItem(`viraha-onboarded:${userId}`, '1');
    setOpen(false);
  };

  if (!userId) return null;

  return (
    <Modal open={open} onClose={dismiss} aria-labelledby="welcome-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(560px, 92vw)',
          bgcolor: 'var(--cin-surface, #141419)',
          borderRadius: '18px',
          border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          p: 4,
          outline: 'none',
        }}
      >
        <SectionLabel>Welcome to Viraha</SectionLabel>
        <Typography
          id="welcome-title"
          sx={{
            fontFamily: 'Posterama, var(--font-body)',
            fontWeight: 700,
            fontSize: 26,
            color: 'var(--cin-text, #F4F4F6)',
            mb: 3,
          }}
        >
          Three ways to start
        </Typography>
        {CARDS.map(({ title, href, Icon }) => (
          <CinemaCard
            key={href}
            sx={{
              p: 2,
              mb: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon size={20} color="var(--cin-accent, #8B7CFF)" />
              <Typography sx={{ color: 'var(--cin-text, #F4F4F6)' }}>
                {title}
              </Typography>
            </Box>
            <GlowButton component={Link} href={href} onClick={dismiss}>
              Go
            </GlowButton>
          </CinemaCard>
        ))}
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <GlowButton variant="ghost" onClick={dismiss}>
            Skip for now
          </GlowButton>
        </Box>
      </Box>
    </Modal>
  );
}
