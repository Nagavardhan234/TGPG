import axios from 'axios';
import { API_URL, HEADERS } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

console.log('[API Config] Platform:', Platform.OS);
console.log('[API Config] Using API URL:', API_URL);

// Check if we're using ngrok
const isNgrok = API_URL.includes('ngrok');
const isAndroid = Platform.OS === 'android';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

const ngrokHeaders = {
  ...defaultHeaders,
  'ngrok-skip-browser-warning': 'true',
  'bypass-tunnel-reminder': 'true'
};

const androidHeaders = {
  ...defaultHeaders,
  'Connection': 'keep-alive',
  'Accept-Encoding': 'gzip, deflate, br'
};

// Determine which headers to use
const getHeaders = () => {
  if (isNgrok && isAndroid) {
    return { ...androidHeaders, ...ngrokHeaders };
  }
  if (isNgrok) return ngrokHeaders;
  if (isAndroid) return androidHeaders;
  return defaultHeaders;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: isAndroid ? 60000 : 30000, // Longer timeout for Android
  headers: getHeaders(),
  validateStatus: (status) => status >= 200 && status < 500
});

// Health check function with platform logging
const checkApiHealth = async () => {
  try {
    console.log('[Health Check] Checking API health...');
    const response = await api.get('/api/health');
    console.log('[Health Check] Response:', response.data);
    return response.data?.status === 'ok';
  } catch (error) {
    console.error('[Health Check] Failed:', error);
    return false;
  }
};

// Add request interceptor to include token
api.interceptors.request.use(
  async (config) => {
    try {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log('[Axios Request]', {
        platform: Platform.OS,
        url: fullUrl,
        method: config.method,
        timestamp: new Date().toISOString()
      });

      // Try to get manager token first
      let token = await AsyncStorage.getItem('token');
      
      // If no manager token, try student token
      if (!token) {
        token = await AsyncStorage.getItem('student_token');
      }
      
      // Log token status (but not the actual token)
      console.log('[Auth Status]', {
        platform: Platform.OS,
        hasToken: !!token,
        tokenType: token ? (await AsyncStorage.getItem('token') ? 'manager' : 'student') : 'none'
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Ensure content type is set for non-GET requests
      if (config.method !== 'get') {
        config.headers['Content-Type'] = 'application/json';
      }

      // Add cache prevention
      const timestamp = new Date().getTime();
      config.params = {
        ...config.params,
        _t: timestamp
      };

      // Update headers based on platform and ngrok
      config.headers = {
        ...config.headers,
        ...getHeaders()
      };

      return config;
    } catch (error) {
      console.error('[Axios Request Error]', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('[Axios Request Setup Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        message: 'Request timed out. Please check your internet connection and try again.'
      });
    }

    if (!error.response) {
      // Check if the API is healthy
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        return Promise.reject({
          ...error,
          message: isNgrok 
            ? 'Unable to connect to the ngrok tunnel. Please check if the tunnel is active.'
            : 'Unable to connect to the server. Please check if the server is running.'
        });
      }
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection and try again.'
      });
    }

    if (error.response?.status === 401) {
      const errorType = error.response?.data?.error;
      
      if (errorType === 'TOKEN_EXPIRED' || errorType === 'INVALID_TOKEN') {
        console.log('Authentication error, clearing storage');
        await AsyncStorage.multiRemove(['token', 'student_token', 'user', 'pg', 'manager']);
        router.replace('/screens/LoginScreen');
        return Promise.reject({
          ...error,
          message: 'Your session has expired. Please log in again.'
        });
      }
    }

    // Enhance error messages
    switch (error.response?.status) {
      case 404:
        error.message = 'The requested resource was not found.';
        break;
      case 403:
        error.message = 'You do not have permission to access this resource.';
        break;
      case 500:
        error.message = 'An internal server error occurred. Please try again later.';
        break;
      case 502:
        error.message = isNgrok
          ? 'Bad gateway error. The ngrok tunnel might be down.'
          : 'Bad gateway error. The server might be down or being updated.';
        break;
      case 503:
        error.message = 'Service unavailable. Please try again later.';
        break;
      default:
        if (!error.message) {
          error.message = 'An unexpected error occurred. Please try again.';
        }
    }

    return Promise.reject(error);
  }
);

// Export the health check function along with the api instance
export { checkApiHealth };
export default api; 