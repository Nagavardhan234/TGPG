import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (credentials: { phone: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: any) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          
          // Store token and user data
          localStorage.setItem('token', token);
          set({ token, user, isAuthenticated: true });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      logout: () => {
        // Clear local storage and state
        localStorage.clear();
        set({ token: null, user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuth; 