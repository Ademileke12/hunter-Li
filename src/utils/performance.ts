/**
 * Performance Utilities
 * 
 * Provides debouncing and throttling utilities for optimizing
 * expensive operations like canvas updates and API calls.
 * 
 * Requirements: 18.4, 18.5, 18.6
 */

/**
 * Debounce function
 * Delays execution until after a specified wait time has elapsed
 * since the last time it was invoked.
 * 
 * Use for: Input handlers, resize events, API calls
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Ensures a function is called at most once per specified time period.
 * 
 * Use for: Scroll handlers, mouse move events, canvas updates
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}

/**
 * Request Animation Frame throttle
 * Throttles function execution to browser's animation frame rate (~16ms)
 * 
 * Use for: Canvas rendering, smooth animations
 * 
 * @param func - Function to throttle
 * @returns RAF-throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Debounce with leading edge
 * Executes immediately on first call, then debounces subsequent calls
 * 
 * Use for: Button clicks that trigger API calls
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function with leading edge
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    const later = () => {
      timeout = null;
      lastCallTime = Date.now();
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    // Execute immediately if enough time has passed
    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      func(...args);
    } else {
      // Otherwise, schedule for later
      timeout = setTimeout(later, wait - timeSinceLastCall);
    }
  };
}

/**
 * Batch updates
 * Collects multiple calls and executes them in a single batch
 * 
 * Use for: Multiple state updates, bulk API operations
 * 
 * @param func - Function to batch
 * @param wait - Wait time in milliseconds
 * @returns Batched function
 */
export function batch<T>(
  func: (items: T[]) => void,
  wait: number
): (item: T) => void {
  let items: T[] = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(item: T) {
    items.push(item);

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(items);
      items = [];
      timeout = null;
    }, wait);
  };
}

/**
 * Memoize function results
 * Caches function results based on arguments
 * 
 * Use for: Expensive calculations, data transformations
 * 
 * @param func - Function to memoize
 * @param keyGenerator - Optional custom key generator
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance timing constants
 */
export const PERFORMANCE_TIMINGS = {
  // Canvas updates (60fps = 16.67ms per frame)
  CANVAS_UPDATE: 16, // ms
  
  // Input debouncing
  INPUT_DEBOUNCE: 300, // ms
  SEARCH_DEBOUNCE: 500, // ms
  
  // Auto-save debouncing
  AUTO_SAVE: 500, // ms
  
  // API throttling
  API_THROTTLE: 1000, // ms
  
  // Scroll throttling
  SCROLL_THROTTLE: 100, // ms
  
  // Resize debouncing
  RESIZE_DEBOUNCE: 200, // ms
};
