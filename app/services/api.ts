import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheManager } from '../utils/cacheManager';
import { checkConnection } from '../utils/networkStatus';
import { router } from 'expo-router';
import rateLimit from 'axios-rate-limit';
import { API_URL, API_CONFIG, HEADERS, ENDPOINTS } from '@/app/config/api.config';
import { showMessage } from 'react-native-flash-message';
import { authService } from './auth.service';
import { useNetworkStore } from '../stores/networkStore';
import NetInfo from '@react-native-community/netinfo';
import { throttle } from 'lodash';

interface CacheItem {
  data: any;
  timestamp: number;
}

interface RequestConfig extends AxiosRequestConfig {
  cache?: {
    key: string;
    duration: number;
  };
  requiresAuth?: boolean;
}

class ApiService {
  private api: AxiosInstance;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private cache: Map<string, CacheItem> = new Map();

  constructor() {
    // Create base axios instance
    this.api = axios.create({
      baseURL: API_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: HEADERS.DEFAULT,
    });

    this.setupInterceptors();
    this.setupNetworkMonitoring();
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp, duration } = JSON.parse(cached);
        if (Date.now() - timestamp < duration) {
          return data;
        }
        // Remove expired cache
        await AsyncStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }

  private async setToCache(key: string, data: any, duration: number): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        duration,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config) => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          const cacheConfig = (config as RequestConfig).cache;
          if (cacheConfig) {
            const cachedData = await this.getFromCache(cacheConfig.key);
            if (cachedData) {
              return Promise.resolve({
                ...config,
                data: cachedData,
                headers: config.headers || {},
                status: 200,
                statusText: 'OK',
                cached: true,
              });
            }
          }
          throw new Error('No internet connection');
        }

        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      async (response) => {
        const config = response.config as RequestConfig;
        if (config.cache) {
          await this.setToCache(config.cache.key, response.data, config.cache.duration);
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
              await AsyncStorage.setItem('authToken', response.data.token);
              
              error.config.headers.Authorization = `Bearer ${response.data.token}`;
              return this.api.request(error.config);
            }
          } catch (refreshError) {
            await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
            throw new Error('Session expired. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private setupNetworkMonitoring() {
    useNetworkStore.subscribe(
      (state) => state.isConnected,
      (isConnected) => {
        if (isConnected && this.requestQueue.length > 0) {
          this.processQueue();
        }
      }
    );
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const isConnected = useNetworkStore.getState().isConnected;
      if (!isConnected) {
        this.isProcessingQueue = false;
        return;
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  async request<T>(config: RequestConfig): Promise<T> {
    const isConnected = useNetworkStore.getState().isConnected;

    if (config.cache) {
      const cachedData = await this.getFromCache(config.cache.key);

      if (cachedData) {
        return cachedData;
      }

      if (!isConnected) {
        throw new Error('No internet connection and no cached data available');
      }
    }

    if (!isConnected) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const response = await this.api.request<T>(config);
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    try {
      const response = await this.api.request<T>(config);

      if (config.cache) {
        await this.setToCache(config.cache.key, response.data, config.cache.duration);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Request failed');
      }
      throw error;
    }
  }

  // Helper methods with caching
  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const api = new ApiService();

// Export pre-configured instances for different endpoints
export const studentApi = {
  getProfile: () => api.get(ENDPOINTS.STUDENT_PROFILE, {
    cache: {
      key: 'student_profile',
      duration: API_CONFIG.CACHE_DURATION.MEDIUM,
    },
  }),
  
  getPaymentHistory: () => api.get(ENDPOINTS.STUDENT_PAYMENTS, {
    cache: {
      key: 'payment_history',
      duration: API_CONFIG.CACHE_DURATION.SHORT,
    },
  }),

  getComplaints: () => api.get(ENDPOINTS.STUDENT_COMPLAINTS, {
    cache: {
      key: 'complaints',
      duration: API_CONFIG.CACHE_DURATION.SHORT,
    },
  }),

  getNotifications: () => api.get(ENDPOINTS.NOTIFICATIONS, {
    cache: {
      key: 'notifications',
      duration: API_CONFIG.CACHE_DURATION.SHORT,
    },
  }),
};

export const clearCache = async () => {
  await AsyncStorage.clear();
};

export default api.api; 