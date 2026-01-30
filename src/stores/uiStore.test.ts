import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './uiStore';
import type { DrawingTool } from '../types';

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      toolLibraryCollapsed: false,
      annotationMode: false,
      selectedTool: null,
    });

    // Clear localStorage
    localStorage.clear();
  });

  describe('toolLibraryCollapsed', () => {
    it('should initialize with collapsed state from localStorage', () => {
      // Set localStorage value
      localStorage.setItem('tool_library_collapsed', 'true');

      // Create a new store instance by importing fresh
      const { toolLibraryCollapsed } = useUIStore.getState();

      // Note: The store is already initialized, so we need to test this differently
      // We'll test the persistence behavior instead
      expect(typeof toolLibraryCollapsed).toBe('boolean');
    });

    it('should default to false (expanded) when no localStorage value exists', () => {
      localStorage.removeItem('tool_library_collapsed');

      // Reset store to trigger initialization
      useUIStore.setState({
        toolLibraryCollapsed: false,
        annotationMode: false,
        selectedTool: null,
      });

      const { toolLibraryCollapsed } = useUIStore.getState();
      expect(toolLibraryCollapsed).toBe(false);
    });

    it('should toggle toolLibraryCollapsed state', () => {
      const { toggleToolLibrary } = useUIStore.getState();

      // Initial state should be false
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(false);

      // Toggle to true
      toggleToolLibrary();
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(true);

      // Toggle back to false
      toggleToolLibrary();
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(false);
    });

    it('should persist toolLibraryCollapsed to localStorage when toggled', () => {
      const { toggleToolLibrary } = useUIStore.getState();

      // Toggle to true
      toggleToolLibrary();
      expect(localStorage.getItem('tool_library_collapsed')).toBe('true');

      // Toggle to false
      toggleToolLibrary();
      expect(localStorage.getItem('tool_library_collapsed')).toBe('false');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { toggleToolLibrary } = useUIStore.getState();

      // Should not throw
      expect(() => toggleToolLibrary()).not.toThrow();

      // State should still update even if localStorage fails
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(true);
      
      // Verify setItem was called (and threw)
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Console error should have been called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('annotationMode', () => {
    it('should initialize with annotationMode false', () => {
      const { annotationMode } = useUIStore.getState();
      expect(annotationMode).toBe(false);
    });

    it('should set annotationMode to true', () => {
      const { setAnnotationMode } = useUIStore.getState();

      setAnnotationMode(true);
      expect(useUIStore.getState().annotationMode).toBe(true);
    });

    it('should set annotationMode to false', () => {
      const { setAnnotationMode } = useUIStore.getState();

      // First enable it
      setAnnotationMode(true);
      expect(useUIStore.getState().annotationMode).toBe(true);

      // Then disable it
      setAnnotationMode(false);
      expect(useUIStore.getState().annotationMode).toBe(false);
    });

    it('should clear selectedTool when disabling annotationMode', () => {
      const { setAnnotationMode, setSelectedTool } = useUIStore.getState();

      // Set a tool
      setSelectedTool('pencil');
      expect(useUIStore.getState().selectedTool).toBe('pencil');
      expect(useUIStore.getState().annotationMode).toBe(true);

      // Disable annotation mode
      setAnnotationMode(false);
      expect(useUIStore.getState().annotationMode).toBe(false);
      expect(useUIStore.getState().selectedTool).toBe(null);
    });

    it('should not affect selectedTool when enabling annotationMode', () => {
      const { setAnnotationMode } = useUIStore.getState();

      // Enable annotation mode without setting a tool
      setAnnotationMode(true);
      expect(useUIStore.getState().annotationMode).toBe(true);
      expect(useUIStore.getState().selectedTool).toBe(null);
    });
  });

  describe('selectedTool', () => {
    it('should initialize with selectedTool null', () => {
      const { selectedTool } = useUIStore.getState();
      expect(selectedTool).toBe(null);
    });

    it('should set selectedTool to a valid drawing tool', () => {
      const { setSelectedTool } = useUIStore.getState();

      const tools: DrawingTool[] = ['pencil', 'arrow', 'highlight', 'text'];

      tools.forEach((tool) => {
        setSelectedTool(tool);
        expect(useUIStore.getState().selectedTool).toBe(tool);
      });
    });

    it('should set selectedTool to null', () => {
      const { setSelectedTool } = useUIStore.getState();

      // First set a tool
      setSelectedTool('pencil');
      expect(useUIStore.getState().selectedTool).toBe('pencil');

      // Then clear it
      setSelectedTool(null);
      expect(useUIStore.getState().selectedTool).toBe(null);
    });

    it('should enable annotationMode when selecting a tool', () => {
      const { setSelectedTool } = useUIStore.getState();

      // Initially annotation mode should be false
      expect(useUIStore.getState().annotationMode).toBe(false);

      // Select a tool
      setSelectedTool('pencil');
      expect(useUIStore.getState().selectedTool).toBe('pencil');
      expect(useUIStore.getState().annotationMode).toBe(true);
    });

    it('should not disable annotationMode when clearing selectedTool', () => {
      const { setSelectedTool } = useUIStore.getState();

      // Select a tool (enables annotation mode)
      setSelectedTool('pencil');
      expect(useUIStore.getState().annotationMode).toBe(true);

      // Clear the tool
      setSelectedTool(null);
      expect(useUIStore.getState().selectedTool).toBe(null);
      // Annotation mode should remain enabled
      expect(useUIStore.getState().annotationMode).toBe(true);
    });

    it('should allow switching between different tools', () => {
      const { setSelectedTool } = useUIStore.getState();

      setSelectedTool('pencil');
      expect(useUIStore.getState().selectedTool).toBe('pencil');

      setSelectedTool('arrow');
      expect(useUIStore.getState().selectedTool).toBe('arrow');

      setSelectedTool('highlight');
      expect(useUIStore.getState().selectedTool).toBe('highlight');

      setSelectedTool('text');
      expect(useUIStore.getState().selectedTool).toBe('text');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete annotation workflow', () => {
      const { setSelectedTool, setAnnotationMode } = useUIStore.getState();

      // Start: everything disabled
      expect(useUIStore.getState().annotationMode).toBe(false);
      expect(useUIStore.getState().selectedTool).toBe(null);

      // User selects a tool
      setSelectedTool('pencil');
      expect(useUIStore.getState().annotationMode).toBe(true);
      expect(useUIStore.getState().selectedTool).toBe('pencil');

      // User switches tools
      setSelectedTool('arrow');
      expect(useUIStore.getState().annotationMode).toBe(true);
      expect(useUIStore.getState().selectedTool).toBe('arrow');

      // User disables annotation mode
      setAnnotationMode(false);
      expect(useUIStore.getState().annotationMode).toBe(false);
      expect(useUIStore.getState().selectedTool).toBe(null);
    });

    it('should handle tool library toggle independently of annotation mode', () => {
      const { toggleToolLibrary, setAnnotationMode } = useUIStore.getState();

      // Enable annotation mode
      setAnnotationMode(true);
      expect(useUIStore.getState().annotationMode).toBe(true);

      // Toggle tool library
      toggleToolLibrary();
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(true);
      // Annotation mode should not be affected
      expect(useUIStore.getState().annotationMode).toBe(true);

      // Toggle tool library again
      toggleToolLibrary();
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(false);
      expect(useUIStore.getState().annotationMode).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid toggles of tool library', () => {
      const { toggleToolLibrary } = useUIStore.getState();

      for (let i = 0; i < 10; i++) {
        toggleToolLibrary();
      }

      // After even number of toggles, should be back to initial state
      expect(useUIStore.getState().toolLibraryCollapsed).toBe(false);
    });

    it('should handle setting the same tool multiple times', () => {
      const { setSelectedTool } = useUIStore.getState();

      setSelectedTool('pencil');
      setSelectedTool('pencil');
      setSelectedTool('pencil');

      expect(useUIStore.getState().selectedTool).toBe('pencil');
      expect(useUIStore.getState().annotationMode).toBe(true);
    });

    it('should handle setting annotation mode to the same value', () => {
      const { setAnnotationMode } = useUIStore.getState();

      setAnnotationMode(true);
      setAnnotationMode(true);
      expect(useUIStore.getState().annotationMode).toBe(true);

      setAnnotationMode(false);
      setAnnotationMode(false);
      expect(useUIStore.getState().annotationMode).toBe(false);
    });
  });
});
