import { API_URL } from '@/config/api.config';
import { ENDPOINTS } from '@/app/constants/endpoints';

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
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
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}; 