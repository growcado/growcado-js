import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GrowcadoSDK, type CustomerIdentifiers } from '@growcado/sdk';
import type { UseCustomerIdentifiersResult } from '../types';
import { useGrowcadoContext } from '../providers';

/**
 * Hook for managing customer identifiers in the Growcado SDK
 * 
 * @returns Object with setCustomer and clearCustomer functions
 */
export function useCustomerIdentifiers(): UseCustomerIdentifiersResult {
  const { isConfigured } = useGrowcadoContext();
  const queryClient = useQueryClient();

  const setCustomer = useCallback((identifiers: CustomerIdentifiers): void => {
    if (!isConfigured) {
      console.warn('[useCustomerIdentifiers] SDK is not configured. Customer identifiers will not be set.');
      return;
    }

    try {
      // Set customer identifiers in the SDK
      GrowcadoSDK.setCustomerIdentifiers(identifiers);
      
      // Invalidate all Growcado content queries to refetch with new customer context
      queryClient.invalidateQueries({
        queryKey: ['growcado-content'],
      });
    } catch (error) {
      console.error('[useCustomerIdentifiers] Failed to set customer identifiers:', error);
      throw error;
    }
  }, [isConfigured, queryClient]);

  const clearCustomer = useCallback((): void => {
    if (!isConfigured) {
      console.warn('[useCustomerIdentifiers] SDK is not configured. Customer identifiers cannot be cleared.');
      return;
    }

    try {
      // Clear customer identifiers by setting empty object
      GrowcadoSDK.setCustomerIdentifiers({});
      
      // Invalidate all Growcado content queries to refetch without customer context
      queryClient.invalidateQueries({
        queryKey: ['growcado-content'],
      });
    } catch (error) {
      console.error('[useCustomerIdentifiers] Failed to clear customer identifiers:', error);
      throw error;
    }
  }, [isConfigured, queryClient]);

  return {
    setCustomer,
    clearCustomer,
  };
} 