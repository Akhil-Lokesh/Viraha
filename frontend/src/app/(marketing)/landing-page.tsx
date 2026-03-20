'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Map, Camera, Compass, ChevronDown, MapPin } from 'lucide-react';
import Button from '@mui/material/Button';
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

      {/* Gradient overlay */}
      <Box sx={{ position: 'absolute', inset: 0 }} className="gradient-hero" />

      {/* Additional top vignette for navbar readability */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 160,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
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
            fontSize: { xs: '3rem', md: '4.5rem', lg: '6rem' },
            fontFamily: 'var(--font-heading)',
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
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
            color: 'rgba(255,255,255,0.8)',
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
          <Button
            variant="contained"
            disableElevation
            size="large"
            component={Link}
            href="/sign-up"
            sx={{
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              '&:hover': { bgcolor: 'secondary.dark' },
              borderRadius: '9999px',
              px: 4,
              height: 48,
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 4px 14px rgba(var(--mui-palette-secondary-mainChannel) / 0.25)',
            }}
          >
            Start Your Journey
          </Button>
          <Button
            size="large"
            variant="text"
            disableElevation
            component={Link}
            href="/sign-in"
            sx={{
              color: 'white',
              border: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: 'white' },
              borderRadius: '9999px',
              px: 4,
              height: 48,
              fontSize: '1rem',
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
            }}
          >
            Sign In
          </Button>
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
          sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Scroll
        </Typography>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown style={{ height: 20, width: 20, color: 'rgba(255,255,255,0.6)' }} />
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
    color: { bgcolor: 'rgba(var(--viraha-deep-channel, 88,28,135) / 0.1)', color: 'var(--viraha-deep, #581C87)' },
  },
  {
    icon: Camera,
    title: 'Tell Your Story',
    description:
      'Posts, albums, and journals \u2014 capture your travels the way you want to remember them.',
    color: { bgcolor: 'rgba(var(--viraha-teal-channel, 20,184,166) / 0.1)', color: 'var(--viraha-teal, #14B8A6)' },
  },
  {
    icon: Compass,
    title: 'Discover Places',
    description:
      'Find inspiration from fellow travelers. Explore the world through authentic stories.',
    color: { bgcolor: 'rgba(var(--viraha-teal-700-channel, 15,118,110) / 0.1)', color: 'var(--viraha-teal-700, #0F766E)' },
  },
];

function FeaturesSection() {
  return (
    <Box component="section" id="features" className="section-spacing">
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
            <Box
              key={feature.title}
              component={motion.div}
              variants={staggerItem}
              sx={{
                borderRadius: '16px',
                p: 4,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                '&:hover': { borderColor: 'divider', boxShadow: 3 },
                transition: 'all 0.3s',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  mb: 3,
                  transition: 'transform 0.3s',
                  ...feature.color,
                }}
              >
                <feature.icon style={{ height: 24, width: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                {feature.title}
              </Typography>
              <Typography sx={{ mt: 1.5, color: 'text.secondary', lineHeight: 1.6 }}>
                {feature.description}
              </Typography>
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
    <Box component="section" className="section-spacing" sx={{ overflow: 'hidden' }}>
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
              whileHover={{
                rotateY: -2,
                rotateX: 1,
                scale: 1.02,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ perspective: 1000 }}
              sx={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
                cursor: 'pointer',
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

                {/* Gradient overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)',
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
                      bgcolor: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(12px)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '9999px',
                      border: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
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
                      bgcolor: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(12px)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '9999px',
                      border: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
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
                        border: 2,
                        borderColor: 'rgba(255,255,255,0.3)',
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
                      <Typography sx={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>
                        {user.displayName}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Trip title */}
                  <Typography
                    sx={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'white', lineHeight: 1.2 }}
                  >
                    {trip.title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      color: 'rgba(255,255,255,0.7)',
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
                        bgcolor: 'secondary.main',
                        border: 2,
                        borderColor: 'background.default',
                        boxShadow: 2,
                      }}
                    />
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: '11px',
                        color: 'text.secondary',
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
                        background: (theme) =>
                          `linear-gradient(to right, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}4D)`,
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
      className="gradient-warm"
      sx={{ py: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle pattern overlay */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
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
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.01em',
            }}
          >
            Join travelers preserving memories
          </Typography>
          <Typography
            sx={{ mt: 1.5, fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', maxWidth: 576, mx: 'auto' }}
          >
            A growing community of people who believe travel stories deserve to
            be kept alive.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 4, maxWidth: 768, mx: 'auto' }}>
          <Box sx={{ color: 'white', '& div': { color: 'white' }, '& .MuiTypography-root': { color: 'white' } }}>
            <StatCard value={10000} suffix="+" label="Memories Preserved" />
          </Box>
          <Box sx={{ color: 'white', '& div': { color: 'white' }, '& .MuiTypography-root': { color: 'white' } }}>
            <StatCard value={50} suffix="+" label="Countries Explored" />
          </Box>
          <Box sx={{ color: 'white', '& div': { color: 'white' }, '& .MuiTypography-root': { color: 'white' } }}>
            <StatCard value={5000} suffix="+" label="Stories Shared" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── CTA Section ───────────────────────────────────────
function CTASection() {
  return (
    <Box component="section" className="section-spacing" sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Subtle radial gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent, rgba(var(--mui-palette-secondary-mainChannel) / 0.03), transparent)',
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
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              fontWeight: 'bold',
              letterSpacing: '-0.01em',
            }}
          >
            Ready to start your journey?
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '1.125rem', color: 'text.secondary' }}>
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
            <Button
              variant="contained"
              disableElevation
              size="large"
              component={Link}
              href="/sign-up"
              sx={{
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                '&:hover': { bgcolor: 'secondary.dark' },
                borderRadius: '9999px',
                px: 5,
                height: 48,
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: '0 4px 14px rgba(var(--mui-palette-secondary-mainChannel) / 0.2)',
              }}
            >
              Create Free Account
            </Button>
          </Box>
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
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
