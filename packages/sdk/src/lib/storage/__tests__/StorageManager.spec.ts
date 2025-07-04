import { StorageManager } from '../StorageManager';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock window
const windowMock = {};

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset localStorage mock implementation to default working state
    localStorageMock.setItem.mockImplementation((_key: string, _value: string) => {
      // Default implementation - just track the calls
    });
    localStorageMock.getItem.mockImplementation((_key: string) => null);
    localStorageMock.removeItem.mockImplementation((_key: string) => {
      // Default implementation - just track the calls
    });
    
    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: windowMock,
      writable: true
    });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('localStorage mode', () => {
    beforeEach(() => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
    });

    it('should use localStorage when available', () => {
      localStorageMock.getItem.mockReturnValue('stored-value');
      
      const result = storageManager.getItem('test-key');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe('stored-value');
    });

    it('should store items in localStorage', () => {
      storageManager.setItem('test-key', 'test-value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should clear specific keys from localStorage', () => {
      vi.clearAllMocks(); // Clear mocks from constructor storage detection
      
      storageManager.clear();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cxp_utm_params');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cxp_initial_referrer');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cxp_customer_identifiers');
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(3);
    });

    it('should return null when localStorage item does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = storageManager.getItem('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should fallback to memory storage when window is undefined', () => {
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;
      
      // Create new instance after window is undefined
      const memoryStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      vi.clearAllMocks(); // Clear any calls from constructor
      
      memoryStorageManager.setItem('test-key', 'test-value');
      const result = memoryStorageManager.getItem('test-key');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result).toBe('test-value');
    });
  });

  describe('memory mode', () => {
    beforeEach(() => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should use memory storage', () => {
      storageManager.setItem('test-key', 'test-value');
      const result = storageManager.getItem('test-key');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const result = storageManager.getItem('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should clear memory storage', () => {
      storageManager.setItem('test-key-1', 'value-1');
      storageManager.setItem('test-key-2', 'value-2');
      
      storageManager.clear();
      
      expect(storageManager.getItem('test-key-1')).toBeNull();
      expect(storageManager.getItem('test-key-2')).toBeNull();
    });

    it('should not affect localStorage when using memory mode', () => {
      vi.clearAllMocks(); // Clear any calls from constructor
      
      storageManager.setItem('test-key', 'test-value');
      storageManager.getItem('test-key');
      storageManager.clear();
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('auto storage mode', () => {
    it('should detect localStorage when available', () => {
      const autoStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'auto'
      });
      
      expect(autoStorageManager.getCurrentStorageType()).toBe('localStorage');
    });

    it('should fallback to memory when localStorage fails', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const autoStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'auto'
      });
      
      expect(autoStorageManager.getCurrentStorageType()).toBe('memory');
    });

    it('should fallback to memory when window is undefined', () => {
      // @ts-expect-error - Intentionally setting window to undefined
      global.window = undefined;
      
      const autoStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'auto'
      });
      
      expect(autoStorageManager.getCurrentStorageType()).toBe('memory');
    });
  });

  describe('SSR mode', () => {
    it('should always use memory storage in SSR mode regardless of storage config', () => {
      const ssrStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage',
        ssrMode: true
      });
      
      expect(ssrStorageManager.getCurrentStorageType()).toBe('memory');
    });

    it('should use memory storage for auto mode in SSR', () => {
      const ssrStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'auto',
        ssrMode: true
      });
      
      expect(ssrStorageManager.getCurrentStorageType()).toBe('memory');
    });
  });

  describe('storage validation', () => {
    it('should fallback to memory when localStorage is explicitly requested but not available', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });
      
      const validatedStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      expect(validatedStorageManager.getCurrentStorageType()).toBe('memory');
    });
  });

  describe('hydration', () => {
    let memoryStorageManager: StorageManager;

    beforeEach(() => {
      memoryStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should upgrade from memory to localStorage when localStorage becomes available', () => {
      // Start with memory storage
      expect(memoryStorageManager.getCurrentStorageType()).toBe('memory');
      expect(memoryStorageManager.isHydrationCapable()).toBe(true);
      
      // Add some data to memory
      memoryStorageManager.setItem('test-key', 'test-value');
      
      vi.clearAllMocks(); // Clear constructor calls
      
      // Hydrate storage
      const upgraded = memoryStorageManager.hydrateStorage();
      
      expect(upgraded).toBe(true);
      expect(memoryStorageManager.getCurrentStorageType()).toBe('localStorage');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should not upgrade when localStorage is not available', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(memoryStorageManager.isHydrationCapable()).toBe(false);
      
      const upgraded = memoryStorageManager.hydrateStorage();
      
      expect(upgraded).toBe(false);
      expect(memoryStorageManager.getCurrentStorageType()).toBe('memory');
    });

    it('should not upgrade when already using localStorage', () => {
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      vi.clearAllMocks();
      
      const upgraded = localStorageManager.hydrateStorage();
      
      expect(upgraded).toBe(false);
      expect(localStorageManager.getCurrentStorageType()).toBe('localStorage');
    });
  });

  describe('storage migration', () => {
    beforeEach(() => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should migrate data from memory to localStorage', () => {
      // Add data to memory
      storageManager.setItem('cxp_utm_params', 'utm-data');
      storageManager.setItem('cxp_customer_identifiers', 'customer-data');
      
      vi.clearAllMocks(); // Clear constructor calls
      
      // Migrate to localStorage
      storageManager.migrateToStorage('localStorage');
      
      // Verify migration calls were made - order may vary due to Map.forEach
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cxp_utm_params', 'utm-data');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cxp_customer_identifiers', 'customer-data');
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(storageManager.getCurrentStorageType()).toBe('localStorage');
    });

    it('should migrate data from localStorage to memory', () => {
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      // Mock existing localStorage data
      localStorageMock.getItem.mockImplementation((key) => {
        const data: Record<string, string> = {
          'cxp_utm_params': 'utm-data',
          'cxp_customer_identifiers': 'customer-data'
        };
        return data[key] || null;
      });
      
      vi.clearAllMocks();
      
      // Migrate to memory
      localStorageManager.migrateToStorage('memory');
      
      expect(localStorageManager.getCurrentStorageType()).toBe('memory');
      expect(localStorageManager.getItem('cxp_utm_params')).toBe('utm-data');
      expect(localStorageManager.getItem('cxp_customer_identifiers')).toBe('customer-data');
    });

    it('should handle migration failures gracefully', () => {
      storageManager.setItem('test-key', 'test-value');
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });
      
      vi.clearAllMocks();
      
      // Should not throw and should stay with memory
      storageManager.migrateToStorage('localStorage');
      
      expect(storageManager.getCurrentStorageType()).toBe('memory');
      expect(storageManager.getItem('test-key')).toBe('test-value');
    });

    it('should not migrate when target storage is the same', () => {
      vi.clearAllMocks();
      
      storageManager.migrateToStorage('memory');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });

  describe('default configuration', () => {
    it('should default to localStorage when storage not specified', () => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant'
      });
      
      expect(storageManager.getCurrentStorageType()).toBe('localStorage');
    });
  });

  describe('updateStorageType', () => {
    beforeEach(() => {
      // Reset localStorage mock to working state for this test group
      localStorageMock.setItem.mockImplementation((_key: string, _value: string) => {
        // Default working implementation
      });
      
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should switch from memory to localStorage', () => {
      vi.clearAllMocks(); // Clear constructor calls
      
      // Initially in memory mode
      storageManager.setItem('test-key', 'test-value');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Switch to localStorage
      storageManager.updateStorageType('localStorage');
      storageManager.setItem('new-key', 'new-value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('new-key', 'new-value');
    });

    it('should switch from localStorage to memory', () => {
      vi.clearAllMocks(); // Clear constructor calls
      
      storageManager.updateStorageType('localStorage');
      storageManager.setItem('test-key', 'test-value');
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      vi.clearAllMocks();
      
      // Switch to memory
      storageManager.updateStorageType('memory');
      storageManager.setItem('new-key', 'new-value');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('data persistence', () => {
    beforeEach(() => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should persist data across multiple operations', () => {
      storageManager.setItem('key1', 'value1');
      storageManager.setItem('key2', 'value2');
      storageManager.setItem('key3', 'value3');
      
      expect(storageManager.getItem('key1')).toBe('value1');
      expect(storageManager.getItem('key2')).toBe('value2');
      expect(storageManager.getItem('key3')).toBe('value3');
    });

    it('should overwrite existing values', () => {
      storageManager.setItem('test-key', 'initial-value');
      expect(storageManager.getItem('test-key')).toBe('initial-value');
      
      storageManager.setItem('test-key', 'updated-value');
      expect(storageManager.getItem('test-key')).toBe('updated-value');
    });

    it('should handle empty string values', () => {
      storageManager.setItem('empty-key', '');
      expect(storageManager.getItem('empty-key')).toBe('');
    });

    it('should handle special characters in keys and values', () => {
      const specialKey = 'key-with-special!@#$%^&*()_+characters';
      const specialValue = 'value with spaces and symbols: !@#$%^&*()';
      
      storageManager.setItem(specialKey, specialValue);
      expect(storageManager.getItem(specialKey)).toBe(specialValue);
    });
  });

  describe('utility methods', () => {
    it('should report current storage type correctly', () => {
      const memoryManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
      
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      expect(memoryManager.getCurrentStorageType()).toBe('memory');
      expect(localStorageManager.getCurrentStorageType()).toBe('localStorage');
    });

    it('should report hydration capability correctly', () => {
      const memoryManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
      
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      expect(memoryManager.isHydrationCapable()).toBe(true);
      expect(localStorageManager.isHydrationCapable()).toBe(false);
    });

    it('should report hydration not capable when localStorage fails', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const memoryManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
      
      expect(memoryManager.isHydrationCapable()).toBe(false);
    });
  });
}); 