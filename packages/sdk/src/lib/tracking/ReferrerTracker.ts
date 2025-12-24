import type { ITracker, IStorageManager, SDKConfig, ReferrerData } from '../core/types.js';

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

    if (this.storage) {
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
    
    // Only update storage if we found a new referrer in the document
    // This preserves manually set referrer during hydration
    if (initialReferrer && !this.storage.getItem('cxp_initial_referrer')) {
      this.storage.setItem('cxp_initial_referrer', initialReferrer);
    }
  }

  // Manual referrer management
  setReferrer(referrer: string | ReferrerData): void {
    if (!this.storage) {
      console.warn('[ReferrerTracker] Storage not available. Cannot set referrer.');
      return;
    }

    let referrerUrl: string;
    
    if (typeof referrer === 'string') {
      referrerUrl = referrer;
    } else {
      referrerUrl = referrer.url;
    }

    if (referrerUrl && referrerUrl.trim() !== '') {
      this.storage.setItem('cxp_initial_referrer', referrerUrl.trim());
    } else {
      // If no valid referrer, clear existing referrer data
      this.storage.setItem('cxp_initial_referrer', '');
    }
  }

  clearReferrer(): void {
    if (this.storage) {
      this.storage.setItem('cxp_initial_referrer', '');
    }
  }

  getReferrer(): string | null {
    if (!this.storage) {
      return null;
    }

    const storedReferrer = this.storage.getItem('cxp_initial_referrer');
    return storedReferrer && storedReferrer.trim() !== '' ? storedReferrer : null;
  }
} 