'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import MuiSwitch from '@mui/material/Switch';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogActions from '@mui/material/DialogActions';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Eye, VolumeX, UserX, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { useAuthStore } from '@/lib/stores/auth-store';
import { updateProfile } from '@/lib/api/users';
import {
  dialogPaperSx,
  switchSx,
  settingsStagger,
  settingsItem,
  rowHoverSx,
} from './cinema-settings';

interface ToggleRowProps {
  icon: React.ReactNode;
  active: boolean;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ icon, active, title, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: 'var(--cin-surface-2, #1C1C24)',
            border: `1px solid ${CIN.hairline}`,
            color: active ? CIN.accent : CIN.textMuted,
            transition: 'color .2s ease',
            mt: 0.25,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ color: CIN.textMuted, mt: 0.25, maxWidth: 320, display: 'block' }}>
            {description}
          </Typography>
        </Box>
      </Box>
      <MuiSwitch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        sx={switchSx}
      />
    </Box>
  );
}

interface LinkRowProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function LinkRow({ href, icon, title, description }: LinkRowProps) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        textDecoration: 'none',
        color: 'inherit',
        ...rowHoverSx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: 'var(--cin-surface-2, #1C1C24)',
          border: `1px solid ${CIN.hairline}`,
          color: CIN.textMuted,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: CIN.textMuted }}>
          {description}
        </Typography>
      </Box>
      <ChevronRight style={{ height: 18, width: 18, color: CIN.textMuted, flexShrink: 0 }} />
    </Box>
  );
}

export function PrivacyTab() {
  const reduceMotion = useReducedMotion();
  const { user, setUser } = useAuthStore();
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);
  const [showLocation, setShowLocation] = useState(user?.showLocation ?? true);
  const [saving, setSaving] = useState(false);
  const [confirmPrivateOpen, setConfirmPrivateOpen] = useState(false);

  async function persistPrivate(value: boolean) {
    setSaving(true);
    try {
      const updated = await updateProfile({ isPrivate: value });
      setUser(updated);
      toast.success(value ? 'Account set to private' : 'Account set to public');
    } catch {
      setIsPrivate(!value);
      toast.error('Failed to update privacy setting');
    } finally {
      setSaving(false);
    }
  }

  function handlePrivateChange(value: boolean) {
    // Optimistic toggle, then confirm before persisting when switching ON.
    setIsPrivate(value);
    if (value) {
      setConfirmPrivateOpen(true);
      return;
    }
    void persistPrivate(value);
  }

  function handleConfirmPrivate() {
    setConfirmPrivateOpen(false);
    void persistPrivate(true);
  }

  function handleCancelPrivate() {
    setConfirmPrivateOpen(false);
    setIsPrivate(false);
  }

  async function handleShowLocationChange(value: boolean) {
    setShowLocation(value);
    setSaving(true);
    try {
      const updated = await updateProfile({ showLocation: value } as Parameters<typeof updateProfile>[0]);
      setUser(updated);
      toast.success(value ? 'Location visible on profile' : 'Location hidden from profile');
    } catch {
      setShowLocation(!value);
      toast.error('Failed to update location setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      variants={settingsStagger}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SectionLabel>Visibility</SectionLabel>
          <ToggleRow
            icon={<Shield style={{ height: 18, width: 18 }} />}
            active={isPrivate}
            title="Private Account"
            description="When enabled, only approved followers can see your posts and travel memories."
            checked={isPrivate}
            disabled={saving}
            onChange={handlePrivateChange}
          />
          <Box sx={{ borderTop: `1px solid ${CIN.hairline}` }} />
          <ToggleRow
            icon={<Eye style={{ height: 18, width: 18 }} />}
            active={showLocation}
            title="Show Location"
            description="Display your home city on your profile. Other travelers can find you by location."
            checked={showLocation}
            disabled={saving}
            onChange={(value) => void handleShowLocationChange(value)}
          />
        </CinemaCard>
      </motion.div>

      {/* Muted & blocked accounts */}
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 2 }}>
          <Box sx={{ px: 1, pt: 0.5 }}>
            <SectionLabel>Muted &amp; blocked</SectionLabel>
          </Box>
          <LinkRow
            href="/settings/muted"
            icon={<VolumeX style={{ height: 18, width: 18 }} />}
            title="Muted accounts"
            description="Hidden from your feed — they're never notified."
          />
          <Box sx={{ borderTop: `1px solid ${CIN.hairline}`, mx: 1.5 }} />
          <LinkRow
            href="/settings/blocked"
            icon={<UserX style={{ height: 18, width: 18 }} />}
            title="Blocked accounts"
            description="Manage the accounts you've blocked."
          />
        </CinemaCard>
      </motion.div>

      <MuiDialog
        open={confirmPrivateOpen}
        onClose={handleCancelPrivate}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(139,124,255,0.12)',
            }}
          >
            <Shield style={{ height: 24, width: 24, color: CIN.accent }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, textAlign: 'center', color: CIN.text }}>
            Switch to a private account?
          </Typography>
        </Box>
        <MuiDialogContent sx={{ pt: 2 }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: CIN.textMuted }}>
            Switching to private means your future posts won&apos;t appear in public
            feeds. Followers will continue to see them.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <GlowButton
            type="button"
            onClick={handleConfirmPrivate}
            disabled={saving}
            sx={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Make account private'}
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={handleCancelPrivate}
            disabled={saving}
            sx={{ width: '100%' }}
          >
            Cancel
          </GlowButton>
        </MuiDialogActions>
      </MuiDialog>
    </motion.div>
  );
}
