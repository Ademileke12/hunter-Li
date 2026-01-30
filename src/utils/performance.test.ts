import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  rafThrottle,
  debounceLeading,
  batch,
  memoize,
  PERFORMANCE_TIMINGS,
} from './performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('debounceLeading', () => {
    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const debounced = debounceLeading(fn, 100);

      debounced();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should debounce subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounceLeading(fn, 100);

      debounced();
      expect(fn).toHaveBeenCalledTimes(1);

      debounced();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('batch', () => {
    it('should collect multiple calls into single batch', () => {
      const fn = vi.fn();
      const batched = batch(fn, 100);

      batched('item1');
      batched('item2');
      batched('item3');

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('should reset batch after execution', () => {
      const fn = vi.fn();
      const batched = batch(fn, 100);

      batched('item1');
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith(['item1']);

      batched('item2');
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith(['item2']);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      const result1 = memoized(1, 2);
      const result2 = memoized(1, 2);

      expect(result1).toBe(3);
      expect(result2).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call function for different arguments', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      memoized(1, 2);
      memoized(2, 3);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should support custom key generator', () => {
      const fn = vi.fn((obj: { a: number; b: number }) => obj.a + obj.b);
      const memoized = memoize(fn, (obj) => `${obj.a}-${obj.b}`);

      memoized({ a: 1, b: 2 });
      memoized({ a: 1, b: 2 });

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('PERFORMANCE_TIMINGS', () => {
    it('should have correct timing constants', () => {
      expect(PERFORMANCE_TIMINGS.CANVAS_UPDATE).toBe(16);
      expect(PERFORMANCE_TIMINGS.INPUT_DEBOUNCE).toBe(300);
      expect(PERFORMANCE_TIMINGS.SEARCH_DEBOUNCE).toBe(500);
      expect(PERFORMANCE_TIMINGS.AUTO_SAVE).toBe(500);
      expect(PERFORMANCE_TIMINGS.API_THROTTLE).toBe(1000);
      expect(PERFORMANCE_TIMINGS.SCROLL_THROTTLE).toBe(100);
      expect(PERFORMANCE_TIMINGS.RESIZE_DEBOUNCE).toBe(200);
    });
  });
});
