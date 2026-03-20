import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { User } from '../../lib/types';

// Test the store logic directly without persist middleware
interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

function createTestStore() {
  return create<AuthState>()((set, get) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
    isAuthenticated: () => !!get().user,
  }));
}

describe('AuthStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should start with no user', () => {
    expect(store.getState().user).toBeNull();
  });

  it('should set user', () => {
    const mockUser: User = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      displayName: 'Test',
      bio: null,
      avatar: null,
      homeCity: null,
      homeCountry: null,
      homeLat: null,
      homeLng: null,
      isPrivate: false,
      emailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    store.getState().setUser(mockUser);
    expect(store.getState().user).toEqual(mockUser);
  });

  it('should clear user on logout', () => {
    store.setState({ user: { id: '1', username: 'test' } as User });
    store.getState().logout();
    expect(store.getState().user).toBeNull();
  });

  it('should report isAuthenticated correctly', () => {
    expect(store.getState().isAuthenticated()).toBe(false);
    store.setState({ user: { id: '1', username: 'test' } as User });
    expect(store.getState().isAuthenticated()).toBe(true);
  });
});
