import type { ITracker, IStorageManager, SDKConfig } from '../core/types';

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

    if (this.enabled && this.storage) {
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

    if (utmParameters.length > 0) {
      const utmParamsString = utmParameters.join('&');
      this.storage.setItem('cxp_utm_params', utmParamsString);
    }
  }
} 