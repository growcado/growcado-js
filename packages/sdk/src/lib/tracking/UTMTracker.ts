import type { ITracker, IStorageManager, SDKConfig, UTMParameters } from '../core/types';

export class UTMTracker implements ITracker {
  private storage: IStorageManager | null = null;
  private enabled = false;

  initialize(config: SDKConfig, storage: IStorageManager): void {
    this.storage = storage;
    this.enabled = config.enableAutoUTM ?? true;

    if (this.enabled) {
      this.initializeUTMTracking();
    }
  }

  initializeSSR(config: SDKConfig, storage: IStorageManager): void {
    this.storage = storage;
    this.enabled = config.enableAutoUTM ?? true;
    
    // Skip UTM tracking initialization in SSR mode - no browser APIs available
    // UTM parameters will be processed during hydration
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.storage) {
      const storedUtmParams = this.storage.getItem('cxp_utm_params');
      if (storedUtmParams) {
        headers['X-UTM'] = storedUtmParams;
      }
    }

    return headers;
  }

  reset(): void {
    this.storage = null;
    this.enabled = false;
  }

  private initializeUTMTracking(): void {
    // Only run in browser environment
    if (typeof window === 'undefined' || !this.storage) return;
    
    const queryParams = new URLSearchParams(window.location.search);
    const utmParameters: string[] = [];

    queryParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        const strippedKey = key.substring(4); // Remove "utm_" prefix
        utmParameters.push(`${encodeURIComponent(strippedKey)}=${encodeURIComponent(value)}`);
      }
    });

    // Only update storage if we found new UTM parameters in the URL
    // This preserves manually set parameters during hydration
    if (utmParameters.length > 0) {
      const utmParamsString = utmParameters.join('&');
      this.storage.setItem('cxp_utm_params', utmParamsString);
    }
  }

  // Manual UTM parameter management
  setUTMParameters(params: UTMParameters): void {
    if (!this.storage) {
      console.warn('[UTMTracker] Storage not available. Cannot set UTM parameters.');
      return;
    }

    const utmParameters: string[] = [];
    
    // Convert UTMParameters to the same format used by auto tracking
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        utmParameters.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    if (utmParameters.length > 0) {
      const utmParamsString = utmParameters.join('&');
      this.storage.setItem('cxp_utm_params', utmParamsString);
    } else {
      // If no valid parameters, clear existing UTM data
      this.storage.setItem('cxp_utm_params', '');
    }
  }

  clearUTMParameters(): void {
    if (this.storage) {
      this.storage.setItem('cxp_utm_params', '');
    }
  }

  getUTMParameters(): UTMParameters | null {
    if (!this.storage) {
      return null;
    }

    const storedUtmParams = this.storage.getItem('cxp_utm_params');
    if (!storedUtmParams) {
      return null;
    }

    const params: UTMParameters = {};
    const urlParams = new URLSearchParams(storedUtmParams);
    
    urlParams.forEach((value, key) => {
      params[key] = decodeURIComponent(value);
    });

    return Object.keys(params).length > 0 ? params : null;
  }
} 