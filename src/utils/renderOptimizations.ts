/**
 * Rendering Optimization Utilities
 * 
 * Provides utilities for optimizing React component rendering:
 * - Memoization helpers
 * - Comparison functions for React.memo
 * - Virtual scrolling utilities
 * 
 * Requirements: 18.7
 */

import type { WidgetInstance } from '../types';

/**
 * Deep equality check for objects
 * Used in React.memo comparison functions
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Shallow equality check for objects
 * Faster than deep equality, use when possible
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * Widget instance comparison function for React.memo
 * Only re-renders if widget instance properties change
 */
export function areWidgetPropsEqual(
  prevProps: { instance: WidgetInstance },
  nextProps: { instance: WidgetInstance }
): boolean {
  const prev = prevProps.instance;
  const next = nextProps.instance;
  
  // Check primitive properties
  if (
    prev.id !== next.id ||
    prev.type !== next.type ||
    prev.zIndex !== next.zIndex ||
    prev.updatedAt !== next.updatedAt
  ) {
    return false;
  }
  
  // Check position
  if (prev.position.x !== next.position.x || prev.position.y !== next.position.y) {
    return false;
  }
  
  // Check size
  if (prev.size.width !== next.size.width || prev.size.height !== next.size.height) {
    return false;
  }
  
  // Check config (shallow comparison)
  if (!shallowEqual(prev.config, next.config)) {
    return false;
  }
  
  // Check state (shallow comparison)
  if (!shallowEqual(prev.state, next.state)) {
    return false;
  }
  
  return true;
}

/**
 * Virtual scrolling utilities
 */

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

/**
 * Calculate which items should be rendered in a virtual scroll list
 * 
 * @param scrollTop - Current scroll position
 * @param totalItems - Total number of items in list
 * @param options - Virtual scroll configuration
 * @returns Indices and offsets for rendering
 */
export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
  
  // Calculate offset for positioning
  const offsetY = startIndex * itemHeight;
  
  // Calculate total height for scrollbar
  const totalHeight = totalItems * itemHeight;
  
  return {
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
  };
}

/**
 * Memoized calculation utilities
 */

/**
 * Memoize risk score calculation
 * Caches results based on input parameters
 */
export function memoizeRiskScore() {
  const cache = new Map<string, number>();
  
  return (lpPercent: number, top10Percent: number, deployerActive: boolean): number => {
    const key = `${lpPercent}-${top10Percent}-${deployerActive}`;
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    let score = 0;
    
    // LP percentage risk
    if (lpPercent < 50) {
      score += 50 - lpPercent;
    }
    
    // Holder concentration risk
    if (top10Percent > 50) {
      score += top10Percent - 50;
    }
    
    // Deployer activity risk
    if (deployerActive) {
      score += 30;
    }
    
    cache.set(key, score);
    return score;
  };
}

/**
 * Memoize holder concentration calculation
 */
export function calculateHolderConcentration(holders: Array<{ percentage: number }>): number {
  return holders.slice(0, 10).reduce((sum, holder) => sum + holder.percentage, 0);
}

/**
 * Memoize number formatting
 */
const numberFormatCache = new Map<string, string>();

export function formatNumber(num: number, decimals: number = 2): string {
  const key = `${num}-${decimals}`;
  
  if (numberFormatCache.has(key)) {
    return numberFormatCache.get(key)!;
  }
  
  let formatted: string;
  
  if (num >= 1_000_000_000) {
    formatted = `${(num / 1_000_000_000).toFixed(decimals)}B`;
  } else if (num >= 1_000_000) {
    formatted = `${(num / 1_000_000).toFixed(decimals)}M`;
  } else if (num >= 1_000) {
    formatted = `${(num / 1_000).toFixed(decimals)}K`;
  } else {
    formatted = num.toFixed(decimals);
  }
  
  numberFormatCache.set(key, formatted);
  return formatted;
}

/**
 * Clear memoization caches
 * Call this periodically to prevent memory leaks
 */
export function clearMemoizationCaches(): void {
  numberFormatCache.clear();
}

/**
 * React rendering optimization helpers
 */

/**
 * Check if component should update based on props
 * Use with React.memo for fine-grained control
 */
export function shouldComponentUpdate<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keys: (keyof T)[]
): boolean {
  for (const key of keys) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}

/**
 * Batch DOM updates using requestAnimationFrame
 * Useful for updating multiple elements efficiently
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Intersection Observer for lazy rendering
 * Only render components when they're visible in viewport
 */
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.01, // Trigger when 1% visible
      ...options,
    }
  );
}
