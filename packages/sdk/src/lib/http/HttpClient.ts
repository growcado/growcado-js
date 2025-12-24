import axios, { AxiosInstance } from 'axios';
import type { IHttpClient, SDKConfig, GrowcadoResponse } from '../core/types.js';

export class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance | null = null;
  private config: SDKConfig | null = null;

  configure(config: SDKConfig): void {
    this.config = config;
    
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: config.baseURL || 'https://api.growcado.io/',
    });
  }

  async get<T>(path: string, headers?: Record<string, string>): Promise<GrowcadoResponse<T>> {
    if (!this.axiosInstance || !this.config) {
      throw new Error('HttpClient not configured. Call configure() first.');
    }

    try {
      const response = await this.axiosInstance.get(path, 
        headers ? { headers } : undefined
      );

      return { data: response.data };
    } catch (error: unknown) {
      console.error('[GrowcadoSDK] Error fetching content:', error);
      
      const errorResponse = error as { 
        response?: { 
          data?: { message?: string; [key: string]: unknown }; 
          status?: number; 
        }; 
        message?: string;
        code?: string | number;
        config?: unknown;
      };
      
      return {
        error: {
          message: errorResponse.response?.data?.message || errorResponse.message || 'An unknown error occurred',
          code: errorResponse.response?.status || errorResponse.code,
          details: errorResponse.response?.data || errorResponse.config,
        }
      };
    }
  }

  getAxiosInstance(): AxiosInstance | null {
    return this.axiosInstance;
  }

  reset(): void {
    this.axiosInstance = null;
    this.config = null;
  }
} 