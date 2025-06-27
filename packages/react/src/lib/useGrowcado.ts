import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { sdk } from '@growcado/sdk';

export interface UseGrowcadoOptions extends Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'> {
  queryKey?: string[];
}

/**
 * React Query hook for using Growcado SDK
 * This is an example of how to integrate the core SDK with React Query
 */
export function useGrowcado(options: UseGrowcadoOptions = {}) {
  const { queryKey = ['growcado'], ...queryOptions } = options;

  return useQuery({
    queryKey,
    queryFn: () => {
      // In a real implementation, this might be an async call
      return Promise.resolve(sdk());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
}

export default useGrowcado; 