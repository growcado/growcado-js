import { useState, useEffect } from 'react';
import { 
  useGrowcadoContent, 
  useCustomerIdentifiers, 
  useGrowcadoContext 
} from '@growcado/react';
import { GrowcadoSDK } from '@growcado/sdk';
import type { SDKConfig, CustomerIdentifiers } from '@growcado/sdk';
import './App.css';

// Types for our app state
interface ContentConfig {
  modelIdentifier: string;
  contentIdentifier: string;
  tenantId?: string;
  headers?: Record<string, string>;
}

interface AppState {
  sdkConfig: SDKConfig;
  customerData: CustomerIdentifiers & { customKey?: string; customValue?: string };
  contentConfig: ContentConfig;
  activeSection: string;
  contentFetchMode: 'hook' | 'promise';
}

function App() {
  // Get context to check if SDK is configured
  const { config: currentConfig, isConfigured } = useGrowcadoContext();
  
  // Customer identifiers hook
  const { setCustomer, clearCustomer } = useCustomerIdentifiers();
  
  // App state
  const [state, setState] = useState<AppState>({
    sdkConfig: {
      tenantId: (import.meta as any).env?.VITE_DEFAULT_TENANT_ID || 'demo-tenant',
      baseURL: (import.meta as any).env?.VITE_DEFAULT_BASE_URL || 'https://api.growcado.io/',
      storage: ((import.meta as any).env?.VITE_DEFAULT_STORAGE as 'localStorage' | 'memory') || 'localStorage',
      enableAutoUTM: (import.meta as any).env?.VITE_DEFAULT_ENABLE_AUTO_UTM !== 'false',
      enableReferrerTracking: (import.meta as any).env?.VITE_DEFAULT_ENABLE_REFERRER_TRACKING !== 'false',
    },
    customerData: {
      email: (import.meta as any).env?.VITE_DEFAULT_EMAIL || '',
      userId: (import.meta as any).env?.VITE_DEFAULT_USER_ID || '',
      anonymousId: (import.meta as any).env?.VITE_DEFAULT_ANONYMOUS_ID || '',
      customKey: (import.meta as any).env?.VITE_DEFAULT_CUSTOM_KEY || '',
      customValue: (import.meta as any).env?.VITE_DEFAULT_CUSTOM_VALUE || '',
    },
    contentConfig: {
      modelIdentifier: (import.meta as any).env?.VITE_DEFAULT_MODEL_IDENTIFIER || 'message',
      contentIdentifier: (import.meta as any).env?.VITE_DEFAULT_CONTENT_IDENTIFIER || 'greetings',
      tenantId: '',
      headers: undefined,
    },
    activeSection: 'config',
    contentFetchMode: 'hook'
  });

  // Results state
  const [results, setResults] = useState<{
    title: string;
    timestamp: string;
    result: any;
  } | null>(null);

  const [actionStatus, setActionStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Custom headers input state - initialize from environment variables
  const [customHeadersInput, setCustomHeadersInput] = useState<string>(
    (import.meta as any).env?.VITE_DEFAULT_CUSTOM_HEADERS || ''
  );

  // Content fetching hook - only enabled when we have the required fields
  const contentQuery = useGrowcadoContent({
    modelIdentifier: state.contentConfig.modelIdentifier,
    contentIdentifier: state.contentConfig.contentIdentifier,
    tenantId: state.contentConfig.tenantId || undefined,
    headers: state.contentConfig.headers,
    enabled: false, // We'll trigger this manually
  });

  // Error test content hook
  const errorTestQuery = useGrowcadoContent({
    modelIdentifier: 'non-existent-model',
    contentIdentifier: 'non-existent-content',
    enabled: false,
    retry: 1, // Only retry once for error test
  });

  // Helper functions
  const updateActionStatus = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setActionStatus({ message, type });
    setTimeout(() => setActionStatus(null), 5000);
  };

  const displayResult = (result: any, title: string) => {
    setResults({
      title,
      timestamp: new Date().toISOString(),
      result
    });
  };

  // Initialize app with environment info
  useEffect(() => {
    // Debug: Log all environment variables
    console.log('🔍 All environment variables:', (import.meta as any).env);
    console.log('📧 Email env var:', (import.meta as any).env?.VITE_DEFAULT_EMAIL);
    console.log('🏢 Tenant ID env var:', (import.meta as any).env?.VITE_DEFAULT_TENANT_ID);
    
    // Display initial state with environment info
    const envInfo = {
      message: 'Growcado React SDK Testing Interface Ready',
      sdk: '@growcado/react + @growcado/sdk',
      availableHooks: ['useGrowcadoContent', 'useCustomerIdentifiers', 'useGrowcadoContext'],
      availableModes: ['Hook Mode (declarative)', 'Promise Mode (imperative)'],
      instructions: 'Default values loaded from environment. Switch between Hook and Promise modes to see different approaches!',
      environmentDefaults: {
        tenantId: (import.meta as any).env?.VITE_DEFAULT_TENANT_ID || 'Not set',
        baseURL: (import.meta as any).env?.VITE_DEFAULT_BASE_URL || 'Not set',
        email: (import.meta as any).env?.VITE_DEFAULT_EMAIL || 'Not set',
        modelIdentifier: (import.meta as any).env?.VITE_DEFAULT_MODEL_IDENTIFIER || 'Not set',
        contentIdentifier: (import.meta as any).env?.VITE_DEFAULT_CONTENT_IDENTIFIER || 'Not set'
      }
    };
    
    displayResult(envInfo, 'React SDK Initialization');
    
    // Check if there are UTM parameters in the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasUtmParams = Array.from(urlParams.keys()).some(key => key.startsWith('utm_'));
    if (hasUtmParams) {
      updateActionStatus('📋 UTM parameters detected in URL!', 'info');
    }
  }, []); // Empty dependency array - run once on mount

  // Handlers
  const handleConfigureSDK = () => {
    try {
      if (!state.sdkConfig.tenantId.trim()) {
        throw new Error('Tenant ID is required');
      }

      // Create config object
      const config = {
        tenantId: state.sdkConfig.tenantId.trim(),
        baseURL: state.sdkConfig.baseURL?.trim() || undefined,
        storage: state.sdkConfig.storage,
        enableAutoUTM: state.sdkConfig.enableAutoUTM,
        enableReferrerTracking: state.sdkConfig.enableReferrerTracking,
      };

      // Remove empty baseURL to use default
      if (!config.baseURL) {
        delete config.baseURL;
      }

      GrowcadoSDK.configure(config);
      
      updateActionStatus('✅ SDK configured successfully!', 'success');
      displayResult(config, 'SDK Configuration');
      
    } catch (error: any) {
      updateActionStatus(`❌ SDK Configuration failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'SDK Configuration Error');
    }
  };

  const handleGetConfig = () => {
    try {
      const config = GrowcadoSDK.getConfig();
      if (config) {
        updateActionStatus('✅ Configuration retrieved', 'success');
        displayResult(config, 'Current SDK Configuration');
      } else {
        updateActionStatus('⚠️ SDK not configured yet', 'warning');
        displayResult({ message: 'SDK not configured' }, 'Configuration Status');
      }
    } catch (error: any) {
      updateActionStatus(`❌ Get Configuration failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Get Configuration Error');
    }
  };

  const handleSetCustomerIdentifiers = () => {
    try {
      const identifiers: CustomerIdentifiers = {};
      
      if (state.customerData.email?.trim()) identifiers.email = state.customerData.email.trim();
      if (state.customerData.userId?.trim()) identifiers.userId = state.customerData.userId.trim();
      if (state.customerData.anonymousId?.trim()) identifiers.anonymousId = state.customerData.anonymousId.trim();
      
      // Custom key-value pair
      if (state.customerData.customKey?.trim() && state.customerData.customValue?.trim()) {
        identifiers[state.customerData.customKey.trim()] = state.customerData.customValue.trim();
      }

      if (Object.keys(identifiers).length === 0) {
        throw new Error('At least one identifier must be provided');
      }

      setCustomer(identifiers);
      updateActionStatus('✅ Customer identifiers set successfully!', 'success');
      displayResult(identifiers, 'Customer Identifiers Set');
      
    } catch (error: any) {
      updateActionStatus(`❌ Set Customer Identifiers failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Set Customer Identifiers Error');
    }
  };

  const handleClearCustomerIdentifiers = () => {
    try {
      // Clear form
      setState(prev => ({
        ...prev,
        customerData: {
          email: '',
          userId: '',
          anonymousId: '',
          customKey: '',
          customValue: ''
        }
      }));
      
      // Clear in SDK
      clearCustomer();
      
      // Clear from localStorage if using localStorage storage
      if (currentConfig?.storage === 'localStorage') {
        localStorage.removeItem('cxp_customer_identifiers');
      }
      
      updateActionStatus('✅ Customer identifiers cleared', 'success');
      displayResult({ message: 'All customer identifiers cleared' }, 'Clear Identifiers');
      
    } catch (error: any) {
      updateActionStatus(`❌ Clear Customer Identifiers failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Clear Customer Identifiers Error');
    }
  };

  const handleGetContent = async () => {
    try {
      if (!state.contentConfig.modelIdentifier.trim()) {
        throw new Error('Model Identifier is required');
      }
      if (!state.contentConfig.contentIdentifier.trim()) {
        throw new Error('Content Identifier is required');
      }

      // Parse custom headers if provided
      let headers: Record<string, string> | undefined;
      if (customHeadersInput.trim()) {
        try {
          headers = JSON.parse(customHeadersInput.trim());
        } catch (e) {
          throw new Error('Invalid JSON in custom headers');
        }
      }

      // Update content config with headers
      setState(prev => ({
        ...prev,
        contentConfig: {
          ...prev.contentConfig,
          headers
        }
      }));

      updateActionStatus('🔄 Fetching content...', 'info');
      
      if (state.contentFetchMode === 'hook') {
        // Hook-based approach: Use React Query
        await contentQuery.refetch();
        
        // Check the query state after refetch
        if (contentQuery.data) {
          updateActionStatus('✅ Content fetched successfully! (Hook Mode)', 'success');
          displayResult({
            mode: 'React Hook (useGrowcadoContent)',
            config: state.contentConfig,
            response: { data: contentQuery.data }
          }, 'Content Fetch Success - Hook Mode');
        } else if (contentQuery.error) {
          updateActionStatus(`❌ Content fetch failed: ${contentQuery.error.message}`, 'error');
          displayResult({ error: contentQuery.error.message }, 'Content Fetch Error - Hook Mode');
        }
      } else {
        // Promise-based approach: Use SDK directly
        const contentConfig = {
          modelIdentifier: state.contentConfig.modelIdentifier,
          contentIdentifier: state.contentConfig.contentIdentifier,
          ...(state.contentConfig.tenantId && { tenantId: state.contentConfig.tenantId }),
          ...(headers && { headers })
        };

        const response = await GrowcadoSDK.getContent(contentConfig);
        
        if (response.error) {
          updateActionStatus(`❌ Content fetch failed: ${response.error.message}`, 'error');
          displayResult({ error: response.error.message }, 'Content Fetch Error - Promise Mode');
        } else {
          updateActionStatus('✅ Content fetched successfully! (Promise Mode)', 'success');
          displayResult({
            mode: 'Direct SDK Promise (GrowcadoSDK.getContent)',
            config: contentConfig,
            response: response
          }, 'Content Fetch Success - Promise Mode');
        }
      }
      
    } catch (error: any) {
      updateActionStatus(`❌ Content Retrieval failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Content Retrieval Error');
    }
  };

  const handleTestError = async () => {
    try {
      updateActionStatus('🔄 Testing error handling...', 'info');
      
      const result = await errorTestQuery.refetch();
      
      updateActionStatus('✅ Error handling test completed', 'success');
      displayResult(result, 'Error Handling Test');
      
    } catch (error: any) {
      updateActionStatus(`❌ Error Handling Test failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Error Handling Test Error');
    }
  };

  const handleCheckUTM = () => {
    try {
      const utmParams = localStorage.getItem('cxp_utm_params');
      const currentUrl = new URL(window.location.href);
      const urlUtmParams: Record<string, string> = {};
      
      // Extract current URL parameters
      for (const [key, value] of currentUrl.searchParams.entries()) {
        if (key.startsWith('utm_')) {
          urlUtmParams[key] = value;
        }
      }
      
      updateActionStatus('✅ UTM parameters checked', 'success');
      displayResult({
        stored: utmParams,
        currentUrl: urlUtmParams,
        instructions: 'Add UTM parameters to URL (e.g., ?utm_source=test&utm_medium=example) and refresh to see them stored'
      }, 'UTM Parameters');
      
    } catch (error: any) {
      updateActionStatus(`❌ UTM Check failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'UTM Check Error');
    }
  };

  const handleCheckReferrer = () => {
    try {
      const storedReferrer = localStorage.getItem('cxp_initial_referrer');
      const currentReferrer = document.referrer;
      
      updateActionStatus('✅ Referrer data checked', 'success');
      displayResult({
        stored: storedReferrer,
        current: currentReferrer,
        instructions: 'Navigate from another site to see referrer tracking in action'
      }, 'Referrer Data');
      
    } catch (error: any) {
      updateActionStatus(`❌ Referrer Check failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Referrer Check Error');
    }
  };

  const handleViewStorage = () => {
    try {
      const storageData = {
        cxp_customer_identifiers: localStorage.getItem('cxp_customer_identifiers'),
        cxp_utm_params: localStorage.getItem('cxp_utm_params'),
        cxp_initial_referrer: localStorage.getItem('cxp_initial_referrer')
      };
      
      // Parse JSON where applicable
      if (storageData.cxp_customer_identifiers) {
        try {
          storageData.cxp_customer_identifiers = JSON.parse(storageData.cxp_customer_identifiers);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      updateActionStatus('✅ Storage data retrieved', 'success');
      displayResult(storageData, 'Local Storage Data');
      
    } catch (error: any) {
      updateActionStatus(`❌ View Storage failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'View Storage Error');
    }
  };

  const handleClearStorage = () => {
    try {
      localStorage.removeItem('cxp_customer_identifiers');
      localStorage.removeItem('cxp_utm_params');
      localStorage.removeItem('cxp_initial_referrer');
      
      updateActionStatus('✅ All storage cleared', 'success');
      displayResult({ message: 'All Growcado SDK storage data cleared' }, 'Clear Storage');
      
    } catch (error: any) {
      updateActionStatus(`❌ Clear Storage failed: ${error.message}`, 'error');
      displayResult({ error: error.message }, 'Clear Storage Error');
    }
  };

  // Initialize results on mount
  useEffect(() => {
    const envInfo = {
      message: 'Growcado React SDK Testing Interface Ready',
      sdk: '@growcado/react',
      availableHooks: ['useGrowcadoContent', 'useCustomerIdentifiers', 'useGrowcadoContext'],
      instructions: 'SDK configured via GrowcadoProvider. Start by setting customer identifiers or fetching content.',
      sdkConfiguration: currentConfig,
      environmentDefaults: {
        tenantId: (import.meta as any).env?.VITE_DEFAULT_TENANT_ID || 'Not set',
        baseURL: (import.meta as any).env?.VITE_DEFAULT_BASE_URL || 'Not set',
        email: (import.meta as any).env?.VITE_DEFAULT_EMAIL || 'Not set',
        modelIdentifier: (import.meta as any).env?.VITE_DEFAULT_MODEL_IDENTIFIER || 'Not set'
      }
    };
    
    displayResult(envInfo, 'React SDK Initialization');

    // Check if there are UTM parameters in the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasUtmParams = Array.from(urlParams.keys()).some(key => key.startsWith('utm_'));
    if (hasUtmParams) {
      updateActionStatus('📋 UTM parameters detected in URL!', 'info');
    }
  }, [currentConfig]);

  return (
    <div className="app">
      <div className="container">
        <h1>🥑 Growcado React SDK - Comprehensive Testing Interface</h1>
        <p>This example demonstrates all functionality of the <code>@growcado/react</code> package.</p>
        
        <div className={`status ${isConfigured ? 'success' : 'warning'}`}>
          {isConfigured ? '✅ SDK configured and ready!' : '⚠️ SDK configuration pending'}
        </div>

        <div className="info-box">
          <strong>💡 Testing Tips:</strong>
          <ul>
            <li><strong>🆕 Configure SDK:</strong> Use the configuration form to dynamically change SDK settings</li>
            <li><strong>🆕 Try both modes:</strong> Switch between Hook and Promise modes to see different approaches</li>
            <li>Set customer identifiers to test personalization and cache invalidation</li>
            <li>Use URL parameters like <code>?utm_source=test&utm_medium=example</code> to test UTM tracking</li>
            <li>Check browser localStorage to see stored data</li>
            <li>Notice how React Query automatically caches content in Hook mode</li>
            <li>Customer changes automatically invalidate content queries in Hook mode</li>
            <li>Try different storage modes and tracking settings to see their effects</li>
          </ul>
        </div>
      </div>

      <div className="grid">
        {/* SDK Configuration */}
        <div className="container">
          <div className="section">
            <h3>1. SDK Configuration</h3>
            
            {/* Configuration Form */}
            <div className="form-group">
              <label htmlFor="tenantId">Tenant ID <span className="badge">Required</span></label>
              <input
                type="text"
                id="tenantId"
                placeholder="your-tenant-id"
                value={state.sdkConfig.tenantId || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  sdkConfig: { ...prev.sdkConfig, tenantId: e.target.value }
                }))}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="baseURL">Base URL</label>
              <input
                type="url"
                id="baseURL"
                placeholder="https://api.growcado.io/"
                value={state.sdkConfig.baseURL || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  sdkConfig: { ...prev.sdkConfig, baseURL: e.target.value }
                }))}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="storage">Storage Type</label>
              <select
                id="storage"
                value={state.sdkConfig.storage}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  sdkConfig: { ...prev.sdkConfig, storage: e.target.value as 'localStorage' | 'memory' }
                }))}
              >
                <option value="localStorage">localStorage</option>
                <option value="memory">memory</option>
              </select>
            </div>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enableAutoUTM"
                checked={state.sdkConfig.enableAutoUTM}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  sdkConfig: { ...prev.sdkConfig, enableAutoUTM: e.target.checked }
                }))}
              />
              <label htmlFor="enableAutoUTM">Enable Auto UTM Tracking</label>
            </div>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enableReferrerTracking"
                checked={state.sdkConfig.enableReferrerTracking}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  sdkConfig: { ...prev.sdkConfig, enableReferrerTracking: e.target.checked }
                }))}
              />
              <label htmlFor="enableReferrerTracking">Enable Referrer Tracking</label>
            </div>
            
            <button onClick={handleConfigureSDK}>Configure SDK</button>
            <button onClick={handleGetConfig} className="secondary">Get Current Config</button>
            
            {/* Current Configuration Display */}
            <div className="config-display">
              <h4>Current Configuration:</h4>
              <p><strong>Tenant ID:</strong> {currentConfig?.tenantId || 'Not configured'}</p>
              <p><strong>Base URL:</strong> {currentConfig?.baseURL || 'Not configured'}</p>
              <p><strong>Storage:</strong> {currentConfig?.storage || 'Not configured'}</p>
              <p><strong>Auto UTM:</strong> {currentConfig?.enableAutoUTM ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Referrer Tracking:</strong> {currentConfig?.enableReferrerTracking ? 'Enabled' : 'Disabled'}</p>
            </div>
            
            <div className="note">
              <em>💡 You can dynamically reconfigure the SDK. Changes will affect both Hook and Promise modes.</em>
            </div>
          </div>

          {/* Customer Identifiers */}
          <div className="section">
            <h3>2. Customer Identifiers</h3>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="user@example.com"
                value={state.customerData.email || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  customerData: { ...prev.customerData, email: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                type="text"
                id="userId"
                placeholder="user123"
                value={state.customerData.userId || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  customerData: { ...prev.customerData, userId: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="anonymousId">Anonymous ID</label>
              <input
                type="text"
                id="anonymousId"
                placeholder="anon-abc123"
                value={state.customerData.anonymousId || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  customerData: { ...prev.customerData, anonymousId: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customKey">Custom Key</label>
              <input
                type="text"
                id="customKey"
                placeholder="customField"
                value={state.customerData.customKey || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  customerData: { ...prev.customerData, customKey: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customValue">Custom Value</label>
              <input
                type="text"
                id="customValue"
                placeholder="customValue"
                value={state.customerData.customValue || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  customerData: { ...prev.customerData, customValue: e.target.value }
                }))}
              />
            </div>
            <button onClick={handleSetCustomerIdentifiers}>Set Customer Identifiers</button>
            <button onClick={handleClearCustomerIdentifiers} className="danger">Clear Identifiers</button>
          </div>
        </div>

        {/* Content Testing */}
        <div className="container">
          <div className="section">
            <h3>3. Content Retrieval</h3>
            
            {/* Content Fetch Mode Toggle */}
            <div className="mode-toggle">
              <label>Fetch Mode:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="contentFetchMode"
                    value="hook"
                    checked={state.contentFetchMode === 'hook'}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      contentFetchMode: e.target.value as 'hook' | 'promise'
                    }))}
                  />
                  <span className="radio-label">
                    <strong>🪝 React Hook</strong>
                    <small>Declarative, automatic caching, React Query</small>
                  </span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="contentFetchMode"
                    value="promise"
                    checked={state.contentFetchMode === 'promise'}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      contentFetchMode: e.target.value as 'hook' | 'promise'
                    }))}
                  />
                  <span className="radio-label">
                    <strong>⚡ Direct Promise</strong>
                    <small>Imperative, manual handling, direct SDK</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="info-box">
              <strong>📚 Mode Comparison:</strong>
              <ul>
                <li><strong>Hook Mode:</strong> Uses <code>useGrowcadoContent</code> - React Query handles caching, loading states, and background refetching automatically</li>
                <li><strong>Promise Mode:</strong> Uses <code>GrowcadoSDK.getContent()</code> directly - Manual handling, no automatic caching, immediate results</li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="modelIdentifier">Model Identifier <span className="badge">Required</span></label>
              <input
                type="text"
                id="modelIdentifier"
                placeholder="blog-post"
                value={state.contentConfig.modelIdentifier}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  contentConfig: { ...prev.contentConfig, modelIdentifier: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contentIdentifier">Content Identifier <span className="badge">Required</span></label>
              <input
                type="text"
                id="contentIdentifier"
                placeholder="my-first-post"
                value={state.contentConfig.contentIdentifier}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  contentConfig: { ...prev.contentConfig, contentIdentifier: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="overrideTenantId">Override Tenant ID (optional)</label>
              <input
                type="text"
                id="overrideTenantId"
                placeholder="different-tenant"
                value={state.contentConfig.tenantId || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  contentConfig: { ...prev.contentConfig, tenantId: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customHeaders">Custom Headers (JSON)</label>
              <input
                type="text"
                id="customHeaders"
                placeholder='{"Authorization": "Bearer token"}'
                value={customHeadersInput}
                onChange={(e) => setCustomHeadersInput(e.target.value)}
              />
            </div>
            <button onClick={handleGetContent} disabled={contentQuery.isLoading}>
              {contentQuery.isLoading ? 'Loading...' : 'Get Content'}
            </button>
            <button onClick={handleTestError} className="secondary" disabled={errorTestQuery.isLoading}>
              {errorTestQuery.isLoading ? 'Testing...' : 'Test Error Handling'}
            </button>
            
            {/* Content Query Status */}
            <div className="query-status">
              <p><strong>Query Status:</strong></p>
              <ul>
                <li>Loading: {contentQuery.isLoading ? 'Yes' : 'No'}</li>
                <li>Error: {contentQuery.isError ? 'Yes' : 'No'}</li>
                <li>Success: {contentQuery.isSuccess ? 'Yes' : 'No'}</li>
                <li>Cached Data: {contentQuery.data ? 'Available' : 'None'}</li>
              </ul>
            </div>
          </div>

          {/* Tracking & Storage */}
          <div className="section">
            <h3>4. Tracking & Storage</h3>
            <button onClick={handleCheckUTM}>Check UTM Parameters</button>
            <button onClick={handleCheckReferrer}>Check Referrer Data</button>
            <button onClick={handleViewStorage} className="secondary">View Local Storage</button>
            <button onClick={handleClearStorage} className="danger">Clear All Storage</button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container">
        <div className="result-section">
          <h3>📊 Results & Output</h3>
          {actionStatus && (
            <div className={`status ${actionStatus.type}`}>
              {actionStatus.message}
            </div>
          )}
          <pre>
            {results ? JSON.stringify(results, null, 2) : 'Results will appear here...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App; 