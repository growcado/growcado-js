# 🥑 Growcado React SDK - Comprehensive Example

This React example demonstrates all functionality of the `@growcado/react` package, showcasing how to integrate Growcado's content management capabilities into a React application using modern React patterns and React Query.

## 🚀 Features Demonstrated

### 🆕 Dual Mode Content Fetching
- **Hook Mode** - Declarative content fetching using `useGrowcadoContent` with React Query
- **Promise Mode** - Imperative content fetching using `GrowcadoSDK.getContent()` directly
- **Mode Toggle** - Switch between approaches to compare patterns and performance

### React SDK Hooks & Components
- **`GrowcadoProvider`** - Context provider for SDK configuration
- **`useGrowcadoContent`** - Declarative content fetching with React Query
- **`useCustomerIdentifiers`** - Customer management with automatic cache invalidation
- **`useGrowcadoContext`** - Access to SDK configuration state

### Core Functionality
- **SDK Configuration** - Automatic initialization via provider
- **Content Retrieval** - Fetch content with caching and error handling
- **Customer Management** - Set/clear customer identifiers with cache invalidation
- **Error Handling** - Comprehensive error states and testing
- **Storage Management** - View and clear localStorage data
- **UTM Tracking** - Automatic UTM parameter capture and storage
- **Referrer Tracking** - Initial referrer capture and persistence

### React Query Integration
- **Automatic Caching** - Content is cached for improved performance
- **Background Refetching** - Automatic content updates
- **Loading States** - Proper loading and error states
- **Query Invalidation** - Customer changes invalidate relevant queries
- **Optimistic Updates** - Smooth user experience

## 🏗️ Architecture

### Provider Setup
The app is wrapped with `GrowcadoProvider` which automatically configures the SDK:

```tsx
<GrowcadoProvider config={sdkConfig} queryClient={queryClient}>
  <App />
</GrowcadoProvider>
```

### Hook Usage
Components use React hooks to interact with the SDK:

```tsx
// Fetch content declaratively
const { data, isLoading, isError } = useGrowcadoContent({
  modelIdentifier: 'homepage',
  contentIdentifier: 'hero-section'
});

// Manage customer identifiers
const { setCustomer, clearCustomer } = useCustomerIdentifiers();
```

## 🎯 Mode Comparison

This example supports two different approaches for content fetching:

### 🪝 Hook Mode (Declarative)
```tsx
const { data, isLoading, error } = useGrowcadoContent({
  modelIdentifier: 'homepage',
  contentIdentifier: 'hero-section'
});
```

**Benefits:**
- ✅ Automatic caching with React Query
- ✅ Built-in loading and error states
- ✅ Background refetching
- ✅ Request deduplication
- ✅ Automatic cache invalidation
- ✅ Declarative and reactive

### ⚡ Promise Mode (Imperative)
```tsx
const response = await GrowcadoSDK.getContent({
  modelIdentifier: 'homepage',
  contentIdentifier: 'hero-section'
});
```

**Benefits:**
- ✅ Direct control over timing
- ✅ No automatic caching overhead
- ✅ Simpler for one-off requests
- ✅ Immediate response handling
- ✅ Manual error handling
- ✅ Lighter weight approach

## 🎯 Comparison with Vanilla SDK

| Feature | Vanilla SDK | React Hook Mode | React Promise Mode |
|---------|-------------|-----------------|-------------------|
| **Configuration** | Manual `configure()` | Auto via Provider | Auto via Provider |
| **Content Fetching** | Direct API calls | Declarative hooks | Direct API calls |
| **Caching** | Manual | React Query | Manual |
| **Loading States** | Manual | Automatic | Manual |
| **Error Handling** | Manual try/catch | Built-in states | Manual try/catch |
| **Customer Management** | Direct SDK | Hook-based | Direct SDK |
| **State Management** | External | Built-in React | Manual React |

## 🛠️ Environment Configuration

The example loads configuration from environment variables:

```bash
# .env file
VITE_DEFAULT_TENANT_ID=your-tenant-id
VITE_DEFAULT_BASE_URL=https://api.growcado.io/
VITE_DEFAULT_STORAGE=localStorage
VITE_DEFAULT_ENABLE_AUTO_UTM=true
VITE_DEFAULT_ENABLE_REFERRER_TRACKING=true

# Customer defaults
VITE_DEFAULT_EMAIL=user@example.com
VITE_DEFAULT_USER_ID=user123

# Content defaults
VITE_DEFAULT_MODEL_IDENTIFIER=message
VITE_DEFAULT_CONTENT_IDENTIFIER=greetings
```

## 🧪 Testing Features

### 1. SDK Configuration Display
- View current SDK configuration
- See provider-managed state
- Environment variable loading

### 2. Customer Management
- Set customer identifiers (email, userId, anonymousId, custom fields)
- Clear all customer data
- Automatic query invalidation on customer changes

### 3. Content Retrieval
- Fetch content with React Query integration
- Custom headers support
- Tenant ID override
- Real-time loading and error states
- Query status monitoring

### 4. Error Handling
- Test error scenarios
- Comprehensive error display
- React Query error boundaries

### 5. Storage & Tracking
- View localStorage data
- UTM parameter tracking
- Referrer data capture
- Storage cleanup

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to http://localhost:5173

## 💡 Key Benefits of React SDK

### Developer Experience
- **Declarative**: Use hooks instead of imperative API calls
- **Type Safe**: Full TypeScript support with generics
- **React Patterns**: Familiar React patterns and hooks
- **Less Boilerplate**: No manual state management required

### Performance
- **Automatic Caching**: React Query handles caching automatically
- **Background Updates**: Content refreshes in the background
- **Request Deduplication**: Multiple identical requests are deduplicated
- **Memory Management**: Automatic cleanup and garbage collection

### User Experience
- **Loading States**: Built-in loading indicators
- **Error Recovery**: Automatic retry and error handling
- **Optimistic Updates**: Smooth state transitions
- **Cache Invalidation**: Automatic content updates when context changes

## 🔧 Advanced Usage

### Custom Query Configuration
```tsx
const content = useGrowcadoContent({
  modelIdentifier: 'blog',
  contentIdentifier: 'post-1',
  enabled: isUserLoggedIn, // Conditional fetching
  staleTime: 10 * 60 * 1000, // 10 minutes
  retry: 3, // Retry failed requests
});
```

### Error Handling
```tsx
const { data, error, isError } = useGrowcadoContent({
  modelIdentifier: 'content',
  contentIdentifier: 'item'
});

if (isError) {
  return <div>Error: {error?.message}</div>;
}
```

### Customer Context Management
```tsx
const { setCustomer, clearCustomer } = useCustomerIdentifiers();

// Setting customer automatically invalidates content queries
await setCustomer({
  userId: '123',
  email: 'user@example.com',
  segment: 'premium'
});
```

## 📱 Mobile & Responsive

The interface is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets
- Progressive Web Apps (PWA)

## 🔗 Related Examples

- **[Vanilla SDK Example](../vanilla-sdk/)** - Direct SDK usage without React
- **[SDK Documentation](../../packages/sdk/README.md)** - Core SDK features
- **[React SDK Documentation](../../packages/react/README.md)** - React-specific features 