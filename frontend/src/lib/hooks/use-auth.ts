'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { getMe } from '../api/auth';

export function useAuth() {
  const { user, setUser, logout, isAuthenticated } =
    useAuthStore();

  useEffect(() => {
    if (!user) {
      getMe()
        .then(setUser)
        .catch(() => {
          // Not authenticated or token expired
        });
    }
  }, [user, setUser]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
    logout,
  };
}
