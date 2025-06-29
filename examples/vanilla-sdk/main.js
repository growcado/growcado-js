import { GrowcadoSDK } from '@growcado/sdk';

// DOM elements
const globalStatus = document.getElementById('global-status');
const actionStatus = document.getElementById('action-status');
const resultOutput = document.getElementById('result-output');

// Form elements
const tenantIdInput = document.getElementById('tenantId');
const baseURLInput = document.getElementById('baseURL');
const storageSelect = document.getElementById('storage');
const enableAutoUTMCheck = document.getElementById('enableAutoUTM');
const enableReferrerTrackingCheck = document.getElementById('enableReferrerTracking');

const emailInput = document.getElementById('email');
const userIdInput = document.getElementById('userId');
const anonymousIdInput = document.getElementById('anonymousId');
const customKeyInput = document.getElementById('customKey');
const customValueInput = document.getElementById('customValue');

const modelIdentifierInput = document.getElementById('modelIdentifier');
const contentIdentifierInput = document.getElementById('contentIdentifier');
const overrideTenantIdInput = document.getElementById('overrideTenantId');
const customHeadersInput = document.getElementById('customHeaders');

// Helper functions
function updateGlobalStatus(message, type = 'info') {
    globalStatus.textContent = message;
    globalStatus.className = `status ${type}`;
}

function updateActionStatus(message, type = 'info') {
    actionStatus.textContent = message;
    actionStatus.className = `status ${type}`;
    actionStatus.style.display = 'block';
}

function displayResult(result, title = 'Result') {
    const output = {
        title,
        timestamp: new Date().toISOString(),
        result
    };
    resultOutput.textContent = JSON.stringify(output, null, 2);
}

function displayError(error, context = 'Operation') {
    console.error(`[${context}] Error:`, error);
    updateActionStatus(`❌ ${context} failed: ${error.message}`, 'error');
    displayResult({
        error: error.message,
        stack: error.stack,
        context
    }, `${context} Error`);
}

// SDK Configuration
document.getElementById('configure-sdk').addEventListener('click', () => {
    try {
        const config = {
            tenantId: tenantIdInput.value.trim(),
            baseURL: baseURLInput.value.trim(),
            storage: storageSelect.value,
            enableAutoUTM: enableAutoUTMCheck.checked,
            enableReferrerTracking: enableReferrerTrackingCheck.checked
        };

        if (!config.tenantId) {
            throw new Error('Tenant ID is required');
        }

        // Remove empty baseURL to use default
        if (!config.baseURL) {
            delete config.baseURL;
        }

        GrowcadoSDK.configure(config);
        
        updateGlobalStatus('✅ SDK configured successfully!', 'success');
        updateActionStatus('✅ SDK configured successfully!', 'success');
        displayResult(config, 'SDK Configuration');
        
    } catch (error) {
        displayError(error, 'SDK Configuration');
    }
});

document.getElementById('get-config').addEventListener('click', () => {
    try {
        const config = GrowcadoSDK.getConfig();
        if (config) {
            updateActionStatus('✅ Configuration retrieved', 'success');
            displayResult(config, 'Current SDK Configuration');
        } else {
            updateActionStatus('⚠️ SDK not configured yet', 'warning');
            displayResult({ message: 'SDK not configured' }, 'Configuration Status');
        }
    } catch (error) {
        displayError(error, 'Get Configuration');
    }
});

// Customer Identifiers
document.getElementById('set-identifiers').addEventListener('click', () => {
    try {
        const identifiers = {};
        
        if (emailInput.value.trim()) identifiers.email = emailInput.value.trim();
        if (userIdInput.value.trim()) identifiers.userId = userIdInput.value.trim();
        if (anonymousIdInput.value.trim()) identifiers.anonymousId = anonymousIdInput.value.trim();
        
        // Custom key-value pair
        if (customKeyInput.value.trim() && customValueInput.value.trim()) {
            identifiers[customKeyInput.value.trim()] = customValueInput.value.trim();
        }

        if (Object.keys(identifiers).length === 0) {
            throw new Error('At least one identifier must be provided');
        }

        GrowcadoSDK.setCustomerIdentifiers(identifiers);
        
        updateActionStatus('✅ Customer identifiers set successfully!', 'success');
        displayResult(identifiers, 'Customer Identifiers Set');
        
    } catch (error) {
        displayError(error, 'Set Customer Identifiers');
    }
});

document.getElementById('clear-identifiers').addEventListener('click', () => {
    try {
        // Clear form
        emailInput.value = '';
        userIdInput.value = '';
        anonymousIdInput.value = '';
        customKeyInput.value = '';
        customValueInput.value = '';
        
        // Clear in SDK by setting empty object
        GrowcadoSDK.setCustomerIdentifiers({});
        
        // Clear from localStorage if using localStorage storage
        const config = GrowcadoSDK.getConfig();
        if (config?.storage === 'localStorage') {
            localStorage.removeItem('cxp_customer_identifiers');
        }
        
        updateActionStatus('✅ Customer identifiers cleared', 'success');
        displayResult({ message: 'All customer identifiers cleared' }, 'Clear Identifiers');
        
    } catch (error) {
        displayError(error, 'Clear Customer Identifiers');
    }
});

// Content Retrieval
document.getElementById('get-content').addEventListener('click', async () => {
    try {
        const contentConfig = {
            modelIdentifier: modelIdentifierInput.value.trim(),
            contentIdentifier: contentIdentifierInput.value.trim()
        };

        if (!contentConfig.modelIdentifier) {
            throw new Error('Model Identifier is required');
        }
        if (!contentConfig.contentIdentifier) {
            throw new Error('Content Identifier is required');
        }

        // Add optional fields
        if (overrideTenantIdInput.value.trim()) {
            contentConfig.tenantId = overrideTenantIdInput.value.trim();
        }

        if (customHeadersInput.value.trim()) {
            try {
                contentConfig.headers = JSON.parse(customHeadersInput.value.trim());
            } catch (e) {
                throw new Error('Invalid JSON in custom headers');
            }
        }

        updateActionStatus('🔄 Fetching content...', 'info');
        
        const response = await GrowcadoSDK.getContent(contentConfig);
        
        if (response.error) {
            updateActionStatus(`❌ Content fetch failed: ${response.error.message}`, 'error');
            displayResult(response, 'Content Fetch Error');
        } else {
            updateActionStatus('✅ Content fetched successfully!', 'success');
            displayResult({
                config: contentConfig,
                response: response
            }, 'Content Fetch Success');
        }
        
    } catch (error) {
        displayError(error, 'Content Retrieval');
    }
});

document.getElementById('test-error').addEventListener('click', async () => {
    try {
        updateActionStatus('🔄 Testing error handling...', 'info');
        
        // Intentionally trigger an error with invalid content
        const response = await GrowcadoSDK.getContent({
            modelIdentifier: 'non-existent-model',
            contentIdentifier: 'non-existent-content'
        });
        
        updateActionStatus('✅ Error handling test completed', 'success');
        displayResult(response, 'Error Handling Test');
        
    } catch (error) {
        displayError(error, 'Error Handling Test');
    }
});

// Tracking & Storage
document.getElementById('check-utm').addEventListener('click', () => {
    try {
        const utmParams = localStorage.getItem('cxp_utm_params');
        const currentUrl = new URL(window.location.href);
        const urlUtmParams = {};
        
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
        
    } catch (error) {
        displayError(error, 'UTM Check');
    }
});

document.getElementById('check-referrer').addEventListener('click', () => {
    try {
        const storedReferrer = localStorage.getItem('cxp_initial_referrer');
        const currentReferrer = document.referrer;
        
        updateActionStatus('✅ Referrer data checked', 'success');
        displayResult({
            stored: storedReferrer,
            current: currentReferrer,
            instructions: 'Navigate from another site to see referrer tracking in action'
        }, 'Referrer Data');
        
    } catch (error) {
        displayError(error, 'Referrer Check');
    }
});

document.getElementById('view-storage').addEventListener('click', () => {
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
        
    } catch (error) {
        displayError(error, 'View Storage');
    }
});

document.getElementById('clear-storage').addEventListener('click', () => {
    try {
        localStorage.removeItem('cxp_customer_identifiers');
        localStorage.removeItem('cxp_utm_params');
        localStorage.removeItem('cxp_initial_referrer');
        
        updateActionStatus('✅ All storage cleared', 'success');
        displayResult({ message: 'All Growcado SDK storage data cleared' }, 'Clear Storage');
        
    } catch (error) {
        displayError(error, 'Clear Storage');
    }
});

// Load environment variables with fallbacks
function loadDefaults() {
    // Debug: Log all environment variables
    console.log('🔍 All environment variables:', import.meta.env);
    console.log('📧 Email env var:', import.meta.env.VITE_DEFAULT_EMAIL);
    console.log('🏢 Tenant ID env var:', import.meta.env.VITE_DEFAULT_TENANT_ID);
    
    // Load defaults from environment variables or use fallbacks
    tenantIdInput.value = import.meta.env.VITE_DEFAULT_TENANT_ID || 'demo-tenant';
    baseURLInput.value = import.meta.env.VITE_DEFAULT_BASE_URL || 'https://api.growcado.io/';
    storageSelect.value = import.meta.env.VITE_DEFAULT_STORAGE || 'localStorage';
    enableAutoUTMCheck.checked = import.meta.env.VITE_DEFAULT_ENABLE_AUTO_UTM !== 'false';
    enableReferrerTrackingCheck.checked = import.meta.env.VITE_DEFAULT_ENABLE_REFERRER_TRACKING !== 'false';

    // Customer identifiers
    emailInput.value = import.meta.env.VITE_DEFAULT_EMAIL || '';
    userIdInput.value = import.meta.env.VITE_DEFAULT_USER_ID || '';
    anonymousIdInput.value = import.meta.env.VITE_DEFAULT_ANONYMOUS_ID || '';

    // Content configuration
    modelIdentifierInput.value = import.meta.env.VITE_DEFAULT_MODEL_IDENTIFIER || 'homepage';
    contentIdentifierInput.value = import.meta.env.VITE_DEFAULT_CONTENT_IDENTIFIER || 'hero-section';

    // Custom fields
    customKeyInput.value = import.meta.env.VITE_DEFAULT_CUSTOM_KEY || '';
    customValueInput.value = import.meta.env.VITE_DEFAULT_CUSTOM_VALUE || '';

    // Custom headers
    const defaultHeaders = import.meta.env.VITE_DEFAULT_CUSTOM_HEADERS;
    if (defaultHeaders && defaultHeaders.trim()) {
        customHeadersInput.value = defaultHeaders;
    }
}

// Initialize the app
function init() {
    try {
        console.log('GrowcadoSDK imported successfully:', GrowcadoSDK);
        
        // Load default values from environment
        loadDefaults();
        
        updateGlobalStatus('✅ SDK loaded and ready for configuration!', 'success');
        
        // Display initial state with environment info
        const envInfo = {
            message: 'Growcado SDK Testing Interface Ready',
            sdk: 'GrowcadoSDK',
            availableMethods: ['configure', 'getContent', 'setCustomerIdentifiers', 'getConfig'],
            instructions: 'Default values loaded from environment. Start by configuring the SDK above.',
            environmentDefaults: {
                tenantId: import.meta.env.VITE_DEFAULT_TENANT_ID || 'Not set',
                baseURL: import.meta.env.VITE_DEFAULT_BASE_URL || 'Not set',
                email: import.meta.env.VITE_DEFAULT_EMAIL || 'Not set',
                modelIdentifier: import.meta.env.VITE_DEFAULT_MODEL_IDENTIFIER || 'Not set'
            }
        };
        
        displayResult(envInfo, 'SDK Initialization');
        
        // Check if there are UTM parameters in the current URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasUtmParams = Array.from(urlParams.keys()).some(key => key.startsWith('utm_'));
        if (hasUtmParams) {
            updateActionStatus('📋 UTM parameters detected in URL!', 'info');
        }
        
    } catch (error) {
        console.error('Error loading SDK:', error);
        updateGlobalStatus(`❌ Error loading SDK: ${error.message}`, 'error');
        displayError(error, 'SDK Initialization');
    }
}

// Initialize when DOM is loaded
init(); 