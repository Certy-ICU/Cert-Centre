/**
 * API Utilities for PWA
 * 
 * This module provides utilities for making API calls with offline support
 * and handling offline error states gracefully.
 */

// Define error types
export enum ApiErrorType {
  NETWORK = 'network',
  OFFLINE = 'offline',
  SERVER = 'server',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

// API error structure
export interface ApiError {
  type: ApiErrorType;
  status?: number;
  message: string;
  data?: any;
}

/**
 * Check if the browser is offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Safely make API requests with offline handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    offlineMessage?: string;
    offlineFallback?: T | (() => T | Promise<T>);
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const {
    offlineMessage = 'You are offline. This action will be completed when you reconnect.',
    offlineFallback,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  // Check if offline before making the call
  if (isOffline()) {
    if (offlineFallback) {
      return typeof offlineFallback === 'function'
        ? (offlineFallback as () => T | Promise<T>)()
        : offlineFallback;
    }
    
    throw {
      type: ApiErrorType.OFFLINE,
      message: offlineMessage,
    } as ApiError;
  }

  // Try to make the API call
  let lastError: any;
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if we're offline
      if (isOffline()) {
        throw {
          type: ApiErrorType.OFFLINE,
          message: offlineMessage,
          data: error,
        } as ApiError;
      }
      
      // Don't retry if it's not a network error
      if (error.status && error.status !== 0 && error.status !== 408 && error.status !== 429) {
        throw formatApiError(error);
      }
      
      // Wait before retrying
      if (i < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }
  
  // If we get here, all retries failed
  throw formatApiError(lastError);
}

/**
 * Format API errors into a consistent structure
 */
export function formatApiError(error: any): ApiError {
  // Already formatted
  if (error.type && Object.values(ApiErrorType).includes(error.type)) {
    return error as ApiError;
  }
  
  // Network or offline error
  if (!navigator.onLine) {
    return {
      type: ApiErrorType.OFFLINE,
      message: 'You are offline. Please check your connection and try again.',
      data: error,
    };
  }
  
  if (!error.status || error.status === 0) {
    return {
      type: ApiErrorType.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      data: error,
    };
  }
  
  // Auth errors
  if (error.status === 401 || error.status === 403) {
    return {
      type: ApiErrorType.AUTH,
      status: error.status,
      message: error.status === 401 
        ? 'You need to sign in to access this resource.' 
        : 'You do not have permission to access this resource.',
      data: error,
    };
  }
  
  // Validation errors
  if (error.status === 400 || error.status === 422) {
    return {
      type: ApiErrorType.VALIDATION,
      status: error.status,
      message: error.message || 'Validation error. Please check your inputs.',
      data: error,
    };
  }
  
  // Server errors
  if (error.status >= 500) {
    return {
      type: ApiErrorType.SERVER,
      status: error.status,
      message: 'Server error. Please try again later.',
      data: error,
    };
  }
  
  // Unknown errors
  return {
    type: ApiErrorType.UNKNOWN,
    status: error.status,
    message: error.message || 'An unexpected error occurred.',
    data: error,
  };
}

/**
 * Helper function for making fetch requests with offline support
 */
export async function fetchWithOfflineSupport<T>(
  url: string,
  options: RequestInit = {},
  apiOptions: Parameters<typeof safeApiCall>[1] = {}
): Promise<T> {
  return safeApiCall(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error: any = new Error(`HTTP error ${response.status}`);
        error.status = response.status;
        
        try {
          error.data = await response.json();
          error.message = error.data.message || error.message;
        } catch {
          // If we can't parse the JSON, just use the response text
          error.data = await response.text();
        }
        
        throw error;
      }
      
      return await response.json();
    },
    apiOptions
  );
} 