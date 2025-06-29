# 🥑 Growcado SDK Examples

This directory contains comprehensive examples demonstrating how to use the Growcado SDK packages in different environments and frameworks.

## 📁 Available Examples

### 🍦 [Vanilla SDK Example](./vanilla-sdk/)
A pure JavaScript implementation showcasing the core `@growcado/sdk` package functionality.

**Features:**
- Direct SDK usage without any framework
- Manual state management and DOM manipulation
- Complete testing interface for all SDK features
- Environment variable configuration
- Comprehensive error handling and storage management

**Best for:**
- Learning core SDK concepts
- Non-React applications
- Custom framework integrations
- Understanding the underlying SDK behavior

### ⚛️ [React SDK Example](./react-app/)
A modern React application demonstrating the `@growcado/react` package with hooks and React Query integration.

**Features:**
- React hooks (`useGrowcadoContent`, `useCustomerIdentifiers`, `useGrowcadoContext`)
- GrowcadoProvider for automatic SDK configuration
- React Query integration for caching and background updates
- Automatic query invalidation on customer changes
- TypeScript support with generics
- Modern React patterns and best practices

**Best for:**
- React applications
- Modern web development patterns
- Declarative content fetching
- Automatic caching and state management

## 🎯 Feature Comparison

| Feature | Vanilla SDK | React SDK |
|---------|-------------|-----------|
| **Framework** | Pure JavaScript | React |
| **Configuration** | Manual `GrowcadoSDK.configure()` | Automatic via `GrowcadoProvider` |
| **Content Fetching** | Imperative `await getContent()` | Declarative `useGrowcadoContent()` |
| **State Management** | Manual DOM updates | React state + React Query |
| **Caching** | Manual implementation | Built-in React Query caching |
| **Loading States** | Manual state tracking | Automatic via React Query |
| **Error Handling** | Try/catch blocks | Built-in error states |
| **Customer Management** | Direct SDK calls | Hook-based with auto-invalidation |
| **TypeScript** | Basic types | Full generics support |
| **Bundle Size** | Smaller | Larger (includes React) |

## 🚀 Quick Start

### Vanilla SDK Example
```bash
cd vanilla-sdk
npm install
npm run dev
```

### React SDK Example
```bash
cd react-app
npm install
npm run dev
```

## 🛠️ Environment Configuration

Both examples support environment variable configuration and will automatically load values from a shared `.env` file.

### Quick Setup
```bash
# Option 1: Use the setup script (recommended)
cd examples && ./setup.sh

# Option 2: Manual setup
cp .env.example .env
nano .env  # Edit with your values
```

### Environment Variables
Create a `.env` file in the project root with these variables:

```bash
# SDK Configuration
VITE_DEFAULT_TENANT_ID=your-tenant-id
VITE_DEFAULT_BASE_URL=https://api.growcado.io/
VITE_DEFAULT_STORAGE=localStorage
VITE_DEFAULT_ENABLE_AUTO_UTM=true
VITE_DEFAULT_ENABLE_REFERRER_TRACKING=true

# Customer Defaults
VITE_DEFAULT_EMAIL=user@example.com
VITE_DEFAULT_USER_ID=user123
VITE_DEFAULT_ANONYMOUS_ID=anon-abc123

# Content Defaults
VITE_DEFAULT_MODEL_IDENTIFIER=message
VITE_DEFAULT_CONTENT_IDENTIFIER=greetings

# Custom Fields
VITE_DEFAULT_CUSTOM_KEY=segment
VITE_DEFAULT_CUSTOM_VALUE=premium
VITE_DEFAULT_CUSTOM_HEADERS={"X-Custom": "header-value"}
```

**Note:** The `.env.example` file in the project root contains working default values that you can use as-is for testing.

## 🧪 Testing Features

Both examples provide comprehensive testing interfaces for:

### 1. SDK Configuration
- ✅ Configure SDK with tenant ID and options
- ✅ View current configuration
- ✅ Test different storage modes
- ✅ Toggle UTM and referrer tracking

### 2. Customer Management
- ✅ Set customer identifiers (email, userId, anonymousId)
- ✅ Add custom key-value pairs
- ✅ Clear all customer data
- ✅ View stored customer information

### 3. Content Retrieval
- ✅ Fetch content with model/content identifiers
- ✅ Override tenant ID for specific requests
- ✅ Add custom headers
- ✅ Handle successful responses
- ✅ Test error scenarios

### 4. Tracking & Storage
- ✅ UTM parameter capture and storage
- ✅ Initial referrer tracking
- ✅ View all localStorage data
- ✅ Clear storage data
- ✅ Test tracking with URL parameters

### 5. Error Handling
- ✅ Network error simulation
- ✅ Invalid content requests
- ✅ Configuration errors
- ✅ Comprehensive error reporting

## 💡 Architecture Insights

### Vanilla SDK Architecture
```
User Action → SDK Method → HTTP Request → Update DOM
                ↓
         Manual State Management
```

### React SDK Architecture
```
User Action → React Hook → React Query → SDK Method → HTTP Request
                ↓              ↓
         React State    Automatic Caching
                ↓              ↓
         Component Re-render ← Cache Update
```

## 🎨 UI/UX Features

Both examples feature:
- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Feedback**: Immediate status updates
- **Comprehensive Logging**: Detailed operation results
- **Error Visualization**: Clear error messages and context
- **Interactive Testing**: All SDK features accessible via UI

## 🔧 Development

### Running Examples Locally

1. **Install dependencies** (from project root):
   ```bash
   pnpm install
   ```

2. **Build SDK packages**:
   ```bash
   pnpm run build:packages
   ```

3. **Run vanilla example**:
   ```bash
   pnpm run example:vanilla
   ```

4. **Run React example**:
   ```bash
   pnpm run example:react
   ```

### Adding UTM Parameters for Testing

To test UTM tracking, add parameters to the URL:
```
http://localhost:5173/?utm_source=test&utm_medium=example&utm_campaign=demo
```

### Testing Referrer Tracking

To test referrer tracking:
1. Create a simple HTML file with a link to your example
2. Open the HTML file in browser
3. Click the link to navigate to the example
4. Check referrer data in the storage section

## 📚 Learning Path

### For Beginners
1. Start with the **Vanilla SDK Example** to understand core concepts
2. Explore the SDK configuration and basic content fetching
3. Test customer management and storage features
4. Move to the **React SDK Example** to see modern patterns

### For React Developers
1. Jump to the **React SDK Example** for familiar patterns
2. Explore hook-based content fetching
3. Understand React Query integration benefits
4. Compare with Vanilla SDK for deeper understanding

### For Advanced Users
1. Study both examples to understand trade-offs
2. Examine the source code for implementation details
3. Customize examples for your specific use cases
4. Contribute improvements or additional examples

## 🔗 Related Documentation

- **[Core SDK Documentation](../packages/sdk/README.md)** - Detailed SDK API reference
- **[React SDK Documentation](../packages/react/README.md)** - React-specific features and hooks
- **[API Documentation](https://docs.growcado.io)** - Complete API reference
- **[Getting Started Guide](https://docs.growcado.io/getting-started)** - Quick start tutorial 