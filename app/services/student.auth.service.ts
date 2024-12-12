import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    student: {
      TenantID: number;
      FullName: string;
      Email: string;
      Phone: string;
      Room_No: string;
      PGID: number;
    };
  };
}

export const loginStudent = async (credentials: { phone: string; password: string }) => {
  try {
    const response = await api.post<LoginResponse>(
      `${ENDPOINTS.STUDENTS}/login`,
      credentials
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }

    const token = response.data.data.token;
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return response.data;
  } catch (error: any) {
    console.error('Student login error:', error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw {
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
}; 