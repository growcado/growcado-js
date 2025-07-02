import { useQuery } from '@tanstack/react-query';
import { GrowcadoSDK } from '@growcado/sdk';
import type { ContentConfig } from '@growcado/sdk';
import type {
  UseGrowcadoContentConfig,
  UseGrowcadoContentResult,
} from '../types';
import { useGrowcadoContext } from '../providers';

/**
 * React Query hook for fetching Growcado content
 * 
 * @param config Configuration for content fetching
 * @returns React Query result with data, loading states, and error handling
 */
export function useGrowcadoContent<T = any>(
  config: UseGrowcadoContentConfig
): UseGrowcadoContentResult<T> {
  const { isConfigured } = useGrowcadoContext();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
    refetchOnMount = true,
    retry = 3,
    ...contentConfig
  } = config;

  const queryResult = useQuery({
    queryKey: [
      'growcado-content',
      contentConfig.modelIdentifier,
      contentConfig.contentIdentifier,
      contentConfig.tenantId,
      contentConfig.customerIdentifiers,
      contentConfig.headers,
    ],
    queryFn: async (): Promise<T> => {
      if (!isConfigured) {
        throw new Error('Growcado SDK is not configured. Ensure GrowcadoProvider is set up correctly.');
      }

      const response = await GrowcadoSDK.getContent<T>(contentConfig);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch content');
      }
      
      return response.data as T;
    },
    enabled: enabled && isConfigured,
    staleTime,
    gcTime: cacheTime, // gcTime is the new name for cacheTime in React Query v5
    refetchOnWindowFocus,
    refetchOnMount,
    retry: typeof retry === 'boolean' ? (retry ? 3 : 0) : retry,
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isRefetching: queryResult.isRefetching,
    isSuccess: queryResult.isSuccess,
  };
} 