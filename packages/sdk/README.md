# @growcado/sdk

The official JavaScript/TypeScript SDK for Growcado CMS. This SDK provides a simple and powerful way to fetch content from your Growcado CMS and automatically track customer interactions.

## Installation

```bash
npm install @growcado/sdk
# or
yarn add @growcado/sdk
# or  
pnpm add @growcado/sdk
```

## Quick Start

```typescript
import { GrowcadoSDK } from '@growcado/sdk';

// Configure the SDK
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  enableAutoUTM: true,
  enableReferrerTracking: true
});

// Fetch content
const response = await GrowcadoSDK.getContent({
  modelIdentifier: 'blog-post',
  contentIdentifier: 'my-first-post'
});

if (response.data) {
  console.log('Content:', response.data);
} else if (response.error) {
  console.error('Error:', response.error.message);
}
```

## Configuration

### SDKConfig

```typescript
interface SDKConfig {
  tenantId: string;                      // Your Growcado tenant ID (required)
  baseURL?: string;                      // API base URL (default: 'https://api.growcado.io/')
  enableAutoUTM?: boolean;               // Auto-track UTM parameters (default: true)
  enableReferrerTracking?: boolean;      // Auto-track referrer information (default: true)
  storage?: 'localStorage' | 'memory' | 'auto'; // Storage method (default: 'auto')
  ssrMode?: boolean;                     // Enable SSR mode (default: auto-detected)
  hydrateOnMount?: boolean;              // Auto-hydrate when client APIs become available (default: true)
}
```

## Server-Side Rendering (SSR) & Hydration

The Growcado SDK provides built-in support for Server-Side Rendering (SSR) environments like Next.js, Nuxt.js, and SvelteKit. The SDK automatically detects the environment and adapts its behavior accordingly.

### Quick SSR Setup

```typescript
import { GrowcadoSDK } from '@growcado/sdk';

// Configure for SSR with automatic environment detection
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  storage: 'auto',           // Automatically uses memory on server, localStorage on client
  enableAutoUTM: true,
  enableReferrerTracking: true
});
```

### SSR Configuration Options

- **`storage: 'auto'`** - Automatically uses memory storage on server and localStorage on client
- **`ssrMode: boolean`** - Explicitly enable/disable SSR mode (auto-detected by default)
- **`hydrateOnMount: boolean`** - Automatically migrate data from memory to localStorage on client (default: true)

### Next.js Example

#### Server Component (App Router)

```typescript
// app/blog/[slug]/page.tsx
import { GrowcadoSDK } from '@growcado/sdk';

// Configure once (can be in a separate config file)
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  storage: 'auto'
});

export default async function BlogPost({ params }: { params: { slug: string } }) {
  // This runs on the server - uses memory storage
  const response = await GrowcadoSDK.getContent({
    modelIdentifier: 'blog-post',
    contentIdentifier: params.slug
  });

  if (response.error) {
    return <div>Error loading content</div>;
  }

  return (
    <div>
      <h1>{response.data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: response.data.content }} />
    </div>
  );
}
```

#### Client Component with Hydration

```typescript
// components/ClientTracker.tsx
'use client';

import { useEffect } from 'react';
import { GrowcadoSDK } from '@growcado/sdk';

export default function ClientTracker() {
  useEffect(() => {
    // Hydrate on client - migrates any server data to localStorage
    GrowcadoSDK.hydrate();
    
    // Set customer identifiers (persists after hydration)
    GrowcadoSDK.setCustomerIdentifiers({
      userId: 'user123',
      email: 'user@example.com'
    });
  }, []);

  return null; // This component handles tracking only
}
```

#### Root Layout

```typescript
// app/layout.tsx
import ClientTracker from './components/ClientTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <ClientTracker />
      </body>
    </html>
  );
}
```

### Manual Hydration

If you prefer manual control over hydration:

```typescript
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  storage: 'auto',
  hydrateOnMount: false  // Disable automatic hydration
});

// Later, manually hydrate when ready
if (typeof window !== 'undefined') {
  GrowcadoSDK.hydrate();
}
```

### SSR Best Practices

1. **Use `storage: 'auto'`** - This handles environment detection automatically
2. **Configure once** - Call `GrowcadoSDK.configure()` once in your app initialization
3. **Hydrate on client** - Call `GrowcadoSDK.hydrate()` in a client-side useEffect or component
4. **Set identifiers after hydration** - Customer identifiers set on server will persist after hydration

### Environment Detection

The SDK automatically detects the environment:

```typescript
// Server environment (Node.js)
// - Uses memory storage
// - Skips browser-specific APIs
// - Content fetching works normally

// Client environment (Browser)  
// - Uses localStorage (if available)
// - Enables full tracking features
// - Migrates server data during hydration
```

### Error Handling in SSR

```typescript
const response = await GrowcadoSDK.getContent({...});

if (response.error) {
  // Handle gracefully in SSR
  console.error('Content fetch failed:', response.error.message);
  
  // Return fallback content or error page
  return <div>Content temporarily unavailable</div>;
}
```

## API Reference

### `GrowcadoSDK.configure(config: SDKConfig)`

Configures the SDK with your tenant settings and tracking preferences.

### `GrowcadoSDK.getContent<T>(config: ContentConfig)`

Fetches content from your Growcado CMS.

```typescript
interface ContentConfig {
  modelIdentifier: string;      // The content model identifier
  contentIdentifier: string;    // The specific content identifier
  tenantId?: string;           // Override tenant ID for this request
  headers?: Record<string, string>; // Additional headers
}
```

Returns a `GrowcadoResponse<T>` with either `data` or `error`.

### `GrowcadoSDK.setCustomerIdentifiers(identifiers: CustomerIdentifiers)`

Sets customer identification data for personalization and tracking.

```typescript
interface CustomerIdentifiers {
  email?: string;
  userId?: string;
  anonymousId?: string;
  [key: string]: string | undefined; // Custom identifiers
}
```

## Features

### Automatic UTM Tracking
When `enableAutoUTM` is enabled, the SDK automatically captures and stores UTM parameters from the URL and includes them in API requests.

### Referrer Tracking  
When `enableReferrerTracking` is enabled, the SDK captures the initial referrer and includes it in API requests for attribution tracking.

### Customer Identification
Set customer identifiers to enable personalized content delivery and customer journey tracking.

```typescript
GrowcadoSDK.setCustomerIdentifiers({
  email: 'user@example.com',
  userId: 'user123',
  customId: 'custom-value'
});
```

### TypeScript Support
The SDK is written in TypeScript and provides full type safety for all APIs.

## Error Handling

The SDK returns a standardized response format:

```typescript
interface GrowcadoResponse<T> {
  data?: T;              // Successful response data
  error?: {              // Error information
    message: string;
    code?: string | number;
    details?: any;
  };
}
```

Always check for errors in your response:

```typescript
const response = await GrowcadoSDK.getContent({...});

if (response.error) {
  // Handle error
  console.error('Failed to fetch content:', response.error.message);
  return;
}

// Use response.data safely
console.log(response.data);
```

## License

MIT
