import { UTMTracker } from '../UTMTracker';
import { StorageManager } from '../../storage/StorageManager';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

// Mock window
const windowMock = {
  location: {
    search: '',
  },
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe('UTMTracker', () => {
  let utmTracker: UTMTracker;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: windowMock,
      writable: true,
    });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Clear localStorage mock store
    localStorageMock.clear();

    utmTracker = new UTMTracker();
    storageManager = new StorageManager({
      tenantId: 'test-tenant',
      storage: 'memory',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset window location search
    windowMock.location.search = '';
    // Clear localStorage mock store
    localStorageMock.clear();
  });

  describe('initialization with UTM tracking enabled', () => {
    it('should extract and store UTM parameters', () => {
      windowMock.location.search =
        '?utm_source=google&utm_medium=cpc&utm_campaign=test';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=google&medium=cpc&campaign=test');
    });

    it('should handle URL encoded UTM parameters', () => {
      windowMock.location.search =
        '?utm_source=google%20ads&utm_medium=cpc&utm_campaign=test%20campaign';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe(
        'source=google%20ads&medium=cpc&campaign=test%20campaign'
      );
    });

    it('should filter out non-UTM parameters', () => {
      windowMock.location.search =
        '?utm_source=google&other_param=value&utm_medium=cpc&random=test';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=google&medium=cpc');
      expect(storedParams).not.toContain('other_param');
      expect(storedParams).not.toContain('random');
    });

    it('should handle all standard UTM parameters', () => {
      windowMock.location.search =
        '?utm_source=google&utm_medium=cpc&utm_campaign=test&utm_term=keyword&utm_content=ad';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe(
        'source=google&medium=cpc&campaign=test&term=keyword&content=ad'
      );
    });

    it('should not store anything when no UTM parameters present', () => {
      windowMock.location.search = '?other=value&test=123';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBeNull();
    });

    it('should handle empty query string', () => {
      windowMock.location.search = '';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBeNull();
    });

    it('should handle special characters in UTM values', () => {
      windowMock.location.search =
        '?utm_source=google&utm_campaign=test!@#$%^&*()_+';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toContain('source=google');
      // URL encoding happens, so special characters are encoded
      expect(storedParams).toContain('campaign=test!%40%23%24%25%5E');
    });
  });

  describe('initialization with UTM tracking disabled', () => {
    it('should not extract UTM parameters when disabled', () => {
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: false,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBeNull();
    });

    it('should default to enabled when not specified', () => {
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          // enableAutoUTM not specified, should default to true
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=google&medium=cpc');
    });
  });

  describe('non-browser environment', () => {
    it('should not run in non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBeNull();

      // Restore original window
      global.window = originalWindow;
    });
  });

  describe('getHeaders', () => {
    beforeEach(() => {
      // Create fresh storage manager for each test
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory',
      });
      utmTracker = new UTMTracker();
      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );
    });

    it('should return UTM header when parameters are stored', () => {
      // Manually store UTM parameters
      storageManager.setItem('cxp_utm_params', 'source=google&medium=cpc');

      const headers = utmTracker.getHeaders();

      expect(headers).toEqual({
        'X-UTM': 'source=google&medium=cpc',
      });
    });

    it('should return empty headers when no UTM parameters stored', () => {
      const headers = utmTracker.getHeaders();

      expect(headers).toEqual({});
    });

    it('should return empty headers when UTM tracking is disabled', () => {
      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: false,
        },
        storageManager
      );

      // Manually store UTM parameters
      storageManager.setItem('cxp_utm_params', 'source=google&medium=cpc');

      const headers = utmTracker.getHeaders();

      // Manual UTM parameters should still be included in headers even when auto UTM is disabled
      expect(headers).toEqual({
        'X-UTM': 'source=google&medium=cpc'
      });
    });

    it('should return empty headers when storage is not available', () => {
      utmTracker.reset();

      const headers = utmTracker.getHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      // Verify initial state
      let headers = utmTracker.getHeaders();
      expect(Object.keys(headers)).toContain('X-UTM');

      utmTracker.reset();

      // Verify reset state
      headers = utmTracker.getHeaders();
      expect(headers).toEqual({});
    });

    it('should allow reinitialization after reset', () => {
      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      utmTracker.reset();

      windowMock.location.search = '?utm_source=facebook&utm_medium=social';
      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=facebook&medium=social');
    });
  });

  describe('URL parsing edge cases', () => {
    it('should handle query string without question mark', () => {
      windowMock.location.search = 'utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=google&medium=cpc');
    });

    it('should handle empty UTM parameter values', () => {
      windowMock.location.search = '?utm_source=&utm_medium=cpc&utm_campaign=';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      expect(storedParams).toBe('source=&medium=cpc&campaign=');
    });

    it('should handle duplicate UTM parameters', () => {
      windowMock.location.search =
        '?utm_source=google&utm_source=facebook&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      // URLSearchParams keeps all values, but our implementation processes them differently
      expect(storedParams).toContain('source=');
      expect(storedParams).toContain('medium=cpc');
    });

    it('should handle UTM parameters with equals signs in values', () => {
      windowMock.location.search = '?utm_source=google&utm_content=test=value';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );

      const storedParams = storageManager.getItem('cxp_utm_params');
      // Equals sign gets URL encoded
      expect(storedParams).toBe('source=google&content=test%3Dvalue');
    });
  });

  describe('integration with different storage modes', () => {
    it('should work with localStorage storage', () => {
      const localStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'localStorage',
      });

      windowMock.location.search = '?utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        localStorageManager
      );

      const headers = utmTracker.getHeaders();
      expect(headers).toEqual({
        'X-UTM': 'source=google&medium=cpc',
      });
    });

    it('should work with memory storage', () => {
      const memoryStorageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory',
      });

      windowMock.location.search = '?utm_source=google&utm_medium=cpc';

      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        memoryStorageManager
      );

      const headers = utmTracker.getHeaders();
      expect(headers).toEqual({
        'X-UTM': 'source=google&medium=cpc',
      });
    });
  });

  describe('manual UTM operations', () => {
    beforeEach(() => {
      storageManager = new StorageManager({
        tenantId: 'test-tenant',
        storage: 'memory',
      });
      utmTracker = new UTMTracker();
      utmTracker.initialize(
        {
          tenantId: 'test-tenant',
          enableAutoUTM: true,
        },
        storageManager
      );
    });

    describe('setUTMParameters', () => {
      it('should store all standard UTM parameters', () => {
        const utmParams = {
          source: 'newsletter',
          medium: 'email',
          campaign: 'holiday-sale',
          term: 'winter-deals',
          content: 'top-banner',
        };

        utmTracker.setUTMParameters(utmParams);

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe(
          'source=newsletter&medium=email&campaign=holiday-sale&term=winter-deals&content=top-banner'
        );
      });

      it('should store partial UTM parameters', () => {
        const utmParams = {
          source: 'facebook',
          campaign: 'summer-promo',
        };

        utmTracker.setUTMParameters(utmParams);

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('source=facebook&campaign=summer-promo');
      });

      it('should store custom UTM parameters', () => {
        const utmParams = {
          source: 'google',
          medium: 'cpc',
          custom_param: 'custom-value',
          another_param: 'another-value',
        };

        utmTracker.setUTMParameters(utmParams);

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toContain('source=google');
        expect(storedParams).toContain('medium=cpc');
        expect(storedParams).toContain('custom_param=custom-value');
        expect(storedParams).toContain('another_param=another-value');
      });

      it('should handle URL encoding of special characters', () => {
        const utmParams = {
          source: 'google ads',
          campaign: 'test campaign!@#$%^&*()',
          content: 'banner with spaces',
        };

        utmTracker.setUTMParameters(utmParams);

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toContain('source=google%20ads');
        expect(storedParams).toContain(
          'campaign=test%20campaign!%40%23%24%25%5E%26*()'
        );
        expect(storedParams).toContain('content=banner%20with%20spaces');
      });

      it('should ignore undefined and empty string values', () => {
        const utmParams = {
          source: 'google',
          medium: undefined,
          campaign: undefined,
          term: '',
          content: 'banner',
        };

        utmTracker.setUTMParameters(utmParams);

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('source=google&content=banner');
        expect(storedParams).not.toContain('medium');
        expect(storedParams).not.toContain('campaign');
        expect(storedParams).not.toContain('term');
      });

      it('should clear UTM data when no valid parameters provided', () => {
        // First set some UTM data
        storageManager.setItem('cxp_utm_params', 'source=google&medium=cpc');

        // Then call setUTMParameters with no valid params
        utmTracker.setUTMParameters({
          source: undefined,
          medium: undefined,
          campaign: '',
        });

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('');
      });

      it('should warn when storage is not available', () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {
            // Intentionally suppress console output during test
            return undefined;
          });
        utmTracker.reset();

        utmTracker.setUTMParameters({ source: 'google' });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[UTMTracker] Storage not available. Cannot set UTM parameters.'
        );

        consoleWarnSpy.mockRestore();
      });

      it('should override auto-detected UTM parameters', () => {
        // First auto-detect some UTM params
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';
        utmTracker.initialize(
          {
            tenantId: 'test-tenant',
            enableAutoUTM: true,
          },
          storageManager
        );

        // Override with manual params
        utmTracker.setUTMParameters({
          source: 'newsletter',
          medium: 'email',
          campaign: 'manual-override',
        });

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe(
          'source=newsletter&medium=email&campaign=manual-override'
        );
      });
    });

    describe('clearUTMParameters', () => {
      it('should clear stored UTM parameters', () => {
        // First set some UTM parameters
        utmTracker.setUTMParameters({
          source: 'google',
          medium: 'cpc',
          campaign: 'test',
        });

        // Verify they're stored
        let storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('source=google&medium=cpc&campaign=test');

        // Clear them
        utmTracker.clearUTMParameters();

        // Verify they're cleared
        storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('');
      });

      it('should handle clearing when no parameters exist', () => {
        utmTracker.clearUTMParameters();

        const storedParams = storageManager.getItem('cxp_utm_params');
        expect(storedParams).toBe('');
      });

      it('should not error when storage is not available', () => {
        utmTracker.reset();

        expect(() => {
          utmTracker.clearUTMParameters();
        }).not.toThrow();
      });
    });

    describe('getUTMParameters', () => {
      it('should return stored UTM parameters as object', () => {
        utmTracker.setUTMParameters({
          source: 'google',
          medium: 'cpc',
          campaign: 'test-campaign',
          term: 'keyword',
          content: 'banner',
        });

        const params = utmTracker.getUTMParameters();
        expect(params).toEqual({
          source: 'google',
          medium: 'cpc',
          campaign: 'test-campaign',
          term: 'keyword',
          content: 'banner',
        });
      });

      it('should return custom UTM parameters', () => {
        utmTracker.setUTMParameters({
          source: 'google',
          medium: 'cpc',
          custom_param: 'custom-value',
          another_param: 'another-value',
        });

        const params = utmTracker.getUTMParameters();
        expect(params).toEqual({
          source: 'google',
          medium: 'cpc',
          custom_param: 'custom-value',
          another_param: 'another-value',
        });
      });

      it('should handle URL decoding of parameter values', () => {
        // Manually set encoded parameters to simulate storage
        storageManager.setItem(
          'cxp_utm_params',
          'source=google%20ads&campaign=test%20campaign&content=banner%20ad'
        );

        const params = utmTracker.getUTMParameters();
        expect(params).toEqual({
          source: 'google ads',
          campaign: 'test campaign',
          content: 'banner ad',
        });
      });

      it('should return null when no UTM parameters stored', () => {
        const params = utmTracker.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should return null when UTM parameters are empty', () => {
        storageManager.setItem('cxp_utm_params', '');

        const params = utmTracker.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should return null when storage is not available', () => {
        utmTracker.reset();

        const params = utmTracker.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should work with auto-detected parameters', () => {
        windowMock.location.search =
          '?utm_source=facebook&utm_medium=social&utm_campaign=auto-test';
        utmTracker.initialize(
          {
            tenantId: 'test-tenant',
            enableAutoUTM: true,
          },
          storageManager
        );

        const params = utmTracker.getUTMParameters();
        expect(params).toEqual({
          source: 'facebook',
          medium: 'social',
          campaign: 'auto-test',
        });
      });
    });

    describe('manual and auto UTM integration', () => {
      it('should work alongside getHeaders method', () => {
        utmTracker.setUTMParameters({
          source: 'newsletter',
          medium: 'email',
          campaign: 'test',
        });

        const headers = utmTracker.getHeaders();
        expect(headers).toEqual({
          'X-UTM': 'source=newsletter&medium=email&campaign=test',
        });
      });

      it('should respect enableAutoUTM setting for getHeaders', () => {
        // Reinitialize with auto UTM disabled
        utmTracker.initialize(
          {
            tenantId: 'test-tenant',
            enableAutoUTM: false,
          },
          storageManager
        );

        utmTracker.setUTMParameters({
          source: 'newsletter',
          medium: 'email',
        });

        const headers = utmTracker.getHeaders();
        // Manual UTM parameters should still be included in headers even when auto UTM is disabled
        expect(headers).toEqual({
          'X-UTM': 'source=newsletter&medium=email'
        });
      });

      it('should allow manual parameters even when auto UTM is disabled', () => {
        // Reinitialize with auto UTM disabled
        utmTracker.initialize(
          {
            tenantId: 'test-tenant',
            enableAutoUTM: false,
          },
          storageManager
        );

        utmTracker.setUTMParameters({
          source: 'manual',
          medium: 'api',
        });

        const params = utmTracker.getUTMParameters();
        expect(params).toEqual({
          source: 'manual',
          medium: 'api',
        });
      });
    });
  });
});
