import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface StudentResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  roomNo: number;
  pgId: number;
  status: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: StudentResponse;
  message?: string;
}

interface TokenPayload {
  id: number;
  role: string;
  pgId: number;
  iat: number;
  exp: number;
}

export const loginStudent = async (credentials: { phone: string; password: string }) => {
  try {
    const response = await api.post<LoginResponse>(
      ENDPOINTS.STUDENT_LOGIN,
      credentials
    );

    // Check if response has data and is successful
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Invalid response from server');
    }

    // Validate token presence
    if (!response.data.token) {
      throw new Error('Authentication failed: Missing token');
    }

    // Store token and user data in AsyncStorage
    await AsyncStorage.setItem('student_token', response.data.token);
    await AsyncStorage.setItem('student', JSON.stringify({
      TenantID: response.data.user.id,
      FullName: response.data.user.name,
      Email: response.data.user.email,
      Phone: response.data.user.phone,
      Room_No: response.data.user.roomNo,
      pgId: response.data.user.pgId, // Use pgId from response
      Status: response.data.user.status || 'ACTIVE'
    }));

    // Set token in axios headers
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    return {
      success: true,
      token: response.data.token,
      student: {
        TenantID: response.data.user.id,
        FullName: response.data.user.name,
        Email: response.data.user.email,
        Phone: response.data.user.phone,
        Room_No: response.data.user.roomNo,
        pgId: response.data.user.pgId, // Use pgId from response
        Status: response.data.user.status || 'ACTIVE'
      }
    };
  } catch (error: any) {
    console.error('Student login error:', error.response?.data || error.message);
    
    // Clear any existing token
    await AsyncStorage.removeItem('student_token');
    delete api.defaults.headers.common['Authorization'];

    // Return a structured error response
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Unable to connect to server',
    };
  }
}; 