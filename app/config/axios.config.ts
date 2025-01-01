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
    // Try to get manager token first
    let token = await AsyncStorage.getItem('token');
    
    // If no manager token, try student token
    if (!token) {
      token = await AsyncStorage.getItem('student_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const errorType = error.response?.data?.error;
      
      if (errorType === 'TOKEN_EXPIRED' || errorType === 'INVALID_TOKEN') {
        // Clear stored tokens
        await AsyncStorage.multiRemove(['token', 'student_token', 'user', 'pg']);
        
        // Redirect to login
        router.replace('/screens/ManagerLoginScreen');
        
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