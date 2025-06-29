# Growcado SDK Examples

This directory contains examples demonstrating how to use the Growcado SDK in different environments.

## Available Examples

- **vanilla-sdk**: Pure JavaScript/HTML example with comprehensive testing interface
- **react-app**: React application example (coming soon)

## Environment Configuration

You can set default values for all examples using environment variables. This is useful for:
- Setting your default tenant ID
- Pre-filling customer identifiers
- Configuring default content to test with
- Setting up custom headers

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   # SDK Configuration
   VITE_DEFAULT_TENANT_ID=your-tenant-id
   VITE_DEFAULT_BASE_URL=https://api.growcado.io/
   
   # Customer Identifiers  
   VITE_DEFAULT_EMAIL=your-email@company.com
   VITE_DEFAULT_USER_ID=your-user-id
   
   # Content Configuration
   VITE_DEFAULT_MODEL_IDENTIFIER=your-model
   VITE_DEFAULT_CONTENT_IDENTIFIER=your-content
   ```

3. Start any example - it will automatically load these defaults!

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DEFAULT_TENANT_ID` | Your Growcado tenant ID | `demo-tenant` |
| `VITE_DEFAULT_BASE_URL` | API base URL | `https://api.growcado.io/` |
| `VITE_DEFAULT_STORAGE` | Storage mode (`localStorage` or `memory`) | `localStorage` |
| `VITE_DEFAULT_ENABLE_AUTO_UTM` | Enable automatic UTM tracking | `true` |
| `VITE_DEFAULT_ENABLE_REFERRER_TRACKING` | Enable referrer tracking | `true` |
| `VITE_DEFAULT_EMAIL` | Default customer email | _(empty)_ |
| `VITE_DEFAULT_USER_ID` | Default customer user ID | _(empty)_ |
| `VITE_DEFAULT_ANONYMOUS_ID` | Default anonymous ID | _(empty)_ |
| `VITE_DEFAULT_MODEL_IDENTIFIER` | Default content model | `homepage` |
| `VITE_DEFAULT_CONTENT_IDENTIFIER` | Default content identifier | `hero-section` |
| `VITE_DEFAULT_CUSTOM_HEADERS` | Default HTTP headers (JSON) | _(empty)_ |
| `VITE_DEFAULT_CUSTOM_KEY` | Default custom field key | _(empty)_ |
| `VITE_DEFAULT_CUSTOM_VALUE` | Default custom field value | _(empty)_ |

### Notes

- Environment variables are **optional** - examples will work with built-in defaults if no `.env` file is present
- All variables must be prefixed with `VITE_` to be accessible in the browser
- Boolean values should be set to `'true'` or `'false'` (as strings)
- JSON values (like custom headers) should be properly escaped

## Running Examples

### Vanilla SDK Example

```bash
cd vanilla-sdk
pnpm install
pnpm run dev
```

The vanilla example provides a comprehensive testing interface for all SDK functionality including:
- SDK configuration
- Customer identifier management  
- Content retrieval
- UTM and referrer tracking
- Local storage inspection

### React App Example

```bash
cd react-app
pnpm install  
pnpm run dev
```

## Development

Each example is configured to:
- Load the shared environment configuration
- Use the SDK from source (not built packages) for development
- Support hot reloading
- Include comprehensive error handling

## Troubleshooting

If you encounter issues:

1. **Environment variables not loading**: Make sure your `.env` file is in the `examples/` directory, not in individual example folders
2. **SDK import errors**: Ensure you've built the SDK packages: `pnpm nx build sdk`
3. **Port conflicts**: Examples use different ports (vanilla: 3010, react: 5173)

For more help, check the individual example README files or the main project documentation. 