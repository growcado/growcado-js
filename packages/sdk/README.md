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
  tenantId: string;                    // Your Growcado tenant ID (required)
  baseURL?: string;                    // API base URL (default: 'https://api.growcado.io/')
  enableAutoUTM?: boolean;             // Auto-track UTM parameters (default: true)
  enableReferrerTracking?: boolean;    // Auto-track referrer information (default: true)
  storage?: 'localStorage' | 'memory'; // Storage method (default: 'localStorage')
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
