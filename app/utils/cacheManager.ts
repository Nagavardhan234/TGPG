import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/app/config/api.config';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  key: string;
  expiry: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cachePrefix = '@app_cache:';
  private maxCacheSize = 50 * 1024 * 1024; // 50MB

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(config: CacheConfig): Promise<T | null> {
    try {
      const key = this.cachePrefix + config.key;
      const cached = await AsyncStorage.getItem(key);

      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      if (now - item.timestamp > item.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(config: CacheConfig, data: T): Promise<void> {
    try {
      const key = this.cachePrefix + config.key;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: config.expiry,
      };

      await this.ensureCacheSize();
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cachePrefix + key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private async ensureCacheSize(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      const cacheItems: { key: string; size: number; timestamp: number }[] = [];

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          const item: CacheItem<any> = JSON.parse(value);
          cacheItems.push({ key, size, timestamp: item.timestamp });
        }
      }

      if (totalSize > this.maxCacheSize) {
        // Sort by timestamp (oldest first)
        cacheItems.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest items until we're under the limit
        while (totalSize > this.maxCacheSize && cacheItems.length > 0) {
          const item = cacheItems.shift();
          if (item) {
            await AsyncStorage.removeItem(item.key);
            totalSize -= item.size;
          }
        }
      }
    } catch (error) {
      console.error('Cache size management error:', error);
    }
  }
}

export const cacheManager = CacheManager.getInstance();

