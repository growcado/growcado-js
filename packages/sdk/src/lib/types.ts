export interface SDKConfig {
    baseURL?: string;
    tenantId: string;
    enableAutoUTM?: boolean;
    enableReferrerTracking?: boolean;
    storage?: 'localStorage' | 'memory';
  }
  
  export interface ContentConfig {
    modelIdentifier: string;
    contentIdentifier: string;
    tenantId?: string;
    headers?: Record<string, string>;
    customerIdentifiers?: CustomerIdentifiers;
  }
  
  export interface CustomerIdentifiers {
    email?: string;
    userId?: string;
    anonymousId?: string;
    [key: string]: string | undefined;
  }
  
  export interface GrowcadoResponse<T = any> {
    data?: T;
    error?: {
      message: string;
      code?: string | number;
      details?: any;
    };
  }
  
  export interface SDKInstance {
    configure(config: SDKConfig): void;
    getContent<T>(config: ContentConfig): Promise<GrowcadoResponse<T>>;
    setCustomerIdentifiers(identifiers: CustomerIdentifiers): void;
    getConfig(): SDKConfig | null;
    reset(): void; // Testing utility method
  } 