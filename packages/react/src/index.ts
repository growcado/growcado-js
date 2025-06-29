/**
 * @fileoverview React wrapper library for Growcado SDK
 * Provides React-specific functionality on top of the core Growcado SDK
 */

// Export providers
export { GrowcadoProvider, useGrowcadoContext } from './lib/providers';

// Export hooks  
export { useGrowcadoContent, useCustomerIdentifiers } from './lib/hooks';

// Export types
export type {
  UseGrowcadoContentConfig,
  GrowcadoProviderProps,
  GrowcadoContextValue,
  UseGrowcadoContentResult,
  UseCustomerIdentifiersResult,
} from './lib/types';

// Re-export core SDK types for convenience
export type {
  SDKConfig,
  ContentConfig,
  CustomerIdentifiers,
  GrowcadoResponse,
} from '@growcado/sdk';
