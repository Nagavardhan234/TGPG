// API Configuration
export const API_CONFIG = {
  // Base URLs
  DEV_API_URL: 'http://localhost:3000',
  PROD_API_URL: 'https://your-production-api.com',
  
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
};

// Export the API URL based on environment
export const API_URL = __DEV__ ? API_CONFIG.DEV_API_URL : API_CONFIG.PROD_API_URL;

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

// Export headers
export const HEADERS = {
  DEFAULT: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  MULTIPART: {
    'Content-Type': 'multipart/form-data',
  },
};