import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useCanvasStore } from './canvasStore';
import type { WidgetType, Position } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Canvas Store - Widget Duplication Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    const store = useCanvasStore.getState();
    store.loadWorkspace('en');
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Property 13: Widget Duplication', () => {
    it('should create a new widget instance with same type and configuration but different unique ID', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 13: Widget Duplication
       * 
       * For any widget instance with configuration, duplicating the widget should
       * create a new widget instance with the same type and configuration but a
       * different unique ID.
       * 
       * **Validates: Requirements 4.5**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'risk-flags',
        'pnl-tracker'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: -1000, max: 1000 }),
        y: fc.integer({ min: -1000, max: 1000 }),
      });

      const configGen = fc.record({
        tokenAddress: fc.option(fc.hexaString({ minLength: 32, maxLength: 44 }), { nil: undefined }),
        slippage: fc.option(fc.double({ min: 0.1, max: 5.0, noNaN: true }), { nil: undefined }),
        refreshInterval: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
        customSetting: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, configGen, (widgetType, position, config) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget with configuration
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          expect(widgets.length).toBe(1);
          const originalWidget = widgets[0];

          // Update widget configuration
          store.updateWidget(originalWidget.id, { config });

          // Get updated widget
          const updatedWidgets = useCanvasStore.getState().widgets;
          const widgetWithConfig = updatedWidgets[0];

          // Duplicate the widget
          store.duplicateWidget(widgetWithConfig.id);

          // Get all widgets after duplication
          const finalWidgets = useCanvasStore.getState().widgets;

          // Verify we now have 2 widgets
          expect(finalWidgets.length).toBe(2);

          // Find original and duplicate
          const original = finalWidgets.find((w) => w.id === widgetWithConfig.id);
          const duplicate = finalWidgets.find((w) => w.id !== widgetWithConfig.id);

          expect(original).toBeDefined();
          expect(duplicate).toBeDefined();

          // Verify IDs are different
          expect(duplicate!.id).not.toBe(original!.id);

          // Verify type is the same
          expect(duplicate!.type).toBe(original!.type);
          expect(duplicate!.type).toBe(widgetType);

          // Verify configuration is copied
          expect(duplicate!.config).toEqual(original!.config);

          // Verify size is the same
          expect(duplicate!.size).toEqual(original!.size);
        }),
        { numRuns: 100 }
      );
    });

    it('should duplicate widget with state preservation', () => {
      /**
       * Property 13 Extension: State Preservation During Duplication
       * 
       * When duplicating a widget with state, the duplicate should have
       * a copy of the state, not a reference to the same state object.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('notes', 'pnl-tracker', 'checklist');

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      const stateGen = fc.record({
        content: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
        items: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }), { nil: undefined }),
        lastModified: fc.option(fc.integer({ min: 1000000000000, max: 9999999999999 }), { nil: undefined }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, stateGen, (widgetType, position, state) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const originalWidget = widgets[0];

          // Update widget state
          store.updateWidget(originalWidget.id, { state });

          // Duplicate the widget
          store.duplicateWidget(originalWidget.id);

          // Get all widgets after duplication
          const finalWidgets = useCanvasStore.getState().widgets;
          expect(finalWidgets.length).toBe(2);

          const original = finalWidgets.find((w) => w.id === originalWidget.id);
          const duplicate = finalWidgets.find((w) => w.id !== originalWidget.id);

          // Verify state is copied
          expect(duplicate!.state).toEqual(original!.state);

          // Verify it's a deep copy, not a reference
          // (modifying one shouldn't affect the other)
          if (duplicate!.state && typeof duplicate!.state === 'object') {
            expect(duplicate!.state).not.toBe(original!.state);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should position duplicate widget offset from original', () => {
      /**
       * Property 13 Extension: Position Offset
       * 
       * Duplicated widgets should be positioned with an offset from the
       * original to make them visible and distinguishable.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'token-overview', 'birdeye');

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, (widgetType, position) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const originalWidget = widgets[0];

          // Duplicate the widget
          store.duplicateWidget(originalWidget.id);

          // Get all widgets after duplication
          const finalWidgets = useCanvasStore.getState().widgets;
          const duplicate = finalWidgets.find((w) => w.id !== originalWidget.id);

          // Verify position is offset (not the same)
          expect(duplicate!.position).not.toEqual(originalWidget.position);

          // Verify the offset is reasonable (typically 20px in both directions)
          const xOffset = Math.abs(duplicate!.position.x - originalWidget.position.x);
          const yOffset = Math.abs(duplicate!.position.y - originalWidget.position.y);

          expect(xOffset).toBeGreaterThan(0);
          expect(yOffset).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should assign higher z-index to duplicate widget', () => {
      /**
       * Property 13 Extension: Z-Index Ordering
       * 
       * Duplicated widgets should have a higher z-index than the original
       * to appear on top of the original widget.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, (widgetType, position) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const originalWidget = widgets[0];
          const originalZIndex = originalWidget.zIndex;

          // Duplicate the widget
          store.duplicateWidget(originalWidget.id);

          // Get all widgets after duplication
          const finalWidgets = useCanvasStore.getState().widgets;
          const duplicate = finalWidgets.find((w) => w.id !== originalWidget.id);

          // Verify duplicate has higher z-index
          expect(duplicate!.zIndex).toBeGreaterThan(originalZIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple duplications correctly', () => {
      /**
       * Property 13 Extension: Multiple Duplications
       * 
       * Duplicating a widget multiple times should create multiple
       * independent copies, each with unique IDs.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      const duplicateCountGen = fc.integer({ min: 1, max: 5 });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, duplicateCountGen, (widgetType, position, duplicateCount) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add original widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const originalWidget = widgets[0];

          // Duplicate multiple times
          for (let i = 0; i < duplicateCount; i++) {
            store.duplicateWidget(originalWidget.id);
          }

          // Get all widgets after duplications
          const finalWidgets = useCanvasStore.getState().widgets;

          // Verify we have original + duplicates
          expect(finalWidgets.length).toBe(1 + duplicateCount);

          // Verify all widgets have unique IDs
          const ids = finalWidgets.map((w) => w.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Verify all widgets have the same type
          finalWidgets.forEach((widget) => {
            expect(widget.type).toBe(widgetType);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('should handle duplication of non-existent widget gracefully', () => {
      /**
       * Property 13 Edge Case: Non-Existent Widget
       * 
       * Attempting to duplicate a non-existent widget should not crash
       * and should not modify the workspace.
       */

      const nonExistentIdGen = fc.uuid();

      fc.assert(
        fc.property(nonExistentIdGen, (nonExistentId) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add a widget
          store.addWidget('swap');

          const widgetsBefore = useCanvasStore.getState().widgets;
          const countBefore = widgetsBefore.length;

          // Try to duplicate non-existent widget
          store.duplicateWidget(nonExistentId);

          // Verify workspace unchanged
          const widgetsAfter = useCanvasStore.getState().widgets;
          expect(widgetsAfter.length).toBe(countBefore);
        }),
        { numRuns: 50 }
      );
    });
  });
});
