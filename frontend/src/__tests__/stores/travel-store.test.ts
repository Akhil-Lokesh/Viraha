import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';

interface TravelStoreState {
  mode: 'local' | 'traveling';
  currentLat: number | null;
  currentLng: number | null;
  hasPrompted: boolean;
  setMode: (mode: 'local' | 'traveling', lat?: number | null, lng?: number | null) => void;
  setHasPrompted: (val: boolean) => void;
  reset: () => void;
}

function createTestStore() {
  return create<TravelStoreState>()((set) => ({
    mode: 'local',
    currentLat: null,
    currentLng: null,
    hasPrompted: false,
    setMode: (mode, lat, lng) =>
      set({ mode, currentLat: lat ?? null, currentLng: lng ?? null }),
    setHasPrompted: (val) => set({ hasPrompted: val }),
    reset: () => set({ mode: 'local', currentLat: null, currentLng: null, hasPrompted: false }),
  }));
}

describe('TravelStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should start in local mode', () => {
    expect(store.getState().mode).toBe('local');
    expect(store.getState().currentLat).toBeNull();
    expect(store.getState().currentLng).toBeNull();
  });

  it('should switch to traveling mode with coordinates', () => {
    store.getState().setMode('traveling', 40.7128, -74.006);
    expect(store.getState().mode).toBe('traveling');
    expect(store.getState().currentLat).toBe(40.7128);
    expect(store.getState().currentLng).toBe(-74.006);
  });

  it('should switch back to local mode', () => {
    store.getState().setMode('traveling', 35.6762, 139.6503);
    store.getState().setMode('local');
    expect(store.getState().mode).toBe('local');
    expect(store.getState().currentLat).toBeNull();
    expect(store.getState().currentLng).toBeNull();
  });

  it('should track hasPrompted', () => {
    expect(store.getState().hasPrompted).toBe(false);
    store.getState().setHasPrompted(true);
    expect(store.getState().hasPrompted).toBe(true);
  });

  it('should reset all state', () => {
    store.getState().setMode('traveling', 48.8566, 2.3522);
    store.getState().setHasPrompted(true);
    store.getState().reset();
    expect(store.getState().mode).toBe('local');
    expect(store.getState().currentLat).toBeNull();
    expect(store.getState().hasPrompted).toBe(false);
  });
});
