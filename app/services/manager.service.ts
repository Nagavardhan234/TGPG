import { API_URL } from '@/config/api.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface Manager {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface PG {
  PGID: number;
  PGName: string;
  Status: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  token: string;
  manager: Manager;
  pg: PG | null;
}

export const managerService = {
  login: async (credentials: { 
    phone: string;
    password: string;
  }): Promise<LoginResponse> => {
    try {
      console.log('Sending login request:', {
        url: ENDPOINTS.MANAGER_LOGIN,
        credentials: { ...credentials, password: '***' }
      });

      const response = await api.post(ENDPOINTS.MANAGER_LOGIN, credentials);
      const data = response.data;

      if (data.success && data.token) {
        // Store the token
        await AsyncStorage.setItem('token', data.token);
        
        // Store user data
        if (data.manager) {
          await AsyncStorage.setItem('user', JSON.stringify(data.manager));
        }
      }

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw {
        success: false,
        error: error.response?.data?.error || 'AUTH_ERROR',
        message: error.response?.data?.message || 'Authentication failed'
      };
    }
  },

  logout: async () => {
    try {
      // Get token before clearing storage
      const token = await AsyncStorage.getItem('token');
      
      // Clear storage first
      await AsyncStorage.clear();

      // Call logout endpoint if token exists
      if (token) {
        await api.post(ENDPOINTS.LOGOUT, null, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },

  getUser: async (): Promise<any | null> => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  }
}; 