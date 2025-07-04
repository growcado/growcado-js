import { GrowcadoSDK } from '../GrowcadoSDK';
import axios from 'axios';
import { vi, Mock, beforeEach, describe, it, expect, afterEach } from 'vitest';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        interceptors: {
          request: {
            use: vi.fn()
          }
        }
      }))
    }
  };
});

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

// Mock window and document
const windowMock = {
  location: {
    search: '',
    href: 'https://example.com'
  }
};

const documentMock = {
  referrer: ''
};

interface MockAxiosInstance {
  get: Mock;
  interceptors: {
    request: {
      use: Mock;
    };
  };
}

describe('GrowcadoSDK Integration Tests', () => {
  let mockAxiosInstance: MockAxiosInstance;
  let mockAxiosCreate: Mock;

  beforeEach(() => {
    // Reset SDK state before each test
    GrowcadoSDK.reset();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear localStorage mock store
    localStorageMock.clear();
    
    // Setup axios mock
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    };
    
    mockAxiosCreate = vi.mocked(axios.create);
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);
    
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

      // Clear mocks to exclude storage detection calls from constructor
      vi.clearAllMocks();
      
      // Simulate some activity that would trigger tracking if enabled
      windowMock.location.search = '?utm_source=facebook&utm_medium=social';
      
      // Verify no additional tracking calls were made
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Request Interceptor Integration', () => {
    let interceptorFunction: (config: { headers?: Record<string, string> }) => { headers: Record<string, string> };

    beforeEach(() => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      // Get the interceptor function
      interceptorFunction = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('should combine headers from all tracking components', () => {
      // Set up all tracking data
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com', userId: '123' });
      
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'cxp_utm_params': return 'source=google&medium=cpc';
          case 'cxp_initial_referrer': return 'https://google.com';
          case 'cxp_customer_identifiers': return JSON.stringify({ email: 'test@example.com', userId: '123' });
          default: return null;
        }
      });

      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      // Verify all headers are present
      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com&userId=123');
      expect(modifiedConfig.headers['X-UTM']).toBe('source=google&medium=cpc');
      expect(modifiedConfig.headers['X-ENTRY-SOURCE-INITIAL-REFERRAL']).toBe('https://google.com');
    });

    it('should handle partial tracking data gracefully', () => {
      // Only set customer identifiers
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cxp_customer_identifiers') {
          return JSON.stringify({ email: 'test@example.com' });
        }
        return null;
      });

      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      // Verify only customer identifier header is present
      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com');
      expect(modifiedConfig.headers['X-UTM']).toBeUndefined();
      expect(modifiedConfig.headers['X-ENTRY-SOURCE-INITIAL-REFERRAL']).toBeUndefined();
    });

    it('should preserve existing headers and create headers object if missing', () => {
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });

      // Test with no headers object
      const configWithoutHeaders = {};
      const modifiedConfig1 = interceptorFunction(configWithoutHeaders);
      expect(modifiedConfig1.headers).toBeDefined();

      // Test with existing headers
      const configWithHeaders = { 
        headers: { 'Authorization': 'Bearer token' } 
      };
      const modifiedConfig2 = interceptorFunction(configWithHeaders);
      expect(modifiedConfig2.headers['Authorization']).toBe('Bearer token');
      expect(modifiedConfig2.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com');
    });
  });

  describe('Content Fetching Integration', () => {
    beforeEach(() => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'memory'
      });
    });

    it('should handle full end-to-end content fetching with all tracking', () => {
      // Set up tracking data
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      
      const mockResponse = {
        data: { id: 1, title: 'Test Content' }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      return GrowcadoSDK.getContent({
        modelIdentifier: 'blog-post',
        contentIdentifier: 'test-post'
      }).then(result => {
        // Verify correct URL was called
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          'cms/tenant/test-tenant/published/blog-post/test-post',
          undefined
        );

        // Verify response format
        expect(result).toEqual({ data: mockResponse.data });
      });
    });

    it('should handle tenant ID override in content config', async () => {
      const mockResponse = { data: { id: 1, title: 'Test Content' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await GrowcadoSDK.getContent({
        modelIdentifier: 'blog-post',
        contentIdentifier: 'test-post',
        tenantId: 'override-tenant'
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'cms/tenant/override-tenant/published/blog-post/test-post',
        undefined
      );
    });

    it('should pass custom headers to HTTP client', async () => {
      const mockResponse = { data: { id: 1, title: 'Test Content' } };
      const customHeaders = { 'X-Custom-Header': 'test-value' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await GrowcadoSDK.getContent({
        modelIdentifier: 'blog-post',
        contentIdentifier: 'test-post',
        headers: customHeaders
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'cms/tenant/test-tenant/published/blog-post/test-post',
        { headers: customHeaders }
      );
    });

    it('should handle errors and return proper error format', async () => {
      const serverError = {
        response: {
          status: 404,
          data: { message: 'Content not found' }
        }
      };
      mockAxiosInstance.get.mockRejectedValue(serverError);

      const result = await GrowcadoSDK.getContent({
        modelIdentifier: 'blog-post',
        contentIdentifier: 'test-post'
      });

      expect(result).toEqual({
        error: {
          message: 'Content not found',
          code: 404,
          details: { message: 'Content not found' }
        }
      });
    });
  });

  describe('Customer Identifier Management Integration', () => {
    beforeEach(() => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
    });

    it('should persist customer identifiers and make them available in requests', () => {
      const identifiers = { email: 'test@example.com', userId: '123' };
      GrowcadoSDK.setCustomerIdentifiers(identifiers);

      // Verify storage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify(identifiers)
      );

      // Verify availability in request interceptor
      const interceptorFunction = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com&userId=123');
    });

    it('should merge multiple customer identifier calls', () => {
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      GrowcadoSDK.setCustomerIdentifiers({ userId: '123' });

      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify({ email: 'test@example.com', userId: '123' })
      );
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

  describe('Error Handling Integration', () => {
    it('should require configuration before use', async () => {
      await expect(GrowcadoSDK.getContent({
        modelIdentifier: 'test',
        contentIdentifier: 'test'
      })).rejects.toThrow('SDK not configured');
    });

    it('should require tenant ID', async () => {
      GrowcadoSDK.configure({
        tenantId: '',
        storage: 'memory'
      });

      await expect(GrowcadoSDK.getContent({
        modelIdentifier: 'test',
        contentIdentifier: 'test'
      })).rejects.toThrow('Tenant ID is required');
    });

    it('should handle malformed stored data gracefully', () => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });

      // Mock malformed JSON in storage
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'cxp_customer_identifiers') return 'invalid-json';
        return null;
      });

      const interceptorFunction = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      // Should fall back to default
      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('none:none');
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

      // But should still work in request interceptor
      const interceptorFunction = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com');
    });
  });

  describe('SSR and Hydration Integration', () => {
    it('should handle complete SSR to client hydration workflow', () => {
      // Step 1: Simulate SSR configuration
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'auto',
        ssrMode: true,
        enableAutoUTM: true,
        enableReferrerTracking: true
      });

      // Verify SSR configuration
      const ssrConfig = GrowcadoSDK.getConfig();
      expect(ssrConfig?.ssrMode).toBe(true);

      // Step 2: Set customer identifiers on server-side
      GrowcadoSDK.setCustomerIdentifiers({ 
        userId: 'server-user-123',
        sessionId: 'server-session-456' 
      });

      vi.clearAllMocks(); // Clear SSR initialization calls

      // Step 3: Simulate client-side hydration
      windowMock.location.search = '?utm_source=google&utm_medium=cpc';
      documentMock.referrer = 'https://google.com';
      
      GrowcadoSDK.hydrate();

      // Verify hydration updated config
      const hydratedConfig = GrowcadoSDK.getConfig();
      expect(hydratedConfig?.ssrMode).toBe(false);

      // Step 4: Verify tracking was activated during hydration
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_utm_params',
        'source=google&medium=cpc'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_initial_referrer',
        'https://google.com'
      );

      // Step 5: Verify customer identifiers persisted through hydration
      GrowcadoSDK.setCustomerIdentifiers({ email: 'client@example.com' });
      
      // Should store server-side data during SSR
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify({ userId: 'server-user-123', sessionId: 'server-session-456' })
      );
      
      // Should store client-side data after hydration (overwrites in this case)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify({ email: 'client@example.com' })
      );
    });

    it('should handle SSR with disabled tracking gracefully', () => {
      // Configure with tracking disabled in SSR
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        ssrMode: true,
        enableAutoUTM: false,
        enableReferrerTracking: false
      });

      vi.clearAllMocks();

      // Set up tracking data (should be ignored)
      windowMock.location.search = '?utm_source=facebook';
      documentMock.referrer = 'https://facebook.com';

      // Hydrate with tracking still disabled
      GrowcadoSDK.hydrate();

      // Verify tracking remains disabled after hydration
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'cxp_utm_params',
        expect.any(String)
      );
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'cxp_initial_referrer',
        expect.any(String)
      );
    });

    it('should handle hydration in non-browser environment gracefully', () => {
      // @ts-expect-error - Testing non-browser environment
      global.window = undefined;

      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'memory'
      });

      vi.clearAllMocks();

      // Should not throw and should warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Suppress console output during test
      });
      
      GrowcadoSDK.hydrate();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[GrowcadoSDK] Hydrate called in non-browser environment'
      );

      consoleSpy.mockRestore();
    });
  });
}); 