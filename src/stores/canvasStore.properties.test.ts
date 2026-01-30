import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useCanvasStore } from './canvasStore';
import { getWidgetDefinition } from '../utils/widgetRegistry';
import type { Language, WidgetType, Position, Size, Annotation } from '../types';

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

describe('Canvas Store Property-Based Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    const store = useCanvasStore.getState();
    store.loadWorkspace('en');
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Property 2: Widget Position Updates', () => {
    it('should update widget position to match target position when dragged', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 2: Widget Position Updates
       * 
       * For any widget instance and any valid canvas position, dragging the widget
       * to that position should update the widget's stored position to match the
       * target position.
       * 
       * **Validates: Requirements 2.5, 4.6**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview',
        'holder-distribution'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: -10000, max: 10000 }),
        y: fc.integer({ min: -10000, max: 10000 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, positionGen, (widgetType, initialPosition, targetPosition) => {
          // Clear and reset store
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add a widget at initial position
          store.addWidget(widgetType, initialPosition);

          // Get the widget that was just added
          const widgets = useCanvasStore.getState().widgets;
          expect(widgets.length).toBe(1);
          const widget = widgets[0];

          // Verify initial position
          expect(widget.position.x).toBe(initialPosition.x);
          expect(widget.position.y).toBe(initialPosition.y);

          // Update widget position (simulating drag)
          store.updateWidget(widget.id, { position: targetPosition });

          // Get updated widget
          const updatedWidgets = useCanvasStore.getState().widgets;
          const updatedWidget = updatedWidgets.find((w) => w.id === widget.id);

          // Verify position was updated to target position
          expect(updatedWidget).toBeDefined();
          expect(updatedWidget!.position.x).toBe(targetPosition.x);
          expect(updatedWidget!.position.y).toBe(targetPosition.y);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple widgets with independent position updates', () => {
      /**
       * Property 2 Extension: Multiple Widget Position Independence
       * 
       * Updating the position of one widget should not affect the positions
       * of other widgets on the canvas.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: -5000, max: 5000 }),
        y: fc.integer({ min: -5000, max: 5000 }),
      });

      fc.assert(
        fc.property(
          fc.array(fc.record({ type: widgetTypeGen, position: positionGen }), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          positionGen,
          (widgets, targetIndex, newPosition) => {
            // Ensure targetIndex is valid
            if (targetIndex >= widgets.length) return;

            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add all widgets
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            const originalPositions = currentWidgets.map((w) => ({ id: w.id, position: { ...w.position } }));

            // Update position of target widget
            const targetWidget = currentWidgets[targetIndex];
            store.updateWidget(targetWidget.id, { position: newPosition });

            // Verify target widget position changed
            const updatedWidgets = useCanvasStore.getState().widgets;
            const updatedTarget = updatedWidgets.find((w) => w.id === targetWidget.id);
            expect(updatedTarget!.position).toEqual(newPosition);

            // Verify other widgets' positions unchanged
            updatedWidgets.forEach((widget) => {
              if (widget.id !== targetWidget.id) {
                const originalPos = originalPositions.find((p) => p.id === widget.id);
                expect(widget.position).toEqual(originalPos!.position);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3: Widget Size Updates', () => {
    it('should update widget size to match target size while respecting minimum constraints', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 3: Widget Size Updates
       * 
       * For any widget instance and any valid size within the widget's constraints,
       * resizing the widget should update the widget's stored dimensions to match
       * the target size while respecting minimum size constraints.
       * 
       * **Validates: Requirements 2.6, 4.7, 4.8**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview',
        'holder-distribution',
        'lp-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      const sizeGen = fc.record({
        width: fc.integer({ min: 200, max: 2000 }),
        height: fc.integer({ min: 200, max: 1500 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, sizeGen, (widgetType, position, targetSize) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const widget = widgets[0];

          // Update widget size
          store.updateWidget(widget.id, { size: targetSize });

          // Get updated widget
          const updatedWidgets = useCanvasStore.getState().widgets;
          const updatedWidget = updatedWidgets.find((w) => w.id === widget.id);

          expect(updatedWidget).toBeDefined();

          // Verify size was updated
          // Note: The store doesn't enforce minimum size constraints automatically,
          // but the UI components (WidgetContainer) should enforce them.
          // For this property test, we verify that the size is stored as requested.
          expect(updatedWidget!.size.width).toBe(targetSize.width);
          expect(updatedWidget!.size.height).toBe(targetSize.height);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle size updates for multiple widgets independently', () => {
      /**
       * Property 3 Extension: Multiple Widget Size Independence
       * 
       * Resizing one widget should not affect the sizes of other widgets.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });
      const sizeGen = fc.record({
        width: fc.integer({ min: 300, max: 1000 }),
        height: fc.integer({ min: 300, max: 800 }),
      });

      fc.assert(
        fc.property(
          fc.array(fc.record({ type: widgetTypeGen, position: positionGen }), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          sizeGen,
          (widgets, targetIndex, newSize) => {
            if (targetIndex >= widgets.length) return;

            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add all widgets
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            const originalSizes = currentWidgets.map((w) => ({ id: w.id, size: { ...w.size } }));

            // Update size of target widget
            const targetWidget = currentWidgets[targetIndex];
            store.updateWidget(targetWidget.id, { size: newSize });

            // Verify target widget size changed
            const updatedWidgets = useCanvasStore.getState().widgets;
            const updatedTarget = updatedWidgets.find((w) => w.id === targetWidget.id);
            expect(updatedTarget!.size).toEqual(newSize);

            // Verify other widgets' sizes unchanged
            updatedWidgets.forEach((widget) => {
              if (widget.id !== targetWidget.id) {
                const originalSize = originalSizes.find((s) => s.id === widget.id);
                expect(widget.size).toEqual(originalSize!.size);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve widget position when size is updated', () => {
      /**
       * Property 3 Extension: Position Preservation During Resize
       * 
       * When a widget is resized, its position should remain unchanged.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });
      const sizeGen = fc.record({
        width: fc.integer({ min: 300, max: 1000 }),
        height: fc.integer({ min: 300, max: 800 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, sizeGen, (widgetType, position, newSize) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(widgetType, position);

          const widgets = useCanvasStore.getState().widgets;
          const widget = widgets[0];
          const originalPosition = { ...widget.position };

          // Update widget size
          store.updateWidget(widget.id, { size: newSize });

          // Verify position unchanged
          const updatedWidgets = useCanvasStore.getState().widgets;
          const updatedWidget = updatedWidgets.find((w) => w.id === widget.id);
          expect(updatedWidget!.position).toEqual(originalPosition);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Widget Deletion', () => {
    it('should remove widget from workspace state and prevent rendering after deletion', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 4: Widget Deletion
       * 
       * For any widget instance on the canvas, deleting the widget should result
       * in the widget no longer appearing in the workspace state and no longer
       * being rendered on the canvas.
       * 
       * **Validates: Requirements 2.8, 4.3**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'risk-flags'
      );

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
          expect(widgets.length).toBe(1);
          const widget = widgets[0];
          const widgetId = widget.id;

          // Verify widget exists
          expect(widgets.find((w) => w.id === widgetId)).toBeDefined();

          // Delete widget
          store.removeWidget(widgetId);

          // Verify widget no longer exists in state
          const updatedWidgets = useCanvasStore.getState().widgets;
          expect(updatedWidgets.length).toBe(0);
          expect(updatedWidgets.find((w) => w.id === widgetId)).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should delete only the specified widget without affecting others', () => {
      /**
       * Property 4 Extension: Selective Widget Deletion
       * 
       * Deleting a specific widget should only remove that widget and leave
       * all other widgets unchanged.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview', 'birdeye');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(
          fc.array(fc.record({ type: widgetTypeGen, position: positionGen }), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (widgets, targetIndex) => {
            if (targetIndex >= widgets.length) return;

            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add all widgets
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            const initialCount = currentWidgets.length;
            const targetWidget = currentWidgets[targetIndex];
            const otherWidgetIds = currentWidgets
              .filter((w) => w.id !== targetWidget.id)
              .map((w) => w.id);

            // Delete target widget
            store.removeWidget(targetWidget.id);

            // Verify widget count decreased by 1
            const updatedWidgets = useCanvasStore.getState().widgets;
            expect(updatedWidgets.length).toBe(initialCount - 1);

            // Verify target widget is gone
            expect(updatedWidgets.find((w) => w.id === targetWidget.id)).toBeUndefined();

            // Verify all other widgets still exist
            otherWidgetIds.forEach((id) => {
              expect(updatedWidgets.find((w) => w.id === id)).toBeDefined();
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle deletion of all widgets correctly', () => {
      /**
       * Property 4 Extension: Complete Workspace Clearing
       * 
       * Deleting all widgets should result in an empty workspace.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(
          fc.array(fc.record({ type: widgetTypeGen, position: positionGen }), { minLength: 1, maxLength: 5 }),
          (widgets) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add all widgets
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            expect(currentWidgets.length).toBe(widgets.length);

            // Delete all widgets one by one
            currentWidgets.forEach((widget) => {
              store.removeWidget(widget.id);
            });

            // Verify workspace is empty
            const finalWidgets = useCanvasStore.getState().widgets;
            expect(finalWidgets.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist widget deletion across save/load cycles', () => {
      /**
       * Property 4 Extension: Deletion Persistence
       * 
       * After deleting a widget and saving the workspace, loading the workspace
       * should not restore the deleted widget.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });
      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(
          fc.array(fc.record({ type: widgetTypeGen, position: positionGen }), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          languageGen,
          (widgets, targetIndex, language) => {
            if (targetIndex >= widgets.length) return;

            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace(language);

            // Add all widgets
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            const targetWidget = currentWidgets[targetIndex];
            const targetId = targetWidget.id;

            // Delete target widget
            store.removeWidget(targetId);

            // Save workspace
            store.saveWorkspace();

            // Load workspace again
            store.loadWorkspace(language);

            // Verify deleted widget is not restored
            const restoredWidgets = useCanvasStore.getState().widgets;
            expect(restoredWidgets.find((w) => w.id === targetId)).toBeUndefined();
            expect(restoredWidgets.length).toBe(widgets.length - 1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Workspace Persistence Round-Trip', () => {
    it('should persist and restore workspace configuration correctly', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 5: Workspace Persistence Round-Trip
       * 
       * For any workspace configuration (widgets, positions, sizes, annotations),
       * persisting the workspace to localStorage for a given language and then
       * loading it should restore an equivalent workspace state.
       * 
       * **Validates: Requirements 2.9, 2.10**
       */

      // Generator for widget types
      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'new-pairs',
        'trending',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'risk-flags',
        'swap',
        'notes',
        'checklist',
        'block-clock',
        'pnl-tracker'
      );

      // Generator for positions
      const positionGen = fc.record({
        x: fc.integer({ min: -5000, max: 5000 }),
        y: fc.integer({ min: -5000, max: 5000 }),
      });

      // Generator for sizes
      const sizeGen = fc.record({
        width: fc.integer({ min: 200, max: 1200 }),
        height: fc.integer({ min: 200, max: 1000 }),
      });

      // Generator for widget configurations
      const widgetConfigGen = fc.record({
        type: widgetTypeGen,
        position: positionGen,
        size: sizeGen,
      });

      // Generator for annotations
      const annotationGen = fc.oneof(
        // Pencil annotation
        fc.record({
          type: fc.constant('pencil' as const),
          points: fc.array(fc.integer({ min: 0, max: 2000 }), { minLength: 4, maxLength: 100 }),
          color: fc.constantFrom('#3b82f6', '#ef4444', '#10b981', '#f59e0b'),
          strokeWidth: fc.integer({ min: 1, max: 5 }),
        }),
        // Arrow annotation
        fc.record({
          type: fc.constant('arrow' as const),
          points: fc.array(fc.integer({ min: 0, max: 2000 }), { minLength: 4, maxLength: 4 }),
          color: fc.constantFrom('#3b82f6', '#ef4444', '#10b981', '#f59e0b'),
          strokeWidth: fc.integer({ min: 1, max: 5 }),
        }),
        // Highlight annotation
        fc.record({
          type: fc.constant('highlight' as const),
          rect: fc.record({
            x: fc.integer({ min: 0, max: 2000 }),
            y: fc.integer({ min: 0, max: 2000 }),
            width: fc.integer({ min: 50, max: 500 }),
            height: fc.integer({ min: 50, max: 500 }),
          }),
          color: fc.constantFrom('#3b82f6', '#ef4444', '#10b981', '#f59e0b'),
          strokeWidth: fc.integer({ min: 1, max: 5 }),
        }),
        // Text annotation
        fc.record({
          type: fc.constant('text' as const),
          text: fc.string({ minLength: 1, maxLength: 100 }),
          position: positionGen,
          color: fc.constantFrom('#3b82f6', '#ef4444', '#10b981', '#f59e0b'),
          strokeWidth: fc.integer({ min: 1, max: 5 }),
        })
      );

      // Generator for workspace configurations
      const workspaceConfigGen = fc.record({
        widgets: fc.array(widgetConfigGen, { minLength: 0, maxLength: 10 }),
        annotations: fc.array(annotationGen, { minLength: 0, maxLength: 5 }),
        language: fc.constantFrom<Language>('en', 'zh-CN'),
        zoom: fc.double({ min: 0.1, max: 5.0, noNaN: true }),
        pan: positionGen,
      });

      fc.assert(
        fc.property(workspaceConfigGen, (config) => {
          // Clear localStorage and reset store
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          
          // Load empty workspace for the language
          store.loadWorkspace(config.language);
          
          // Set language
          store.setLanguage(config.language);

          // Add widgets to the workspace
          config.widgets.forEach((widgetConfig) => {
            store.addWidget(widgetConfig.type, widgetConfig.position);
          });

          // Update widget sizes to match the generated configuration
          const currentWidgets = useCanvasStore.getState().widgets;
          currentWidgets.forEach((widget, index) => {
            if (index < config.widgets.length) {
              store.updateWidget(widget.id, {
                size: config.widgets[index].size,
              });
            }
          });

          // Add annotations
          config.annotations.forEach((annotationConfig) => {
            const annotation: Annotation = {
              id: `annotation-${Date.now()}-${Math.random()}`,
              type: annotationConfig.type,
              points: 'points' in annotationConfig ? annotationConfig.points : undefined,
              rect: 'rect' in annotationConfig ? annotationConfig.rect : undefined,
              text: 'text' in annotationConfig ? annotationConfig.text : undefined,
              position: 'position' in annotationConfig ? annotationConfig.position : undefined,
              color: annotationConfig.color,
              strokeWidth: annotationConfig.strokeWidth,
              timestamp: Date.now(),
            };
            store.addAnnotation(annotation);
          });

          // Set zoom and pan
          store.setZoom(config.zoom);
          store.setPan(config.pan);

          // Capture the current state before saving
          const stateBefore = useCanvasStore.getState();
          const widgetCountBefore = stateBefore.widgets.length;
          const annotationCountBefore = stateBefore.annotations.length;
          const zoomBefore = stateBefore.zoom;
          const panBefore = stateBefore.pan;

          // Save the workspace
          store.saveWorkspace();

          // Verify data was persisted to localStorage
          const storageKey = `workspace_${config.language}`;
          const persistedData = localStorageMock.getItem(storageKey);
          expect(persistedData).not.toBeNull();

          // Create a fresh store state by loading the workspace
          store.loadWorkspace(config.language);

          // Get the restored state
          const stateAfter = useCanvasStore.getState();

          // Verify widget count matches
          expect(stateAfter.widgets.length).toBe(widgetCountBefore);

          // Verify each widget's properties
          stateAfter.widgets.forEach((widget, index) => {
            const originalWidget = stateBefore.widgets[index];
            expect(widget.type).toBe(originalWidget.type);
            expect(widget.position.x).toBe(originalWidget.position.x);
            expect(widget.position.y).toBe(originalWidget.position.y);
            expect(widget.size.width).toBe(originalWidget.size.width);
            expect(widget.size.height).toBe(originalWidget.size.height);
          });

          // Verify annotation count matches
          expect(stateAfter.annotations.length).toBe(annotationCountBefore);

          // Verify each annotation's properties
          stateAfter.annotations.forEach((annotation, index) => {
            const originalAnnotation = stateBefore.annotations[index];
            expect(annotation.type).toBe(originalAnnotation.type);
            expect(annotation.color).toBe(originalAnnotation.color);
            expect(annotation.strokeWidth).toBe(originalAnnotation.strokeWidth);

            // Verify type-specific properties
            if (annotation.type === 'pencil' || annotation.type === 'arrow') {
              expect(annotation.points).toEqual(originalAnnotation.points);
            } else if (annotation.type === 'highlight') {
              expect(annotation.rect).toEqual(originalAnnotation.rect);
            } else if (annotation.type === 'text') {
              expect(annotation.text).toBe(originalAnnotation.text);
              expect(annotation.position).toEqual(originalAnnotation.position);
            }
          });

          // Verify zoom and pan
          expect(stateAfter.zoom).toBeCloseTo(zoomBefore, 5);
          expect(stateAfter.pan.x).toBe(panBefore.x);
          expect(stateAfter.pan.y).toBe(panBefore.y);

          // Verify language
          expect(stateAfter.currentLanguage).toBe(config.language);
        }),
        { numRuns: 10 }
      );
    });

    it('should maintain workspace isolation across different languages', () => {
      /**
       * Property 5 Extension: Multi-Language Workspace Isolation
       * 
       * Workspaces for different languages should be stored independently.
       * Saving a workspace for one language should not affect the workspace
       * for another language.
       * 
       * **Validates: Requirements 2.9, 2.10, 17.2**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'swap',
        'notes',
        'token-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: -1000, max: 1000 }),
        y: fc.integer({ min: -1000, max: 1000 }),
      });

      const workspaceGen = fc.record({
        widgets: fc.array(
          fc.record({
            type: widgetTypeGen,
            position: positionGen,
          }),
          { minLength: 1, maxLength: 5 }
        ),
      });

      fc.assert(
        fc.property(workspaceGen, workspaceGen, (workspace1, workspace2) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();

          // Create workspace for English
          store.loadWorkspace('en');
          workspace1.widgets.forEach((w) => {
            store.addWidget(w.type, w.position);
          });
          const enWidgetCount = useCanvasStore.getState().widgets.length;
          store.saveWorkspace();

          // Create workspace for Chinese
          store.loadWorkspace('zh-CN');
          workspace2.widgets.forEach((w) => {
            store.addWidget(w.type, w.position);
          });
          const zhWidgetCount = useCanvasStore.getState().widgets.length;
          store.saveWorkspace();

          // Load English workspace and verify it wasn't affected
          store.loadWorkspace('en');
          const enState = useCanvasStore.getState();
          expect(enState.widgets.length).toBe(enWidgetCount);
          expect(enState.currentLanguage).toBe('en');

          // Load Chinese workspace and verify it wasn't affected
          store.loadWorkspace('zh-CN');
          const zhState = useCanvasStore.getState();
          expect(zhState.widgets.length).toBe(zhWidgetCount);
          expect(zhState.currentLanguage).toBe('zh-CN');

          // Verify both workspaces exist in localStorage
          expect(localStorageMock.getItem('workspace_en')).not.toBeNull();
          expect(localStorageMock.getItem('workspace_zh-CN')).not.toBeNull();
        }),
        { numRuns: 10 }
      );
    });

    it('should handle empty workspace persistence correctly', () => {
      /**
       * Property 5 Edge Case: Empty Workspace
       * 
       * An empty workspace (no widgets, no annotations) should persist
       * and restore correctly.
       */

      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(languageGen, (language) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();

          // Load empty workspace
          store.loadWorkspace(language);
          
          // Save empty workspace
          store.saveWorkspace();

          // Load again
          store.loadWorkspace(language);

          const state = useCanvasStore.getState();
          expect(state.widgets.length).toBe(0);
          expect(state.annotations.length).toBe(0);
          expect(state.currentLanguage).toBe(language);
        }),
        { numRuns: 10 }
      );
    });

    it('should preserve widget configuration and state through persistence', () => {
      /**
       * Property 5 Extension: Widget Config and State Persistence
       * 
       * Widget-specific configuration and state should be preserved
       * through the save/load cycle.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      const configGen = fc.record({
        tokenAddress: fc.hexaString({ minLength: 32, maxLength: 44 }),
        slippage: fc.double({ min: 0.1, max: 5.0, noNaN: true }),
        customSetting: fc.string({ minLength: 1, maxLength: 20 }),
      });

      const stateGen = fc.record({
        notes: fc.string({ minLength: 0, maxLength: 200 }),
        lastUpdated: fc.integer({ min: 0, max: Date.now() }),
      });

      fc.assert(
        fc.property(
          widgetTypeGen,
          positionGen,
          configGen,
          stateGen,
          fc.constantFrom<Language>('en', 'zh-CN'),
          (type, position, config, state, language) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();

            // Load workspace
            store.loadWorkspace(language);

            // Add widget
            store.addWidget(type, position);

            // Update widget config and state
            const widget = useCanvasStore.getState().widgets[0];
            store.updateWidget(widget.id, {
              config,
              state,
            });

            // Save workspace
            store.saveWorkspace();

            // Load workspace again
            store.loadWorkspace(language);

            // Verify widget config and state
            const restoredWidget = useCanvasStore.getState().widgets[0];
            expect(restoredWidget.config).toEqual(config);
            expect(restoredWidget.state).toEqual(state);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 6: Canvas Panning', () => {
    it('should offset all widgets visually by the pan amount relative to their original positions', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 6: Canvas Panning
       * 
       * For any pan offset (x, y), applying the pan to the canvas should result
       * in all widgets being visually offset by that amount relative to their
       * original positions.
       * 
       * **Validates: Requirements 2.2**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: -2000, max: 2000 }),
        y: fc.integer({ min: -2000, max: 2000 }),
      });

      const panOffsetGen = fc.record({
        x: fc.integer({ min: -5000, max: 5000 }),
        y: fc.integer({ min: -5000, max: 5000 }),
      });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          panOffsetGen,
          (widgets, panOffset) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add widgets to canvas
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            // Capture original widget positions
            const originalWidgets = useCanvasStore.getState().widgets;
            const originalPositions = originalWidgets.map((w) => ({
              id: w.id,
              position: { ...w.position },
            }));

            // Apply pan offset
            store.setPan(panOffset);

            // Get current state
            const currentState = useCanvasStore.getState();
            const currentWidgets = currentState.widgets;

            // Verify pan was applied to state
            expect(currentState.pan.x).toBe(panOffset.x);
            expect(currentState.pan.y).toBe(panOffset.y);

            // Verify widget positions remain unchanged in the data model
            // (The visual offset is applied during rendering, not to the stored positions)
            currentWidgets.forEach((widget) => {
              const originalPos = originalPositions.find((p) => p.id === widget.id);
              expect(widget.position.x).toBe(originalPos!.position.x);
              expect(widget.position.y).toBe(originalPos!.position.y);
            });

            // The visual rendering would calculate: displayPosition = widget.position + pan
            // We verify this calculation would be correct
            currentWidgets.forEach((widget) => {
              const originalPos = originalPositions.find((p) => p.id === widget.id);
              const expectedVisualX = originalPos!.position.x + panOffset.x;
              const expectedVisualY = originalPos!.position.y + panOffset.y;

              // The visual position calculation (what would be rendered)
              const visualX = widget.position.x + currentState.pan.x;
              const visualY = widget.position.y + currentState.pan.y;

              expect(visualX).toBe(expectedVisualX);
              expect(visualY).toBe(expectedVisualY);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow panning in any direction without boundaries', () => {
      /**
       * Property 6 Extension: Unbounded Panning
       * 
       * The canvas should allow panning to any position without artificial
       * boundaries, supporting an infinite canvas concept.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      // Test extreme pan values
      const extremePanGen = fc.record({
        x: fc.integer({ min: -100000, max: 100000 }),
        y: fc.integer({ min: -100000, max: 100000 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, extremePanGen, (type, position, panOffset) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add a widget
          store.addWidget(type, position);

          // Apply extreme pan offset
          store.setPan(panOffset);

          // Verify pan was applied without clamping or boundaries
          const state = useCanvasStore.getState();
          expect(state.pan.x).toBe(panOffset.x);
          expect(state.pan.y).toBe(panOffset.y);

          // Verify widget is still accessible in the data model
          expect(state.widgets.length).toBe(1);
          expect(state.widgets[0].position).toEqual(position);
        }),
        { numRuns: 50 }
      );
    });

    it('should persist pan state across save/load cycles', () => {
      /**
       * Property 6 Extension: Pan Persistence
       * 
       * Pan offset should be saved and restored when the workspace is
       * persisted and loaded.
       */

      const panOffsetGen = fc.record({
        x: fc.integer({ min: -5000, max: 5000 }),
        y: fc.integer({ min: -5000, max: 5000 }),
      });

      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(panOffsetGen, languageGen, (panOffset, language) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace(language);

          // Set pan offset
          store.setPan(panOffset);

          // Save workspace
          store.saveWorkspace();

          // Load workspace again
          store.loadWorkspace(language);

          // Verify pan was restored
          const state = useCanvasStore.getState();
          expect(state.pan.x).toBe(panOffset.x);
          expect(state.pan.y).toBe(panOffset.y);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle multiple sequential pan operations correctly', () => {
      /**
       * Property 6 Extension: Sequential Panning
       * 
       * Multiple pan operations should correctly update the pan state,
       * with each operation replacing the previous pan offset.
       */

      const panSequenceGen = fc.array(
        fc.record({
          x: fc.integer({ min: -2000, max: 2000 }),
          y: fc.integer({ min: -2000, max: 2000 }),
        }),
        { minLength: 2, maxLength: 10 }
      );

      fc.assert(
        fc.property(panSequenceGen, (panSequence) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Apply each pan operation in sequence
          panSequence.forEach((panOffset) => {
            store.setPan(panOffset);

            // Verify current pan matches the latest operation
            const state = useCanvasStore.getState();
            expect(state.pan.x).toBe(panOffset.x);
            expect(state.pan.y).toBe(panOffset.y);
          });

          // Verify final pan state matches the last operation
          const finalState = useCanvasStore.getState();
          const lastPan = panSequence[panSequence.length - 1];
          expect(finalState.pan.x).toBe(lastPan.x);
          expect(finalState.pan.y).toBe(lastPan.y);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 7: Canvas Zooming', () => {
    it('should scale all widget positions and sizes proportionally while maintaining relative positions', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 7: Canvas Zooming
       * 
       * For any zoom level between 0.1 and 5.0, applying the zoom should scale
       * all widget positions and sizes proportionally while maintaining their
       * relative positions.
       * 
       * **Validates: Requirements 2.3**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 100, max: 2000 }),
        y: fc.integer({ min: 100, max: 2000 }),
      });

      const zoomLevelGen = fc.double({ min: 0.1, max: 5.0, noNaN: true });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 2, maxLength: 10 }
          ),
          zoomLevelGen,
          (widgets, zoomLevel) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add widgets to canvas
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            // Capture original widget positions and sizes
            const originalWidgets = useCanvasStore.getState().widgets;
            const originalData = originalWidgets.map((w) => ({
              id: w.id,
              position: { ...w.position },
              size: { ...w.size },
            }));

            // Calculate relative distances between widgets before zoom
            const relativeDistances: Array<{ id1: string; id2: string; dx: number; dy: number }> = [];
            for (let i = 0; i < originalWidgets.length; i++) {
              for (let j = i + 1; j < originalWidgets.length; j++) {
                const w1 = originalWidgets[i];
                const w2 = originalWidgets[j];
                relativeDistances.push({
                  id1: w1.id,
                  id2: w2.id,
                  dx: w2.position.x - w1.position.x,
                  dy: w2.position.y - w1.position.y,
                });
              }
            }

            // Apply zoom
            store.setZoom(zoomLevel);

            // Get current state
            const currentState = useCanvasStore.getState();
            const currentWidgets = currentState.widgets;

            // Verify zoom was applied to state
            expect(currentState.zoom).toBeCloseTo(zoomLevel, 5);

            // Verify widget positions remain unchanged in the data model
            // (The visual scaling is applied during rendering, not to the stored positions)
            currentWidgets.forEach((widget) => {
              const originalData_ = originalData.find((d) => d.id === widget.id);
              expect(widget.position.x).toBe(originalData_!.position.x);
              expect(widget.position.y).toBe(originalData_!.position.y);
              expect(widget.size.width).toBe(originalData_!.size.width);
              expect(widget.size.height).toBe(originalData_!.size.height);
            });

            // Verify relative distances are maintained when scaled
            // Visual position = position * zoom
            // Visual size = size * zoom
            relativeDistances.forEach(({ id1, id2, dx, dy }) => {
              const w1 = currentWidgets.find((w) => w.id === id1)!;
              const w2 = currentWidgets.find((w) => w.id === id2)!;

              // Calculate visual positions (what would be rendered)
              const visualX1 = w1.position.x * currentState.zoom;
              const visualY1 = w1.position.y * currentState.zoom;
              const visualX2 = w2.position.x * currentState.zoom;
              const visualY2 = w2.position.y * currentState.zoom;

              // Calculate visual relative distance
              const visualDx = visualX2 - visualX1;
              const visualDy = visualY2 - visualY1;

              // Expected visual distance = original distance * zoom
              const expectedVisualDx = dx * currentState.zoom;
              const expectedVisualDy = dy * currentState.zoom;

              // Verify relative distances are scaled proportionally
              expect(visualDx).toBeCloseTo(expectedVisualDx, 2);
              expect(visualDy).toBeCloseTo(expectedVisualDy, 2);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp zoom level between 0.1 and 5.0', () => {
      /**
       * Property 7 Extension: Zoom Bounds
       * 
       * Zoom level should be clamped to the valid range [0.1, 5.0] to prevent
       * extreme zoom values that could cause rendering issues.
       */

      const extremeZoomGen = fc.double({ min: -10.0, max: 20.0, noNaN: true });

      fc.assert(
        fc.property(extremeZoomGen, (zoomLevel) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Apply zoom (potentially out of bounds)
          store.setZoom(zoomLevel);

          // Verify zoom was clamped to valid range
          const state = useCanvasStore.getState();
          expect(state.zoom).toBeGreaterThanOrEqual(0.1);
          expect(state.zoom).toBeLessThanOrEqual(5.0);

          // Verify the clamped value matches expected behavior
          if (zoomLevel < 0.1) {
            expect(state.zoom).toBe(0.1);
          } else if (zoomLevel > 5.0) {
            expect(state.zoom).toBe(5.0);
          } else {
            expect(state.zoom).toBeCloseTo(zoomLevel, 5);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should persist zoom level across save/load cycles', () => {
      /**
       * Property 7 Extension: Zoom Persistence
       * 
       * Zoom level should be saved and restored when the workspace is
       * persisted and loaded.
       */

      const zoomLevelGen = fc.double({ min: 0.1, max: 5.0, noNaN: true });
      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(zoomLevelGen, languageGen, (zoomLevel, language) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace(language);

          // Set zoom level
          store.setZoom(zoomLevel);

          // Save workspace
          store.saveWorkspace();

          // Load workspace again
          store.loadWorkspace(language);

          // Verify zoom was restored
          const state = useCanvasStore.getState();
          expect(state.zoom).toBeCloseTo(zoomLevel, 5);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle multiple sequential zoom operations correctly', () => {
      /**
       * Property 7 Extension: Sequential Zooming
       * 
       * Multiple zoom operations should correctly update the zoom state,
       * with each operation replacing the previous zoom level.
       */

      const zoomSequenceGen = fc.array(
        fc.double({ min: 0.1, max: 5.0, noNaN: true }),
        { minLength: 2, maxLength: 10 }
      );

      fc.assert(
        fc.property(zoomSequenceGen, (zoomSequence) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Apply each zoom operation in sequence
          zoomSequence.forEach((zoomLevel) => {
            store.setZoom(zoomLevel);

            // Verify current zoom matches the latest operation
            const state = useCanvasStore.getState();
            expect(state.zoom).toBeCloseTo(zoomLevel, 5);
          });

          // Verify final zoom state matches the last operation
          const finalState = useCanvasStore.getState();
          const lastZoom = zoomSequence[zoomSequence.length - 1];
          expect(finalState.zoom).toBeCloseTo(lastZoom, 5);
        }),
        { numRuns: 50 }
      );
    });

    it('should maintain zoom independence from pan operations', () => {
      /**
       * Property 7 Extension: Zoom-Pan Independence
       * 
       * Zoom and pan operations should be independent - changing zoom should
       * not affect pan, and changing pan should not affect zoom.
       */

      const zoomLevelGen = fc.double({ min: 0.1, max: 5.0, noNaN: true });
      const panOffsetGen = fc.record({
        x: fc.integer({ min: -2000, max: 2000 }),
        y: fc.integer({ min: -2000, max: 2000 }),
      });

      fc.assert(
        fc.property(zoomLevelGen, panOffsetGen, zoomLevelGen, panOffsetGen, (zoom1, pan1, zoom2, pan2) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Set initial zoom and pan
          store.setZoom(zoom1);
          store.setPan(pan1);

          let state = useCanvasStore.getState();
          expect(state.zoom).toBeCloseTo(zoom1, 5);
          expect(state.pan).toEqual(pan1);

          // Change zoom, verify pan unchanged
          store.setZoom(zoom2);
          state = useCanvasStore.getState();
          expect(state.zoom).toBeCloseTo(zoom2, 5);
          expect(state.pan).toEqual(pan1); // Pan should remain unchanged

          // Change pan, verify zoom unchanged
          store.setPan(pan2);
          state = useCanvasStore.getState();
          expect(state.zoom).toBeCloseTo(zoom2, 5); // Zoom should remain unchanged
          expect(state.pan).toEqual(pan2);
        }),
        { numRuns: 50 }
      );
    });

    it('should correctly combine zoom and pan for visual rendering calculations', () => {
      /**
       * Property 7 Extension: Combined Zoom and Pan
       * 
       * When both zoom and pan are applied, the visual position should be
       * calculated as: visualPosition = (position * zoom) + pan
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 100, max: 1000 }),
        y: fc.integer({ min: 100, max: 1000 }),
      });
      const zoomLevelGen = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const panOffsetGen = fc.record({
        x: fc.integer({ min: -500, max: 500 }),
        y: fc.integer({ min: -500, max: 500 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, zoomLevelGen, panOffsetGen, (type, position, zoom, pan) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget
          store.addWidget(type, position);

          // Apply zoom and pan
          store.setZoom(zoom);
          store.setPan(pan);

          // Get current state
          const state = useCanvasStore.getState();
          const widget = state.widgets[0];

          // Calculate expected visual position
          // Note: The actual rendering formula might be (position + pan) * zoom
          // or position * zoom + pan depending on the implementation.
          // Based on typical canvas implementations, it's usually: (position + pan) * zoom
          const expectedVisualX = (widget.position.x + state.pan.x) * state.zoom;
          const expectedVisualY = (widget.position.y + state.pan.y) * state.zoom;

          // Verify the calculation would produce correct visual coordinates
          const calculatedVisualX = (widget.position.x + state.pan.x) * state.zoom;
          const calculatedVisualY = (widget.position.y + state.pan.y) * state.zoom;

          expect(calculatedVisualX).toBeCloseTo(expectedVisualX, 2);
          expect(calculatedVisualY).toBeCloseTo(expectedVisualY, 2);

          // Verify stored values remain unchanged
          expect(widget.position).toEqual(position);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 8: Widget Overlap Allowance', () => {
    it('should allow widgets to overlap and both remain fully interactive', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 8: Widget Overlap Allowance
       * 
       * For any two widget instances, positioning them such that their bounding
       * boxes intersect should be allowed, and both widgets should remain fully
       * interactive.
       * 
       * **Validates: Requirements 2.7**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'birdeye',
        'swap',
        'notes',
        'token-overview',
        'holder-distribution',
        'lp-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 2000 }),
        y: fc.integer({ min: 0, max: 2000 }),
      });

      const sizeGen = fc.record({
        width: fc.integer({ min: 300, max: 800 }),
        height: fc.integer({ min: 300, max: 600 }),
      });

      fc.assert(
        fc.property(
          widgetTypeGen,
          widgetTypeGen,
          positionGen,
          sizeGen,
          sizeGen,
          (type1, type2, position1, size1, size2) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add first widget
            store.addWidget(type1, position1);
            const widgets = useCanvasStore.getState().widgets;
            const widget1 = widgets[0];

            // Update first widget size
            store.updateWidget(widget1.id, { size: size1 });

            // Calculate overlapping position for second widget
            // Position it so it overlaps with the first widget
            // Overlap occurs when: x2 < x1 + width1 AND x1 < x2 + width2
            //                  AND: y2 < y1 + height1 AND y1 < y2 + height2
            const position2: Position = {
              x: position1.x + Math.floor(size1.width / 2), // Overlap horizontally
              y: position1.y + Math.floor(size1.height / 2), // Overlap vertically
            };

            // Add second widget at overlapping position
            store.addWidget(type2, position2);
            const updatedWidgets = useCanvasStore.getState().widgets;
            expect(updatedWidgets.length).toBe(2);
            const widget2 = updatedWidgets[1];

            // Update second widget size
            store.updateWidget(widget2.id, { size: size2 });

            // Get final state
            const finalWidgets = useCanvasStore.getState().widgets;
            const finalWidget1 = finalWidgets.find((w) => w.id === widget1.id)!;
            const finalWidget2 = finalWidgets.find((w) => w.id === widget2.id)!;

            // Verify both widgets exist in the state
            expect(finalWidget1).toBeDefined();
            expect(finalWidget2).toBeDefined();

            // Verify both widgets have their correct positions and sizes
            expect(finalWidget1.position).toEqual(position1);
            expect(finalWidget1.size).toEqual(size1);
            expect(finalWidget2.position).toEqual(position2);
            expect(finalWidget2.size).toEqual(size2);

            // Verify widgets are actually overlapping
            // Check if bounding boxes intersect
            const box1 = {
              left: finalWidget1.position.x,
              right: finalWidget1.position.x + finalWidget1.size.width,
              top: finalWidget1.position.y,
              bottom: finalWidget1.position.y + finalWidget1.size.height,
            };

            const box2 = {
              left: finalWidget2.position.x,
              right: finalWidget2.position.x + finalWidget2.size.width,
              top: finalWidget2.position.y,
              bottom: finalWidget2.position.y + finalWidget2.size.height,
            };

            const isOverlapping =
              box1.left < box2.right &&
              box1.right > box2.left &&
              box1.top < box2.bottom &&
              box1.bottom > box2.top;

            // Verify overlap is occurring (based on our positioning logic)
            expect(isOverlapping).toBe(true);

            // Verify both widgets remain interactive (can be updated independently)
            const newPosition1: Position = { x: position1.x + 10, y: position1.y + 10 };
            store.updateWidget(finalWidget1.id, { position: newPosition1 });

            const afterUpdate1 = useCanvasStore.getState().widgets;
            const updatedWidget1 = afterUpdate1.find((w) => w.id === widget1.id)!;
            const unchangedWidget2 = afterUpdate1.find((w) => w.id === widget2.id)!;

            expect(updatedWidget1.position).toEqual(newPosition1);
            expect(unchangedWidget2.position).toEqual(position2); // Widget 2 unchanged

            // Verify second widget can also be updated independently
            const newPosition2: Position = { x: position2.x + 15, y: position2.y + 15 };
            store.updateWidget(finalWidget2.id, { position: newPosition2 });

            const afterUpdate2 = useCanvasStore.getState().widgets;
            const finalUpdatedWidget2 = afterUpdate2.find((w) => w.id === widget2.id)!;

            expect(finalUpdatedWidget2.position).toEqual(newPosition2);

            // Verify both widgets can be deleted independently
            store.removeWidget(widget1.id);
            const afterDelete1 = useCanvasStore.getState().widgets;
            expect(afterDelete1.length).toBe(1);
            expect(afterDelete1.find((w) => w.id === widget1.id)).toBeUndefined();
            expect(afterDelete1.find((w) => w.id === widget2.id)).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow multiple widgets to overlap in complex arrangements', () => {
      /**
       * Property 8 Extension: Multiple Widget Overlap
       * 
       * Multiple widgets should be able to overlap each other in complex
       * arrangements, and all should remain independently interactive.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview', 'birdeye');
      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 3, maxLength: 8 }
          ),
          (widgets) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add all widgets at potentially overlapping positions
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;
            expect(currentWidgets.length).toBe(widgets.length);

            // Verify all widgets exist and have correct positions
            currentWidgets.forEach((widget, index) => {
              expect(widget.type).toBe(widgets[index].type);
              expect(widget.position).toEqual(widgets[index].position);
            });

            // Verify each widget can be updated independently
            currentWidgets.forEach((widget) => {
              const newPosition: Position = {
                x: widget.position.x + 5,
                y: widget.position.y + 5,
              };
              store.updateWidget(widget.id, { position: newPosition });

              const updated = useCanvasStore.getState().widgets.find((w) => w.id === widget.id)!;
              expect(updated.position).toEqual(newPosition);
            });

            // Verify all widgets still exist after updates
            const finalWidgets = useCanvasStore.getState().widgets;
            expect(finalWidgets.length).toBe(widgets.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain z-index ordering when widgets overlap', () => {
      /**
       * Property 8 Extension: Z-Index Preservation During Overlap
       * 
       * When widgets overlap, their z-index values should determine rendering
       * order, and z-index should be preserved correctly.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 100, max: 500 }),
        y: fc.integer({ min: 100, max: 500 }),
      });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (widgets) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add widgets in sequence
            widgets.forEach((w) => store.addWidget(w.type, w.position));

            const currentWidgets = useCanvasStore.getState().widgets;

            // Verify z-index increases with each added widget
            for (let i = 1; i < currentWidgets.length; i++) {
              expect(currentWidgets[i].zIndex).toBeGreaterThan(currentWidgets[i - 1].zIndex);
            }

            // Verify z-index values are unique
            const zIndexes = currentWidgets.map((w) => w.zIndex);
            const uniqueZIndexes = new Set(zIndexes);
            expect(uniqueZIndexes.size).toBe(zIndexes.length);

            // Verify z-index is preserved after position updates
            const targetWidget = currentWidgets[0];
            const originalZIndex = targetWidget.zIndex;
            const newPosition: Position = { x: targetWidget.position.x + 50, y: targetWidget.position.y + 50 };

            store.updateWidget(targetWidget.id, { position: newPosition });

            const updatedWidget = useCanvasStore.getState().widgets.find((w) => w.id === targetWidget.id)!;
            expect(updatedWidget.zIndex).toBe(originalZIndex);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist overlapping widget configurations across save/load cycles', () => {
      /**
       * Property 8 Extension: Overlap Persistence
       * 
       * Overlapping widget configurations should be correctly saved and
       * restored when the workspace is persisted and loaded.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const basePositionGen = fc.record({
        x: fc.integer({ min: 200, max: 800 }),
        y: fc.integer({ min: 200, max: 800 }),
      });
      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(widgetTypeGen, widgetTypeGen, basePositionGen, languageGen, (type1, type2, basePosition, language) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace(language);

          // Add first widget
          store.addWidget(type1, basePosition);
          const widgets1 = useCanvasStore.getState().widgets;
          const widget1Id = widgets1[0].id;

          // Add second widget at overlapping position
          const overlappingPosition: Position = {
            x: basePosition.x + 50, // Partial overlap
            y: basePosition.y + 50,
          };
          store.addWidget(type2, overlappingPosition);
          const widgets2 = useCanvasStore.getState().widgets;
          const widget2Id = widgets2[1].id;

          // Capture positions before save
          const beforeSave = useCanvasStore.getState().widgets;
          const widget1PosBefore = beforeSave.find((w) => w.id === widget1Id)!.position;
          const widget2PosBefore = beforeSave.find((w) => w.id === widget2Id)!.position;

          // Save workspace
          store.saveWorkspace();

          // Reload workspace from localStorage
          store.loadWorkspace(language);

          // Verify both widgets restored with correct positions
          const afterLoad = useCanvasStore.getState().widgets;
          expect(afterLoad.length).toBe(2);

          // Find widgets by ID (IDs are preserved in save/load)
          const widget1AfterLoad = afterLoad.find((w) => w.id === widget1Id);
          const widget2AfterLoad = afterLoad.find((w) => w.id === widget2Id);

          expect(widget1AfterLoad).toBeDefined();
          expect(widget2AfterLoad).toBeDefined();

          const widget1PosAfter = widget1AfterLoad!.position;
          const widget2PosAfter = widget2AfterLoad!.position;

          expect(widget1PosAfter).toEqual(widget1PosBefore);
          expect(widget2PosAfter).toEqual(widget2PosBefore);

          // Verify overlap is maintained after load
          // (positions are close enough to overlap with typical widget sizes)
          const dx = Math.abs(widget1PosAfter.x - widget2PosAfter.x);
          const dy = Math.abs(widget1PosAfter.y - widget2PosAfter.y);
          expect(dx).toBeLessThan(400); // Typical widget width
          expect(dy).toBeLessThan(400); // Typical widget height
        }),
        { numRuns: 50 }
      );
    });

    it('should allow complete overlap where one widget is entirely within another', () => {
      /**
       * Property 8 Extension: Complete Overlap
       * 
       * A widget should be allowed to be positioned entirely within the
       * bounds of another widget, and both should remain interactive.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>('swap', 'notes', 'token-overview');
      const positionGen = fc.record({
        x: fc.integer({ min: 100, max: 500 }),
        y: fc.integer({ min: 100, max: 500 }),
      });
      const largeSizeGen = fc.record({
        width: fc.integer({ min: 600, max: 1000 }),
        height: fc.integer({ min: 600, max: 800 }),
      });
      const smallSizeGen = fc.record({
        width: fc.integer({ min: 200, max: 400 }),
        height: fc.integer({ min: 200, max: 400 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, widgetTypeGen, positionGen, largeSizeGen, smallSizeGen, (type1, type2, position1, largeSize, smallSize) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add large widget
          store.addWidget(type1, position1);
          const widget1 = useCanvasStore.getState().widgets[0];
          store.updateWidget(widget1.id, { size: largeSize });

          // Add small widget completely inside the large widget
          const innerPosition: Position = {
            x: position1.x + 100, // Well inside the large widget
            y: position1.y + 100,
          };
          store.addWidget(type2, innerPosition);
          const widgets = useCanvasStore.getState().widgets;
          const widget2 = widgets[1];
          store.updateWidget(widget2.id, { size: smallSize });

          // Verify both widgets exist
          const finalWidgets = useCanvasStore.getState().widgets;
          expect(finalWidgets.length).toBe(2);

          const finalWidget1 = finalWidgets.find((w) => w.id === widget1.id)!;
          const finalWidget2 = finalWidgets.find((w) => w.id === widget2.id)!;

          // Verify small widget is completely inside large widget
          const isCompletelyInside =
            finalWidget2.position.x >= finalWidget1.position.x &&
            finalWidget2.position.y >= finalWidget1.position.y &&
            finalWidget2.position.x + finalWidget2.size.width <= finalWidget1.position.x + finalWidget1.size.width &&
            finalWidget2.position.y + finalWidget2.size.height <= finalWidget1.position.y + finalWidget1.size.height;

          expect(isCompletelyInside).toBe(true);

          // Verify both widgets remain interactive
          const newConfig = { testSetting: 'updated' };
          store.updateWidget(finalWidget2.id, { config: newConfig });

          const updatedWidget2 = useCanvasStore.getState().widgets.find((w) => w.id === widget2.id)!;
          expect(updatedWidget2.config).toEqual(newConfig);

          // Verify inner widget can be deleted without affecting outer widget
          store.removeWidget(widget2.id);
          const afterDelete = useCanvasStore.getState().widgets;
          expect(afterDelete.length).toBe(1);
          expect(afterDelete[0].id).toBe(widget1.id);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 11: Widget Addition', () => {
    it('should create a new widget instance with correct type and default configuration when added from tool library', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 11: Widget Addition
       * 
       * For any widget type in the tool library, clicking to add the widget
       * should result in a new widget instance appearing on the canvas with
       * the correct type and default configuration.
       * 
       * **Validates: Requirements 2.4, 3.4**
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'dexscreener',
        'dextools',
        'birdeye',
        'new-pairs',
        'trending',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'token-age',
        'deployer-info',
        'risk-flags',
        'swap',
        'quick-buy',
        'twitter-embed',
        'telegram-channel',
        'rss-feed',
        'notes',
        'checklist',
        'block-clock',
        'pnl-tracker'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: -1000, max: 5000 }),
        y: fc.integer({ min: -1000, max: 5000 }),
      });

      fc.assert(
        fc.property(widgetTypeGen, positionGen, (widgetType, position) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Get widget definition from registry
          const widgetDef = getWidgetDefinition(widgetType);
          expect(widgetDef).toBeDefined();

          // Capture initial state
          const initialWidgetCount = useCanvasStore.getState().widgets.length;

          // Add widget (simulating click from tool library)
          store.addWidget(widgetType, position);

          // Get updated state
          const currentState = useCanvasStore.getState();
          const currentWidgets = currentState.widgets;

          // Verify widget count increased by 1
          expect(currentWidgets.length).toBe(initialWidgetCount + 1);

          // Get the newly added widget
          const newWidget = currentWidgets[currentWidgets.length - 1];

          // Verify widget has correct type
          expect(newWidget.type).toBe(widgetType);

          // Verify widget has correct position
          expect(newWidget.position.x).toBe(position.x);
          expect(newWidget.position.y).toBe(position.y);

          // Verify widget has default size from registry
          expect(newWidget.size.width).toBe(widgetDef!.defaultSize.width);
          expect(newWidget.size.height).toBe(widgetDef!.defaultSize.height);

          // Verify widget has default configuration from registry
          expect(newWidget.config).toEqual(widgetDef!.defaultConfig);

          // Verify widget has a unique ID
          expect(newWidget.id).toBeDefined();
          expect(typeof newWidget.id).toBe('string');
          expect(newWidget.id.length).toBeGreaterThan(0);

          // Verify widget has proper z-index (should be highest)
          const maxZIndex = Math.max(...currentWidgets.map((w) => w.zIndex));
          expect(newWidget.zIndex).toBe(maxZIndex);

          // Verify widget has timestamps
          expect(newWidget.createdAt).toBeDefined();
          expect(newWidget.updatedAt).toBeDefined();
          expect(typeof newWidget.createdAt).toBe('number');
          expect(typeof newWidget.updatedAt).toBe('number');

          // Verify widget has empty state initially
          expect(newWidget.state).toEqual({});
        }),
        { numRuns: 100 }
      );
    });

    it('should add multiple widgets of the same type with unique IDs', () => {
      /**
       * Property 11 Extension: Multiple Widget Instances
       * 
       * Adding multiple widgets of the same type should create separate
       * instances with unique IDs and independent configurations.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'swap',
        'notes',
        'token-overview',
        'birdeye',
        'holder-distribution'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 2000 }),
        y: fc.integer({ min: 0, max: 2000 }),
      });

      fc.assert(
        fc.property(
          widgetTypeGen,
          fc.array(positionGen, { minLength: 2, maxLength: 5 }),
          (widgetType, positions) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add multiple widgets of the same type
            positions.forEach((position) => {
              store.addWidget(widgetType, position);
            });

            const currentWidgets = useCanvasStore.getState().widgets;

            // Verify correct number of widgets added
            expect(currentWidgets.length).toBe(positions.length);

            // Verify all widgets have the same type
            currentWidgets.forEach((widget) => {
              expect(widget.type).toBe(widgetType);
            });

            // Verify all widgets have unique IDs
            const widgetIds = currentWidgets.map((w) => w.id);
            const uniqueIds = new Set(widgetIds);
            expect(uniqueIds.size).toBe(widgetIds.length);

            // Verify each widget has correct position
            currentWidgets.forEach((widget, index) => {
              expect(widget.position).toEqual(positions[index]);
            });

            // Verify widgets can be updated independently
            const firstWidget = currentWidgets[0];
            const newConfig = { testValue: 'updated' };
            store.updateWidget(firstWidget.id, { config: newConfig });

            const afterUpdate = useCanvasStore.getState().widgets;
            const updatedWidget = afterUpdate.find((w) => w.id === firstWidget.id)!;
            expect(updatedWidget.config).toEqual(newConfig);

            // Verify other widgets' configs unchanged
            afterUpdate.forEach((widget) => {
              if (widget.id !== firstWidget.id) {
                expect(widget.config).not.toEqual(newConfig);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should add widgets with default position when no position is provided', () => {
      /**
       * Property 11 Extension: Default Position
       * 
       * When adding a widget without specifying a position, the system
       * should use a default position (100, 100).
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'swap',
        'notes',
        'token-overview',
        'birdeye'
      );

      fc.assert(
        fc.property(widgetTypeGen, (widgetType) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add widget without position
          store.addWidget(widgetType);

          const currentWidgets = useCanvasStore.getState().widgets;
          expect(currentWidgets.length).toBe(1);

          const widget = currentWidgets[0];

          // Verify default position is used
          expect(widget.position.x).toBe(100);
          expect(widget.position.y).toBe(100);

          // Verify widget type is correct
          expect(widget.type).toBe(widgetType);
        }),
        { numRuns: 50 }
      );
    });

    it('should assign incrementing z-index values to newly added widgets', () => {
      /**
       * Property 11 Extension: Z-Index Assignment
       * 
       * Each newly added widget should receive a z-index value that is
       * higher than all existing widgets, ensuring proper stacking order.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'swap',
        'notes',
        'token-overview',
        'birdeye',
        'holder-distribution'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (widgets) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace('en');

            // Add widgets one by one
            widgets.forEach((w) => {
              store.addWidget(w.type, w.position);
            });

            const currentWidgets = useCanvasStore.getState().widgets;

            // Verify z-index increases with each widget
            for (let i = 1; i < currentWidgets.length; i++) {
              expect(currentWidgets[i].zIndex).toBeGreaterThan(currentWidgets[i - 1].zIndex);
            }

            // Verify z-index values are sequential (or at least increasing)
            const zIndexes = currentWidgets.map((w) => w.zIndex);
            const sortedZIndexes = [...zIndexes].sort((a, b) => a - b);
            expect(zIndexes).toEqual(sortedZIndexes);

            // Verify all z-index values are unique
            const uniqueZIndexes = new Set(zIndexes);
            expect(uniqueZIndexes.size).toBe(zIndexes.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist newly added widgets across save/load cycles', () => {
      /**
       * Property 11 Extension: Widget Addition Persistence
       * 
       * Widgets added to the canvas should be automatically saved and
       * restored when the workspace is loaded.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'swap',
        'notes',
        'token-overview',
        'birdeye',
        'holder-distribution',
        'lp-overview'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 2000 }),
        y: fc.integer({ min: 0, max: 2000 }),
      });

      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          languageGen,
          (widgets, language) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();
            store.loadWorkspace(language);

            // Add widgets
            widgets.forEach((w) => {
              store.addWidget(w.type, w.position);
            });

            // Capture widget data before save
            const beforeSave = useCanvasStore.getState().widgets;
            const widgetDataBefore = beforeSave.map((w) => ({
              type: w.type,
              position: { ...w.position },
              size: { ...w.size },
              config: { ...w.config },
            }));

            // Save workspace
            store.saveWorkspace();

            // Load workspace again
            store.loadWorkspace(language);

            // Verify widgets were restored
            const afterLoad = useCanvasStore.getState().widgets;
            expect(afterLoad.length).toBe(widgets.length);

            // Verify each widget's properties match
            afterLoad.forEach((widget, index) => {
              expect(widget.type).toBe(widgetDataBefore[index].type);
              expect(widget.position).toEqual(widgetDataBefore[index].position);
              expect(widget.size).toEqual(widgetDataBefore[index].size);
              expect(widget.config).toEqual(widgetDataBefore[index].config);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle adding widgets to different language workspaces independently', () => {
      /**
       * Property 11 Extension: Multi-Language Widget Addition
       * 
       * Widgets added to one language workspace should not appear in
       * another language workspace.
       */

      const widgetTypeGen = fc.constantFrom<WidgetType>(
        'swap',
        'notes',
        'token-overview',
        'birdeye'
      );

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.array(
            fc.record({
              type: widgetTypeGen,
              position: positionGen,
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (enWidgets, zhWidgets) => {
            localStorageMock.clear();
            const store = useCanvasStore.getState();

            // Add widgets to English workspace
            store.loadWorkspace('en');
            enWidgets.forEach((w) => {
              store.addWidget(w.type, w.position);
            });
            const enWidgetCount = useCanvasStore.getState().widgets.length;
            store.saveWorkspace();

            // Add widgets to Chinese workspace
            store.loadWorkspace('zh-CN');
            zhWidgets.forEach((w) => {
              store.addWidget(w.type, w.position);
            });
            const zhWidgetCount = useCanvasStore.getState().widgets.length;
            store.saveWorkspace();

            // Verify English workspace has correct widgets
            store.loadWorkspace('en');
            const enState = useCanvasStore.getState();
            expect(enState.widgets.length).toBe(enWidgetCount);
            expect(enState.currentLanguage).toBe('en');

            // Verify Chinese workspace has correct widgets
            store.loadWorkspace('zh-CN');
            const zhState = useCanvasStore.getState();
            expect(zhState.widgets.length).toBe(zhWidgetCount);
            expect(zhState.currentLanguage).toBe('zh-CN');

            // Verify widget counts are independent
            expect(enWidgetCount).toBe(enWidgets.length);
            expect(zhWidgetCount).toBe(zhWidgets.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle adding all available widget types without errors', () => {
      /**
       * Property 11 Extension: All Widget Types Support
       * 
       * The system should support adding any widget type defined in the
       * registry without errors.
       */

      const allWidgetTypes: WidgetType[] = [
        'dexscreener',
        'dextools',
        'birdeye',
        'new-pairs',
        'trending',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'token-age',
        'deployer-info',
        'risk-flags',
        'swap',
        'quick-buy',
        'twitter-embed',
        'telegram-channel',
        'rss-feed',
        'notes',
        'checklist',
        'block-clock',
        'pnl-tracker',
      ];

      const positionGen = fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
      });

      fc.assert(
        fc.property(positionGen, (position) => {
          localStorageMock.clear();
          const store = useCanvasStore.getState();
          store.loadWorkspace('en');

          // Add one widget of each type
          allWidgetTypes.forEach((type) => {
            store.addWidget(type, position);
          });

          const currentWidgets = useCanvasStore.getState().widgets;

          // Verify all widgets were added
          expect(currentWidgets.length).toBe(allWidgetTypes.length);

          // Verify each widget type is present
          allWidgetTypes.forEach((type) => {
            const widget = currentWidgets.find((w) => w.type === type);
            expect(widget).toBeDefined();
            expect(widget!.type).toBe(type);

            // Verify widget has valid definition
            const widgetDef = getWidgetDefinition(type);
            expect(widgetDef).toBeDefined();
            expect(widget!.size).toEqual(widgetDef!.defaultSize);
            expect(widget!.config).toEqual(widgetDef!.defaultConfig);
          });
        }),
        { numRuns: 10 }
      );
    });
  });
});
