import type { ICustomerIdentifierManager, IStorageManager, SDKConfig, CustomerIdentifiers } from '../core/types';

export class CustomerIdentifierManager implements ICustomerIdentifierManager {
  private storage: IStorageManager | null = null;
  private customerIdentifiers: CustomerIdentifiers = {};

  initialize(config: SDKConfig, storage: IStorageManager): void {
    this.storage = storage;
    this.customerIdentifiers = {};
  }

  initializeSSR(config: SDKConfig, storage: IStorageManager): void {
    // Customer identifier management doesn't use browser APIs, so SSR init is the same
    this.initialize(config, storage);
  }

  setIdentifiers(identifiers: CustomerIdentifiers): void {
    // First merge with in-memory identifiers
    this.customerIdentifiers = { ...this.customerIdentifiers, ...identifiers };
    
    // Store in persistent storage if available, merging with existing stored data
    if (this.storage) {
      let allIdentifiers = { ...this.customerIdentifiers };
      
      // Read existing stored data and merge
      const stored = this.storage.getItem('cxp_customer_identifiers');
      if (stored) {
        try {
          const storedIdentifiers = JSON.parse(stored);
          // Merge: stored data first, then in-memory (prioritizing in-memory for conflicts)
          allIdentifiers = { ...storedIdentifiers, ...this.customerIdentifiers };
        } catch (_e) {
          console.warn('[GrowcadoSDK] Failed to parse stored customer identifiers');
          // Continue with just in-memory data
        }
      }
      
      this.storage.setItem('cxp_customer_identifiers', JSON.stringify(allIdentifiers));
    }
  }

  getIdentifiers(): CustomerIdentifiers {
    // Load from storage if using localStorage and merge with in-memory
    let allIdentifiers = { ...this.customerIdentifiers };
    
    if (this.storage) {
      const stored = this.storage.getItem('cxp_customer_identifiers');
      if (stored) {
        try {
          const storedIdentifiers = JSON.parse(stored);
          // Merge stored identifiers first, then overlay in-memory (prioritizing in-memory)
          allIdentifiers = { ...storedIdentifiers, ...this.customerIdentifiers };
        } catch (_e) {
          console.warn('[GrowcadoSDK] Failed to parse stored customer identifiers');
        }
      }
    }

    return allIdentifiers;
  }

  getHeaders(): Record<string, string> {
    const identifiers = this.getIdentifiers();
    const customerHeader = this.buildCustomerIdentifiersHeader(identifiers);
    
    return {
      'X-CUSTOMER-IDENTIFIERS': customerHeader
    };
  }

  reset(): void {
    // Clear stored data before removing storage reference
    if (this.storage) {
      this.storage.setItem('cxp_customer_identifiers', JSON.stringify({}));
    }
    this.storage = null;
    this.customerIdentifiers = {};
  }

  private buildCustomerIdentifiersHeader(identifiers: CustomerIdentifiers): string {
    const validIdentifiers = Object.entries(identifiers)
      .filter(([_key, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`);

    return validIdentifiers.length > 0 ? validIdentifiers.join('&') : 'none:none';
  }
} 