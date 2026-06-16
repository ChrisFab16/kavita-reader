import { create } from 'zustand';
import { Image } from 'expo-image';

interface LibraryDisplayState {
  resetToken: number;
  isResetting: boolean;
  requestFullReload: () => Promise<void>;
}

export const useLibraryDisplayStore = create<LibraryDisplayState>((set, get) => ({
  resetToken: 0,
  isResetting: false,
  requestFullReload: async () => {
    if (get().isResetting) {
      return;
    }

    set({ isResetting: true });
    try {
      await Image.clearDiskCache();
      Image.clearMemoryCache();
      set((state) => ({ resetToken: state.resetToken + 1 }));
    } finally {
      set({ isResetting: false });
    }
  },
}));
