import { API_URL } from '@/config/api.config';

interface LoginResponse {
  manager: boolean;
  success: boolean;
  token?: string;
  error?: string;
  user?: {
    id: number;
    fullName: string;
    email?: string;
    phone: string;
    role: 'manager' | 'member';
  };
}

interface LoginCredentials {
  email?: string | null;
  phone?: string | null;
  password: string;
  userType: 'manager' | 'member';
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const endpoint = credentials.userType === 'manager' 
        ? `${API_URL}/api/managers/login`
        : `${API_URL}/api/members/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          phone: credentials.phone,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (data.error?.toLowerCase().includes('password')) {
            return {
              success: false,
              error: 'Incorrect password',
            };
          }
          return {
            success: false,
            error: 'Invalid credentials',
          };
        }
        if (response.status === 404) {
          return {
            success: false,
            error: 'Account not found with this email/phone',
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },
}; 