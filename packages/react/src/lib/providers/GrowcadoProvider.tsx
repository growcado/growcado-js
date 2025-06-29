import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrowcadoSDK } from '@growcado/sdk';

// Simple types to avoid build issues
interface SimpleGrowcadoProviderProps {
  children: React.ReactNode;
  config: any;
  queryClient?: QueryClient;
}

interface SimpleGrowcadoContextValue {
  config: any;
  isConfigured: boolean;
}

// Create the context
const GrowcadoContext = createContext<SimpleGrowcadoContextValue | null>(null);

/**
 * Hook to access the Growcado context
 */
export function useGrowcadoContext(): SimpleGrowcadoContextValue {
  const context = useContext(GrowcadoContext);
  if (!context) {
    throw new Error('useGrowcadoContext must be used within a GrowcadoProvider');
  }
  return context;
}

/**
 * Default QueryClient configuration for Growcado
 */
const createDefaultQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3, // Simple retry count
    },
  },
});

/**
 * GrowcadoProvider component that provides SDK configuration and React Query client
 */
export function GrowcadoProvider(props: SimpleGrowcadoProviderProps) {
  const { children, config, queryClient } = props;
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  // Create default query client if not provided
  const defaultQueryClient = useMemo(() => {
    return queryClient || createDefaultQueryClient();
  }, [queryClient]);

  // Configure SDK when config changes
  useEffect(() => {
    try {
      GrowcadoSDK.configure(config);
      setCurrentConfig(config);
      setIsConfigured(true);
    } catch (error) {
      console.error('[GrowcadoProvider] Failed to configure SDK:', error);
      setIsConfigured(false);
    }
  }, [config]);

  // Create context value
  const contextValue = useMemo(() => ({
    config: currentConfig,
    isConfigured,
  }), [currentConfig, isConfigured]);

  return (
    <QueryClientProvider client={defaultQueryClient}>
      <GrowcadoContext.Provider value={contextValue}>
        {children}
      </GrowcadoContext.Provider>
    </QueryClientProvider>
  );
} 