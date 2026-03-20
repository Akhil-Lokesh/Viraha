'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Box, Typography } from '@mui/material';

interface StatCardProps {
  value: number;
  label: string;
  suffix?: string;
}

export function StatCard({ value, label, suffix = '' }: StatCardProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const steps = 40;
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
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      style={{ textAlign: 'center' }}
    >
      <Typography
        sx={{
          fontSize: { xs: '1.875rem', md: '2.25rem' },
          fontWeight: 700,
          letterSpacing: '-0.025em',
        }}
      >
        {count.toLocaleString()}
        {suffix}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
        {label}
      </Typography>
    </motion.div>
  );
}
