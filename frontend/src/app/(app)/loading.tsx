import { Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Greeting skeleton — paper panel with hairline border */}
      <Box
        className="paper-grain"
        sx={{
          borderRadius: 1,
          border: '1px solid var(--viraha-hairline, rgba(34,28,24,0.15))',
          bgcolor: 'background.paper',
          p: 3,
        }}
      >
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 256, mb: 1 }} />
        <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 160 }} />
      </Box>

      {/* Stamp-rail skeleton */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[80, 96, 80].map((width, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            animation="pulse"
            sx={{
              height: 32,
              width,
              borderRadius: '4px',
              transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
            }}
          />
        ))}
      </Box>

      {/* Postcard grid skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 1.5,
              pb: 3, // thick postcard bottom
              borderRadius: 1,
              border: '1px solid var(--viraha-hairline, rgba(34,28,24,0.15))',
              bgcolor: 'background.paper',
              transform: `rotate(${i % 3 === 0 ? -0.6 : i % 3 === 1 ? 0.5 : 0}deg)`,
            }}
          >
            <Skeleton variant="rounded" animation="pulse" sx={{ aspectRatio: '4/3', borderRadius: '4px' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: '75%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: '50%' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
