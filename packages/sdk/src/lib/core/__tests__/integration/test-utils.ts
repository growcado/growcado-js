import { vi, Mock } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { GrowcadoSDK } from '../../GrowcadoSDK';

// Mock axios at module level
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn()
    }
  };
});

export interface MockAxiosInstance {
  get: Mock;
  interceptors: {
    request: {
      use: Mock;
    };
  };
}

export interface TestMocks {
  mockAxiosInstance: MockAxiosInstance;
  mockAxiosCreate: Mock;
  localStorageMock: {
    getItem: Mock;
    setItem: Mock;
    removeItem: Mock;
    clear: Mock;
  };
  windowMock: {
    location: {
      search: string;
      href: string;
    };
  };
  documentMock: {
    referrer: string;
  };
}

// Create localStorage mock
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
};

// Create window mock
export const createWindowMock = () => ({
  location: {
    search: '',
    href: 'https://example.com'
  }
});

// Create document mock
export const createDocumentMock = () => ({
  referrer: ''
});

export const setupTestMocks = (): TestMocks => {
  const localStorageMock = createLocalStorageMock();
  const windowMock = createWindowMock();
  const documentMock = createDocumentMock();

  // Create fresh mock axios instance for each test
  const mockAxiosInstance: MockAxiosInstance = {
    get: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn()
      }
    }
  };
  
  // Get the mocked axios.create and configure it to return our mock instance
  const mockAxiosCreate = vi.mocked(axios.create);
  // Clear any previous mock calls and setup new return value
  mockAxiosCreate.mockClear();
  // Use type casting to satisfy TypeScript while keeping our minimal mock interface
  mockAxiosCreate.mockReturnValue(mockAxiosInstance as unknown as AxiosInstance);

  // Setup global mocks
  Object.defineProperty(global, 'window', {
    value: windowMock,
    writable: true
  });
  Object.defineProperty(global, 'document', {
    value: documentMock,
    writable: true
  });
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  return {
    mockAxiosInstance,
    mockAxiosCreate,
    localStorageMock,
    windowMock,
    documentMock
  };
};

export const resetTestEnvironment = () => {
  // Reset SDK state before each test
  GrowcadoSDK.reset();
  
  // Reset all mocks but preserve the mock implementation
  vi.clearAllMocks();
};

export const getRequestInterceptor = (mockAxiosInstance: MockAxiosInstance) => {
  if (!mockAxiosInstance.interceptors.request.use.mock.calls[0]) {
    throw new Error('Request interceptor not set up. Make sure SDK is configured first.');
  }
  return mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
}; 