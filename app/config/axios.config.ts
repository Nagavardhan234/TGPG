import axios from 'axios';
import { BASE_URL } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add request interceptor to handle token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token from storage:', token); // Debug log
      
      if (token) {
        // Ensure token is properly formatted
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
      } else {
        console.warn('No token found in storage');
      }
      return config;
    } catch (error) {
      console.error('Error in axios interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.response?.data?.error === 'INVALID_TOKEN') {
      // Clear stored token
      await AsyncStorage.removeItem('token');
      // You could also redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

export default api; 