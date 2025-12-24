# @growcado/react

React hooks and components for the Growcado SDK with React Query integration. This package provides React-specific functionality on top of the core `@growcado/sdk`, including hooks for content fetching, customer management, and proper TypeScript support.

## Features

- 🔄 **React Query Integration** - Built-in caching, background refetching, and error handling
- 🎯 **TypeScript Support** - Full type safety with strict mode compatibility  
- 🔧 **Easy Configuration** - Context provider for SDK setup
- 👤 **Customer Management** - Hooks for managing customer identifiers
- 🚀 **SSR Support** - Works with server-side rendering
- 🔍 **Dev Tools** - React Query devtools integration

## Installation

```bash
npm install @growcado/react @growcado/sdk @tanstack/react-query
# or
pnpm add @growcado/react @growcado/sdk @tanstack/react-query
# or  
yarn add @growcado/react @growcado/sdk @tanstack/react-query
```

## Quick Start

### 1. Setup Provider

Wrap your app with the `GrowcadoProvider` and React Query's `QueryClientProvider`:

```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrowcadoProvider } from '@growcado/react';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GrowcadoProvider 
        config={{
          tenantId: 'your-tenant-id',
          apiKey: 'your-api-key',
          baseURL: 'https://api.growcado.io/', // optional
          storage: 'localStorage', // optional: 'localStorage' | 'memory'
          enableAutoUTM: true, // optional
          enableReferrerTracking: true, // optional
        }}
      >
        <HomePage />
      </GrowcadoProvider>
    </QueryClientProvider>
  );
}
```

### 2. Fetch Content

Use the `useGrowcadoContent` hook to fetch content:

```tsx
import { useGrowcadoContent } from '@growcado/react';

function HomePage() {
  const { data, isLoading, error } = useGrowcadoContent({
    modelIdentifier: 'homepage',
    contentIdentifier: 'hero-section'
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
    </div>
  );
}
```

### 3. Manage Customer Identifiers

Use the `useCustomerIdentifiers` hook for customer management:

```tsx
import { useCustomerIdentifiers } from '@growcado/react';

function LoginForm() {
  const { setCustomer, clearCustomer } = useCustomerIdentifiers();

  const handleLogin = (userId: string, email: string) => {
    setCustomer({ userId, email });
    // Content will automatically refetch with new customer context
  };

  const handleLogout = () => {
    clearCustomer();
    // Content will automatically refetch without customer context
  };

  return (
    <div>
      <button onClick={() => handleLogin('123', 'user@example.com')}>
        Login
      </button>
      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
```

## API Reference

### GrowcadoProvider

Context provider that configures the Growcado SDK and provides React Query integration.

```tsx
interface GrowcadoProviderProps {
  children: React.ReactNode;
  config: SDKConfig;
  queryClient?: QueryClient; // Optional custom React Query client
}
```

### useGrowcadoContent

Hook for fetching content with React Query integration.

```tsx
const result = useGrowcadoContent({
  modelIdentifier: 'homepage',
  contentIdentifier: 'main',
  tenantId: 'optional-override', // Falls back to SDK config
  enabled: true, // React Query enabled flag
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes (gcTime in React Query v5)
  cxpParameters: { /* optional dynamic context parameters */ }
});
```

**Returns:**
```tsx
{
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
  isSuccess: boolean;
}
```

### useCustomerIdentifiers

Hook for managing customer identifiers.

```tsx
const { setCustomer, clearCustomer } = useCustomerIdentifiers();

// Set customer identifiers
setCustomer({ 
  userId: '123', 
  email: 'user@example.com',
  customField: 'value'
});

// Clear all customer identifiers
clearCustomer();
```

## Advanced Usage

### CXP Parameters

Pass dynamic, context-specific data with each content request using `cxpParameters`. This is ideal for product pages, cart context, or any frequently changing data:

```tsx
function ProductBanner({ product }) {
  const { data, isLoading } = useGrowcadoContent({
    modelIdentifier: 'product-banner',
    contentIdentifier: 'hero',
    cxpParameters: {
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price.toString(),
      productCategory: product.category
    }
  });

  if (isLoading) return <div>Loading...</div>;
  return <Banner data={data} />;
}
```

```tsx
function CartUpsell({ cart }) {
  const { data } = useGrowcadoContent({
    modelIdentifier: 'checkout-banner',
    contentIdentifier: 'upsell',
    cxpParameters: {
      cartTotal: cart.total.toString(),
      cartItemCount: cart.items.length.toString()
    }
  });

  return data ? <UpsellBanner content={data} /> : null;
}
```

CXP parameters are included in the React Query cache key, so different parameter values result in separate cached entries.

### Custom Query Options

You can pass any React Query options to `useGrowcadoContent`:

```tsx
const { data, isLoading } = useGrowcadoContent({
  modelIdentifier: 'products',
  contentIdentifier: 'featured',
  enabled: isUserLoggedIn, // Only fetch if user is logged in
  staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  retry: 3, // Retry 3 times on error
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
});
```

### Custom Query Client

You can provide your own React Query client:

```tsx
const customQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Custom retry logic
        return failureCount < 2 && error.status !== 404;
      },
    },
  },
});

<GrowcadoProvider config={config} queryClient={customQueryClient}>
  <App />
</GrowcadoProvider>
```

### Error Handling

The hook provides comprehensive error handling:

```tsx
const { data, isError, error } = useGrowcadoContent({
  modelIdentifier: 'content',
  contentIdentifier: 'main'
});

if (isError) {
  console.log('Error message:', error?.message);
  console.log('Error details:', error?.cause);
  
  // Handle specific error types
  if (error?.message.includes('404')) {
    return <div>Content not found</div>;
  }
  
  return <div>Something went wrong</div>;
}
```

### Conditional Fetching

You can conditionally fetch content based on state:

```tsx
const [shouldFetch, setShouldFetch] = useState(false);

const { data } = useGrowcadoContent({
  modelIdentifier: 'conditional',
  contentIdentifier: 'content',
  enabled: shouldFetch, // Only fetch when true
});
```

## TypeScript Support

The package is built with TypeScript and provides full type safety:

```tsx
interface MyContentType {
  title: string;
  description: string;
  imageUrl: string;
}

const { data } = useGrowcadoContent<MyContentType>({
  modelIdentifier: 'homepage',
  contentIdentifier: 'hero'
});

// data is typed as MyContentType | undefined
console.log(data?.title); // ✅ Type safe
```

## React Query Integration

This package leverages React Query for:

- **Automatic Caching** - Content is cached and shared across components
- **Background Refetching** - Data stays fresh automatically
- **Optimistic Updates** - UI updates immediately, syncs in background
- **Request Deduplication** - Multiple components requesting same data share the request
- **Offline Support** - Cached data available when offline

### Query Keys

The package automatically generates query keys based on:
- Model identifier
- Content identifier  
- Tenant ID
- Customer identifiers
- Additional headers

This ensures proper cache invalidation when any of these values change.

## Best Practices

1. **Use Context Provider** - Always wrap your app with `GrowcadoProvider`
2. **Handle Loading States** - Always check `isLoading` before accessing `data`
3. **Error Boundaries** - Use React error boundaries for production apps
4. **TypeScript Types** - Define interfaces for your content types
5. **Customer Context** - Update customer identifiers when user state changes

## Troubleshooting

### SDK Not Configured Error

If you see "SDK not configured" errors:
- Ensure `GrowcadoProvider` wraps your components
- Check that your config object has required fields (`tenantId`)
- Verify the provider is not unmounting/remounting unexpectedly

### Content Not Loading

If content isn't loading:
- Check browser network tab for failed requests
- Verify your `modelIdentifier` and `contentIdentifier` are correct
- Ensure your API credentials are valid
- Check if the `enabled` flag is set to `true`

### Type Errors

If you're getting TypeScript errors:
- Make sure you're importing types from `@growcado/react`
- Update to the latest version of the package
- Check that your content interface matches the actual API response

## License

MIT
