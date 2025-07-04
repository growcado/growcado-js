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

describe('Tracking Integration Tests', () => {
  let mockAxiosInstance: any;
  let mockAxiosCreate: any;
  let localStorageMock: any;
  let windowMock: any;
  let documentMock: any;

  // Helper function to get the request interceptor
  const getRequestInterceptor = (mockAxiosInstance: any) => {
    if (!mockAxiosInstance.interceptors.request.use.mock.calls[0]) {
      throw new Error('Request interceptor not set up. Make sure SDK is configured first.');
    }
    return mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
  };

  beforeEach(() => {
    // Clear all mocks first
    vi.clearAllMocks();
    
    // Reset SDK state
    GrowcadoSDK.reset();

    // Create fresh mocks for each test
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

    // Create axios instance mock with fresh spies
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    };

    // Set up axios.create mock - ensure it's properly reset
    mockAxiosCreate = vi.mocked(axios.create);
    mockAxiosCreate.mockClear();
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
    GrowcadoSDK.reset();
    vi.clearAllMocks();
  });

  describe('Customer Identifier Management Integration', () => {
    it('should persist customer identifiers and make them available in requests', () => {
      // Configure SDK
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        enableAutoUTM: false,
        enableReferrerTracking: false
      });

      // Set customer identifiers
      GrowcadoSDK.setCustomerIdentifiers({
        userId: 'user123',
        sessionId: 'session456'
      });

      // Verify data is stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify({ userId: 'user123', sessionId: 'session456' })
      );

      // Get the interceptor function from the configure call
      const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
      const requestConfig = { headers: {} };

      // Call the interceptor
      interceptorFunction(requestConfig);

      // Verify customer identifiers are added to headers
      expect(requestConfig.headers).toEqual({
        'X-CUSTOMER-IDENTIFIERS': 'userId=user123&sessionId=session456'
      });
    });

    it('should merge multiple customer identifier calls', () => {
      // Configure SDK
      GrowcadoSDK.configure({
        tenantId: 'test-tenant'
      });

      // Set initial identifiers
      GrowcadoSDK.setCustomerIdentifiers({
        userId: 'user123'
      });

      // Add more identifiers
      GrowcadoSDK.setCustomerIdentifiers({
        sessionId: 'session456',
        email: 'test@example.com'
      });

      // Verify merged data is stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        JSON.stringify({
          userId: 'user123',
          sessionId: 'session456',
          email: 'test@example.com'
        })
      );
    });
  });

  describe('Manual UTM Integration', () => {
    describe('setUTMParameters', () => {
      it('should set UTM parameters and include them in request headers', () => {
        // Configure SDK
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: false
        });

        // Set manual UTM parameters
        GrowcadoSDK.setUTMParameters({
          source: 'newsletter',
          medium: 'email',
          campaign: 'spring-sale'
        });

        // Get the interceptor function from the configure call
        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };

        // Call the interceptor
        interceptorFunction(requestConfig);

        // Verify UTM parameters are added to headers
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=newsletter&medium=email&campaign=spring-sale'
        });
      });

      it('should set partial UTM parameters', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'google'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=google'
        });
      });

      it('should override auto-detected UTM parameters', () => {
        // Set URL with UTM parameters
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true
        });

        // Override with manual parameters
        GrowcadoSDK.setUTMParameters({
          source: 'manual',
          medium: 'email'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        // Manual should override auto-detected
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=manual&medium=email'
        });
      });

      it('should handle custom UTM parameters', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter',
          customParam: 'custom-value'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=newsletter&customParam=custom-value'
        });
      });

      it('should work when auto UTM is disabled', () => {
        windowMock.location.search = '?utm_source=google';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: false
        });

        GrowcadoSDK.setUTMParameters({
          source: 'manual'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=manual'
        });
      });
    });

    describe('getUTMParameters', () => {
      it('should return manually set UTM parameters', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: false
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter',
          medium: 'email'
        });

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toEqual({
          source: 'newsletter',
          medium: 'email'
        });
      });

      it('should return auto-detected UTM parameters when no manual ones are set', () => {
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true
        });

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toEqual({
          source: 'google',
          medium: 'cpc'
        });
      });

      it('should return null when no UTM parameters exist', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: false
        });

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should prioritize manual parameters over auto-detected ones', () => {
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true
        });

        GrowcadoSDK.setUTMParameters({
          source: 'manual',
          campaign: 'special'
        });

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toEqual({
          source: 'manual',
          campaign: 'special'
        });
      });
    });

    describe('clearUTMParameters', () => {
      it('should clear manually set UTM parameters', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter',
          medium: 'email'
        });

        GrowcadoSDK.clearUTMParameters();

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should clear auto-detected UTM parameters', () => {
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true
        });

        // Should have auto-detected params initially
        let params = GrowcadoSDK.getUTMParameters();
        expect(params).toEqual({
          source: 'google',
          medium: 'cpc'
        });

        GrowcadoSDK.clearUTMParameters();

        params = GrowcadoSDK.getUTMParameters();
        expect(params).toBeNull();
      });

      it('should remove UTM headers from requests after clearing', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        GrowcadoSDK.clearUTMParameters();

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).not.toHaveProperty('X-UTM');
      });

      it('should handle clearing when no parameters exist', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        // Clear when nothing is set - should not throw
        expect(() => GrowcadoSDK.clearUTMParameters()).not.toThrow();

        const params = GrowcadoSDK.getUTMParameters();
        expect(params).toBeNull();
      });
    });

    describe('integration with other SDK features', () => {
      it('should work alongside customer identifiers in request headers', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-UTM': 'source=newsletter'
        });
      });

      it('should work alongside referrer tracking in request headers', () => {
        documentMock.referrer = 'https://google.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: true
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        // Get the interceptor function from the configure call
        expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };

        // Call the interceptor
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-UTM': 'source=newsletter',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://google.com'
        });
      });

      it('should persist through SDK reset and reconfiguration', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'original'
        });

        GrowcadoSDK.reset();

        // After reset, parameters should be cleared
        let params = GrowcadoSDK.getUTMParameters();
        expect(params).toBeNull();

        // Reconfigure and set new parameters
        GrowcadoSDK.configure({
          tenantId: 'test-tenant-2'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'new'
        });

        params = GrowcadoSDK.getUTMParameters();
        expect(params).toEqual({
          source: 'new'
        });
      });

      it('should work with manual referrer alongside customer identifiers in request headers', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should work with manual referrer, UTM parameters, and customer identifiers all together', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: false,
          enableReferrerTracking: false
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123',
          sessionId: 'session456'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter',
          medium: 'email'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123&sessionId=session456',
          'X-UTM': 'source=newsletter&medium=email',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should prioritize manual referrer over auto-detected in combined scenarios', () => {
        // Set auto-detected values
        documentMock.referrer = 'https://auto-detected.com';
        windowMock.location.search = '?utm_source=google&utm_medium=cpc';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableAutoUTM: true,
          enableReferrerTracking: true
        });

        // Override with manual values
        GrowcadoSDK.setReferrer('https://manual-referrer.com');
        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        // Manual values should take precedence
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-UTM': 'source=newsletter',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should handle clearing manual referrer while preserving other tracking data', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        // Clear only referrer
        GrowcadoSDK.clearReferrer();

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        // UTM and customer identifiers should remain
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-UTM': 'source=newsletter'
        });
        expect(requestConfig.headers).not.toHaveProperty('X-ENTRY-SOURCE-INITIAL-REFERRAL');
      });

      it('should handle clearing all tracking data independently', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'newsletter'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        // Clear each type of tracking independently
        GrowcadoSDK.clearUTMParameters();

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        let requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });

        GrowcadoSDK.clearReferrer();

        requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123'
        });
      });

      it('should persist manual referrer through SDK reset and reconfiguration', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setReferrer('https://original-referrer.com');

        GrowcadoSDK.reset();

        // After reset, referrer should be cleared
        let referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBeNull();

        // Reconfigure and set new referrer
        GrowcadoSDK.configure({
          tenantId: 'test-tenant-2'
        });

        GrowcadoSDK.setReferrer('https://new-referrer.com');

        referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://new-referrer.com');
      });

      it('should work with ReferrerData object in combined scenarios', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setReferrer({
          url: 'https://complex-referrer.com/page?param=value',
          domain: 'complex-referrer.com'
        });

        GrowcadoSDK.setCustomerIdentifiers({
          userId: 'user123'
        });

        GrowcadoSDK.setUTMParameters({
          source: 'social',
          medium: 'facebook'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'userId=user123',
          'X-UTM': 'source=social&medium=facebook',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://complex-referrer.com/page?param=value'
        });
      });
    });
  });

  describe('Manual Referrer Integration', () => {
    describe('setReferrer', () => {
      it('should set referrer as string and include it in request headers', () => {
        // Configure SDK
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        });

        // Set manual referrer
        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        // Get the interceptor function from the configure call
        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };

        // Call the interceptor
        interceptorFunction(requestConfig);

        // Verify referrer is added to headers
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should set referrer as ReferrerData object and include URL in headers', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        });

        // Set referrer as ReferrerData object
        GrowcadoSDK.setReferrer({
          url: 'https://example.com/page',
          domain: 'example.com'
        });

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        // Only the URL should be in headers
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://example.com/page'
        });
      });

      it('should override auto-detected referrer', () => {
        // Set document referrer
        documentMock.referrer = 'https://auto-detected.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: true
        });

        // Override with manual referrer
        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        // Manual should override auto-detected
        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should work when auto referrer tracking is disabled', () => {
        documentMock.referrer = 'https://auto-detected.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).toEqual({
          'X-CUSTOMER-IDENTIFIERS': 'none:none',
          'X-ENTRY-SOURCE-INITIAL-REFERRAL': 'https://manual-referrer.com'
        });
      });

      it('should handle empty string by clearing referrer', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        // First set a referrer
        GrowcadoSDK.setReferrer('https://example.com');
        
        // Then clear with empty string
        GrowcadoSDK.setReferrer('');

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).not.toHaveProperty('X-ENTRY-SOURCE-INITIAL-REFERRAL');
      });
    });

    describe('getReferrer', () => {
      it('should return manually set referrer', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://manual-referrer.com');
      });

      it('should return auto-detected referrer when no manual one is set', () => {
        documentMock.referrer = 'https://auto-detected.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: true
        });

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://auto-detected.com');
      });

      it('should return null when no referrer exists', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: false
        });

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should prioritize manual referrer over auto-detected one', () => {
        documentMock.referrer = 'https://auto-detected.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: true
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://manual-referrer.com');
      });

      it('should return referrer set as ReferrerData object', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setReferrer({
          url: 'https://example.com/page',
          domain: 'example.com'
        });

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://example.com/page');
      });
    });

    describe('clearReferrer', () => {
      it('should clear manually set referrer', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        GrowcadoSDK.clearReferrer();

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should clear auto-detected referrer', () => {
        documentMock.referrer = 'https://auto-detected.com';

        GrowcadoSDK.configure({
          tenantId: 'test-tenant',
          enableReferrerTracking: true
        });

        // Should have auto-detected referrer initially
        let referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBe('https://auto-detected.com');

        GrowcadoSDK.clearReferrer();

        referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBeNull();
      });

      it('should remove referrer headers from requests after clearing', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        GrowcadoSDK.setReferrer('https://manual-referrer.com');

        GrowcadoSDK.clearReferrer();

        const interceptorFunction = getRequestInterceptor(mockAxiosInstance);
        const requestConfig = { headers: {} };
        interceptorFunction(requestConfig);

        expect(requestConfig.headers).not.toHaveProperty('X-ENTRY-SOURCE-INITIAL-REFERRAL');
      });

      it('should handle clearing when no referrer exists', () => {
        GrowcadoSDK.configure({
          tenantId: 'test-tenant'
        });

        // Clear when nothing is set - should not throw
        expect(() => GrowcadoSDK.clearReferrer()).not.toThrow();

        const referrer = GrowcadoSDK.getReferrer();
        expect(referrer).toBeNull();
      });
    });
  });
}); 
