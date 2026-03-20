import { Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Greeting skeleton */}
      <Box sx={{ borderRadius: '16px', bgcolor: 'action.hover', p: 3 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 256, mb: 1 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 160 }} />
      </Box>

      {/* Tabs skeleton */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 36, width: 80, borderRadius: '9999px' }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 36, width: 96, borderRadius: '9999px' }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 36, width: 80, borderRadius: '9999px' }} />
      </Box>

      {/* Post grid skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/3', borderRadius: '16px' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: '75%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: '50%' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
