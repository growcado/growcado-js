export interface SDKConfig {
    baseURL?: string;
    tenantId: string;
    enableAutoUTM?: boolean;
    enableReferrerTracking?: boolean;
    storage?: 'localStorage' | 'memory' | 'auto';
    // SSR-specific options
    ssrMode?: boolean;
    hydrateOnMount?: boolean;
  }
  
  export interface ContentConfig {
    modelIdentifier: string;
    contentIdentifier: string;
    tenantId?: string;
    headers?: Record<string, string>;
    customerIdentifiers?: CustomerIdentifiers;
    cxpParameters?: CXPParameters;
  }
  
  export interface CustomerIdentifiers {
    email?: string;
    userId?: string;
    anonymousId?: string;
    [key: string]: string | undefined;
  }

  export interface UTMParameters {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    [key: string]: string | undefined;
  }

  export interface ReferrerData {
    url: string;
    domain?: string;
    [key: string]: string | undefined;
  }

  export interface CXPParameters {
    [key: string]: string | undefined;
  }
  
  export interface GrowcadoResponse<T = unknown> {
    data?: T;
    error?: {
      message: string;
      code?: string | number;
      details?: unknown;
    };
  }
  
  export interface SDKInstance {
    configure(config: SDKConfig): void;
    getContent<T>(config: ContentConfig): Promise<GrowcadoResponse<T>>;
    setCustomerIdentifiers(identifiers: CustomerIdentifiers): void;
    getConfig(): SDKConfig | null;
    reset(): void;
    hydrate(): void;
    // Manual UTM tracking methods
    setUTMParameters(params: UTMParameters): void;
    clearUTMParameters(): void;
    getUTMParameters(): UTMParameters | null;
    // Manual referrer tracking methods
    setReferrer(referrer: string | ReferrerData): void;
    clearReferrer(): void;
    getReferrer(): string | null;
  }

  // New interfaces for refactored architecture
  export interface IStorageManager {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    clear(): void;
  }

  export interface IHttpClient {
    get<T>(path: string, headers?: Record<string, string>): Promise<GrowcadoResponse<T>>;
    configure(config: SDKConfig): void;
    reset(): void;
  }

  export interface ITracker {
    initialize(config: SDKConfig, storage: IStorageManager): void;
    initializeSSR(config: SDKConfig, storage: IStorageManager): void; // SSR-safe initialization
    getHeaders(): Record<string, string>;
    reset(): void;
  }

  export interface ICustomerIdentifierManager extends ITracker {
    setIdentifiers(identifiers: CustomerIdentifiers): void;
    getIdentifiers(): CustomerIdentifiers;
  } 