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

describe('HTTP Integration Tests', () => {
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

  const getRequestInterceptor = (mockAxiosInstance: any) => {
    if (!mockAxiosInstance.interceptors.request.use.mock.calls[0]) {
      throw new Error('Request interceptor not set up. Make sure SDK is configured first.');
    }
    return mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
  };

  describe('Request Interceptor Integration', () => {
    let interceptorFunction: any;

    beforeEach(() => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'localStorage'
      });
      
      // Get the interceptor function
      interceptorFunction = getRequestInterceptor(mockAxiosInstance);
    });

    it('should combine headers from all tracking components', () => {
      // Set up all tracking data
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com', userId: '123' });
      
      localStorageMock.getItem.mockImplementation((key: string) => {
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
      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('email=test@example.com&user_id=123');
      expect(modifiedConfig.headers['X-UTM']).toBe('source=google&medium=cpc');
      expect(modifiedConfig.headers['X-ENTRY-SOURCE-INITIAL-REFERRAL']).toBe('https://google.com');
    });

    it('should handle partial tracking data gracefully', () => {
      // Only set customer identifiers
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      
      localStorageMock.getItem.mockImplementation((key: string) => {
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

    it('should handle full end-to-end content fetching with all tracking', async () => {
      // Set up tracking data
      GrowcadoSDK.setCustomerIdentifiers({ email: 'test@example.com' });
      
      const mockResponse = {
        data: { id: 1, title: 'Test Content' }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await GrowcadoSDK.getContent({
        modelIdentifier: 'blog-post',
        contentIdentifier: 'test-post'
      });

      // Verify correct URL was called
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'cms/tenant/test-tenant/published/blog-post/test-post',
        undefined
      );

      // Verify response format
      expect(result).toEqual({ data: mockResponse.data });
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
          data: { 
            message: 'Content not found',
            timestamp: '2025-07-04T14:57:48.660+00:00',
            status: 404,
            error: 'Not Found',
            path: '/cms/tenant/test-tenant/published/blog-post/test-post'
          }
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
          details: serverError.response.data
        }
      });
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
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'cxp_customer_identifiers') return 'invalid-json';
        return null;
      });

      const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
      const requestConfig = { headers: {} };
      const modifiedConfig = interceptorFunction(requestConfig);

      // Should fall back to default
      expect(modifiedConfig.headers['X-CUSTOMER-IDENTIFIERS']).toBe('none:none');
    });
  });
}); 