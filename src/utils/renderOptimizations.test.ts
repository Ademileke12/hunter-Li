import { describe, it, expect } from 'vitest';
import {
  deepEqual,
  shallowEqual,
  areWidgetPropsEqual,
  calculateVirtualScroll,
  calculateHolderConcentration,
  formatNumber,
  shouldComponentUpdate,
} from './renderOptimizations';
import type { WidgetInstance } from '../types';

describe('Rendering Optimizations', () => {
  describe('deepEqual', () => {
    it('should return true for equal primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('test', 'test')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('test', 'other')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 3 } };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should not check nested objects deeply', () => {
      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 1 } };
      expect(shallowEqual(obj1, obj2)).toBe(false); // Different references
    });
  });

  describe('areWidgetPropsEqual', () => {
    const baseWidget: WidgetInstance = {
      id: 'widget-1',
      type: 'dexscreener',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      zIndex: 1,
      config: { tokenAddress: 'abc123' },
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should return true for identical widgets', () => {
      const result = areWidgetPropsEqual(
        { instance: baseWidget },
        { instance: baseWidget }
      );
      expect(result).toBe(true);
    });

    it('should return false when position changes', () => {
      const modified = { ...baseWidget, position: { x: 200, y: 100 } };
      const result = areWidgetPropsEqual(
        { instance: baseWidget },
        { instance: modified }
      );
      expect(result).toBe(false);
    });

    it('should return false when size changes', () => {
      const modified = { ...baseWidget, size: { width: 500, height: 300 } };
      const result = areWidgetPropsEqual(
        { instance: baseWidget },
        { instance: modified }
      );
      expect(result).toBe(false);
    });

    it('should return false when config changes', () => {
      const modified = { ...baseWidget, config: { tokenAddress: 'xyz789' } };
      const result = areWidgetPropsEqual(
        { instance: baseWidget },
        { instance: modified }
      );
      expect(result).toBe(false);
    });

    it('should return false when updatedAt changes', () => {
      const modified = { ...baseWidget, updatedAt: Date.now() + 1000 };
      const result = areWidgetPropsEqual(
        { instance: baseWidget },
        { instance: modified }
      );
      expect(result).toBe(false);
    });
  });

  describe('calculateVirtualScroll', () => {
    it('should calculate visible range correctly', () => {
      const result = calculateVirtualScroll(0, 100, {
        itemHeight: 50,
        containerHeight: 400,
      });

      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBeGreaterThan(0);
      expect(result.offsetY).toBe(0);
      expect(result.totalHeight).toBe(5000); // 100 items * 50px
    });

    it('should handle scrolled position', () => {
      const result = calculateVirtualScroll(500, 100, {
        itemHeight: 50,
        containerHeight: 400,
      });

      expect(result.startIndex).toBeGreaterThan(0);
      expect(result.offsetY).toBeGreaterThan(0);
    });

    it('should respect overscan', () => {
      const result = calculateVirtualScroll(0, 100, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 5,
      });

      // Should render more items due to overscan
      const itemCount = result.endIndex - result.startIndex + 1;
      expect(itemCount).toBeGreaterThan(8); // 400/50 = 8 visible items
    });
  });

  describe('calculateHolderConcentration', () => {
    it('should calculate top 10 holder percentage', () => {
      const holders = [
        { percentage: 10 },
        { percentage: 8 },
        { percentage: 6 },
        { percentage: 5 },
        { percentage: 4 },
        { percentage: 3 },
        { percentage: 2 },
        { percentage: 2 },
        { percentage: 1 },
        { percentage: 1 },
        { percentage: 0.5 }, // Should not be included
      ];

      const result = calculateHolderConcentration(holders);
      expect(result).toBe(42); // Sum of first 10
    });

    it('should handle fewer than 10 holders', () => {
      const holders = [
        { percentage: 50 },
        { percentage: 30 },
        { percentage: 20 },
      ];

      const result = calculateHolderConcentration(holders);
      expect(result).toBe(100);
    });
  });

  describe('formatNumber', () => {
    it('should format billions', () => {
      expect(formatNumber(1_500_000_000)).toBe('1.50B');
      expect(formatNumber(2_000_000_000, 1)).toBe('2.0B');
    });

    it('should format millions', () => {
      expect(formatNumber(1_500_000)).toBe('1.50M');
      expect(formatNumber(2_000_000, 1)).toBe('2.0M');
    });

    it('should format thousands', () => {
      expect(formatNumber(1_500)).toBe('1.50K');
      expect(formatNumber(2_000, 1)).toBe('2.0K');
    });

    it('should format small numbers', () => {
      expect(formatNumber(123.456)).toBe('123.46');
      expect(formatNumber(123.456, 1)).toBe('123.5');
    });

    it('should cache results', () => {
      const result1 = formatNumber(1_000_000);
      const result2 = formatNumber(1_000_000);
      expect(result1).toBe(result2);
    });
  });

  describe('shouldComponentUpdate', () => {
    it('should return false when no keys change', () => {
      const prev = { a: 1, b: 2, c: 3 };
      const next = { a: 1, b: 2, c: 4 };
      const result = shouldComponentUpdate(prev, next, ['a', 'b']);
      expect(result).toBe(false);
    });

    it('should return true when any key changes', () => {
      const prev = { a: 1, b: 2, c: 3 };
      const next = { a: 1, b: 3, c: 3 };
      const result = shouldComponentUpdate(prev, next, ['a', 'b']);
      expect(result).toBe(true);
    });
  });
});
