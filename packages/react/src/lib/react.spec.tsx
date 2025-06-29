import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GrowcadoSDK } from '@growcado/sdk';
import { 
  GrowcadoProvider, 
  useGrowcadoContent, 
  useCustomerIdentifiers,
  useGrowcadoContext 
} from './index';

// Mock the SDK
vi.mock('@growcado/sdk', () => ({
  GrowcadoSDK: {
    configure: vi.fn(),
    getContent: vi.fn(),
    setCustomerIdentifiers: vi.fn(),
    getConfig: vi.fn(),
    reset: vi.fn(),
  },
}));

const mockSDK = vi.mocked(GrowcadoSDK);

describe('GrowcadoProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should configure SDK on mount', () => {
    const config = {
      tenantId: 'test-tenant',
      baseURL: 'https://api.test.com',
    };

    render(
      <GrowcadoProvider config={config}>
        <div>Test</div>
      </GrowcadoProvider>
    );

    expect(mockSDK.configure).toHaveBeenCalledWith(config);
  });

  it('should provide context values correctly', () => {
    const config = {
      tenantId: 'test-tenant',
    };

    function TestComponent() {
      const { config: contextConfig, isConfigured } = useGrowcadoContext();
      return (
        <div>
          <span data-testid="is-configured">{isConfigured.toString()}</span>
          <span data-testid="tenant-id">{contextConfig?.tenantId}</span>
        </div>
      );
    }

    render(
      <GrowcadoProvider config={config}>
        <TestComponent />
      </GrowcadoProvider>
    );

    expect(screen.getByTestId('is-configured').textContent).toBe('true');
    expect(screen.getByTestId('tenant-id').textContent).toBe('test-tenant');
  });
});

describe('useGrowcadoContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch content successfully', async () => {
    const mockData = { title: 'Test Content', description: 'Test Description' };
    mockSDK.getContent.mockResolvedValue({ data: mockData });

    function TestComponent() {
      const { data, isLoading, isError } = useGrowcadoContent({
        modelIdentifier: 'homepage',
        contentIdentifier: 'hero',
      });

      return (
        <div>
          <span data-testid="loading">{isLoading.toString()}</span>
          <span data-testid="error">{isError.toString()}</span>
          {data && <span data-testid="title">{data.title}</span>}
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <GrowcadoProvider config={{ tenantId: 'test-tenant' }}>
          <TestComponent />
        </GrowcadoProvider>
      </QueryClientProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('error').textContent).toBe('false');
    expect(screen.getByTestId('title').textContent).toBe('Test Content');
    expect(mockSDK.getContent).toHaveBeenCalledWith({
      modelIdentifier: 'homepage',
      contentIdentifier: 'hero',
    });
  });

  it.skip('should handle errors properly', async () => {
    // Mock SDK to return an error response (not reject)
    mockSDK.getContent.mockResolvedValue({
      error: { message: 'Content not found', code: 404 },
    });

    function TestComponent() {
      const { data, isLoading, isError, error } = useGrowcadoContent({
        modelIdentifier: 'nonexistent',
        contentIdentifier: 'missing',
      });

      return (
        <div>
          <span data-testid="loading">{isLoading.toString()}</span>
          <span data-testid="error">{isError.toString()}</span>
          <span data-testid="error-message">{error?.message || ''}</span>
          <span data-testid="has-data">{data ? 'true' : 'false'}</span>
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <GrowcadoProvider config={{ tenantId: 'test-tenant' }}>
          <TestComponent />
        </GrowcadoProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('true');
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('has-data').textContent).toBe('false');
    expect(screen.getByTestId('error-message').textContent).toBe('Content not found');
  });
});

describe('useCustomerIdentifiers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.skip('should set customer identifiers and invalidate queries', async () => {
    function TestComponent() {
      const { setCustomer } = useCustomerIdentifiers();

      return (
        <button
          onClick={() => setCustomer({ userId: '123', email: 'test@example.com' })}
          data-testid="set-customer"
        >
          Set Customer
        </button>
      );
    }

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <GrowcadoProvider config={{ tenantId: 'test-tenant' }}>
          <TestComponent />
        </GrowcadoProvider>
      </QueryClientProvider>
    );

    // Set up spy after render so it captures the same instance
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const button = screen.getByTestId('set-customer');
    
    await act(async () => {
      button.click();
    });

    expect(mockSDK.setCustomerIdentifiers).toHaveBeenCalledWith({
      userId: '123',
      email: 'test@example.com',
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['growcado-content'],
    });
  });

  it.skip('should clear customer identifiers and invalidate queries', async () => {
    function TestComponent() {
      const { clearCustomer } = useCustomerIdentifiers();

      return (
        <button
          onClick={() => clearCustomer()}
          data-testid="clear-customer"
        >
          Clear Customer
        </button>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <GrowcadoProvider config={{ tenantId: 'test-tenant' }}>
          <TestComponent />
        </GrowcadoProvider>
      </QueryClientProvider>
    );

    // Set up spy after render so it captures the same instance
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const button = screen.getByTestId('clear-customer');
    
    await act(async () => {
      button.click();
    });

    expect(mockSDK.setCustomerIdentifiers).toHaveBeenCalledWith({});
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['growcado-content'],
    });
  });
}); 