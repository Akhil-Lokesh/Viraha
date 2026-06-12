'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Map, Camera, Compass, ChevronDown, MapPin } from 'lucide-react';
import { CinemaCard, GlowButton } from '@/components/cinema';
import { displaySx, glowRing } from '@/lib/design/cinema-tokens';
import { SectionHeader } from '@/components/shared/section-header';
import { StatCard } from '@/components/shared/stat-card';
import { heroPhotos, mockTrips, mockUsers } from '@/lib/mock-data';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from '@/lib/animations';

// ─── Hero Section ──────────────────────────────────────
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <Box
      ref={ref}
      component="section"
      sx={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--cin-bg)',
      }}
    >
      {/* Background image with parallax */}
      <Box component={motion.div} sx={{ position: 'absolute', inset: 0 }} style={{ y }}>
        <Image
          src={heroPhotos[0]}
          alt="Travel landscape"
          fill
          priority
          style={{ objectFit: 'cover' }}
          sizes="100vw"
        />
      </Box>

      {/* Dark-room gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(11,11,15,0.88) 0%, rgba(11,11,15,0.35) 40%, rgba(11,11,15,0.08) 70%, transparent 100%)',
        }}
      />

      {/* Additional top vignette for navbar readability */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 160,
          background: 'linear-gradient(to bottom, rgba(11,11,15,0.5), transparent)',
        }}
      />

      {/* Content */}
      <Box
        component={motion.div}
        style={{ opacity }}
        sx={{ position: 'relative', zIndex: 10, textAlign: 'center', px: 2, maxWidth: 896, mx: 'auto' }}
      >
        <Typography
          component={motion.h1}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          sx={{
            ...displaySx,
            fontSize: { xs: '3rem', md: '4.5rem', lg: '6rem' },
          }}
        >
          Keep your travels alive
        </Typography>

        <Typography
          component={motion.p}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          sx={{
            mt: { xs: 3, md: 4 },
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            color: 'rgba(244,244,246,0.82)',
            maxWidth: 672,
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          The ache of separation from what you love. Preserve every journey, map
          every memory, share your story.
        </Typography>

        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          sx={{
            mt: { xs: 4, md: 5 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <GlowButton
            size="large"
            component={Link}
            href="/sign-up"
            sx={{ px: 4, height: 48, fontSize: '1rem' }}
          >
            Start Your Journey
          </GlowButton>
          <GlowButton
            variant="ghost"
            size="large"
            component={Link}
            href="/sign-in"
            sx={{
              px: 4,
              height: 48,
              fontSize: '1rem',
              bgcolor: 'rgba(11,11,15,0.35)',
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: 'rgba(11,11,15,0.55)' },
            }}
          >
            Sign In
          </GlowButton>
        </Box>
      </Box>

      {/* Scroll indicator */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        sx={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          sx={{ color: 'var(--cin-text-muted)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Scroll
        </Typography>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown style={{ height: 20, width: 20, color: 'var(--cin-text-muted)' }} />
        </motion.div>
      </Box>
    </Box>
  );
}

// ─── Features Section ──────────────────────────────────
const features = [
  {
    icon: Map,
    title: 'Map Your Memories',
    description:
      'Every pin on the map is a story. Watch your journey unfold across continents.',
  },
  {
    icon: Camera,
    title: 'Tell Your Story',
    description:
      'Posts, albums, and journals — capture your travels the way you want to remember them.',
  },
  {
    icon: Compass,
    title: 'Discover Places',
    description:
      'Find inspiration from fellow travelers. Explore the world through authentic stories.',
  },
];

function FeaturesSection() {
  return (
    <Box component="section" id="features" className="section-spacing" sx={{ bgcolor: 'var(--cin-bg)' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <SectionHeader
          title="Your Journey, Beautifully Preserved"
          subtitle="Everything you need to capture, organize, and relive your travel memories in one place."
        />

        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          sx={{
            mt: 8,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: { xs: 3, lg: 4 },
          }}
        >
          {features.map((feature) => (
            <Box key={feature.title} component={motion.div} variants={staggerItem}>
              <CinemaCard sx={{ p: 4, height: '100%' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    mb: 3,
                    bgcolor: 'rgba(139,124,255,0.12)',
                    color: 'var(--cin-accent)',
                  }}
                >
                  <feature.icon style={{ height: 24, width: 24 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--cin-text)' }}
                >
                  {feature.title}
                </Typography>
                <Typography sx={{ mt: 1.5, color: 'var(--cin-text-muted)', lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CinemaCard>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Preview Section ───────────────────────────────────
function PreviewSection() {
  const trip = mockTrips[0]; // Greek Island Hopping
  const user = mockUsers[0]; // Nina Soleil

  return (
    <Box component="section" className="section-spacing" sx={{ overflow: 'hidden', bgcolor: 'var(--cin-bg)' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <SectionHeader
          title="See Your Travels Come Alive"
          subtitle="Beautiful trip cards, interactive routes, and a visual timeline that tells your story."
        />

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            sx={{ position: 'relative', width: '100%', maxWidth: 512 }}
          >
            {/* Main trip card */}
            <Box
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              sx={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--cin-hairline)',
                cursor: 'pointer',
                transition: 'box-shadow .2s ease',
                '&:hover': { boxShadow: glowRing(1) },
                '&:hover img': { transform: 'scale(1.05)' },
              }}
            >
              {/* Trip photo */}
              <Box sx={{ position: 'relative', aspectRatio: '4/5' }}>
                <Image
                  src={trip.coverPhoto}
                  alt={trip.title}
                  fill
                  style={{ objectFit: 'cover', transition: 'transform 0.7s' }}
                  sizes="(max-width: 768px) 100vw, 512px"
                />

                {/* Bottom vignette */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(11,11,15,0.85), rgba(11,11,15,0.25), transparent)',
                  }}
                />

                {/* Location badge */}
                <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      bgcolor: 'rgba(11,11,15,0.55)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--cin-text)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '9999px',
                      border: '1px solid var(--cin-hairline)',
                    }}
                  >
                    <MapPin style={{ height: 12, width: 12 }} />
                    {trip.locations[1]?.city}, {trip.locations[1]?.country}
                  </Box>
                </Box>

                {/* Photo count */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: 'rgba(11,11,15,0.55)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--cin-text)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '9999px',
                      border: '1px solid var(--cin-hairline)',
                    }}
                  >
                    <Camera style={{ height: 12, width: 12 }} />
                    {trip.postCount}
                  </Box>
                </Box>

                {/* Bottom content */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3 }}>
                  {/* User info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.3)',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={user.avatar || ''}
                        alt={user.displayName || user.username}
                        width={36}
                        height={36}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ color: 'var(--cin-text)', fontSize: '0.875rem', fontWeight: 500 }}>
                        {user.displayName}
                      </Typography>
                      <Typography sx={{ color: 'var(--cin-text-muted)', fontSize: '0.75rem' }}>
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Trip title */}
                  <Typography
                    sx={{ ...displaySx, fontSize: '1.5rem', lineHeight: 1.15 }}
                  >
                    {trip.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      color: 'rgba(244,244,246,0.72)',
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                    }}
                  >
                    {trip.description}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Route dots below the card */}
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}
            >
              {trip.locations.map((location, index) => (
                <Box key={location.id} sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Dot */}
                  <Box
                    component={motion.div}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.6 + index * 0.15,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: 'var(--cin-accent)',
                        border: '2px solid var(--cin-bg)',
                        boxShadow: '0 0 12px var(--cin-accent-glow)',
                      }}
                    />
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: '11px',
                        color: 'var(--cin-text-muted)',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {location.city}
                    </Typography>
                  </Box>

                  {/* Connecting line */}
                  {index < trip.locations.length - 1 && (
                    <Box
                      component={motion.div}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.7 + index * 0.15,
                        duration: 0.4,
                        ease: 'easeOut',
                      }}
                      sx={{
                        width: { xs: 64, sm: 96 },
                        height: 2,
                        background:
                          'linear-gradient(to right, rgba(139,124,255,0.6), rgba(139,124,255,0.3))',
                        transformOrigin: 'left',
                        mb: 2.5,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Stats Section ─────────────────────────────────────
function StatsSection() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'var(--cin-surface)',
        borderTop: '1px solid var(--cin-hairline)',
        borderBottom: '1px solid var(--cin-hairline)',
      }}
    >
      {/* Accent glow + subtle dot pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(139,124,255,0.12), transparent 60%)',
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </Box>

      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 }, position: 'relative', zIndex: 10 }}>
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          sx={{ textAlign: 'center', mb: 7 }}
        >
          <Typography
            sx={{
              ...displaySx,
              fontSize: { xs: '1.875rem', md: '2.25rem' },
            }}
          >
            Join travelers preserving memories
          </Typography>
          <Typography
            sx={{ mt: 1.5, fontSize: '1.125rem', color: 'var(--cin-text-muted)', maxWidth: 576, mx: 'auto' }}
          >
            A growing community of people who believe travel stories deserve to
            be kept alive.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 4, maxWidth: 768, mx: 'auto' }}>
          <StatCard value={10000} suffix="+" label="Memories Preserved" />
          <StatCard value={50} suffix="+" label="Countries Explored" />
          <StatCard value={5000} suffix="+" label="Stories Shared" />
        </Box>
      </Box>
    </Box>
  );
}

// ─── CTA Section ───────────────────────────────────────
function CTASection() {
  return (
    <Box
      component="section"
      className="section-spacing"
      sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'var(--cin-bg)' }}
    >
      {/* Subtle accent gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent, rgba(139,124,255,0.05), transparent)',
        }}
      />

      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 }, position: 'relative', zIndex: 10 }}>
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          sx={{ textAlign: 'center', maxWidth: 672, mx: 'auto' }}
        >
          <Typography
            sx={{
              ...displaySx,
              fontSize: { xs: '1.875rem', md: '2.25rem' },
            }}
          >
            Ready to start your journey?
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '1.125rem', color: 'var(--cin-text-muted)' }}>
            Your travels deserve more than a camera roll. Give them a home.
          </Typography>
          <Box
            component={motion.div}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            sx={{ mt: 4 }}
          >
            <GlowButton
              size="large"
              component={Link}
              href="/sign-up"
              sx={{ px: 5, height: 48, fontSize: '1rem' }}
            >
              Create Free Account
            </GlowButton>
          </Box>
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'var(--cin-text-muted)' }}>
            Free forever. No credit card required.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Landing Page ──────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PreviewSection />
      <StatsSection />
      <CTASection />
    </>
  );
}
