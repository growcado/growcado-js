import { CustomerIdentifierManager } from '../CustomerIdentifierManager';
import { StorageManager } from '../../storage/StorageManager';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

describe('CustomerIdentifierManager', () => {
  let customerManager: CustomerIdentifierManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    customerManager = new CustomerIdentifierManager();
    storageManager = new StorageManager({
      tenantId: 'test-tenant',
      storage: 'memory'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear localStorage mock store
    localStorageMock.clear();
  });

  describe('initialization', () => {
    it('should initialize with empty identifiers', () => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({});
    });

    it('should reset in-memory identifiers on initialization but preserve storage', () => {
      // Set some identifiers first
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      // Re-initialize
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);

      const identifiers = customerManager.getIdentifiers();
      // Should still have the stored data, but in-memory state was reset
      expect(identifiers).toEqual({ email: 'test@example.com' });
    });
  });

  describe('setIdentifiers', () => {
    beforeEach(() => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
    });

    it('should store single identifier', () => {
      customerManager.setIdentifiers({ email: 'test@example.com' });

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ email: 'test@example.com' });
    });

    it('should store multiple identifiers', () => {
      const testIdentifiers = {
        email: 'test@example.com',
        userId: '12345',
        anonymousId: 'anon-123'
      };

      customerManager.setIdentifiers(testIdentifiers);

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual(testIdentifiers);
    });

    it('should merge with existing identifiers', () => {
      customerManager.setIdentifiers({ email: 'test@example.com' });
      customerManager.setIdentifiers({ userId: '12345' });

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({
        email: 'test@example.com',
        userId: '12345'
      });
    });

    it('should overwrite existing identifier values', () => {
      customerManager.setIdentifiers({ email: 'old@example.com' });
      customerManager.setIdentifiers({ email: 'new@example.com' });

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ email: 'new@example.com' });
    });

    it('should handle custom identifier keys', () => {
      customerManager.setIdentifiers({ customKey: 'customValue' });

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ customKey: 'customValue' });
    });

    it('should store identifiers in storage', () => {
      const testIdentifiers = { email: 'test@example.com', userId: '12345' };
      
      customerManager.setIdentifiers(testIdentifiers);

      const storedData = storageManager.getItem('cxp_customer_identifiers');
      expect(storedData).toBe(JSON.stringify(testIdentifiers));
    });

    it('should handle undefined and empty string values', () => {
      customerManager.setIdentifiers({
        email: 'test@example.com',
        userId: undefined,
        anonymousId: '',
        validId: '123'
      });

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({
        email: 'test@example.com',
        userId: undefined,
        anonymousId: '',
        validId: '123'
      });
    });
  });

  describe('getIdentifiers', () => {
    beforeEach(() => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
    });

    it('should load identifiers from storage', () => {
      const storedIdentifiers = { email: 'stored@example.com', userId: '67890' };
      storageManager.setItem('cxp_customer_identifiers', JSON.stringify(storedIdentifiers));

      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual(storedIdentifiers);
    });

    it('should merge stored identifiers with in-memory identifiers', () => {
      // Store some identifiers
      const storedIdentifiers = { email: 'stored@example.com' };
      storageManager.setItem('cxp_customer_identifiers', JSON.stringify(storedIdentifiers));
      
      // Create new customer manager instance to test merging
      const newCustomerManager = new CustomerIdentifierManager();
      newCustomerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      
      // Set some in-memory identifiers (this will now merge with stored data)
      newCustomerManager.setIdentifiers({ userId: '12345' });

      const identifiers = newCustomerManager.getIdentifiers();
      expect(identifiers).toEqual({
        email: 'stored@example.com',
        userId: '12345'
      });
    });

    it('should prioritize in-memory identifiers over stored ones for same keys', () => {
      // Store identifiers with old email
      const storedIdentifiers = { email: 'old@example.com', userId: '12345' };
      storageManager.setItem('cxp_customer_identifiers', JSON.stringify(storedIdentifiers));
      
      // Create new customer manager instance to test priority
      const newCustomerManager = new CustomerIdentifierManager();
      newCustomerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      
      // Set new email in memory (should override stored email but keep stored userId)
      newCustomerManager.setIdentifiers({ email: 'new@example.com' });

      const identifiers = newCustomerManager.getIdentifiers();
      expect(identifiers).toEqual({
        email: 'new@example.com',
        userId: '12345'
      });
    });

    it('should handle malformed JSON in storage gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      // Store invalid JSON directly in storage
      storageManager.setItem('cxp_customer_identifiers', 'invalid-json');
      
      // Create new customer manager instance to trigger JSON parsing
      const newCustomerManager = new CustomerIdentifierManager();
      newCustomerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      
      // Set some in-memory identifiers
      newCustomerManager.setIdentifiers({ email: 'test@example.com' });

      const identifiers = newCustomerManager.getIdentifiers();
      expect(identifiers).toEqual({ email: 'test@example.com' });
      expect(consoleSpy).toHaveBeenCalledWith('[GrowcadoSDK] Failed to parse stored customer identifiers');
      
      consoleSpy.mockRestore();
    });

    it('should return empty object when no identifiers exist', () => {
      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({});
    });

    it('should handle null stored data', () => {
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ email: 'test@example.com' });
    });
  });

  describe('getHeaders', () => {
    beforeEach(() => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
    });

    it('should return default header when no identifiers', () => {
      const headers = customerManager.getHeaders();
      
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'none:none'
      });
    });

    it('should build header from single identifier', () => {
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      const headers = customerManager.getHeaders();
      
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'email=test@example.com'
      });
    });

    it('should build header from multiple identifiers', () => {
      customerManager.setIdentifiers({
        email: 'test@example.com',
        userId: '12345',
        anonymousId: 'anon-123'
      });
      
      const headers = customerManager.getHeaders();
      
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toContain('email=test@example.com');
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toContain('userId=12345');
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toContain('anonymousId=anon-123');
    });

    it('should filter out undefined values', () => {
      customerManager.setIdentifiers({
        email: 'test@example.com',
        userId: undefined,
        validId: '123'
      });
      
      const headers = customerManager.getHeaders();
      
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com&validId=123');
    });

    it('should filter out empty string values', () => {
      customerManager.setIdentifiers({
        email: 'test@example.com',
        userId: '',
        validId: '123'
      });
      
      const headers = customerManager.getHeaders();
      
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com&validId=123');
    });

    it('should handle special characters in values', () => {
      customerManager.setIdentifiers({
        email: 'test+tag@example.com',
        customId: 'value with spaces & symbols!'
      });
      
      const headers = customerManager.getHeaders();
      
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toContain('email=test+tag@example.com');
      expect(headers['X-CUSTOMER-IDENTIFIERS']).toContain('customId=value with spaces & symbols!');
    });

    it('should return none:none when all values are filtered out', () => {
      customerManager.setIdentifiers({
        email: '',
        userId: undefined,
        anonymousId: ''
      });
      
      const headers = customerManager.getHeaders();
      
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'none:none'
      });
    });

    it('should include identifiers from storage', () => {
      // Store identifiers
      const storedIdentifiers = { email: 'stored@example.com' };
      storageManager.setItem('cxp_customer_identifiers', JSON.stringify(storedIdentifiers));
      
      const headers = customerManager.getHeaders();
      
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'email=stored@example.com'
      });
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      // Verify initial state
      let identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ email: 'test@example.com' });
      
      customerManager.reset();
      
      // Verify reset state
      identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({});
      
      const headers = customerManager.getHeaders();
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'none:none'
      });
    });

    it('should allow reinitialization after reset', () => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
      
      customerManager.setIdentifiers({ email: 'test@example.com' });
      customerManager.reset();
      
      customerManager.initialize({
        tenantId: 'new-tenant'
      }, storageManager);
      
      customerManager.setIdentifiers({ userId: '67890' });
      
      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({ userId: '67890' });
    });
  });

  describe('integration with different storage modes', () => {
    it('should work with localStorage storage', () => {
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, localStorageManager);
      
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      const headers = customerManager.getHeaders();
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'email=test@example.com'
      });
    });

    it('should work with memory storage', () => {
      const memoryStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
      
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, memoryStorageManager);
      
      customerManager.setIdentifiers({ email: 'test@example.com' });
      
      const headers = customerManager.getHeaders();
      expect(headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'email=test@example.com'
      });
    });
  });

  describe('JSON serialization edge cases', () => {
    beforeEach(() => {
      customerManager.initialize({
        tenantId: 'test-tenant'
      }, storageManager);
    });

    it('should handle complex nested objects (flattened)', () => {
      const complexIdentifiers = {
        email: 'test@example.com',
        metadata: JSON.stringify({ plan: 'premium', region: 'us-east' })
      };
      
      customerManager.setIdentifiers(complexIdentifiers);
      
      const storedData = storageManager.getItem('cxp_customer_identifiers');
      expect(storedData).not.toBeNull();
      expect(JSON.parse(storedData as string)).toEqual(complexIdentifiers);
    });

    it('should handle unicode characters', () => {
      customerManager.setIdentifiers({
        email: 'tëst@ëxämplë.com',
        name: '测试用户'
      });
      
      const identifiers = customerManager.getIdentifiers();
      expect(identifiers).toEqual({
        email: 'tëst@ëxämplë.com',
        name: '测试用户'
      });
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000);
      customerManager.setIdentifiers({ longId: longValue });
      
      const identifiers = customerManager.getIdentifiers();
      expect(identifiers['longId']).toBe(longValue);
    });
  });
}); 