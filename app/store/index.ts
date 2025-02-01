import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheManager } from '../utils/cacheManager';

interface GlobalState {
  // App State
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
  
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Offline Changes Queue
  offlineChanges: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }>;
  addOfflineChange: (change: { action: string; data: any }) => void;
  removeOfflineChange: (id: string) => void;
  
  // Cache Management
  clearCache: () => Promise<void>;
  
  // Background Sync
  lastSyncTimestamp: number | null;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Error State
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
}

export const useStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // App State
      isInitialized: false,
      setInitialized: (value) => set({ isInitialized: value }),
      
      // Theme
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Offline Changes
      offlineChanges: [],
      addOfflineChange: (change) => set((state) => ({
        offlineChanges: [
          ...state.offlineChanges,
          {
            id: Date.now().toString(),
            ...change,
            timestamp: Date.now(),
          },
        ],
      })),
      removeOfflineChange: (id) => set((state) => ({
        offlineChanges: state.offlineChanges.filter((change) => change.id !== id),
      })),
      
      // Cache Management
      clearCache: async () => {
        await CacheManager.clear();
        set({ lastSyncTimestamp: null });
      },
      
      // Background Sync
      lastSyncTimestamp: null,
      setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
      
      // Error State
      globalError: null,
      setGlobalError: (error) => set({ globalError: error }),
    }),
    {
      name: 'global-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        lastSyncTimestamp: state.lastSyncTimestamp,
        offlineChanges: state.offlineChanges,
      }),
    }
  )
); 