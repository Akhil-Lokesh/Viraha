'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useDashboardStore, useDashboardHydrated } from '@/lib/stores/dashboard-store';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetCatalogDrawer } from '@/components/dashboard/widget-catalog-drawer';
import { HeroMemory } from '@/components/dashboard/hero-memory';
import { StampStrip } from '@/components/dashboard/stamp-strip';
import { EditorialSpread } from '@/components/dashboard/editorial-spread';
import { getJournalTokens, spreadContainer, spreadItem } from '@/components/dashboard/journal-tokens';

export default function HomePage() {
  const theme = useTheme();
  const t = getJournalTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');

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

  // While the persisted dashboard layout rehydrates, show a journal-shaped
  // skeleton spread instead of a blank page so there is no visible flash.
  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100vh - 48px)' } }}>
        <Skeleton variant="text" animation="pulse" sx={{ width: 140, height: 18, bgcolor: t.inkHairline }} />
        <Skeleton variant="text" animation="pulse" sx={{ width: 320, height: 56, mt: 0.5, mb: 3, bgcolor: t.inkHairline }} />
        {/* Hero postcard */}
        <Skeleton
          variant="rectangular"
          animation="pulse"
          sx={{ width: '100%', height: { xs: 280, md: 440 }, borderRadius: '4px', bgcolor: t.inkHairline }}
        />
        {/* Stamp strip */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {[-1.5, 1, -0.5].map((rot) => (
            <Skeleton
              key={rot}
              variant="rectangular"
              animation="pulse"
              sx={{ width: 128, height: 72, borderRadius: '4px', transform: `rotate(${rot}deg)`, bgcolor: t.inkHairline }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100vh - 48px)' } }}>
      {/* One orchestrated staggered reveal for the whole spread */}
      <motion.div variants={spreadContainer} initial="hidden" animate="visible">
        <motion.div variants={spreadItem}>
          <DashboardHeader
            isEditMode={isEditMode}
            onToggleEdit={() => setEditMode(!isEditMode)}
            onReset={resetToDefault}
            onOpenCatalog={() => setCatalogOpen(true)}
          />
        </motion.div>

        <HeroMemory />

        <Box sx={{ mt: 3 }}>
          <StampStrip />
        </Box>

        {/* Ticket-stub divider */}
        <motion.div variants={spreadItem}>
          <Box sx={{ position: 'relative', my: { xs: 4, md: 5 } }} aria-hidden="true">
            <Box
              sx={{
                borderTop: '2px dotted',
                borderColor: t.goldHairline,
                mx: 2,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                width: 8,
                height: 8,
                border: '1.5px solid',
                borderColor: t.goldHairline,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                width: 8,
                height: 8,
                border: '1.5px solid',
                borderColor: t.goldHairline,
              }}
            />
          </Box>
        </motion.div>

        {/* View mode: calm editorial spread. Edit mode: the original draggable
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
          <EditorialSpread widgets={widgets} />
        )}
      </motion.div>

      <WidgetCatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        widgets={widgets}
        onAdd={addWidget}
      />

      {/* FAB — Create new entry */}
      <Link href="/create/post" aria-label="Create new post" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 56,
            height: 56,
            bgcolor: 'text.primary',
            color: 'background.default',
            border: '1.5px solid',
            borderColor: t.gold,
            borderRadius: '50%',
            boxShadow: '3px 3px 0 rgba(34,28,24,0.18)',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { opacity: 0.9 },
            transition: 'opacity 0.2s',
            zIndex: 50,
          }}
        >
          <Pencil style={{ width: 20, height: 20 }} />
        </Box>
      </Link>
    </Box>
  );
}
