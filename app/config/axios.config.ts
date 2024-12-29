import axios from 'axios';
import { BASE_URL } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const token = await AsyncStorage.getItem('student_token');
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
    if (error.response?.status === 401 && error.response?.data?.error === 'INVALID_TOKEN') {
      // Clear stored token
      await AsyncStorage.removeItem('student_token');
      // You could also redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

export default api; 