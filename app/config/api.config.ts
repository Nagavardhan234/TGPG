// API Configuration
export const API_CONFIG = {
  // Base URLs
  DEV_API_URL: 'http://10.0.2.2:3000', // Android emulator localhost
  PROD_API_URL: 'https://3f67-49-206-44-60.ngrok-free.app',
  
  // For testing - set to true to force production URL in development
  FORCE_PROD_API: true,
  
  // Rate Limiting
  RATE_LIMIT: {
    MAX_REQUESTS: 20,
    PER_MILLISECONDS: 1000,
  },
  
  // Timeouts
  TIMEOUT: 30000, // 30 seconds
  
  // Cache Duration (in milliseconds)
  CACHE_DURATION: {
    SHORT: 5 * 60 * 1000,    // 5 minutes
    MEDIUM: 15 * 60 * 1000,  // 15 minutes
    LONG: 60 * 60 * 1000,    // 1 hour
  },

  // CORS Configuration
  ALLOWED_ORIGINS: [
    'http://localhost:19006',
    'http://localhost:8081',
    'exp://localhost:8081',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:8081',
    'https://3f67-49-206-44-60.ngrok-free.app',
    'http://3f67-49-206-44-60.ngrok-free.app'
  ],

  // Headers
  HEADERS: {
    DEFAULT: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    NGROK: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'bypass-tunnel-reminder': 'true',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }
};

// Validate and export the API URL
const validateUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getApiUrl = () => {
  const url = API_CONFIG.FORCE_PROD_API ? API_CONFIG.PROD_API_URL : 
              (__DEV__ ? API_CONFIG.DEV_API_URL : API_CONFIG.PROD_API_URL);
              
  if (!validateUrl(url)) {
    console.error('Invalid API URL:', url);
    throw new Error('Invalid API URL configuration');
  }

  console.log('[API Config] Using API URL:', url);
  return url;
};

export const API_URL = getApiUrl();

// Export endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Student
  STUDENT_PROFILE: '/student/profile',
  STUDENT_PAYMENTS: '/student/payments',
  STUDENT_COMPLAINTS: '/student/complaints',
  
  // Manager
  MANAGER_PROFILE: '/manager/profile',
  MANAGER_PG: '/manager/pg',
  
  // Common
  NOTIFICATIONS: '/notifications',
  MESSAGES: '/messages',
};

// Export headers with platform-specific configuration
export const HEADERS = {
  ...API_CONFIG.HEADERS,
  ANDROID: {
    ...API_CONFIG.HEADERS.DEFAULT,
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip, deflate, br'
  }
};