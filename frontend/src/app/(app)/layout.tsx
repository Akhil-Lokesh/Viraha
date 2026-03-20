import { Box } from '@mui/material';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/mobile-nav';
import { TravelAutoDetector } from '@/components/travel/travel-auto-detector';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh', overflowX: 'hidden' }}>
      {/* Desktop sidebar — fixed left, hidden on mobile */}
      <Sidebar />

      {/* Mobile header — sticky top, hidden on desktop */}
      <Header />

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
    </Box>
  );
}
