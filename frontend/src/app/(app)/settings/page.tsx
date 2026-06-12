'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Settings, User, Palette, Shield, Lock } from 'lucide-react';
import { CIN, displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { easeNative } from '@/lib/animations';
import { ProfileTab } from '@/components/settings/profile-tab';
import { AppearanceTab } from '@/components/settings/appearance-tab';
import { PrivacyTab } from '@/components/settings/privacy-tab';
import { AccountTab } from '@/components/settings/account-tab';

const VALID_TABS = ['profile', 'appearance', 'privacy', 'account'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

const TAB_META: ReadonlyArray<{ id: SettingsTab; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'account', label: 'Account', icon: Lock },
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : 'profile';

  function handleTabChange(value: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Box
      component={motion.div}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeNative }}
      sx={{ maxWidth: 672, mx: 'auto' }}
    >
      {/* Page heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: 'var(--cin-surface, #141419)',
            border: `1px solid ${CIN.hairline}`,
          }}
        >
          <Settings style={{ height: 20, width: 20, color: CIN.accent }} />
        </Box>
        <Box>
          <Typography component="p" sx={eyebrowSx}>
            Your account
          </Typography>
          <Typography component="h1" sx={{ ...displaySx, fontSize: '1.75rem' }}>
            Settings
          </Typography>
        </Box>
      </Box>

      {/* Tabs: animated accent pill via layoutId */}
      <Box
        role="tablist"
        aria-label="Settings sections"
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          mb: 3,
          borderRadius: '12px',
          bgcolor: 'var(--cin-surface, #141419)',
          border: `1px solid ${CIN.hairline}`,
          width: { xs: '100%', sm: 'fit-content' },
          position: { xs: 'sticky', md: 'relative' },
          top: { xs: 52, md: 'auto' },
          zIndex: { xs: 40, md: 'auto' },
        }}
      >
        {TAB_META.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="settings-tabpanel"
              onClick={() => handleTabChange(tab.id)}
              sx={{
                position: 'relative',
                flex: { xs: 1, sm: '0 0 auto' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                bgcolor: 'transparent',
                color: isActive ? CIN.text : CIN.textMuted,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'color .2s ease',
                '&:hover': { color: CIN.text },
              }}
            >
              {isActive && (
                <Box
                  component={motion.span}
                  layoutId="settings-tab-pill"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 32 }
                  }
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '9px',
                    bgcolor: 'rgba(139,124,255,0.14)',
                    border: '1px solid rgba(139,124,255,0.35)',
                  }}
                />
              )}
              <Icon style={{ height: 16, width: 16, position: 'relative', zIndex: 1 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, position: 'relative', zIndex: 1 }}>
                {tab.label}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box id="settings-tabpanel" role="tabpanel" aria-label={`${activeTab} settings`}>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'account' && <AccountTab />}
      </Box>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
