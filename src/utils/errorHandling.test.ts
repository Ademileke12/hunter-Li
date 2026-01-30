import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  StorageError,
  NetworkError,
  APIError,
  WalletError,
  ErrorType,
  ErrorSeverity,
  handleError,
  retryWithBackoff,
  safeStorage,
  getUserFriendlyErrorMessage,
  getErrorRecoverySuggestions,
} from './errorHandling';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('should create an AppError with custom values', () => {
      const originalError = new Error('Original');
      const error = new AppError(
        'Test error',
        ErrorType.NETWORK,
        ErrorSeverity.CRITICAL,
        'User message',
        originalError,
        true
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.userMessage).toBe('User message');
      expect(error.originalError).toBe(originalError);
      expect(error.retryable).toBe(true);
    });

    it('should provide default user messages for each error type', () => {
      const networkError = new AppError('Test', ErrorType.NETWORK);
      expect(networkError.userMessage).toContain('Network');

      const apiError = new AppError('Test', ErrorType.API);
      expect(apiError.userMessage).toContain('fetch data');

      const storageError = new AppError('Test', ErrorType.STORAGE);
      expect(storageError.userMessage).toContain('save data');

      const walletError = new AppError('Test', ErrorType.WALLET);
      expect(walletError.userMessage).toContain('Wallet');
    });
  });

  describe('StorageError', () => {
    it('should create a StorageError', () => {
      const error = new StorageError('Storage failed');

      expect(error.type).toBe(ErrorType.STORAGE);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.retryable).toBe(false);
    });

    it('should wrap original error', () => {
      const original = new Error('Quota exceeded');
      const error = new StorageError('Storage failed', original);

      expect(error.originalError).toBe(original);
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError', () => {
      const error = new NetworkError('Network failed');

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe('APIError', () => {
    it('should create an APIError with status code', () => {
      const error = new APIError('API failed', 500, '/api/test');

      expect(error.type).toBe(ErrorType.API);
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/api/test');
      expect(error.retryable).toBe(true);
    });

    it('should mark 429 errors as retryable', () => {
      const error = new APIError('Rate limited', 429);
      expect(error.retryable).toBe(true);
    });

    it('should mark 4xx errors as non-retryable', () => {
      const error = new APIError('Not found', 404);
      expect(error.retryable).toBe(false);
    });

    it('should mark 5xx errors as retryable', () => {
      const error = new APIError('Server error', 503);
      expect(error.retryable).toBe(true);
    });
  });

  describe('WalletError', () => {
    it('should create a WalletError with code', () => {
      const error = new WalletError('Wallet failed', 'USER_REJECTED');

      expect(error.type).toBe(ErrorType.WALLET);
      expect(error.code).toBe('USER_REJECTED');
      expect(error.retryable).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is', () => {
      const appError = new AppError('Test');
      const result = handleError(appError);

      expect(result).toBe(appError);
    });

    it('should convert network errors', () => {
      const error = new Error('Network request failed');
      const result = handleError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.type).toBe(ErrorType.NETWORK);
    });

    it('should convert storage errors', () => {
      const error = new Error('Storage quota exceeded');
      const result = handleError(error);

      expect(result).toBeInstanceOf(StorageError);
      expect(result.type).toBe(ErrorType.STORAGE);
    });

    it('should convert wallet errors', () => {
      const error = new Error('Wallet signature failed');
      const result = handleError(error);

      expect(result).toBeInstanceOf(WalletError);
      expect(result.type).toBe(ErrorType.WALLET);
    });

    it('should handle unknown errors', () => {
      const result = handleError('Unknown error');

      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should log errors with context', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      handleError(new Error('Test'), 'test context');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('test context'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Network failed'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn);

      // Fast-forward through retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Failed 1'))
        .mockRejectedValueOnce(new NetworkError('Failed 2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { initialDelay: 100 });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      
      // Second retry after 200ms (exponential)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new NetworkError('Always fails'));

      const promise = retryWithBackoff(fn, { maxAttempts: 2 });

      try {
        await vi.advanceTimersByTimeAsync(5000);
        await promise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(fn).toHaveBeenCalledTimes(2);
        expect(error).toBeInstanceOf(NetworkError);
      }
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new WalletError('User rejected'));

      try {
        await retryWithBackoff(fn);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(fn).toHaveBeenCalledTimes(1);
        expect(error).toBeInstanceOf(WalletError);
      }
    });

    it('should respect max delay', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Failed 1'))
        .mockRejectedValueOnce(new NetworkError('Failed 2'))
        .mockRejectedValueOnce(new NetworkError('Failed 3'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, {
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 10,
      });

      // Delays should be: 1000, 2000 (capped), 2000 (capped)
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('safeStorage', () => {
    it('should get item from localStorage', () => {
      localStorage.setItem('test', 'value');

      const result = safeStorage.getItem('test');

      expect(result).toBe('value');
    });

    it('should set item in localStorage', () => {
      safeStorage.setItem('test', 'value');

      expect(localStorage.getItem('test')).toBe('value');
    });

    it('should remove item from localStorage', () => {
      localStorage.setItem('test', 'value');

      safeStorage.removeItem('test');

      expect(localStorage.getItem('test')).toBeNull();
    });

    it('should clear localStorage', () => {
      localStorage.setItem('test1', 'value1');
      localStorage.setItem('test2', 'value2');

      safeStorage.clear();

      expect(localStorage.getItem('test1')).toBeNull();
      expect(localStorage.getItem('test2')).toBeNull();
    });

    it('should throw StorageError on getItem failure', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => safeStorage.getItem('test')).toThrow(StorageError);

      localStorage.getItem = originalGetItem;
    });

    it('should throw StorageError on setItem failure', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => safeStorage.setItem('test', 'value')).toThrow(StorageError);

      localStorage.setItem = originalSetItem;
    });

    it('should throw specific error for quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      try {
        safeStorage.setItem('test', 'value');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).message).toContain('quota');
      }

      localStorage.setItem = originalSetItem;
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return AppError user message', () => {
      const error = new AppError('Test', ErrorType.NETWORK, ErrorSeverity.ERROR, 'Custom message');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Custom message');
    });

    it('should handle network errors', () => {
      const error = new Error('Network request failed');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('Network');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('timed out');
    });

    it('should handle rate limit errors', () => {
      const error = new Error('Rate limit exceeded');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('Too many requests');
    });

    it('should handle storage errors', () => {
      const error = new Error('Storage quota exceeded');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('Storage');
    });

    it('should handle wallet errors', () => {
      const error = new Error('Wallet signature failed');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('Wallet');
    });

    it('should handle user rejection', () => {
      const error = new Error('User rejected transaction');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('cancelled');
    });

    it('should handle insufficient balance', () => {
      const error = new Error('Insufficient balance');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('Insufficient balance');
    });

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Unknown error');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toContain('error occurred');
    });
  });

  describe('getErrorRecoverySuggestions', () => {
    it('should suggest retry for retryable errors', () => {
      const error = new NetworkError('Network failed');

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions).toContain('Try again in a few moments');
    });

    it('should provide network-specific suggestions', () => {
      const error = new NetworkError('Network failed');

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.some(s => s.includes('internet connection'))).toBe(true);
    });

    it('should provide storage-specific suggestions', () => {
      const error = new StorageError('Storage full');

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.some(s => s.includes('storage'))).toBe(true);
    });

    it('should provide wallet-specific suggestions', () => {
      const error = new WalletError('Wallet error');

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.some(s => s.includes('wallet'))).toBe(true);
    });

    it('should provide API-specific suggestions', () => {
      const error = new APIError('API error', 500);

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.some(s => s.includes('try again'))).toBe(true);
    });

    it('should provide rate limit suggestions for 429 errors', () => {
      const error = new APIError('Rate limited', 429);

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.some(s => s.includes('too many requests'))).toBe(true);
    });

    it('should provide default suggestions for unknown errors', () => {
      const error = new Error('Unknown');

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('Refresh'))).toBe(true);
    });
  });
});
