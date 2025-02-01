import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  user: any | null;
  authToken: string | null;
  refreshToken: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  initialLoadingComplete: boolean;
  
  // Network State
  isOnline: boolean;
  isSyncing: boolean;
  offlineActions: Array<{
    type: string;
    payload: any;
    timestamp: number;
  }>;
  
  // Resource Loading State
  resourcesLoaded: {
    fonts: boolean;
    images: boolean;
    initialData: boolean;
  };
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setDarkMode: (isDark: boolean) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  queueOfflineAction: (action: { type: string; payload: any }) => void;
  syncOfflineActions: () => Promise<void>;
  setInitialLoadingComplete: (complete: boolean) => void;
  setResourceLoaded: (resource: keyof AppState['resourcesLoaded'], loaded: boolean) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      authToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isDarkMode: false,
      isOnline: true,
      isSyncing: false,
      offlineActions: [],
      initialLoadingComplete: false,
      resourcesLoaded: {
        fonts: false,
        images: false,
        initialData: false,
      },
      
      // Actions
      setInitialLoadingComplete: (complete) => {
        set({ initialLoadingComplete: complete });
      },

      setResourceLoaded: (resource, loaded) => {
        set((state) => ({
          resourcesLoaded: {
            ...state.resourcesLoaded,
            [resource]: loaded,
          },
        }));
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/api/auth/login', credentials);
          
          set({
            isAuthenticated: true,
            user: response.data.user,
            authToken: response.data.token,
            refreshToken: response.data.refreshToken,
          });
          
          await AsyncStorage.setItem('authToken', response.data.token);
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        } catch (error: any) {
          set({ error: error.message || 'Login failed' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        try {
          set({ isLoading: true });
          await api.post('/api/auth/logout');
          await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
          
          set({
            isAuthenticated: false,
            user: null,
            authToken: null,
            refreshToken: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
      },
      
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        if (isOnline) {
          get().syncOfflineActions();
        }
      },
      
      queueOfflineAction: (action) => {
        set((state) => ({
          offlineActions: [
            ...state.offlineActions,
            { ...action, timestamp: Date.now() },
          ],
        }));
      },
      
      syncOfflineActions: async () => {
        const state = get();
        if (!state.isOnline || state.isSyncing || state.offlineActions.length === 0) {
          return;
        }
        
        set({ isSyncing: true });
        
        try {
          const actions = [...state.offlineActions];
          for (const action of actions) {
            try {
              switch (action.type) {
                case 'CREATE_ROOM':
                  await api.post('/api/rooms', action.payload);
                  break;
                case 'UPDATE_ROOM':
                  await api.put(`/api/rooms/${action.payload.id}`, action.payload);
                  break;
                // Add more cases as needed
              }
              
              // Remove synced action
              set((state) => ({
                offlineActions: state.offlineActions.filter(
                  (a) => a.timestamp !== action.timestamp
                ),
              }));
            } catch (error) {
              console.error('Failed to sync action:', action, error);
            }
          }
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'app-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

export default useAppStore; 