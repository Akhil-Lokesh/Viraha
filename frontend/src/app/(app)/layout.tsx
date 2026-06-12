import { Box } from '@mui/material';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/mobile-nav';
import { UnverifiedEmailBanner } from '@/components/layout/unverified-email-banner';
import { TravelAutoDetector } from '@/components/travel/travel-auto-detector';
import { ActivityStreamMount } from '@/components/layout/activity-stream-mount';
import { FirstRun } from '@/components/onboarding/first-run';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Box sx={{ position: 'relative', minHeight: '100dvh', overflowX: 'hidden' }}>
        {/* Desktop sidebar — fixed left, hidden on mobile */}
        <Sidebar />

        {/* Mobile header — sticky top, hidden on desktop */}
        <Header />

        {/* Banner when user hasn't verified their email */}
        <UnverifiedEmailBanner />

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            ml: { xs: 0, md: '96px' },
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
            pb: { xs: 'calc(88px + env(safe-area-inset-bottom, 0px))', md: 3 },
            minHeight: '100dvh',
          }}
        >
          {children}
        </Box>

        {/* Mobile bottom nav — fixed bottom, hidden on desktop */}
        <BottomNav />

        {/* Travel mode auto-detection */}
        <TravelAutoDetector />

        {/* App-wide activity SSE stream (live unread counts everywhere) */}
        <ActivityStreamMount />

        {/* One-time welcome for new users */}
        <FirstRun />
      </Box>
    </AuthGuard>
  );
}
