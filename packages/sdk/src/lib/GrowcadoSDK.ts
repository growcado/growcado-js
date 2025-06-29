import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import type { SDKConfig, ContentConfig, CustomerIdentifiers, GrowcadoResponse, SDKInstance } from './types';

class GrowcadoSDKClass implements SDKInstance {
  private config: SDKConfig | null = null;
  private axiosInstance: AxiosInstance | null = null;
  private customerIdentifiers: CustomerIdentifiers = {};

  configure(config: SDKConfig): void {
    this.config = {
      baseURL: 'https://api.growcado.io/',
      enableAutoUTM: true,
      enableReferrerTracking: true,
      storage: 'localStorage',
      ...config
    };

    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL || 'https://api.growcado.io/',
    });

    // Set up request interceptor for automatic header injection
    this.axiosInstance.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
      // Ensure headers object exists
      if (!requestConfig.headers) {
        requestConfig.headers = new AxiosHeaders();
      }

      // Add customer identifiers header
      const customerHeader = this.buildCustomerIdentifiersHeader();
      if (customerHeader) {
        requestConfig.headers['X-CUSTOMER-IDENTIFIERS'] = customerHeader;
      }

      // Add UTM parameters if enabled
      if (this.config?.enableAutoUTM) {
        const storedUtmParams = this.getStoredValue('cxp_utm_params');
        if (storedUtmParams) {
          requestConfig.headers['X-UTM'] = storedUtmParams;
        }
      }

      // Add initial referrer if enabled
      if (this.config?.enableReferrerTracking) {
        const storedReferrer = this.getStoredValue('cxp_initial_referrer');
        if (storedReferrer) {
          requestConfig.headers['X-ENTRY-SOURCE-INITIAL-REFERRAL'] = storedReferrer;
        }
      }

      return requestConfig;
    });

    // Initialize tracking if enabled
    if (this.config.enableAutoUTM) {
      this.initializeUTMTracking();
    }
    if (this.config.enableReferrerTracking) {
      this.initializeReferrerTracking();
    }
  }

  async getContent<T>(config: ContentConfig): Promise<GrowcadoResponse<T>> {
    if (!this.config || !this.axiosInstance) {
      throw new Error('SDK not configured. Call GrowcadoSDK.configure() first.');
    }

    const tenantId = config.tenantId || this.config.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID is required either in SDK config or content config.');
    }

    const path = `cms/tenant/${tenantId}/published/${config.modelIdentifier}/${config.contentIdentifier}`;

    try {
      const response = await this.axiosInstance.get(path, 
        config.headers ? { headers: config.headers } : undefined
      );

      return { data: response.data };
    } catch (error: any) {
      console.error('[GrowcadoSDK] Error fetching content:', error);
      
      return {
        error: {
          message: error.response?.data?.message || error.message || 'An unknown error occurred',
          code: error.response?.status || error.code,
          details: error.response?.data || error.config,
        }
      };
    }
  }

  setCustomerIdentifiers(identifiers: CustomerIdentifiers): void {
    this.customerIdentifiers = { ...this.customerIdentifiers, ...identifiers };
    
    // Store in persistent storage if enabled
    if (this.config?.storage === 'localStorage') {
      this.setStoredValue('cxp_customer_identifiers', JSON.stringify(this.customerIdentifiers));
    }
  }

  getConfig(): SDKConfig | null {
    return this.config;
  }

  // Testing utility method to reset SDK state
  reset(): void {
    this.config = null;
    this.axiosInstance = null;
    this.customerIdentifiers = {};
  }

  private buildCustomerIdentifiersHeader(): string {
    // Load from storage if using localStorage
    if (this.config?.storage === 'localStorage') {
      const stored = this.getStoredValue('cxp_customer_identifiers');
      if (stored) {
        try {
          const storedIdentifiers = JSON.parse(stored);
          this.customerIdentifiers = { ...this.customerIdentifiers, ...storedIdentifiers };
        } catch (e) {
          console.warn('[GrowcadoSDK] Failed to parse stored customer identifiers');
        }
      }
    }

    const identifiers = Object.entries(this.customerIdentifiers)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`);

    return identifiers.length > 0 ? identifiers.join('&') : 'none:none';
  }

  private initializeUTMTracking(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const queryParams = new URLSearchParams(window.location.search);
    const utmParameters: string[] = [];

    queryParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        const strippedKey = key.substring(4); // Remove "utm_" prefix
        utmParameters.push(`${encodeURIComponent(strippedKey)}=${encodeURIComponent(value)}`);
      }
    });

    if (utmParameters.length > 0) {
      const utmParamsString = utmParameters.join('&');
      this.setStoredValue('cxp_utm_params', utmParamsString);
    }
  }

  private initializeReferrerTracking(): void {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const initialReferrer = document.referrer && document.referrer !== window.location.href ? document.referrer : null;
    
    if (initialReferrer && !this.getStoredValue('cxp_initial_referrer')) {
      this.setStoredValue('cxp_initial_referrer', initialReferrer);
    }
  }

  private getStoredValue(key: string): string | null {
    if (this.config?.storage === 'localStorage' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setStoredValue(key: string, value: string): void {
    if (this.config?.storage === 'localStorage' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
}

// Export singleton instance
export const GrowcadoSDK = new GrowcadoSDKClass(); 