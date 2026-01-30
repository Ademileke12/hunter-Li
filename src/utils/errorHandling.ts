/**
 * Error Handling Utilities
 * 
 * Centralized error handling utilities for the application.
 * Provides consistent error handling, user-friendly messages,
 * and error recovery strategies.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.5, 19.6, 19.7
 */

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  STORAGE = 'STORAGE',
  WALLET = 'WALLET',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Custom error class
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  originalError?: Error;
  retryable: boolean;
  timestamp: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    userMessage?: string,
    originalError?: Error,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.originalError = originalError;
    this.retryable = retryable;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network connection error. Please check your internet connection and try again.';
      case ErrorType.API:
        return 'Unable to fetch data. Please try again later.';
      case ErrorType.STORAGE:
        return 'Unable to save data. Your browser storage may be full.';
      case ErrorType.WALLET:
        return 'Wallet connection error. Please check your wallet and try again.';
      case ErrorType.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

// Storage error handling
export class StorageError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      ErrorType.STORAGE,
      ErrorSeverity.WARNING,
      undefined,
      originalError,
      false
    );
    this.name = 'StorageError';
  }
}

// Network error handling
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.ERROR,
      undefined,
      originalError,
      true
    );
    this.name = 'NetworkError';
  }
}

// API error handling
export class APIError extends AppError {
  statusCode?: number;
  endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    originalError?: Error
  ) {
    const retryable = statusCode ? statusCode >= 500 || statusCode === 429 : false;
    super(
      message,
      ErrorType.API,
      ErrorSeverity.ERROR,
      undefined,
      originalError,
      retryable
    );
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

// Wallet error handling
export class WalletError extends AppError {
  code?: string;

  constructor(message: string, code?: string, originalError?: Error) {
    super(
      message,
      ErrorType.WALLET,
      ErrorSeverity.ERROR,
      undefined,
      originalError,
      false
    );
    this.name = 'WalletError';
    this.code = code;
  }
}

// Error handler function
export function handleError(error: unknown, context?: string): AppError {
  // Log error for debugging
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // Convert to AppError if not already
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Detect error type from message
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new NetworkError(error.message, error);
    }

    if (message.includes('storage') || message.includes('quota')) {
      return new StorageError(error.message, error);
    }

    if (message.includes('wallet') || message.includes('signature')) {
      return new WalletError(error.message, undefined, error);
    }

    // Default to generic error
    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.ERROR,
      undefined,
      error,
      false
    );
  }

  // Unknown error type
  return new AppError(
    String(error),
    ErrorType.UNKNOWN,
    ErrorSeverity.ERROR,
    undefined,
    undefined,
    false
  );
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: ErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.API],
};

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;
  let delay = finalConfig.initialDelay;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const appError = handleError(error);
      const isRetryable = appError.retryable || 
        (finalConfig.retryableErrors?.includes(appError.type) ?? false);

      // Don't retry if not retryable or last attempt
      if (!isRetryable || attempt === finalConfig.maxAttempts) {
        throw appError;
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${finalConfig.maxAttempts} after ${delay}ms`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

// Safe storage operations
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from localStorage: ${key}`, error);
      throw new StorageError(`Failed to read from storage: ${key}`, error as Error);
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error);
      
      // Check if quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Storage quota exceeded. Please clear some data.',
          error
        );
      }
      
      throw new StorageError(`Failed to write to storage: ${key}`, error as Error);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
      throw new StorageError(`Failed to remove from storage: ${key}`, error as Error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
      throw new StorageError('Failed to clear storage', error as Error);
    }
  },

  // Get available storage space (if supported)
  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get storage estimate', error);
      return null;
    }
  },
};

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch failed')) {
      return 'Network connection error. Please check your internet connection.';
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Storage errors
    if (message.includes('quota') || message.includes('storage')) {
      return 'Storage is full. Please clear some data and try again.';
    }

    // Wallet errors
    if (message.includes('wallet') || message.includes('signature')) {
      return 'Wallet error. Please check your wallet connection.';
    }

    // User rejected
    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'Transaction was cancelled.';
    }

    // Insufficient balance
    if (message.includes('insufficient') || message.includes('balance')) {
      return 'Insufficient balance to complete this transaction.';
    }

    // Generic error
    return 'An error occurred. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

// Error recovery suggestions
export function getErrorRecoverySuggestions(error: unknown): string[] {
  const suggestions: string[] = [];

  if (error instanceof AppError) {
    if (error.retryable) {
      suggestions.push('Try again in a few moments');
    }

    switch (error.type) {
      case ErrorType.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Refresh the page');
        break;
      case ErrorType.STORAGE:
        suggestions.push('Clear browser cache and data');
        suggestions.push('Free up storage space');
        break;
      case ErrorType.WALLET:
        suggestions.push('Check your wallet is connected');
        suggestions.push('Try reconnecting your wallet');
        break;
      case ErrorType.API:
        suggestions.push('Wait a moment and try again');
        if (error instanceof APIError && error.statusCode === 429) {
          suggestions.push('You may be making too many requests');
        }
        break;
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Refresh the page and try again');
    suggestions.push('Contact support if the problem persists');
  }

  return suggestions;
}
