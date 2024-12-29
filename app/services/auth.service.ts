import { API_URL } from '@/config/api.config';
import { ENDPOINTS } from '@/app/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  manager?: any;
}

export const authService = {
  login: async (credentials: { 
    email?: string | null; 
    phone?: string | null; 
    password: string;
    userType: string;
  }): Promise<LoginResponse> => {
    try {
      const { userType, ...loginData } = credentials;
      
      console.log('Sending login request:', {
        url: `${API_URL}${ENDPOINTS.MANAGER_LOGIN}`,
        credentials: { ...loginData, password: '***' }
      });

      const response = await fetch(`${API_URL}${ENDPOINTS.MANAGER_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

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
        error: 'AUTH_ERROR',
        message: error.message || 'Authentication failed'
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
        await fetch(`${API_URL}${ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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