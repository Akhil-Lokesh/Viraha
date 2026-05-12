import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Non-PII subset of User persisted to localStorage.
// Email and other sensitive fields stay in-memory only (fetched fresh from /me).
type PersistedUser = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatar' | 'isPrivate' | 'showLocation'
>;

interface PersistedAuthState {
  user: PersistedUser | null;
}

function stripToPersisted(user: User | PersistedUser | null): PersistedUser | null {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    isPrivate: user.isPrivate,
    showLocation: user.showLocation,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'viraha-auth',
      version: 2,
      partialize: (state): PersistedAuthState => ({
        user: stripToPersisted(state.user),
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const old = persistedState as Record<string, unknown>;
          return { user: stripToPersisted(old.user as User | null) };
        }
        if (version === 1) {
          // v1 → v2: strip PII (email, bio, home*, timestamps) from persisted user.
          const old = persistedState as { user?: User | null };
          return { user: stripToPersisted(old.user ?? null) };
        }
        return persistedState as PersistedAuthState;
      },
    }
  )
);

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  return hydrated;
}
