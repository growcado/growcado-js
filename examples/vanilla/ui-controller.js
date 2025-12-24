import { sdkClient } from './sdk-client.js';

/**
 * UI Controller - handles all user interface interactions
 */
class UIController {
  constructor() {
    this.initializeElements();
    this.setDefaultValues();
    this.bindEvents();
    this.initializeState();
  }

  /**
   * Get all DOM elements
   */
  initializeElements() {
    // Output elements
    this.output = document.getElementById('output');
    this.statusElement = document.getElementById('status');
    this.responseTimeElement = document.getElementById('response-time');
    
    // Button elements
    this.testButton = document.getElementById('test-button');
    this.clearButton = document.getElementById('clear-output');
    this.copyButton = document.getElementById('copy-output');
    
    // Form input elements
    this.tenantIdInput = document.getElementById('tenant-id');
    this.enableAutoUtmInput = document.getElementById('enable-auto-utm');
    this.enableReferrerTrackingInput = document.getElementById('enable-referrer-tracking');
    this.enableStorageInput = document.getElementById('enable-storage');
    this.modelIdentifierInput = document.getElementById('model-identifier');
    this.contentIdentifierInput = document.getElementById('content-identifier');
    
    // Customer identifiers elements
    this.customerIdentifiersContainer = document.getElementById('customer-identifiers-container');
    this.addIdentifierBtn = document.getElementById('add-identifier-btn');
    
    // CXP parameters elements
    this.cxpParametersContainer = document.getElementById('cxp-parameters-container');
    this.addCxpBtn = document.getElementById('add-cxp-btn');
  }

  /**
   * Set default form values
   */
  setDefaultValues() {
    const defaults = sdkClient.defaultConfig;
    const contentDefaults = sdkClient.defaultContentParams;
    
    this.tenantIdInput.value = defaults.tenantId;
    this.modelIdentifierInput.value = contentDefaults.modelIdentifier;
    this.contentIdentifierInput.value = contentDefaults.contentIdentifier;
    this.enableAutoUtmInput.checked = defaults.enableAutoUTM;
    this.enableReferrerTrackingInput.checked = defaults.enableReferrerTracking;
    this.enableStorageInput.checked = defaults.enableStorage;
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Button events
    this.testButton.addEventListener('click', () => this.executeRequest());
    this.clearButton.addEventListener('click', () => this.clearOutput());
    this.copyButton.addEventListener('click', () => this.copyOutput());
    
    // Note: UTM and Referrer tracking are handled automatically by SDK when enabled
    
    // Customer identifiers functionality
    this.addIdentifierBtn.addEventListener('click', () => this.addCustomerIdentifier());
    
    // CXP parameters functionality
    this.addCxpBtn.addEventListener('click', () => this.addCxpParameter());
    
    // Input validation events
    [this.tenantIdInput, this.modelIdentifierInput, this.contentIdentifierInput].forEach(input => {
      input.addEventListener('input', () => this.validateFormInputs());
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  /**
   * Initialize UI state
   */
  initializeState() {
    this.updateStatus('Ready');
    this.responseTimeElement.textContent = '-';
    this.initializeCustomerIdentifiers(); // Set up customer identifiers functionality
    this.initializeCxpParameters(); // Set up CXP parameters functionality
    console.log('🥑 Growcado SDK Developer Tool loaded');
  }



  /**
   * Initialize customer identifiers functionality
   */
  initializeCustomerIdentifiers() {
    this.bindCustomerIdentifierEvents();
  }



  /**
   * Bind events for existing customer identifier pairs
   */
  bindCustomerIdentifierEvents() {
    // Bind remove buttons for existing pairs
    this.customerIdentifiersContainer.querySelectorAll('.remove-identifier-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.removeCustomerIdentifier(e.target.closest('.customer-identifier-pair')));
    });
  }



  /**
   * Add a new customer identifier pair
   */
  addCustomerIdentifier() {
    const newPair = document.createElement('div');
    newPair.className = 'customer-identifier-pair';
    newPair.innerHTML = `
      <div class="key-value-row">
        <input type="text" class="identifier-key" placeholder="Key (e.g., userId)" />
        <input type="text" class="identifier-value" placeholder="Value (e.g., user123)" />
        <button type="button" class="remove-identifier-btn" title="Remove">×</button>
      </div>
    `;
    
    this.customerIdentifiersContainer.appendChild(newPair);
    
    // Bind remove button event
    const removeBtn = newPair.querySelector('.remove-identifier-btn');
    removeBtn.addEventListener('click', () => this.removeCustomerIdentifier(newPair));
  }

  /**
   * Remove a customer identifier pair
   */
  removeCustomerIdentifier(pair) {
    // Don't remove if it's the only pair
    if (this.customerIdentifiersContainer.children.length > 1) {
      pair.remove();
    } else {
      // Clear the inputs instead of removing the last pair
      pair.querySelector('.identifier-key').value = '';
      pair.querySelector('.identifier-value').value = '';
    }
  }

  /**
   * Get all customer identifiers as key-value pairs
   */
  getCustomerIdentifiers() {
    const identifiers = {};
    
    this.customerIdentifiersContainer.querySelectorAll('.customer-identifier-pair').forEach(pair => {
      const key = pair.querySelector('.identifier-key').value.trim();
      const value = pair.querySelector('.identifier-value').value.trim();
      
      if (key && value) {
        identifiers[key] = value;
      }
    });
    
    return identifiers;
  }

  /**
   * Initialize CXP parameters functionality
   */
  initializeCxpParameters() {
    this.bindCxpParameterEvents();
  }

  /**
   * Bind events for existing CXP parameter pairs
   */
  bindCxpParameterEvents() {
    this.cxpParametersContainer.querySelectorAll('.remove-cxp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.removeCxpParameter(e.target.closest('.cxp-parameter-pair')));
    });
  }

  /**
   * Add a new CXP parameter pair
   */
  addCxpParameter() {
    const newPair = document.createElement('div');
    newPair.className = 'cxp-parameter-pair';
    newPair.innerHTML = `
      <div class="key-value-row">
        <input type="text" class="cxp-key" placeholder="Key (e.g., segment)" />
        <input type="text" class="cxp-value" placeholder="Value (e.g., premium)" />
        <button type="button" class="remove-cxp-btn" title="Remove">×</button>
      </div>
    `;
    
    this.cxpParametersContainer.appendChild(newPair);
    
    // Bind remove button event
    const removeBtn = newPair.querySelector('.remove-cxp-btn');
    removeBtn.addEventListener('click', () => this.removeCxpParameter(newPair));
  }

  /**
   * Remove a CXP parameter pair
   */
  removeCxpParameter(pair) {
    // Don't remove if it's the only pair
    if (this.cxpParametersContainer.children.length > 1) {
      pair.remove();
    } else {
      // Clear the inputs instead of removing the last pair
      pair.querySelector('.cxp-key').value = '';
      pair.querySelector('.cxp-value').value = '';
    }
  }

  /**
   * Get all CXP parameters as key-value pairs
   */
  getCxpParameters() {
    const parameters = {};
    
    this.cxpParametersContainer.querySelectorAll('.cxp-parameter-pair').forEach(pair => {
      const key = pair.querySelector('.cxp-key').value.trim();
      const value = pair.querySelector('.cxp-value').value.trim();
      
      if (key && value) {
        parameters[key] = value;
      }
    });
    
    return parameters;
  }

  /**
   * Get configuration from form inputs
   */
  getFormConfiguration() {
    const config = {
      tenantId: this.tenantIdInput.value.trim(),
      enableAutoUTM: this.enableAutoUtmInput.checked,
      enableReferrerTracking: this.enableReferrerTrackingInput.checked,
      enableStorage: this.enableStorageInput.checked
    };
    
    // Note: UTM and Referrer settings are handled automatically by SDK
    
    return config;
  }

  /**
   * Get content parameters from form inputs
   */
  getFormContentParameters() {
    return {
      modelIdentifier: this.modelIdentifierInput.value.trim(),
      contentIdentifier: this.contentIdentifierInput.value.trim()
    };
  }

  /**
   * Update status display
   */
  updateStatus(status, color = '#00d4aa') {
    this.statusElement.textContent = status;
    this.statusElement.style.color = color;
  }



  /**
   * Format JSON output
   */
  formatOutput(obj) {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Display API response only
   */
  displayAPIResponse(data, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    let formattedContent;
    
    if (typeof data === 'object') {
      formattedContent = this.formatOutput(data);
    } else {
      formattedContent = data;
    }
    
    // Add timestamp header focused on API response
    const header = `// ${timestamp} - API Response (${isError ? 'ERROR' : 'SUCCESS'})\n${'='.repeat(50)}\n\n`;
    const fullContent = header + formattedContent;
    
    this.output.textContent = fullContent;
    this.output.className = `output-content ${isError ? 'error-output' : 'success-output'}`;
  }

  /**
   * Display configuration details separately
   */
  displayConfigInfo(config, contentParams, customerIdentifiers, cxpParameters, metadata) {
    const timestamp = new Date().toLocaleTimeString();
    
    const configSection = `// ${timestamp} - Configuration Used\n${'='.repeat(30)}\n\nSDK Config:\n${this.formatOutput(config)}\n\nContent Parameters:\n${this.formatOutput(contentParams)}\n\nCustomer Identifiers:\n${this.formatOutput(customerIdentifiers)}\n\nCXP Parameters:\n${this.formatOutput(cxpParameters)}\n\nRequest Metadata:\n${this.formatOutput(metadata)}\n\n`;
    
    // Show config info in console for reference
    console.group('🔧 Request Configuration');
    console.log('SDK Config:', config);
    console.log('Content Parameters:', contentParams);
    console.log('Customer Identifiers:', customerIdentifiers);
    console.log('CXP Parameters:', cxpParameters);
    console.log('Metadata:', metadata);
    console.groupEnd();
    
    return configSection;
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    if (loading) {
      this.testButton.classList.add('loading');
      this.testButton.querySelector('.button-text').textContent = 'Executing';
      this.testButton.disabled = true;
      this.updateStatus('Executing...', '#ffa500');
    } else {
      this.testButton.classList.remove('loading');
      this.testButton.querySelector('.button-text').textContent = 'Execute Request';
      this.testButton.disabled = false;
    }
  }

  /**
   * Clear output
   */
  clearOutput() {
    this.output.textContent = '';
    this.output.className = 'output-content';
    this.responseTimeElement.textContent = '-';
    this.updateStatus('Ready');
  }

  /**
   * Copy output to clipboard
   */
  async copyOutput() {
    try {
      if (this.output.textContent) {
        await navigator.clipboard.writeText(this.output.textContent);
        this.updateStatus('Copied to clipboard', '#00d4aa');
        setTimeout(() => this.updateStatus('Ready'), 2000);
      }
    } catch (error) {
      this.updateStatus('Copy failed', '#ff6b6b');
      setTimeout(() => this.updateStatus('Ready'), 2000);
    }
  }

  /**
   * Validate form inputs and update UI
   */
  validateFormInputs() {
    const config = this.getFormConfiguration();
    const contentParams = this.getFormContentParameters();
    
    const validationError = sdkClient.validateInputs(config, contentParams);
    
    [this.tenantIdInput, this.modelIdentifierInput, this.contentIdentifierInput].forEach(input => {
      if (validationError) {
        input.style.borderColor = '#ff6b6b';
      } else {
        input.style.borderColor = '#555';
      }
    });
    
    if (validationError) {
      this.updateStatus('Invalid input', '#ff6b6b');
    } else {
      this.updateStatus('Ready');
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.executeRequest();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.clearOutput();
    }
  }

  /**
   * Main execution method
   */
  async executeRequest() {
    const startTime = performance.now();
    this.setLoading(true);
    
    try {
      const config = this.getFormConfiguration();
      const contentParams = this.getFormContentParameters();
      const customerIdentifiers = this.getCustomerIdentifiers();
      const cxpParameters = this.getCxpParameters();
      
      this.updateStatus('SDK configured, fetching content...');
      
      // Use SDK client to execute request
      const result = await sdkClient.execute(config, contentParams, customerIdentifiers, cxpParameters);
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      this.responseTimeElement.textContent = `${responseTime}ms`;
      
      const metadata = {
        responseTime: `${responseTime}ms`,
        status: result.success ? 'success' : 'error',
        timestamp: new Date().toISOString()
      };
      
      // Display configuration info in console
      this.displayConfigInfo(result.config, result.contentParams, result.customerIdentifiers, result.cxpParameters, metadata);
      
      // Display only the API response in the main output
      if (result.success) {
        this.displayAPIResponse(result.data, false);
        this.updateStatus('Request completed', '#00d4aa');
      } else {
        this.displayAPIResponse(result.error, true);
        this.updateStatus('Request failed', '#ff6b6b');
      }
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      this.responseTimeElement.textContent = `${responseTime}ms`;
      
      const metadata = {
        responseTime: `${responseTime}ms`,
        status: 'exception',
        timestamp: new Date().toISOString()
      };
      
      // Display configuration info in console
      this.displayConfigInfo(
        this.getFormConfiguration(),
        this.getFormContentParameters(),
        this.getCustomerIdentifiers(),
        this.getCxpParameters(),
        metadata
      );
      
      // Display only the error in the main output
      const errorDetails = {
        message: error.message,
        stack: error.stack
      };
      
      this.displayAPIResponse(errorDetails, true);
      this.updateStatus('Exception occurred', '#ff6b6b');
    } finally {
      this.setLoading(false);
    }
  }
}

// Initialize UI Controller when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new UIController());
} else {
  new UIController();
} 