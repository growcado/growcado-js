import { ReferrerTracker } from '../ReferrerTracker';
import { StorageManager } from '../../storage/StorageManager';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

// Mock window and document
const windowMock = {
  location: {
    href: 'https://example.com/current-page'
  }
};

const documentMock = {
  referrer: ''
};

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

describe('ReferrerTracker', () => {
  let referrerTracker: ReferrerTracker;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: windowMock,
      writable: true
    });
    Object.defineProperty(global, 'document', {
      value: documentMock,
      writable: true
    });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Clear localStorage mock store
    localStorageMock.clear();
    
    referrerTracker = new ReferrerTracker();
    storageManager = new StorageManager({
      tenantId: 'test-tenant',
      storage: 'memory'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset document referrer
    documentMock.referrer = '';
    // Clear localStorage mock store
    localStorageMock.clear();
  });

  describe('initialization with referrer tracking enabled', () => {
    it('should store initial referrer when present', () => {
      documentMock.referrer = 'https://google.com/search';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://google.com/search');
    });

    it('should not store referrer when it matches current page', () => {
      documentMock.referrer = 'https://example.com/current-page';
      windowMock.location.href = 'https://example.com/current-page';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
    });

    it('should not store empty referrer', () => {
      documentMock.referrer = '';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
    });

    it('should not overwrite existing referrer', () => {
      // Set existing referrer
      storageManager.setItem('cxp_initial_referrer', 'https://existing-referrer.com');
      
      documentMock.referrer = 'https://new-referrer.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://existing-referrer.com');
    });

    it('should handle different referrer formats', () => {
      const testCases = [
        'https://google.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.com/path?query=value#fragment'
      ];

      testCases.forEach((referrer, index) => {
        // Reset storage for each test
        const testStorage = new StorageManager({
          tenantId: `test-tenant-${index}`,
          storage: 'memory'
        });
        
        documentMock.referrer = referrer;
        
        referrerTracker.initialize({
          tenantId: `test-tenant-${index}`,
          enableReferrerTracking: true
        }, testStorage);

        const storedReferrer = testStorage.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe(referrer);
      });
    });

    it('should default to enabled when not specified', () => {
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant'
        // enableReferrerTracking not specified, should default to true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://google.com');
    });
  });

  describe('initialization with referrer tracking disabled', () => {
    it('should not store referrer when disabled', () => {
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: false
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
    });
  });

  describe('non-browser environment', () => {
    it('should not run when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
      
      // Restore original window
      global.window = originalWindow;
    });

    it('should not run when document is undefined', () => {
      const originalDocument = global.document;
      // @ts-expect-error - Intentionally setting document to undefined for testing
      global.document = undefined;
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
      
      // Restore original document
      global.document = originalDocument;
    });
  });

  describe('getHeaders', () => {
    beforeEach(() => {
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
    });

    it('should return referrer header when referrer is stored', () => {
      // Manually store referrer
      storageManager.setItem('cxp_initial_referrer', 'https://google.com');
      
      const headers = referrerTracker.getHeaders();
      
      expect(headers).toEqual({
        'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://google.com'
      });
    });

    it('should return empty headers when no referrer stored', () => {
      const headers = referrerTracker.getHeaders();
      
      expect(headers).toEqual({});
    });

    it('should not auto-capture referrer when auto-tracking is disabled', () => {
      // Set document referrer
      documentMock.referrer = 'https://google.com';
      
      // Initialize with referrer tracking disabled
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: false
      }, storageManager);
      
      // Should not have auto-captured the referrer
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBeNull();
      
      const headers = referrerTracker.getHeaders();
      expect(headers).toEqual({});
    });

    it('should return empty headers when storage is not available', () => {
      referrerTracker.reset();
      
      const headers = referrerTracker.getHeaders();
      
      expect(headers).toEqual({});
    });

    it('should handle various referrer formats in headers', () => {
      const testReferrers = [
        'https://google.com',
        'https://facebook.com/page',
        'https://twitter.com/user/status/123',
        'https://example.com:8080/path?query=value'
      ];

      testReferrers.forEach(referrer => {
        storageManager.setItem('cxp_initial_referrer', referrer);
        
        const headers = referrerTracker.getHeaders();
        
        expect(headers).toEqual({
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': referrer
        });
      });
    });

    it('should return headers for manually set referrer even when auto-tracking is disabled', () => {
      // Reinitialize with referrer tracking disabled
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: false
      }, storageManager);
      
      // Manually store referrer
      storageManager.setItem('cxp_initial_referrer', 'https://google.com');
      
      const headers = referrerTracker.getHeaders();
      
      // Manual referrer should still be returned even when auto-tracking is disabled
      expect(headers).toEqual({
        'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://google.com'
      });
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      // Verify initial state
      let headers = referrerTracker.getHeaders();
      expect(Object.keys(headers)).toContain('X-ENTRY-SOURCE-INITIAL-REFERRAL');
      
      referrerTracker.reset();
      
      // Verify reset state
      headers = referrerTracker.getHeaders();
      expect(headers).toEqual({});
    });

    it('should allow reinitialization after reset', () => {
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      referrerTracker.reset();
      
      documentMock.referrer = 'https://facebook.com';
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://facebook.com');
    });
  });

  describe('referrer comparison edge cases', () => {
    it('should handle URL with trailing slash differences', () => {
      documentMock.referrer = 'https://example.com/current-page/';
      windowMock.location.href = 'https://example.com/current-page';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      // Should still store because URLs don't match exactly
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://example.com/current-page/');
    });

    it('should handle case sensitivity', () => {
      documentMock.referrer = 'https://Example.com/Current-Page';
      windowMock.location.href = 'https://example.com/current-page';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      // Should store because of case differences
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://Example.com/Current-Page');
    });

    it('should handle query parameters and fragments', () => {
      documentMock.referrer = 'https://example.com/current-page?ref=google#section';
      windowMock.location.href = 'https://example.com/current-page';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      // Should store because URLs are different
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://example.com/current-page?ref=google#section');
    });
  });

  describe('integration with different storage modes', () => {
    it('should work with localStorage storage', () => {
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, localStorageManager);

      const headers = referrerTracker.getHeaders();
      expect(headers).toEqual({
        'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://google.com'
      });
    });

    it('should work with memory storage', () => {
      const memoryStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
      
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, memoryStorageManager);

      const headers = referrerTracker.getHeaders();
      expect(headers).toEqual({
        'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://google.com'
      });
    });
  });

  describe('storage key management', () => {
    it('should use correct storage key', () => {
      documentMock.referrer = 'https://google.com';
      
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);

      // Check that the correct key is used
      const storedReferrer = storageManager.getItem('cxp_initial_referrer');
      expect(storedReferrer).toBe('https://google.com');
      
      // Verify other keys are not set
      expect(storageManager.getItem('cxp_utm_params')).toBeNull();
      expect(storageManager.getItem('cxp_customer_identifiers')).toBeNull();
    });
  });

  describe('concurrent initialization scenarios', () => {
    it('should handle multiple initializations correctly', () => {
      // First initialization
      documentMock.referrer = 'https://first-referrer.com';
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      expect(storageManager.getItem('cxp_initial_referrer')).toBe('https://first-referrer.com');
      
      // Second initialization should not overwrite
      documentMock.referrer = 'https://second-referrer.com';
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      expect(storageManager.getItem('cxp_initial_referrer')).toBe('https://first-referrer.com');
    });

    it('should handle re-enabling after disabling', () => {
      // Initialize with tracking disabled
      documentMock.referrer = 'https://google.com';
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: false
      }, storageManager);
      
      expect(storageManager.getItem('cxp_initial_referrer')).toBeNull();
      
      // Re-initialize with tracking enabled
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
      
      expect(storageManager.getItem('cxp_initial_referrer')).toBe('https://google.com');
    });
  });

  describe('manual referrer management', () => {
    beforeEach(() => {
      referrerTracker.initialize({
        tenantId: 'test-tenant',
        enableReferrerTracking: true
      }, storageManager);
    });

    describe('setReferrer', () => {
      it('should set referrer as string', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        
        const storedReferrer = storageManager.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe('https://manual-referrer.com');
        
        const headers = referrerTracker.getHeaders();
        expect(headers).toEqual({
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should set referrer as ReferrerData object', () => {
        referrerTracker.setReferrer({
          url: 'https://manual-referrer.com',
          domain: 'manual-referrer.com'
        });
        
        const storedReferrer = storageManager.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe('https://manual-referrer.com');
      });

      it('should trim whitespace from referrer URL', () => {
        referrerTracker.setReferrer('  https://manual-referrer.com  ');
        
        const storedReferrer = storageManager.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe('https://manual-referrer.com');
      });

      it('should clear referrer when empty string provided', () => {
        // First set a referrer
        referrerTracker.setReferrer('https://manual-referrer.com');
        expect(storageManager.getItem('cxp_initial_referrer')).toBe('https://manual-referrer.com');
        
        // Then clear with empty string
        referrerTracker.setReferrer('');
        expect(storageManager.getItem('cxp_initial_referrer')).toBe('');
      });

      it('should clear referrer when whitespace-only string provided', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        referrerTracker.setReferrer('   ');
        
        const storedReferrer = storageManager.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe('');
      });

      it('should handle ReferrerData with empty URL', () => {
        referrerTracker.setReferrer({
          url: '',
          domain: 'example.com'
        });
        
        const storedReferrer = storageManager.getItem('cxp_initial_referrer');
        expect(storedReferrer).toBe('');
      });

      it('should warn when storage not available', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        referrerTracker.reset();
        
        referrerTracker.setReferrer('https://manual-referrer.com');
        
        expect(consoleSpy).toHaveBeenCalledWith('[ReferrerTracker] Storage not available. Cannot set referrer.');
        consoleSpy.mockRestore();
      });
    });

    describe('getReferrer', () => {
      it('should return stored referrer', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBe('https://manual-referrer.com');
      });

      it('should return null when no referrer stored', () => {
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should return null when referrer is empty string', () => {
        storageManager.setItem('cxp_initial_referrer', '');
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should return null when referrer is whitespace only', () => {
        storageManager.setItem('cxp_initial_referrer', '   ');
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should return null when storage not available', () => {
        referrerTracker.reset();
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });
    });

    describe('clearReferrer', () => {
      it('should clear stored referrer', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        expect(referrerTracker.getReferrer()).toBe('https://manual-referrer.com');
        
        referrerTracker.clearReferrer();
        expect(referrerTracker.getReferrer()).toBeNull();
        
        const headers = referrerTracker.getHeaders();
        expect(headers).toEqual({});
      });

      it('should handle clearing when no referrer set', () => {
        referrerTracker.clearReferrer();
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should handle clearing when storage not available', () => {
        referrerTracker.reset();
        
        expect(() => referrerTracker.clearReferrer()).not.toThrow();
      });
    });

    describe('manual tracking with auto-tracking disabled', () => {
      beforeEach(() => {
        referrerTracker.initialize({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        }, storageManager);
      });

      it('should allow manual referrer management when auto-tracking disabled', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBe('https://manual-referrer.com');
        
        const headers = referrerTracker.getHeaders();
        expect(headers).toEqual({
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should allow clearing manual referrer when auto-tracking disabled', () => {
        referrerTracker.setReferrer('https://manual-referrer.com');
        referrerTracker.clearReferrer();
        
        const referrer = referrerTracker.getReferrer();
        expect(referrer).toBeNull();
      });
    });
  });
}); 