'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/api/client';

export function CsrfInitializer() {
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return null;
}
