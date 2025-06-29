import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrowcadoProvider } from '@growcado/react';
import App from './App.tsx';
import './index.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Load SDK configuration from environment variables with fallbacks
const sdkConfig = {
  tenantId: (import.meta as any).env?.VITE_DEFAULT_TENANT_ID || 'demo-tenant',
  baseURL: (import.meta as any).env?.VITE_DEFAULT_BASE_URL || 'https://api.growcado.io/',
  storage: ((import.meta as any).env?.VITE_DEFAULT_STORAGE as 'localStorage' | 'memory') || 'localStorage',
  enableAutoUTM: (import.meta as any).env?.VITE_DEFAULT_ENABLE_AUTO_UTM !== 'false',
  enableReferrerTracking: (import.meta as any).env?.VITE_DEFAULT_ENABLE_REFERRER_TRACKING !== 'false',
};

console.log('🥑 Growcado React SDK - Initializing with config:', sdkConfig);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GrowcadoProvider config={sdkConfig} queryClient={queryClient}>
        <App />
      </GrowcadoProvider>
    </QueryClientProvider>
  </React.StrictMode>
); 