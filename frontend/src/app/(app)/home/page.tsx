'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Skeleton } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useDashboardStore, useDashboardHydrated } from '@/lib/stores/dashboard-store';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetCatalogDrawer } from '@/components/dashboard/widget-catalog-drawer';
import { HeroMemory } from '@/components/dashboard/hero-memory';
import { StatsStrip } from '@/components/dashboard/stats-strip';
import { RecentPosts } from '@/components/dashboard/recent-posts';
import { WidgetPanels } from '@/components/dashboard/widget-panels';
import { staggerContainer, staggerItem } from '@/lib/animations';

const SKELETON_BG = 'var(--cin-surface-2, #1C1C24)';

export default function HomePage() {
  const reduceMotion = useReducedMotion();

  const hydrated = useDashboardHydrated();
  const widgets = useDashboardStore((s) => s.widgets);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const setEditMode = useDashboardStore((s) => s.setEditMode);
  const moveWidget = useDashboardStore((s) => s.moveWidget);
  const resizeWidget = useDashboardStore((s) => s.resizeWidget);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const changeWidgetColor = useDashboardStore((s) => s.changeWidgetColor);
  const resetToDefault = useDashboardStore((s) => s.resetToDefault);

  const [catalogOpen, setCatalogOpen] = useState(false);

  // While the persisted dashboard layout rehydrates, show a page-shaped
  // skeleton instead of a blank screen so there is no visible flash.
  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100vh - 48px)' } }}>
        <Skeleton variant="text" animation="pulse" sx={{ width: 140, height: 18, bgcolor: SKELETON_BG }} />
        <Skeleton variant="text" animation="pulse" sx={{ width: 320, height: 56, mt: 0.5, mb: 3, bgcolor: SKELETON_BG }} />
        {/* Hero frame */}
        <Skeleton
          variant="rectangular"
          animation="pulse"
          sx={{ width: '100%', height: { xs: 260, md: 440 }, borderRadius: '16px', bgcolor: SKELETON_BG }}
        />
        {/* Stat pills */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              animation="pulse"
              sx={{ width: 110, height: 66, borderRadius: '12px', bgcolor: SKELETON_BG }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100vh - 48px)' } }}>
      {/* One orchestrated staggered reveal for the whole page */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem}>
          <DashboardHeader
            isEditMode={isEditMode}
            onToggleEdit={() => setEditMode(!isEditMode)}
            onReset={resetToDefault}
            onOpenCatalog={() => setCatalogOpen(true)}
          />
        </motion.div>

        <HeroMemory />

        <Box sx={{ mt: 3 }}>
          <StatsStrip />
        </Box>

        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          <RecentPosts />
        </Box>

        {/* Hairline divider */}
        <motion.div variants={staggerItem}>
          <Box
            aria-hidden="true"
            sx={{
              my: { xs: 4, md: 5 },
              borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
            }}
          />
        </motion.div>

        {/* View mode: cinematic panels. Edit mode: the original draggable
            grid — fully functional, intentionally utilitarian. */}
        {isEditMode ? (
          <DashboardGrid
            widgets={widgets}
            isEditMode={isEditMode}
            onMove={moveWidget}
            onResize={resizeWidget}
            onRemove={removeWidget}
            onChangeColor={changeWidgetColor}
          />
        ) : (
          <WidgetPanels widgets={widgets} />
        )}
      </motion.div>

      <WidgetCatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        widgets={widgets}
        onAdd={addWidget}
      />

      {/* FAB — Create new memory */}
      <Link href="/create/post" aria-label="Create new post" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          component={motion.div}
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 56,
            height: 56,
            bgcolor: 'var(--cin-accent, #8B7CFF)',
            color: '#0B0B0F',
            borderRadius: '50%',
            boxShadow: '0 8px 40px var(--cin-accent-glow, rgba(139,124,255,0.35))',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 50,
          }}
        >
          <Pencil style={{ width: 20, height: 20 }} />
        </Box>
      </Link>
    </Box>
  );
}
