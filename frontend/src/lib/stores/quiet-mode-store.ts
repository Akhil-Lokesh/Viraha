import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuietModeState {
  isQuietMode: boolean;
  toggleQuietMode: () => void;
  setQuietMode: (value: boolean) => void;
}

export const useQuietModeStore = create<QuietModeState>()(
  persist(
    (set) => ({
      isQuietMode: false,
      toggleQuietMode: () => set((state) => ({ isQuietMode: !state.isQuietMode })),
      setQuietMode: (value) => set({ isQuietMode: value }),
    }),
    { name: 'viraha-quiet-mode' }
  )
);
