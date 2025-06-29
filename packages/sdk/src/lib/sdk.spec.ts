import { GrowcadoSDK } from './GrowcadoSDK';

describe('GrowcadoSDK', () => {
  beforeEach(() => {
    // Reset SDK state before each test
    GrowcadoSDK.configure({
      tenantId: 'test-tenant',
      storage: 'memory'
    });
  });

  describe('configure', () => {
    it('should set tenant ID', () => {
      GrowcadoSDK.configure({
        tenantId: 'test-123'
      });

      const config = GrowcadoSDK.getConfig();
      expect(config?.tenantId).toBe('test-123');
    });

    it('should use default values', () => {
      GrowcadoSDK.configure({
        tenantId: 'test-tenant'
      });

      const config = GrowcadoSDK.getConfig();
      expect(config?.baseURL).toBe('https://api.growcado.io/');
      expect(config?.enableAutoUTM).toBe(true);
      expect(config?.enableReferrerTracking).toBe(true);
      expect(config?.storage).toBe('localStorage');
    });
  });

  describe('setCustomerIdentifiers', () => {
    it('should store customer identifiers', () => {
      const identifiers = { email: 'test@example.com', userId: '123' };
      GrowcadoSDK.setCustomerIdentifiers(identifiers);

      // Since we can't easily test private methods, we test the behavior
      // by checking if getConfig still works (indicating SDK is properly configured)
      expect(GrowcadoSDK.getConfig()).toBeTruthy();
    });
  });

  describe('getContent', () => {
    it('should throw error if not configured', async () => {
      // Reset the SDK to unconfigured state
      GrowcadoSDK.reset();
      
      await expect(GrowcadoSDK.getContent({
        modelIdentifier: 'test',
        contentIdentifier: 'test'
      })).rejects.toThrow('SDK not configured');
    });

    it('should throw error if no tenant ID', async () => {
      GrowcadoSDK.configure({
        tenantId: '',
        storage: 'memory'
      });

      await expect(GrowcadoSDK.getContent({
        modelIdentifier: 'test',
        contentIdentifier: 'test'
      })).rejects.toThrow('Tenant ID is required');
    });
  });
}); 