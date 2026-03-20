'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useInView } from 'framer-motion';

export function AnimatedCounter({
  value,
  sx,
}: {
  value: number;
  sx?: object;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <Box component="span" ref={ref} sx={sx}>
      {count}
    </Box>
  );
}
