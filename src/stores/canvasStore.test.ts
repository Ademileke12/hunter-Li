import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCanvasStore } from './canvasStore';
import type { WidgetType, Position, Annotation } from '../types';

describe('Canvas Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store to initial state
    useCanvasStore.setState({
      widgets: [],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetX: 0,
        offsetY: 0,
      },
      zoom: 1,
      pan: { x: 0, y: 0 },
      annotations: [],
      currentLanguage: 'en',
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('addWidget', () => {
    it('should add a widget with default position', () => {
      const { addWidget, widgets } = useCanvasStore.getState();

      addWidget('swap');

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(1);
      expect(state.widgets[0].type).toBe('swap');
      expect(state.widgets[0].position).toEqual({ x: 100, y: 100 });
      expect(state.widgets[0].id).toBeDefined();
      expect(state.widgets[0].zIndex).toBe(1);
    });

    it('should add a widget with custom position', () => {
      const { addWidget } = useCanvasStore.getState();
      const customPosition: Position = { x: 200, y: 300 };

      addWidget('notes', customPosition);

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(1);
      expect(state.widgets[0].position).toEqual(customPosition);
    });

    it('should assign correct default size based on widget type', () => {
      const { addWidget } = useCanvasStore.getState();

      addWidget('swap');

      const state = useCanvasStore.getState();
      expect(state.widgets[0].size).toEqual({ width: 400, height: 500 });
    });

    it('should increment z-index for each new widget', () => {
      const { addWidget } = useCanvasStore.getState();

      addWidget('swap');
      addWidget('notes');
      addWidget('dexscreener');

      const state = useCanvasStore.getState();
      expect(state.widgets[0].zIndex).toBe(1);
      expect(state.widgets[1].zIndex).toBe(2);
      expect(state.widgets[2].zIndex).toBe(3);
    });

    it('should initialize widget with default config from registry', () => {
      const { addWidget } = useCanvasStore.getState();

      addWidget('swap');

      const state = useCanvasStore.getState();
      // Swap widget should have default config from registry
      expect(state.widgets[0].config).toEqual({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: '',
        slippageBps: 100,
      });
      expect(state.widgets[0].state).toEqual({});
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const { addWidget } = useCanvasStore.getState();
      const beforeTime = Date.now();

      addWidget('swap');

      const state = useCanvasStore.getState();
      const afterTime = Date.now();
      expect(state.widgets[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(state.widgets[0].createdAt).toBeLessThanOrEqual(afterTime);
      expect(state.widgets[0].updatedAt).toBe(state.widgets[0].createdAt);
    });
  });

  describe('removeWidget', () => {
    it('should remove a widget by id', () => {
      const { addWidget, removeWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;

      removeWidget(widgetId);

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(0);
    });

    it('should only remove the specified widget', () => {
      const { addWidget, removeWidget } = useCanvasStore.getState();

      addWidget('swap');
      addWidget('notes');
      addWidget('dexscreener');

      const widgets = useCanvasStore.getState().widgets;
      const middleWidgetId = widgets[1].id;

      removeWidget(middleWidgetId);

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(2);
      expect(state.widgets.find((w) => w.id === middleWidgetId)).toBeUndefined();
      expect(state.widgets[0].type).toBe('swap');
      expect(state.widgets[1].type).toBe('dexscreener');
    });

    it('should handle removing non-existent widget gracefully', () => {
      const { addWidget, removeWidget } = useCanvasStore.getState();

      addWidget('swap');
      const initialLength = useCanvasStore.getState().widgets.length;

      removeWidget('non-existent-id');

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(initialLength);
    });
  });

  describe('updateWidget', () => {
    it('should update widget position', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const newPosition: Position = { x: 500, y: 600 };

      updateWidget(widgetId, { position: newPosition });

      const state = useCanvasStore.getState();
      expect(state.widgets[0].position).toEqual(newPosition);
    });

    it('should update widget size', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const newSize = { width: 800, height: 600 };

      updateWidget(widgetId, { size: newSize });

      const state = useCanvasStore.getState();
      expect(state.widgets[0].size).toEqual(newSize);
    });

    it('should update widget config', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const newConfig = { tokenAddress: 'ABC123', slippage: 1 };

      updateWidget(widgetId, { config: newConfig });

      const state = useCanvasStore.getState();
      expect(state.widgets[0].config).toEqual(newConfig);
    });

    it('should update widget state', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('notes');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const newState = { content: 'My notes' };

      updateWidget(widgetId, { state: newState });

      const state = useCanvasStore.getState();
      expect(state.widgets[0].state).toEqual(newState);
    });

    it('should update updatedAt timestamp', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const originalUpdatedAt = useCanvasStore.getState().widgets[0].updatedAt;

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      updateWidget(widgetId, { position: { x: 200, y: 200 } });

      const state = useCanvasStore.getState();
      expect(state.widgets[0].updatedAt).toBeGreaterThan(originalUpdatedAt);

      vi.useRealTimers();
    });

    it('should not affect other widgets', () => {
      const { addWidget, updateWidget } = useCanvasStore.getState();

      addWidget('swap');
      addWidget('notes');

      const widgets = useCanvasStore.getState().widgets;
      const firstWidgetId = widgets[0].id;
      const secondWidgetOriginal = { ...widgets[1] };

      updateWidget(firstWidgetId, { position: { x: 999, y: 999 } });

      const state = useCanvasStore.getState();
      expect(state.widgets[1].position).toEqual(secondWidgetOriginal.position);
    });
  });

  describe('duplicateWidget', () => {
    it('should create a duplicate widget with new id', () => {
      const { addWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const originalId = useCanvasStore.getState().widgets[0].id;

      duplicateWidget(originalId);

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(2);
      expect(state.widgets[1].id).not.toBe(originalId);
      expect(state.widgets[1].type).toBe('swap');
    });

    it('should offset duplicate widget position', () => {
      const { addWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('swap', { x: 100, y: 100 });
      const originalId = useCanvasStore.getState().widgets[0].id;

      duplicateWidget(originalId);

      const state = useCanvasStore.getState();
      expect(state.widgets[1].position).toEqual({ x: 120, y: 120 });
    });

    it('should copy widget config', () => {
      const { addWidget, updateWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const config = { tokenAddress: 'ABC123', slippage: 2 };
      updateWidget(widgetId, { config });

      duplicateWidget(widgetId);

      const state = useCanvasStore.getState();
      expect(state.widgets[1].config).toEqual(config);
      // Ensure it's a deep copy, not a reference
      expect(state.widgets[1].config).not.toBe(state.widgets[0].config);
    });

    it('should copy widget state', () => {
      const { addWidget, updateWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('notes');
      const widgetId = useCanvasStore.getState().widgets[0].id;
      const widgetState = { content: 'My notes', fontSize: 14 };
      updateWidget(widgetId, { state: widgetState });

      duplicateWidget(widgetId);

      const state = useCanvasStore.getState();
      expect(state.widgets[1].state).toEqual(widgetState);
      // Ensure it's a deep copy, not a reference
      expect(state.widgets[1].state).not.toBe(state.widgets[0].state);
    });

    it('should increment z-index for duplicate', () => {
      const { addWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('swap');
      addWidget('notes');
      const firstWidgetId = useCanvasStore.getState().widgets[0].id;

      duplicateWidget(firstWidgetId);

      const state = useCanvasStore.getState();
      expect(state.widgets[2].zIndex).toBe(3);
    });

    it('should handle duplicating non-existent widget', () => {
      const { addWidget, duplicateWidget } = useCanvasStore.getState();

      addWidget('swap');
      const initialLength = useCanvasStore.getState().widgets.length;

      // Mock console.warn to avoid test output noise
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      duplicateWidget('non-existent-id');

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(initialLength);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('setZoom', () => {
    it('should set zoom level', () => {
      const { setZoom } = useCanvasStore.getState();

      setZoom(1.5);

      const state = useCanvasStore.getState();
      expect(state.zoom).toBe(1.5);
    });

    it('should clamp zoom to minimum 0.1', () => {
      const { setZoom } = useCanvasStore.getState();

      setZoom(0.05);

      const state = useCanvasStore.getState();
      expect(state.zoom).toBe(0.1);
    });

    it('should clamp zoom to maximum 5.0', () => {
      const { setZoom } = useCanvasStore.getState();

      setZoom(10);

      const state = useCanvasStore.getState();
      expect(state.zoom).toBe(5.0);
    });
  });

  describe('setPan', () => {
    it('should set pan position', () => {
      const { setPan } = useCanvasStore.getState();
      const newPan: Position = { x: 100, y: 200 };

      setPan(newPan);

      const state = useCanvasStore.getState();
      expect(state.pan).toEqual(newPan);
    });

    it('should allow negative pan values', () => {
      const { setPan } = useCanvasStore.getState();
      const newPan: Position = { x: -500, y: -300 };

      setPan(newPan);

      const state = useCanvasStore.getState();
      expect(state.pan).toEqual(newPan);
    });
  });

  describe('annotations', () => {
    const createTestAnnotation = (): Annotation => ({
      id: 'test-annotation-1',
      type: 'pencil',
      points: [10, 20, 30, 40],
      color: '#ff0000',
      strokeWidth: 2,
      timestamp: Date.now(),
    });

    it('should add annotation', () => {
      const { addAnnotation } = useCanvasStore.getState();
      const annotation = createTestAnnotation();

      addAnnotation(annotation);

      const state = useCanvasStore.getState();
      expect(state.annotations).toHaveLength(1);
      expect(state.annotations[0]).toEqual(annotation);
    });

    it('should remove annotation by id', () => {
      const { addAnnotation, removeAnnotation } = useCanvasStore.getState();
      const annotation = createTestAnnotation();

      addAnnotation(annotation);
      removeAnnotation(annotation.id);

      const state = useCanvasStore.getState();
      expect(state.annotations).toHaveLength(0);
    });

    it('should clear all annotations', () => {
      const { addAnnotation, clearAnnotations } = useCanvasStore.getState();

      addAnnotation(createTestAnnotation());
      addAnnotation({ ...createTestAnnotation(), id: 'test-annotation-2' });
      addAnnotation({ ...createTestAnnotation(), id: 'test-annotation-3' });

      clearAnnotations();

      const state = useCanvasStore.getState();
      expect(state.annotations).toHaveLength(0);
    });
  });

  describe('workspace persistence', () => {
    it('should save workspace to localStorage', () => {
      const { addWidget, saveWorkspace } = useCanvasStore.getState();

      addWidget('swap', { x: 100, y: 200 });
      saveWorkspace();

      const stored = localStorage.getItem('workspace_en');
      expect(stored).toBeDefined();

      const workspace = JSON.parse(stored!);
      expect(workspace.widgets).toHaveLength(1);
      expect(workspace.widgets[0].type).toBe('swap');
      expect(workspace.language).toBe('en');
    });

    it('should load workspace from localStorage', () => {
      const { addWidget, saveWorkspace, loadWorkspace } = useCanvasStore.getState();

      // Add widgets and save
      addWidget('swap', { x: 100, y: 200 });
      addWidget('notes', { x: 300, y: 400 });
      saveWorkspace();

      // Reset store
      useCanvasStore.setState({
        widgets: [],
        annotations: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
      });

      // Load workspace
      loadWorkspace('en');

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(2);
      expect(state.widgets[0].type).toBe('swap');
      expect(state.widgets[1].type).toBe('notes');
    });

    it('should use correct storage key for language', () => {
      const { addWidget, saveWorkspace, setLanguage } = useCanvasStore.getState();

      // Save English workspace
      addWidget('swap');
      saveWorkspace();

      // Switch to Chinese and save different workspace
      setLanguage('zh-CN');
      const { addWidget: addWidget2 } = useCanvasStore.getState();
      addWidget2('notes');
      addWidget2('dexscreener');
      useCanvasStore.getState().saveWorkspace();

      // Check both workspaces exist
      const enWorkspace = localStorage.getItem('workspace_en');
      const zhWorkspace = localStorage.getItem('workspace_zh-CN');

      expect(enWorkspace).toBeDefined();
      expect(zhWorkspace).toBeDefined();

      const enData = JSON.parse(enWorkspace!);
      const zhData = JSON.parse(zhWorkspace!);

      expect(enData.widgets).toHaveLength(1);
      expect(zhData.widgets).toHaveLength(2);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      const { loadWorkspace } = useCanvasStore.getState();

      // Set corrupted data
      localStorage.setItem('workspace_en', 'invalid json{{{');

      // Mock console.error to avoid test output noise
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      loadWorkspace('en');

      const state = useCanvasStore.getState();
      // Should reset to initial state
      expect(state.widgets).toHaveLength(0);

      errorSpy.mockRestore();
    });

    it('should handle missing workspace gracefully', () => {
      const { loadWorkspace } = useCanvasStore.getState();

      loadWorkspace('en');

      const state = useCanvasStore.getState();
      // Should have initial state
      expect(state.widgets).toHaveLength(0);
      expect(state.zoom).toBe(1);
      expect(state.pan).toEqual({ x: 0, y: 0 });
    });

    it('should save annotations with workspace', () => {
      const { addAnnotation, saveWorkspace, loadWorkspace } = useCanvasStore.getState();

      const annotation: Annotation = {
        id: 'test-1',
        type: 'pencil',
        points: [10, 20, 30, 40],
        color: '#ff0000',
        strokeWidth: 2,
        timestamp: Date.now(),
      };

      addAnnotation(annotation);
      saveWorkspace();

      // Reset and load
      useCanvasStore.setState({ annotations: [] });
      loadWorkspace('en');

      const state = useCanvasStore.getState();
      expect(state.annotations).toHaveLength(1);
      expect(state.annotations[0].id).toBe('test-1');
    });

    it('should save zoom and pan with workspace', () => {
      const { setZoom, setPan, saveWorkspace, loadWorkspace } = useCanvasStore.getState();

      setZoom(2.5);
      setPan({ x: 100, y: 200 });
      saveWorkspace();

      // Reset and load
      useCanvasStore.setState({ zoom: 1, pan: { x: 0, y: 0 } });
      loadWorkspace('en');

      const state = useCanvasStore.getState();
      expect(state.zoom).toBe(2.5);
      expect(state.pan).toEqual({ x: 100, y: 200 });
    });
  });

  describe('setLanguage', () => {
    it('should switch language and load corresponding workspace', () => {
      const { addWidget, setLanguage } = useCanvasStore.getState();

      // Create English workspace
      addWidget('swap');
      useCanvasStore.getState().saveWorkspace();

      // Switch to Chinese (should be empty)
      setLanguage('zh-CN');

      const state = useCanvasStore.getState();
      expect(state.currentLanguage).toBe('zh-CN');
      expect(state.widgets).toHaveLength(0);
    });

    it('should save current workspace before switching', () => {
      const { addWidget, setLanguage } = useCanvasStore.getState();

      // Create English workspace
      addWidget('swap');
      addWidget('notes');

      // Switch to Chinese
      setLanguage('zh-CN');

      // Switch back to English
      setLanguage('en');

      const state = useCanvasStore.getState();
      expect(state.widgets).toHaveLength(2);
    });
  });
});
