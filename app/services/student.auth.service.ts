import api from '../config/axios.config';
import { ENDPOINTS } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface StudentResponse {
  id: string;
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
  id: string;
  role: string;
  pgId: number;
  iat: number;
  exp: number;
}

export const loginStudent = async (credentials: { phone: string; password: string }) => {
  try {
    console.log('[Student Auth] Attempting login with phone:', credentials.phone);
    const response = await api.post<LoginResponse>(
      ENDPOINTS.STUDENT_LOGIN,
      credentials
    );

    // Check if response has data and is successful
    if (!response.data || !response.data.success) {
      console.log('[Student Auth] Login failed:', response.data?.message);
      throw new Error(response.data?.message || 'Invalid response from server');
    }

    // Validate token presence
    if (!response.data.token) {
      console.log('[Student Auth] No token received in response');
      throw new Error('Authentication failed: Missing token');
    }

    // Decode and log token payload
    try {
      const decoded = jwtDecode<TokenPayload>(response.data.token);
      console.log('[Student Auth] Token payload:', {
        id: decoded.id,
        role: decoded.role,
        pgId: decoded.pgId,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (decodeError) {
      console.error('[Student Auth] Error decoding token:', decodeError);
    }

    // Store token and user data in AsyncStorage
    console.log('[Student Auth] Storing token and user data');
    await AsyncStorage.setItem('student_token', response.data.token);
    const userData = {
      TenantID: response.data.user.id,
      FullName: response.data.user.name,
      Email: response.data.user.email,
      Phone: response.data.user.phone,
      Room_No: response.data.user.roomNo,
      pgId: response.data.user.pgId,
      Status: response.data.user.status || 'ACTIVE'
    };
    await AsyncStorage.setItem('student', JSON.stringify(userData));
    console.log('[Student Auth] User data stored:', userData);

    // Set token in axios headers
    console.log('[Student Auth] Setting authorization header');
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    return {
      success: true,
      token: response.data.token,
      student: userData
    };
  } catch (error: any) {
    console.error('[Student Auth] Login error:', error.response?.data || error.message);
    
    // Clear any existing token
    console.log('[Student Auth] Clearing stored token and headers');
    await AsyncStorage.removeItem('student_token');
    delete api.defaults.headers.common['Authorization'];

    // Return a structured error response
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Unable to connect to server',
    };
  }
}; 