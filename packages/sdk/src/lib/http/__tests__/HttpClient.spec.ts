import { HttpClient } from '../HttpClient';
import axios from 'axios';
import { vi, beforeEach, describe, it, expect, Mock } from 'vitest';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        get: vi.fn()
      }))
    }
  };
});

interface MockAxiosInstance {
  get: Mock;
}

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockAxiosInstance: MockAxiosInstance;
  let mockAxiosCreate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup axios mock
    mockAxiosInstance = {
      get: vi.fn()
    };
    
    mockAxiosCreate = vi.mocked(axios.create);
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);
    
    httpClient = new HttpClient();
  });

  describe('configure', () => {
    it('should create axios instance with default baseURL', () => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.growcado.io/'
      });
    });

    it('should create axios instance with custom baseURL', () => {
      httpClient.configure({
        tenantId: 'test-tenant',
        baseURL: 'https://custom.api.com/'
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://custom.api.com/'
      });
    });

    it('should store configuration', () => {
      httpClient.configure({
        tenantId: 'test-tenant',
        baseURL: 'https://custom.api.com/',
        enableAutoUTM: false
      });

      const axiosInstance = httpClient.getAxiosInstance();
      expect(axiosInstance).toBe(mockAxiosInstance);
    });

    it('should handle undefined baseURL', () => {
      httpClient.configure({
        tenantId: 'test-tenant',
        baseURL: undefined
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.growcado.io/'
      });
    });
  });

  describe('get', () => {
    beforeEach(() => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });
    });

    it('should make successful GET request without headers', async () => {
      const mockResponse = {
        data: { id: 1, title: 'Test Content' }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-path');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-path', undefined);
      expect(result).toEqual({ data: mockResponse.data });
    });

    it('should make successful GET request with headers', async () => {
      const mockResponse = {
        data: { id: 1, title: 'Test Content' }
      };
      const customHeaders = { 'X-Custom-Header': 'test-value' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-path', customHeaders);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-path', { headers: customHeaders });
      expect(result).toEqual({ data: mockResponse.data });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({
        error: {
          message: 'Network Error',
          code: undefined,
          details: undefined
        }
      });
    });

    it('should handle server errors with response data', async () => {
      const serverError = {
        response: {
          status: 404,
          data: { message: 'Content not found', details: 'Additional info' }
        }
      };
      mockAxiosInstance.get.mockRejectedValue(serverError);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({
        error: {
          message: 'Content not found',
          code: 404,
          details: { message: 'Content not found', details: 'Additional info' }
        }
      });
    });

    it('should handle server errors without response message', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {}
        },
        message: 'Internal Server Error'
      };
      mockAxiosInstance.get.mockRejectedValue(serverError);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({
        error: {
          message: 'Internal Server Error',
          code: 500,
          details: {}
        }
      });
    });

    it('should handle errors with error code', async () => {
      const errorWithCode = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };
      mockAxiosInstance.get.mockRejectedValue(errorWithCode);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({
        error: {
          message: 'Connection refused',
          code: 'ECONNREFUSED',
          details: undefined
        }
      });
    });

    it('should handle unknown errors', async () => {
      const unknownError = {};
      mockAxiosInstance.get.mockRejectedValue(unknownError);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({
        error: {
          message: 'An unknown error occurred',
          code: undefined,
          details: undefined
        }
      });
    });

    it('should throw error when not configured', async () => {
      const unconfiguredClient = new HttpClient();

      await expect(unconfiguredClient.get('/test-path')).rejects.toThrow('HttpClient not configured');
    });

    it('should include error config in details when available', async () => {
      const errorWithConfig = {
        message: 'Request failed',
        config: { url: '/test-path', method: 'GET' }
      };
      mockAxiosInstance.get.mockRejectedValue(errorWithConfig);

      const result = await httpClient.get('/test-path');

      expect(result.error?.details).toEqual({ url: '/test-path', method: 'GET' });
    });
  });

  describe('getAxiosInstance', () => {
    it('should return null when not configured', () => {
      const axiosInstance = httpClient.getAxiosInstance();
      expect(axiosInstance).toBeNull();
    });

    it('should return axios instance when configured', () => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });

      const axiosInstance = httpClient.getAxiosInstance();
      expect(axiosInstance).toBe(mockAxiosInstance);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });

      expect(httpClient.getAxiosInstance()).toBe(mockAxiosInstance);

      httpClient.reset();

      expect(httpClient.getAxiosInstance()).toBeNull();
    });

    it('should allow reconfiguration after reset', () => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });
      httpClient.reset();

      httpClient.configure({
        tenantId: 'new-tenant',
        baseURL: 'https://new-api.com/'
      });

      expect(mockAxiosCreate).toHaveBeenCalledTimes(2);
      expect(mockAxiosCreate).toHaveBeenLastCalledWith({
        baseURL: 'https://new-api.com/'
      });
    });
  });

  describe('error logging', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors to console', async () => {
      const error = new Error('Test error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await httpClient.get('/test-path');

      expect(consoleSpy).toHaveBeenCalledWith('[GrowcadoSDK] Error fetching content:', error);
    });
  });

  describe('response data handling', () => {
    beforeEach(() => {
      httpClient.configure({
        tenantId: 'test-tenant'
      });
    });

    it('should handle empty response data', async () => {
      const mockResponse = { data: null };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({ data: null });
    });

    it('should handle complex response data', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ],
          pagination: {
            page: 1,
            total: 2
          }
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({ data: mockResponse.data });
    });

    it('should handle string response data', async () => {
      const mockResponse = { data: 'Simple string response' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-path');

      expect(result).toEqual({ data: 'Simple string response' });
    });
  });
}); 