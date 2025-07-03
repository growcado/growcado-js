import { GrowcadoSDK } from '@growcado/sdk';

/**
 * Simple SDK Client - handles only SDK operations
 */
class SDKClient {
  constructor() {
    this.defaultConfig = {
      tenantId: '182535921101466354',
      enableAutoUTM: true,
      enableReferrerTracking: true,
      enableStorage: false
    };
    
    this.defaultContentParams = {
      modelIdentifier: 'wraped-item',
      contentIdentifier: '65ceedaf-09d2-45'
    };
  }

  /**
   * Validate required inputs
   */
  validateInputs(config, contentParams) {
    if (!config.tenantId?.trim()) {
      return 'Tenant ID is required';
    }
    
    if (!contentParams.modelIdentifier?.trim()) {
      return 'Model Identifier is required';
    }
    
    if (!contentParams.contentIdentifier?.trim()) {
      return 'Content Identifier is required';
    }
    
    return null;
  }

  /**
   * Configure the SDK with provided configuration
   */
  configure(config, customerIdentifiers = {}) {
    // Set customer identifiers
    if (customerIdentifiers && Object.keys(customerIdentifiers).length > 0) {
      GrowcadoSDK.setCustomerIdentifiers(customerIdentifiers);
    }
    
    // Note: Manual UTM and Referrer tracking are not yet supported by the SDK
    // The SDK handles automatic UTM and referrer tracking when enabled
    
    return GrowcadoSDK.configure(config);
  }



  /**
   * Execute SDK content request
   */
  async getContent(contentParams) {
    return await GrowcadoSDK.getContent(contentParams);
  }

  /**
   * Main execution method - validates, configures, and executes
   */
  async execute(config, contentParams, customerIdentifiers = {}) {
    // Validate inputs
    const validationError = this.validateInputs(config, contentParams);
    if (validationError) {
      throw new Error(`Validation Error: ${validationError}`);
    }

    // Configure SDK with customer identifiers
    this.configure(config, customerIdentifiers);
    
    // Execute request
    const response = await this.getContent(contentParams);
    
    if (response.data) {
      return {
        success: true,
        data: response.data,
        config,
        contentParams,
        customerIdentifiers
      };
    } else if (response.error) {
      return {
        success: false,
        error: response.error,
        config,
        contentParams,
        customerIdentifiers
      };
    } else {
      throw new Error('No data or error returned from SDK');
    }
  }
}

// Export singleton instance
export const sdkClient = new SDKClient(); 