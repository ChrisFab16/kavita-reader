import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FitModePreference, ReaderFitMode } from '../utils/readerFit';

export type PrefetchPagesOption = 0 | 2 | 5;

interface ReaderSettingsState {
  fitModePreference: FitModePreference;
  prefetchPages: PrefetchPagesOption;
  cacheEntireAlbum: boolean;
  downloadOnMobileData: boolean;
  setFitModePreference: (mode: FitModePreference) => void;
  setPrefetchPages: (pages: PrefetchPagesOption) => void;
  setCacheEntireAlbum: (enabled: boolean) => void;
  setDownloadOnMobileData: (enabled: boolean) => void;
}

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      fitModePreference: 'auto',
      prefetchPages: 2,
      cacheEntireAlbum: false,
      downloadOnMobileData: false,

      setFitModePreference: (fitModePreference) => set({ fitModePreference }),
      setPrefetchPages: (prefetchPages) => set({ prefetchPages }),
      setCacheEntireAlbum: (cacheEntireAlbum) => set({ cacheEntireAlbum }),
      setDownloadOnMobileData: (downloadOnMobileData) => set({ downloadOnMobileData }),
    }),
    {
      name: 'reader-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        fitModePreference: state.fitModePreference,
        prefetchPages: state.prefetchPages,
        cacheEntireAlbum: state.cacheEntireAlbum,
        downloadOnMobileData: state.downloadOnMobileData,
      }),
    }
  )
);
