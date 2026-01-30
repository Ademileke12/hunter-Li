import { create } from 'zustand';
import type { DrawingTool } from '../types';

export type Theme = 'dark' | 'light';

interface UIStore {
  toolLibraryCollapsed: boolean;
  annotationMode: boolean;
  selectedTool: DrawingTool | null;
  theme: Theme;
  toggleToolLibrary: () => void;
  setToolLibraryCollapsed: (collapsed: boolean) => void;
  setAnnotationMode: (enabled: boolean) => void;
  setSelectedTool: (tool: DrawingTool | null) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const TOOL_LIBRARY_COLLAPSED_KEY = 'tool_library_collapsed';
const THEME_KEY = 'app_theme';

// Helper function to load collapsed state from localStorage
const loadCollapsedState = (): boolean => {
  try {
    const stored = localStorage.getItem(TOOL_LIBRARY_COLLAPSED_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch (error) {
    console.error('Failed to load tool library collapsed state:', error);
  }
  return false; // Default to expanded
};

// Helper to load theme
const loadTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Check system preference if no stored theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
  return 'dark'; // Default to dark
};

// Helper function to save collapsed state to localStorage
const saveCollapsedState = (collapsed: boolean): void => {
  try {
    localStorage.setItem(TOOL_LIBRARY_COLLAPSED_KEY, String(collapsed));
  } catch (error) {
    console.error('Failed to save tool library collapsed state:', error);
  }
};

export const useUIStore = create<UIStore>((set, get) => ({
  toolLibraryCollapsed: loadCollapsedState(),
  annotationMode: false,
  selectedTool: null,
  theme: loadTheme(),

  toggleToolLibrary: () => {
    const newCollapsed = !get().toolLibraryCollapsed;
    set({ toolLibraryCollapsed: newCollapsed });
    saveCollapsedState(newCollapsed);
  },

  setToolLibraryCollapsed: (collapsed: boolean) => {
    set({ toolLibraryCollapsed: collapsed });
    saveCollapsedState(collapsed);
  },

  setAnnotationMode: (enabled: boolean) => {
    set({ annotationMode: enabled });
    // If disabling annotation mode, clear selected tool
    if (!enabled) {
      set({ selectedTool: null });
    }
  },

  setSelectedTool: (tool: DrawingTool | null) => {
    set({ selectedTool: tool });
    // If selecting a tool, enable annotation mode
    if (tool !== null) {
      set({ annotationMode: true });
    }
  },

  setTheme: (theme: Theme) => {
    set({ theme });
    localStorage.setItem(THEME_KEY, theme);
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    localStorage.setItem(THEME_KEY, newTheme);
  },
}));
