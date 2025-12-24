import type { IStorageManager, SDKConfig } from '../core/types.js';

export class StorageManager implements IStorageManager {
  private storageType: 'localStorage' | 'memory';
  private memoryStorage: Map<string, string>;

  constructor(config: SDKConfig) {
    this.memoryStorage = new Map();
    this.storageType = this.resolveStorageType(config);
  }

  private resolveStorageType(config: SDKConfig): 'localStorage' | 'memory' {
    const requestedStorage = config.storage || 'localStorage';
    
    // For explicit SSR mode, always use memory regardless of storage config
    if (config.ssrMode === true) {
      return 'memory';
    }
    
    // Handle 'auto' storage type (only after SSR check)
    if (requestedStorage === 'auto') {
      return this.detectOptimalStorage();
    }
    
    // For explicit types, validate they work in current environment
    if (requestedStorage === 'localStorage') {
      return this.canUseLocalStorage() ? 'localStorage' : 'memory';
    }
    
    return requestedStorage as 'localStorage' | 'memory';
  }

  private detectOptimalStorage(): 'localStorage' | 'memory' {
    if (typeof window === 'undefined') return 'memory';
    return this.canUseLocalStorage() ? 'localStorage' : 'memory';
  }

  private canUseLocalStorage(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.setItem('growcado_test', 'test');
      localStorage.removeItem('growcado_test');
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.storageType === 'localStorage' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.memoryStorage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.storageType === 'localStorage' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage.set(key, value);
    }
  }

  clear(): void {
    if (this.storageType === 'localStorage' && typeof window !== 'undefined') {
      // Only clear our keys to avoid affecting other applications
      const keysToRemove = ['cxp_utm_params', 'cxp_initial_referrer', 'cxp_customer_identifiers'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } else {
      this.memoryStorage.clear();
    }
  }

  updateStorageType(storageType: 'localStorage' | 'memory'): void {
    this.storageType = storageType;
  }

  // Hydration-specific method: upgrade storage when browser APIs become available
  hydrateStorage(): boolean {
    // Only upgrade if we're currently using memory and localStorage is now available
    if (this.storageType === 'memory' && this.canUseLocalStorage()) {
      this.migrateToStorage('localStorage');
      return true;
    }
    return false;
  }

  migrateToStorage(newStorageType: 'localStorage' | 'memory'): void {
    if (this.storageType === newStorageType) return;

    // If migrating from memory to localStorage, transfer data
    if (this.storageType === 'memory' && newStorageType === 'localStorage' && typeof window !== 'undefined') {
      try {
        this.memoryStorage.forEach((value, key) => {
          localStorage.setItem(key, value);
        });
        this.memoryStorage.clear();
      } catch (error) {
        console.warn('[StorageManager] Failed to migrate to localStorage, staying with memory storage:', error);
        return;
      }
    }

    // If migrating from localStorage to memory, transfer data
    if (this.storageType === 'localStorage' && newStorageType === 'memory' && typeof window !== 'undefined') {
      try {
        const keysToMigrate = ['cxp_utm_params', 'cxp_initial_referrer', 'cxp_customer_identifiers'];
        keysToMigrate.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            this.memoryStorage.set(key, value);
          }
        });
      } catch (error) {
        console.warn('[StorageManager] Failed to read from localStorage during migration:', error);
      }
    }

    this.storageType = newStorageType;
  }

  getCurrentStorageType(): 'localStorage' | 'memory' {
    return this.storageType;
  }

  isHydrationCapable(): boolean {
    return this.storageType === 'memory' && this.canUseLocalStorage();
  }
} 