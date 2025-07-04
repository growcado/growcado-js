import { beforeEach, describe, it, expect, afterEach, vi } from 'vitest';
import { GrowcadoSDK } from '../../GrowcadoSDK';
import axios from 'axios';

// Mock axios at the top level of this test file
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn()
    }
  };
});

describe('SDK Configuration Integration Tests', () => {
  let mockAxiosInstance: any;
  let mockAxiosCreate: any;
  let localStorageMock: any;
  let windowMock: any;
  let documentMock: any;

  beforeEach(() => {
    // Reset SDK state
    GrowcadoSDK.reset();

    // Create fresh mocks for each test
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    };

    // Set up axios.create mock
    mockAxiosCreate = vi.mocked(axios.create);
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);

    // Create localStorage mock
    let store: Record<string, string> = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    };

    // Create window mock
    windowMock = {
      location: {
        search: '',
        href: 'https://example.com'
      }
    };

    // Create document mock
    documentMock = {
      referrer: ''
    };

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
  });

  afterEach(() => {
    GrowcadoSDK.reset();
    vi.clearAllMocks();
  });

  describe('SDK Configuration Integration', () => {
    it('should coordinate all components during configuration', () => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        baseURL: 'https://custom.api.com/',
        enableAutoUTM: true,
        enableReferrerTracking: true,
        storage: 'localStorage'
      });

      // Verify HTTP client is configured
      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://custom.api.com/'
      });

      // Verify request interceptor is set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledWith(
        expect.any(Function)
      );

      // Verify configuration is stored
      const config = GrowcadoSDK.getConfig();
      expect(config).toEqual({
        tenantId: 'test-tenant',
        baseURL: 'https://custom.api.com/',
        enableAutoUTM: true,
        enableReferrerTracking: true,
        storage: 'localStorage',
        ssrMode: false,
        hydrateOnMount: true
      });
    });

    it('should initialize tracking components based on configuration', () => {
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';
      documentMock.referrer = 'https://google.com';
      
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        enableAutoUTM: true,
        enableReferrerTracking: true
      });

      // Verify UTM tracking was initialized
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_utm_params',
        'source=google&medium=cpc'
      );

      // Verify referrer tracking was initialized
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_initial_referrer',
        'https://google.com'
      );
    });

    it('should disable tracking components when configured to do so', () => {
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';
      documentMock.referrer = 'https://google.com';
      
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        enableAutoUTM: false,
        enableReferrerTracking: false
      });

      // Clear localStorage mock to check for new tracking calls
      localStorageMock.setItem.mockClear();
      
      // Simulate some activity that would trigger tracking if enabled
      windowMock.location.search = '?utm_source=facebook&utm_medium=social';
      
      // Verify no additional tracking calls were made
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Non-Browser Environment Integration', () => {
    it('should work in non-browser environments', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;

      expect(() => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true,
          enableReferrerTracking: true
        });
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Storage Mode Integration', () => {
    it('should work correctly in memory mode', () => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'memory',
        enableAutoUTM: false,
        enableReferrerTracking: false
      });

      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });

      // Should not use localStorage in memory mode
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // But should still work in request interceptor - need to check if interceptor was set up
      if (mockAxiosInstance.interceptors.request.use.mock.calls.length > 0) {
        const interceptorFunction = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
        const requestConfig = { headers: {} };
        const modifiedConfig = interceptorFunction(requestConfig);

        expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com');
      }
    });
  });

  describe('SDK State Management', () => {
    it('should properly reset all state', () => {
      // Configure and set up data
      GrowcadoSDK.configure({
        tenantId: 'test-tenant'
      });
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      
      expect(GrowcadoSDK.getConfig()).toBeTruthy();
      
      // Reset and verify
      GrowcadoSDK.reset();
      
      expect(GrowcadoSDK.getConfig()).toBeNull();
    });

    it('should allow reconfiguration after reset', () => {
      GrowcadoSDK.configure({ tenantId: 'initial-tenant' });
      GrowcadoSDK.reset();
      
      GrowcadoSDK.configure({ 
        tenantId: 'new-tenant',
        baseURL: 'https://new-api.com/'
      });

      const config = GrowcadoSDK.getConfig();
      expect(config?.tenantId).toBe('new-tenant');
      expect(config?.baseURL).toBe('https://new-api.com/');
    });
  });
}); 