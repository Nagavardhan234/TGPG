import axios from 'axios';
import { API_URL } from '@/config/api.config';
import { showMessage } from 'react-native-flash-message';
import { authService } from './auth.service';
import { ENDPOINTS } from '@/app/constants/endpoints';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// List of endpoints that don't require authentication
const publicEndpoints = [
  ENDPOINTS.MANAGER_LOGIN,
  ENDPOINTS.STUDENT_LOGIN,
  ENDPOINTS.MANAGER_REGISTER
];

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Skip adding token for public endpoints
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url?.endsWith(endpoint)
      );

      if (!isPublicEndpoint) {
        const token = await authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    } catch (error) {
      console.error('Error getting token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if error response exists and has the expected structure
    if (error.response?.data) {
      const { isTokenExpired, message } = error.response.data;

      // Handle session expiration
      if (isTokenExpired) {
        // Show toast notification
        showMessage({
          message: "Session Expired",
          description: message || "Your session has expired. Please log in again.",
          type: "warning",
          duration: 5000,
          icon: "warning",
        });

        // Clear auth data
        await authService.logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api; 