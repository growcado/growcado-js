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
  cxpParameters?: CXPParameters; // Dynamic context parameters (see CXP Parameters section)
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

### `GrowcadoSDK.setUTMParameters(params: UTMParameters)`

Manually sets UTM parameters for tracking. This will override any existing UTM parameters.

```typescript
GrowcadoSDK.setUTMParameters({
  source: 'newsletter',
  medium: 'email',
  campaign: 'spring-sale',
  customParam: 'special-value'
});
```

### `GrowcadoSDK.getUTMParameters()`

Retrieves the current UTM parameters. Returns `UTMParameters | null`.

```typescript
const utmParams = GrowcadoSDK.getUTMParameters();
if (utmParams) {
  console.log('Current UTM source:', utmParams.source);
}
```

### `GrowcadoSDK.clearUTMParameters()`

Clears all stored UTM parameters.

```typescript
GrowcadoSDK.clearUTMParameters();
```

### `GrowcadoSDK.hydrate()`

Activates browser-specific features when transitioning from server-side to client-side rendering. This method automatically migrates data from memory storage to localStorage and enables full tracking capabilities.

```typescript
// Call during client-side hydration
GrowcadoSDK.hydrate();
```

### `GrowcadoSDK.setReferrer(referrer: string | ReferrerData)`

Manually sets referrer information for attribution tracking. This will override any existing referrer data.

```typescript
// Set as string
GrowcadoSDK.setReferrer('https://example.com/referring-page');

// Set as ReferrerData object
GrowcadoSDK.setReferrer({
  url: 'https://example.com/referring-page',
  domain: 'example.com'
});
```

### `GrowcadoSDK.getReferrer()`

Retrieves the current referrer information. Returns `string | null`.

```typescript
const referrer = GrowcadoSDK.getReferrer();
if (referrer) {
  console.log('Current referrer:', referrer);
}
```

### `GrowcadoSDK.clearReferrer()`

Clears all stored referrer information.

```typescript
GrowcadoSDK.clearReferrer();
```

## Features

### Automatic UTM Tracking
When `enableAutoUTM` is enabled, the SDK automatically captures and stores UTM parameters from the URL and includes them in API requests.

### Manual UTM Parameter Management
The SDK now provides methods for manually managing UTM parameters, giving you full control over UTM tracking:

```typescript
// Set UTM parameters manually
GrowcadoSDK.setUTMParameters({
  source: 'newsletter',
  medium: 'email',
  campaign: 'spring-sale',
  term: 'organic',
  content: 'header-cta'
});

// Get current UTM parameters
const currentUTM = GrowcadoSDK.getUTMParameters();
console.log(currentUTM); // { source: 'newsletter', medium: 'email', ... }

// Clear all UTM parameters
GrowcadoSDK.clearUTMParameters();

// Set custom UTM parameters
GrowcadoSDK.setUTMParameters({
  source: 'social',
  medium: 'facebook',
  customParam: 'special-offer'
});
```

#### UTM Parameters Interface
```typescript
interface UTMParameters {
  source?: string;      // Traffic source (e.g., 'google', 'newsletter')
  medium?: string;      // Marketing medium (e.g., 'cpc', 'email')
  campaign?: string;    // Campaign name (e.g., 'spring-sale')
  term?: string;        // Search term (e.g., 'organic')
  content?: string;     // Content identifier (e.g., 'header-cta')
  [key: string]: string | undefined; // Custom UTM parameters
}
```

### UTM Tracking in SSR Environments
The SDK handles UTM parameters intelligently during server-side rendering and hydration:

- **Server-side**: UTM parameters are preserved in memory storage
- **Client-side**: Parameters are automatically migrated to localStorage during hydration
- **Parameter Preservation**: Manually set UTM parameters are preserved during hydration and won't be overwritten by URL parameters unless new ones are present

```typescript
// Server-side (Next.js example)
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  enableAutoUTM: true
});

// Manually set UTM parameters on server
GrowcadoSDK.setUTMParameters({
  source: 'server',
  medium: 'ssr'
});

// Client-side hydration
useEffect(() => {
  GrowcadoSDK.hydrate(); // Preserves server-set parameters
  
  // Only overrides if new URL parameters are present
  // ?utm_source=google&utm_medium=cpc would update the parameters
}, []);
```

### Referrer Tracking  
When `enableReferrerTracking` is enabled, the SDK captures the initial referrer and includes it in API requests for attribution tracking.

### Manual Referrer Tracking
The SDK now provides methods for manually managing referrer information, giving you full control over referrer attribution:

```typescript
// Set referrer manually (string)
GrowcadoSDK.setReferrer('https://example.com/referring-page');

// Set referrer with additional data (ReferrerData object)
GrowcadoSDK.setReferrer({
  url: 'https://example.com/referring-page',
  domain: 'example.com'
});

// Get current referrer
const currentReferrer = GrowcadoSDK.getReferrer();
console.log(currentReferrer); // 'https://example.com/referring-page'

// Clear referrer
GrowcadoSDK.clearReferrer();
```

#### ReferrerData Interface
```typescript
interface ReferrerData {
  url: string;          // Referrer URL (required)
  domain?: string;      // Referrer domain (optional)
  [key: string]: string | undefined; // Custom referrer properties
}
```

### Referrer Tracking in SSR Environments
Similar to UTM tracking, the SDK handles referrer information intelligently during server-side rendering and hydration:

- **Server-side**: Referrer information is preserved in memory storage
- **Client-side**: Referrer data is automatically migrated to localStorage during hydration
- **Parameter Preservation**: Manually set referrer information is preserved during hydration and won't be overwritten by document.referrer unless no referrer was previously stored

```typescript
// Server-side (Next.js example)
GrowcadoSDK.configure({
  tenantId: 'your-tenant-id',
  enableReferrerTracking: true
});

// Manually set referrer on server
GrowcadoSDK.setReferrer('https://newsletter.example.com');

// Client-side hydration
useEffect(() => {
  GrowcadoSDK.hydrate(); // Preserves server-set referrer
  
  // Only captures document.referrer if no referrer was previously stored
}, []);
```

### Customer Identification
Set customer identifiers to enable personalized content delivery and customer journey tracking.

```typescript
GrowcadoSDK.setCustomerIdentifiers({
  email: 'user@example.com',
  userId: 'user123',
  customId: 'custom-value'
});
```

### CXP Parameters

CXP Parameters allow you to pass dynamic, context-specific data with each content request. This is ideal for scenarios where the context changes frequently, such as:

- Product pages (product title, price, SKU)
- Shopping cart context (cart total, item count)
- User session data (current page, interaction state)

Unlike customer identifiers which are persisted, CXP parameters are passed per-request and are not stored, making them perfect for highly dynamic data.

```typescript
// Fetch content with dynamic context
const response = await GrowcadoSDK.getContent({
  modelIdentifier: 'product-banner',
  contentIdentifier: 'hero',
  cxpParameters: {
    productTitle: 'iPhone 15 Pro',
    productPrice: '999',
    cartTotal: '1250.00',
    cartItems: '3'
  }
});
```

The parameters are sent via the `X-CXP-PARAMETERS` header in the same key-value format as other tracking headers.

#### CXPParameters Interface

```typescript
interface CXPParameters {
  [key: string]: string | undefined; // Any key-value pairs
}
```

#### Use Cases

**Product Page Personalization:**
```typescript
const response = await GrowcadoSDK.getContent({
  modelIdentifier: 'product-recommendation',
  contentIdentifier: 'similar-items',
  cxpParameters: {
    productId: 'SKU-12345',
    productCategory: 'electronics',
    productPrice: '599.99'
  }
});
```

**Cart-Based Content:**
```typescript
const response = await GrowcadoSDK.getContent({
  modelIdentifier: 'checkout-banner',
  contentIdentifier: 'upsell',
  cxpParameters: {
    cartTotal: cart.total.toString(),
    cartItemCount: cart.items.length.toString(),
    hasPromoCode: cart.promoCode ? 'true' : 'false'
  }
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