import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TravelStoreState {
  mode: 'local' | 'traveling';
  currentLat: number | null;
  currentLng: number | null;
  hasPrompted: boolean;
  setMode: (mode: 'local' | 'traveling', lat?: number | null, lng?: number | null) => void;
  setHasPrompted: (val: boolean) => void;
  reset: () => void;
}

export const useTravelStore = create<TravelStoreState>()(
  persist(
    (set) => ({
      mode: 'local',
      currentLat: null,
      currentLng: null,
      hasPrompted: false,
      setMode: (mode, lat, lng) =>
        set({
          mode,
          currentLat: lat ?? null,
          currentLng: lng ?? null,
        }),
      setHasPrompted: (val) => set({ hasPrompted: val }),
      reset: () => set({ mode: 'local', currentLat: null, currentLng: null, hasPrompted: false }),
    }),
    { name: 'viraha-travel' }
  )
);
