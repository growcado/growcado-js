import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { SDKConfig, ContentConfig } from '@growcado/sdk';

/**
 * Configuration for the useGrowcadoContent hook extending core SDK types
 */
export interface UseGrowcadoContentConfig extends ContentConfig {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: boolean | number;
}

/**
 * Props for the GrowcadoProvider component
 */
export interface GrowcadoProviderProps {
  children: ReactNode;
  config: SDKConfig;
  queryClient?: QueryClient;
}

/**
 * Context value for the Growcado provider
 */
export interface GrowcadoContextValue {
  config: SDKConfig | null;
  isConfigured: boolean;
}

/**
 * Result type for useGrowcadoContent hook
 */
export interface UseGrowcadoContentResult<T = any> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
  isSuccess: boolean;
}

/**
 * Result type for useCustomerIdentifiers hook
 */
export interface UseCustomerIdentifiersResult {
  setCustomer: (identifiers: import('@growcado/sdk').CustomerIdentifiers) => void;
  clearCustomer: () => void;
} 