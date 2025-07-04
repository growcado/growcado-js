import { beforeEach, describe, it, expect, afterEach, vi } from 'vitest';
import { GrowcadoSDK } from '../../GrowcadoSDK';

describe('SSR Integration Tests', () => {
  let localStorageMock: any;
  let windowMock: any;
  let documentMock: any;

  beforeEach(() => {
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

      // Clear previous mocks to isolate hydration behavior
      vi.clearAllMocks();

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

      // Step 5: Set additional customer identifiers after hydration
      GrowcadoSDK.setCustomerIdentifiers({ email: 'client@example.com' });
      
      // Should merge with existing server-side data (check the final merged call)
      const mergedIdentifiers = JSON.stringify({ 
        userId: 'server-user-123', 
        sessionId: 'server-session-456',
        email: 'client@example.com'
      });
      
      // Verify the final merged customer identifiers were stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cxp_customer_identifiers',
        mergedIdentifiers
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

      // Clear mocks after configuration
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
      // Save original globals
      const originalWindow = global.window;
      
      // Set window to undefined to simulate non-browser environment
      global.window = undefined as any;

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
      
      // Restore original window
      global.window = originalWindow;
    });

    it('should work in SSR and hydration workflow with manual UTM parameters', () => {
      // Save browser globals for later restoration
      const originalWindow = global.window;
      const originalDocument = global.document;
      const originalLocalStorage = global.localStorage;
      
      // Completely remove browser APIs for SSR simulation
      global.window = undefined as any;
      global.document = undefined as any;
      global.localStorage = undefined as any;
      
      // Configure in SSR mode
      GrowcadoSDK.configure({
        tenantId: 'test-tenant',
        storage: 'memory',
        ssrMode: true,
        enableAutoUTM: true
      });

      // Set UTM parameters on server-side
      GrowcadoSDK.setUTMParameters({
        source: 'server',
        medium: 'ssr'
      });

      // Verify they're set in SSR
      let params = GrowcadoSDK.getUTMParameters();
      expect(params).toEqual({
        source: 'server',
        medium: 'ssr'
      });

      // Restore browser environment for hydration
      global.window = windowMock as any;
      global.document = documentMock as any;
      global.localStorage = localStorageMock as any;
      
      // Ensure no URL parameters interfere with manual parameters
      windowMock.location.search = '';
      
      // Hydrate to browser environment
      GrowcadoSDK.hydrate();

      // Manual parameters should be preserved after hydration
      params = GrowcadoSDK.getUTMParameters();
      expect(params).toEqual({
        source: 'server',
        medium: 'ssr'
      });

      // Test that we can still set new manual parameters after hydration
      GrowcadoSDK.setUTMParameters({
        source: 'client',
        medium: 'hydrated'
      });

      params = GrowcadoSDK.getUTMParameters();
      expect(params).toEqual({
        source: 'client',
        medium: 'hydrated'
      });
      
      // Restore original globals
      global.window = originalWindow;
      global.document = originalDocument;
      global.localStorage = originalLocalStorage;
    });
  });
}); 