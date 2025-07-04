import { AxiosHeaders } from 'axios';
import type { SDKConfig, ContentConfig, CustomerIdentifiers, GrowcadoResponse, SDKInstance, UTMParameters, ReferrerData } from './types';
import { StorageManager } from '../storage/StorageManager';
import { HttpClient } from '../http/HttpClient';
import { UTMTracker } from '../tracking/UTMTracker';
import { CustomerIdentifierManager } from '../tracking/CustomerIdentifierManager';
import { ReferrerTracker } from '../tracking/ReferrerTracker';

class GrowcadoSDKClass implements SDKInstance {
  private config: SDKConfig | null = null;
  private storageManager: StorageManager | null = null;
  private httpClient: HttpClient;
  private utmTracker: UTMTracker;
  private customerManager: CustomerIdentifierManager;
  private referrerTracker: ReferrerTracker;

  constructor() {
    // Initialize components
    this.httpClient = new HttpClient();
    this.utmTracker = new UTMTracker();
    this.customerManager = new CustomerIdentifierManager();
    this.referrerTracker = new ReferrerTracker();
  }

  configure(config: SDKConfig): void {
    this.config = {
      baseURL: 'https://api.growcado.io/',
      enableAutoUTM: true,
      enableReferrerTracking: true,
      storage: 'localStorage',
      ssrMode: typeof window === 'undefined',
      hydrateOnMount: true,
      ...config
    };

    // Initialize storage manager (handles storage type resolution internally)
    this.storageManager = new StorageManager(this.config);

    // Configure HTTP client
    this.httpClient.configure(this.config);

    // Initialize trackers based on environment
    this.initializeTrackers();

    // Set up request interceptor for automatic header injection
    const axiosInstance = this.httpClient.getAxiosInstance();
    if (axiosInstance) {
      axiosInstance.interceptors.request.use((requestConfig) => {
        // Ensure headers object exists
        if (!requestConfig.headers) {
          requestConfig.headers = new AxiosHeaders();
        }

        // Aggregate headers from all trackers
        const aggregatedHeaders = this.aggregateHeaders();
        Object.entries(aggregatedHeaders).forEach(([key, value]) => {
          requestConfig.headers[key] = value;
        });

        return requestConfig;
      });
    }
  }

  // New hydration method for client-side activation
  hydrate(): void {
    if (typeof window === 'undefined' || !this.config) {
      console.warn('[GrowcadoSDK] Hydrate called in non-browser environment');
      return;
    }

    // Update config to exit SSR mode
    this.config.ssrMode = false;

    // Let storage manager handle hydration
    const storageUpgraded = this.storageManager?.hydrateStorage() ?? false;

    // Re-initialize trackers with browser APIs
    this.initializeTrackers();

    console.log('[GrowcadoSDK] Hydration complete - browser features activated', 
      storageUpgraded ? '(storage upgraded to localStorage)' : '');
  }

  private initializeTrackers(): void {
    if (!this.config || !this.storageManager) return;

    // Determine if we should use SSR-safe initialization
    const useSSRMode = this.config.ssrMode || typeof window === 'undefined';

    if (useSSRMode) {
      // Server-safe initialization - no browser APIs
      this.utmTracker.initializeSSR(this.config, this.storageManager);
      this.customerManager.initializeSSR(this.config, this.storageManager);
      this.referrerTracker.initializeSSR(this.config, this.storageManager);
    } else {
      // Full initialization with browser APIs
      this.utmTracker.initialize(this.config, this.storageManager);
      this.customerManager.initialize(this.config, this.storageManager);
      this.referrerTracker.initialize(this.config, this.storageManager);
    }
  }

  async getContent<T>(config: ContentConfig): Promise<GrowcadoResponse<T>> {
    if (!this.config || !this.httpClient) {
      throw new Error('SDK not configured. Call GrowcadoSDK.configure() first.');
    }

    const tenantId = config.tenantId || this.config.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID is required either in SDK config or content config.');
    }

    const path = `cms/tenant/${tenantId}/published/${config.modelIdentifier}/${config.contentIdentifier}`;

    return this.httpClient.get<T>(path, config.headers);
  }

  setCustomerIdentifiers(identifiers: CustomerIdentifiers): void {
    this.customerManager.setIdentifiers(identifiers);
  }

  // Manual UTM tracking methods
  setUTMParameters(params: UTMParameters): void {
    this.utmTracker.setUTMParameters(params);
  }

  clearUTMParameters(): void {
    this.utmTracker.clearUTMParameters();
  }

  getUTMParameters(): UTMParameters | null {
    return this.utmTracker.getUTMParameters();
  }

  // Manual referrer tracking methods
  setReferrer(referrer: string | ReferrerData): void {
    this.referrerTracker.setReferrer(referrer);
  }

  clearReferrer(): void {
    this.referrerTracker.clearReferrer();
  }

  getReferrer(): string | null {
    return this.referrerTracker.getReferrer();
  }

  getConfig(): SDKConfig | null {
    return this.config;
  }

  // Testing utility method to reset SDK state
  reset(): void {
    this.config = null;
    this.storageManager = null;
    this.httpClient.reset();
    this.utmTracker.reset();
    this.customerManager.reset();
    this.referrerTracker.reset();
  }

  private aggregateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Get headers from all trackers
    const utmHeaders = this.utmTracker.getHeaders();
    const customerHeaders = this.customerManager.getHeaders();
    const referrerHeaders = this.referrerTracker.getHeaders();

    // Merge all headers
    Object.assign(headers, utmHeaders, customerHeaders, referrerHeaders);

    return headers;
  }
}

// Export singleton instance
export const GrowcadoSDK = new GrowcadoSDKClass(); 