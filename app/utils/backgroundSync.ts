import { useStore } from '../store';
import { CacheManager } from './cacheManager';
import { checkConnection } from './networkStatus';
import { api } from '../services/api';

interface SyncOperation {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount?: number;
}

class BackgroundSync {
  private static instance: BackgroundSync;
  private isSyncing: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicSync();
  }

  static getInstance(): BackgroundSync {
    if (!BackgroundSync.instance) {
      BackgroundSync.instance = new BackgroundSync();
    }
    return BackgroundSync.instance;
  }

  private async syncOperation(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.action) {
        case 'CREATE_COMPLAINT':
          await api.post('/student/complaints', operation.data);
          break;
        case 'UPDATE_PROFILE':
          await api.put('/student/profile', operation.data);
          break;
        case 'SUBMIT_PAYMENT':
          await api.post('/student/payments', operation.data);
          break;
        // Add more cases as needed
        default:
          console.warn(`Unknown sync operation: ${operation.action}`);
          return false;
      }
      return true;
    } catch (error) {
      console.error(`Sync operation failed: ${operation.action}`, error);
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const isConnected = await checkConnection();
      if (!isConnected) {
        this.isSyncing = false;
        return;
      }

      const { offlineChanges, removeOfflineChange, setLastSyncTimestamp } = useStore.getState();
      
      for (const operation of offlineChanges) {
        const success = await this.syncOperation(operation);
        
        if (success) {
          removeOfflineChange(operation.id);
          
          // Invalidate related cache
          switch (operation.action) {
            case 'CREATE_COMPLAINT':
              await CacheManager.remove('cache_complaints');
              break;
            case 'UPDATE_PROFILE':
              await CacheManager.remove('cache_student_profile');
              break;
            case 'SUBMIT_PAYMENT':
              await CacheManager.remove('cache_payment_history');
              break;
          }
        } else {
          // Handle retry logic
          const retryCount = operation.retryCount || 0;
          if (retryCount < this.MAX_RETRIES) {
            useStore.setState(state => ({
              offlineChanges: state.offlineChanges.map(op =>
                op.id === operation.id
                  ? { ...op, retryCount: retryCount + 1 }
                  : op
              ),
            }));
          } else {
            // Remove failed operation after max retries
            removeOfflineChange(operation.id);
          }
        }
      }

      setLastSyncTimestamp(Date.now());
    } finally {
      this.isSyncing = false;
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, this.SYNC_INTERVAL);
  }

  public async syncNow(): Promise<void> {
    await this.processQueue();
  }

  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const backgroundSync = BackgroundSync.getInstance(); 