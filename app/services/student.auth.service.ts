import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StudentResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  roomNo: number;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: StudentResponse;
  message?: string;
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

    // Store token in AsyncStorage
    await AsyncStorage.setItem('student_token', response.data.token);

    // Set token in axios headers
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    // Return the response data
    return {
      success: true,
      token: response.data.token,
      student: {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        roomNo: response.data.user.roomNo
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