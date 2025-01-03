import axios from 'axios';
import { BASE_URL } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
api.interceptors.request.use(
  async (config) => {
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });

    // Try to get manager token first
    let token = await AsyncStorage.getItem('token');
    console.log('Manager token:', token);
    
    // If no manager token, try student token
    if (!token) {
      token = await AsyncStorage.getItem('student_token');
      console.log('Student token:', token);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Final headers:', config.headers);
    } else {
      console.log('No token found');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.config?.headers
    });

    if (error.response?.status === 401) {
      const errorType = error.response?.data?.error;
      
      if (errorType === 'TOKEN_EXPIRED' || errorType === 'INVALID_TOKEN') {
        console.log('Token error, clearing storage');
        // Clear stored tokens
        await AsyncStorage.multiRemove(['token', 'student_token', 'user', 'pg']);
        
        // Redirect to login
        router.replace('/screens/LoginScreen');
        
        return Promise.reject({
          ...error,
          message: 'Your session has expired. Please log in again.'
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api; 