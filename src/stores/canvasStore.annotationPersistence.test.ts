import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCanvasStore } from './canvasStore';
import type { Annotation } from '../types';

describe('Canvas Store - Annotation Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store to initial state
    const store = useCanvasStore.getState();
    store.loadWorkspace('en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should serialize annotations to JSON and store in localStorage', () => {
    const store = useCanvasStore.getState();
    
    const annotation: Annotation = {
      id: 'test-1',
      type: 'pencil',
      points: [10, 10, 20, 20, 30, 30],
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };

    store.addAnnotation(annotation);
    
    // Wait for auto-save
    vi.waitFor(() => {
      const stored = localStorage.getItem('workspace_en');
      expect(stored).toBeTruthy();
      
      const workspace = JSON.parse(stored!);
      expect(workspace.annotations).toHaveLength(1);
      expect(workspace.annotations[0]).toEqual(annotation);
    });
  });

  it('should deserialize annotations from localStorage on load', () => {
    const annotation: Annotation = {
      id: 'test-2',
      type: 'arrow',
      points: [50, 50, 100, 100],
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };

    // Manually set localStorage
    const workspace = {
      language: 'en',
      widgets: [],
      annotations: [annotation],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      zoom: 1,
      pan: { x: 0, y: 0 },
      version: 1,
      lastModified: Date.now(),
    };
    localStorage.setItem('workspace_en', JSON.stringify(workspace));

    // Create a fresh store instance by calling loadWorkspace
    const store = useCanvasStore.getState();
    store.loadWorkspace('en');

    // Get the updated state after loading
    const updatedState = useCanvasStore.getState();

    // Verify annotations are loaded
    expect(updatedState.annotations).toHaveLength(1);
    expect(updatedState.annotations[0]).toEqual(annotation);
  });

  it('should persist annotations per language context', () => {
    const store = useCanvasStore.getState();
    
    // Add annotation in English
    const enAnnotation: Annotation = {
      id: 'en-1',
      type: 'text',
      text: 'English note',
      position: { x: 100, y: 100 },
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };
    store.addAnnotation(enAnnotation);
    store.saveWorkspace();

    // Switch to Chinese and add different annotation
    store.setLanguage('zh-CN');
    const zhAnnotation: Annotation = {
      id: 'zh-1',
      type: 'text',
      text: '中文笔记',
      position: { x: 200, y: 200 },
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };
    store.addAnnotation(zhAnnotation);
    store.saveWorkspace();

    // Verify English workspace has only English annotation
    const enWorkspace = JSON.parse(localStorage.getItem('workspace_en')!);
    expect(enWorkspace.annotations).toHaveLength(1);
    expect(enWorkspace.annotations[0].text).toBe('English note');

    // Verify Chinese workspace has only Chinese annotation
    const zhWorkspace = JSON.parse(localStorage.getItem('workspace_zh-CN')!);
    expect(zhWorkspace.annotations).toHaveLength(1);
    expect(zhWorkspace.annotations[0].text).toBe('中文笔记');
  });

  it('should remove annotation and persist change', () => {
    const store = useCanvasStore.getState();
    
    const annotation: Annotation = {
      id: 'test-3',
      type: 'highlight',
      rect: { x: 10, y: 10, width: 100, height: 50 },
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };

    store.addAnnotation(annotation);
    store.saveWorkspace();

    // Verify annotation is saved
    let stored = localStorage.getItem('workspace_en');
    let workspace = JSON.parse(stored!);
    expect(workspace.annotations).toHaveLength(1);

    // Remove annotation
    store.removeAnnotation(annotation.id);
    
    // Wait for auto-save
    vi.waitFor(() => {
      stored = localStorage.getItem('workspace_en');
      workspace = JSON.parse(stored!);
      expect(workspace.annotations).toHaveLength(0);
    });
  });

  it('should clear all annotations and persist change', () => {
    const store = useCanvasStore.getState();
    
    const annotations: Annotation[] = [
      {
        id: 'test-4',
        type: 'pencil',
        points: [10, 10, 20, 20],
        color: '#00d4ff',
        strokeWidth: 2,
        timestamp: Date.now(),
      },
      {
        id: 'test-5',
        type: 'arrow',
        points: [30, 30, 40, 40],
        color: '#00d4ff',
        strokeWidth: 2,
        timestamp: Date.now(),
      },
    ];

    annotations.forEach(a => store.addAnnotation(a));
    store.saveWorkspace();

    // Verify annotations are saved
    let stored = localStorage.getItem('workspace_en');
    let workspace = JSON.parse(stored!);
    expect(workspace.annotations).toHaveLength(2);

    // Clear all annotations
    store.clearAnnotations();
    
    // Wait for auto-save
    vi.waitFor(() => {
      stored = localStorage.getItem('workspace_en');
      workspace = JSON.parse(stored!);
      expect(workspace.annotations).toHaveLength(0);
    });
  });

  it('should handle corrupted annotation data gracefully', () => {
    // Set corrupted data
    localStorage.setItem('workspace_en', 'invalid json');

    const store = useCanvasStore.getState();
    
    // Should not throw error
    expect(() => store.loadWorkspace('en')).not.toThrow();
    
    // Should reset to empty state
    expect(store.annotations).toHaveLength(0);
  });

  it('should maintain annotations when switching languages', () => {
    const store = useCanvasStore.getState();
    
    // Add annotation in English
    const enAnnotation: Annotation = {
      id: 'en-persist',
      type: 'pencil',
      points: [10, 10, 20, 20],
      color: '#00d4ff',
      strokeWidth: 2,
      timestamp: Date.now(),
    };
    store.addAnnotation(enAnnotation);
    store.saveWorkspace();

    // Switch to Chinese
    store.setLanguage('zh-CN');
    const stateAfterSwitch = useCanvasStore.getState();
    expect(stateAfterSwitch.annotations).toHaveLength(0); // Chinese workspace is empty

    // Switch back to English
    store.setLanguage('en');
    const stateAfterReturn = useCanvasStore.getState();
    expect(stateAfterReturn.annotations).toHaveLength(1);
    expect(stateAfterReturn.annotations[0].id).toBe('en-persist');
  });
});
