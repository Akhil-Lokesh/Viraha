'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box } from '@mui/material';
import { Pencil } from 'lucide-react';
import { useDashboardStore, useDashboardHydrated } from '@/lib/stores/dashboard-store';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetCatalogDrawer } from '@/components/dashboard/widget-catalog-drawer';

export default function HomePage() {
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

  if (!hydrated) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { md: 'calc(100vh - 48px)' } }}>
      <DashboardHeader
        isEditMode={isEditMode}
        onToggleEdit={() => setEditMode(!isEditMode)}
        onReset={resetToDefault}
        onOpenCatalog={() => setCatalogOpen(true)}
      />

      <DashboardGrid
        widgets={widgets}
        isEditMode={isEditMode}
        onMove={moveWidget}
        onResize={resizeWidget}
        onRemove={removeWidget}
        onChangeColor={changeWidgetColor}
      />

      <WidgetCatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        widgets={widgets}
        onAdd={addWidget}
      />

      {/* FAB — Create new entry */}
      <Link href="/create/post" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 56,
            height: 56,
            bgcolor: 'text.primary',
            color: 'background.default',
            borderRadius: '50%',
            boxShadow: 3,
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
