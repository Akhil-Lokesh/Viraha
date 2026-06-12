import { Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

const SKELETON_SX = { bgcolor: 'var(--cin-surface-2, #1C1C24)' } as const;

export default function Loading() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Heading skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 12, width: 120 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 36, width: 260 }} />
      </Box>

      {/* Stat strip skeleton */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {[92, 92, 92].map((width, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            animation="pulse"
            sx={{ ...SKELETON_SX, height: 56, width, borderRadius: '12px' }}
          />
        ))}
      </Box>

      {/* Photo grid skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 2.5,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Skeleton
              variant="rounded"
              animation="pulse"
              sx={{ ...SKELETON_SX, aspectRatio: '4/3', height: 'auto', width: '100%', borderRadius: '14px' }}
            />
            <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 14, width: '70%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 12, width: '45%' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
