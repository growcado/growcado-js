import type { ITracker, IStorageManager, SDKConfig } from '../core/types';

export class ReferrerTracker implements ITracker {
  private storage: IStorageManager | null = null;
  private enabled = false;

  initialize(config: SDKConfig, storage: IStorageManager): void {
    this.storage = storage;
    this.enabled = config.enableReferrerTracking ?? true;

    if (this.enabled) {
      this.initializeReferrerTracking();
    }
  }

  initializeSSR(config: SDKConfig, storage: IStorageManager): void {
    this.storage = storage;
    this.enabled = config.enableReferrerTracking ?? true;
    
    // Skip referrer tracking initialization in SSR mode - no document/window available
    // Referrer will be processed during hydration
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.enabled && this.storage) {
      const storedReferrer = this.storage.getItem('cxp_initial_referrer');
      if (storedReferrer) {
        headers['X-ENTRY-SOURCE-INITIAL-REFERRAL'] = storedReferrer;
      }
    }

    return headers;
  }

  reset(): void {
    this.storage = null;
    this.enabled = false;
  }

  private initializeReferrerTracking(): void {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined' || !this.storage) return;
    
    const initialReferrer = document.referrer && document.referrer !== window.location.href ? document.referrer : null;
    
    if (initialReferrer && !this.storage.getItem('cxp_initial_referrer')) {
      this.storage.setItem('cxp_initial_referrer', initialReferrer);
    }
  }
} 