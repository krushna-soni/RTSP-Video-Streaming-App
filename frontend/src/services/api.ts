// frontend/src/services/api.ts - ENHANCED VERSION WITH ERROR HANDLING
const API_BASE_URL = 'http://localhost:5000/api';

export interface Overlay {
  _id?: string;
  name: string;
  type: 'text' | 'logo';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

export interface APIError extends Error {
  code?: string;
  status?: number;
  details?: any;
  retryable?: boolean;
}

export interface APIRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: APIError) => boolean;
}

class APIService {
  private abortControllers: Map<string, AbortController> = new Map();
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Default request options
  private defaultOptions: APIRequestOptions = {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    retryCondition: (error: APIError) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        !error.status || // Network error
        error.status >= 500 || // Server error
        error.status === 408 || // Request timeout
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT_ERROR'
      );
    }
  };

  private createAPIError(message: string, status?: number, code?: string, details?: any): APIError {
    const error = new globalThis.Error(message) as APIError;
    error.name = 'APIError';
    error.status = status;
    error.code = code;
    error.details = details;
    error.retryable = this.defaultOptions.retryCondition?.(error) ?? false;
    return error;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createRequestKey(endpoint: string, options: RequestInit = {}): string {
    return `${options.method || 'GET'}-${endpoint}-${JSON.stringify(options.body || '')}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.requestCache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 30000): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async fetchWithTimeout(
    url: string, 
    options: APIRequestOptions = {}
  ): Promise<Response> {
    const { timeout = this.defaultOptions.timeout } = options;
    const controller = new AbortController();
    
    // Store controller for potential cancellation
    const requestKey = this.createRequestKey(url, options);
    this.abortControllers.set(requestKey, controller);

    try {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);
      
      return response;
    } catch (error: any) {
      this.abortControllers.delete(requestKey);
      
      if (error.name === 'AbortError') {
        throw this.createAPIError(
          'Request timed out',
          408,
          'TIMEOUT_ERROR',
          { timeout, url }
        );
      }
      
      throw this.createAPIError(
        'Network error occurred',
        0,
        'NETWORK_ERROR',
        { originalError: error.message, url }
      );
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      retries = this.defaultOptions.retries,
      retryDelay = this.defaultOptions.retryDelay,
      retryCondition = this.defaultOptions.retryCondition,
      ...fetchOptions
    } = { ...this.defaultOptions, ...options };

    const url = `${API_BASE_URL}${endpoint}`;
    const requestKey = this.createRequestKey(endpoint, fetchOptions);

    // Check cache for GET requests
    if ((!fetchOptions.method || fetchOptions.method === 'GET') && !options.cache === false) {
      const cached = this.getFromCache<APIResponse<T>>(requestKey);
      if (cached) {
        console.log(`📋 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    let lastError: APIError | null = null;
    
    for (let attempt = 0; attempt <= retries!; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt + 1}/${retries! + 1}): ${fetchOptions.method || 'GET'} ${url}`);
        
        const response = await this.fetchWithTimeout(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        });

        // Parse response
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { message: text };
        }

        if (!response.ok) {
          const error = this.createAPIError(
            data.error || data.message || `HTTP error! status: ${response.status}`,
            response.status,
            response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
            data
          );

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          throw error;
        }

        // Success - cache GET requests
        if (!fetchOptions.method || fetchOptions.method === 'GET') {
          this.setCache(requestKey, data, 30000); // Cache for 30 seconds
        }

        console.log(`✅ API Success (attempt ${attempt + 1}):`, data);
        return data;

      } catch (error: any) {
        lastError = error instanceof Error && 'code' in error 
          ? error as APIError 
          : this.createAPIError(error.message || 'Unknown error', 0, 'UNKNOWN_ERROR');
        
        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === retries || !retryCondition!(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = retryDelay! * Math.pow(2, attempt);
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries! + 1})`);
        await this.delay(delay);
      }
    }

    console.error('💥 API request failed after all retries:', lastError);
    throw lastError;
  }

  // Public API methods
  async request<T>(
    endpoint: string,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.requestWithRetry<T>(endpoint, options);
  }

  // Cancel specific request
  cancelRequest(endpoint: string, options: RequestInit = {}): void {
    const requestKey = this.createRequestKey(endpoint, options);
    const controller = this.abortControllers.get(requestKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestKey);
      console.log(`🚫 Cancelled request: ${requestKey}`);
    }
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    console.log(`🚫 Cancelling ${this.abortControllers.size} pending requests`);
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Clear cache
  clearCache(): void {
    this.requestCache.clear();
    console.log('🗑️ API cache cleared');
  }

  // Get network status
  async checkConnection(): Promise<boolean> {
    try {
      await this.request('/health', { timeout: 5000, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

class OverlayAPI {
  private apiService = new APIService();

  async getAll(options?: APIRequestOptions): Promise<APIResponse<Overlay[]>> {
    return this.apiService.request<Overlay[]>('/overlays', {
      method: 'GET',
      ...options
    });
  }

  async getById(id: string, options?: APIRequestOptions): Promise<APIResponse<Overlay>> {
    return this.apiService.request<Overlay>(`/overlays/${id}`, {
      method: 'GET',
      ...options
    });
  }

  async create(
    overlay: Omit<Overlay, '_id' | 'created_at' | 'updated_at'>,
    options?: APIRequestOptions
  ): Promise<APIResponse<Overlay>> {
    return this.apiService.request<Overlay>('/overlays', {
      method: 'POST',
      body: JSON.stringify(overlay),
      ...options
    });
  }

  async update(
    id: string,
    updates: Partial<Pick<Overlay, 'name' | 'content' | 'position' | 'size' | 'style' | 'type'>>,
    options?: APIRequestOptions
  ): Promise<APIResponse<Overlay>> {
    return this.apiService.request<Overlay>(`/overlays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      retries: 2, // Fewer retries for updates to avoid conflicts
      ...options
    });
  }

  async delete(id: string, options?: APIRequestOptions): Promise<APIResponse<{ message: string }>> {
    return this.apiService.request<{ message: string }>(`/overlays/${id}`, {
      method: 'DELETE',
      ...options
    });
  }

  // Batch operations
  async createBatch(
    overlays: Array<Omit<Overlay, '_id' | 'created_at' | 'updated_at'>>,
    options?: APIRequestOptions
  ): Promise<APIResponse<Overlay[]>> {
    return this.apiService.request<Overlay[]>('/overlays/batch', {
      method: 'POST',
      body: JSON.stringify({ overlays }),
      timeout: 30000, // Longer timeout for batch operations
      ...options
    });
  }

  async updateBatch(
    updates: Array<{ id: string; data: Partial<Overlay> }>,
    options?: APIRequestOptions
  ): Promise<APIResponse<Overlay[]>> {
    return this.apiService.request<Overlay[]>('/overlays/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
      timeout: 30000,
      ...options
    });
  }

  // Health and utility methods
  async healthCheck(options?: APIRequestOptions): Promise<APIResponse<{ 
    status: string; 
    timestamp: string;
    database?: { status: string; message: string };
  }>> {
    return this.apiService.request<{
      status: string;
      timestamp: string;
      database?: { status: string; message: string };
    }>('/health', {
      method: 'GET',
      timeout: 5000,
      retries: 1,
      ...options
    });
  }

  async testDatabase(options?: APIRequestOptions): Promise<APIResponse<{ 
    status: string;
    overlays_count?: number;
  }>> {
    return this.apiService.request<{
      status: string;
      overlays_count?: number;
    }>('/test-db', {
      method: 'GET',
      timeout: 5000,
      retries: 1,
      ...options
    });
  }

  async initSampleData(options?: APIRequestOptions): Promise<APIResponse<{
    message: string;
    inserted_count: number;
  }>> {
    return this.apiService.request<{
      message: string;
      inserted_count: number;
    }>('/init-sample-data', {
      method: 'POST',
      timeout: 15000,
      ...options
    });
  }

  async cleanupOverlays(options?: APIRequestOptions): Promise<APIResponse<{
    message: string;
    deleted_count: number;
  }>> {
    return this.apiService.request<{
      message: string;
      deleted_count: number;
    }>('/cleanup-overlays', {
      method: 'DELETE',
      timeout: 15000,
      ...options
    });
  }

  // Utility methods
  cancelRequest(endpoint: string, method: string = 'GET'): void {
    this.apiService.cancelRequest(endpoint, { method });
  }

  cancelAllRequests(): void {
    this.apiService.cancelAllRequests();
  }

  clearCache(): void {
    this.apiService.clearCache();
  }

  async checkConnection(): Promise<boolean> {
    return this.apiService.checkConnection();
  }
}

// Export instances
export const overlayAPI = new OverlayAPI();

// Export standalone functions for backward compatibility
export const healthCheck = (options?: APIRequestOptions) => overlayAPI.healthCheck(options);
export const testDatabase = (options?: APIRequestOptions) => overlayAPI.testDatabase(options);

// Network status hook utility
export const createNetworkStatusChecker = () => {
  let intervalId: NodeJS.Timeout | null = null;
  let listeners: Array<(isOnline: boolean) => void> = [];

  const addListener = (listener: (isOnline: boolean) => void) => {
    listeners.push(listener);
  };

  const removeListener = (listener: (isOnline: boolean) => void) => {
    listeners = listeners.filter(l => l !== listener);
  };

  const notifyListeners = (isOnline: boolean) => {
    listeners.forEach(listener => listener(isOnline));
  };

  const startMonitoring = (interval: number = 10000) => {
    if (intervalId) return;

    intervalId = setInterval(async () => {
      const isOnline = await overlayAPI.checkConnection();
      notifyListeners(isOnline);
    }, interval);
  };

  const stopMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    addListener,
    removeListener,
    startMonitoring,
    stopMonitoring
  };
};