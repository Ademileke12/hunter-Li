import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getWidgetDefinition } from '../utils/widgetRegistry';
import { calculateFastBuyLayout, isValidTokenAddress } from '../utils/fastBuyFlow';
import { debounce, PERFORMANCE_TIMINGS } from '../utils/performance';
import { safeStorage, StorageError, handleError } from '../utils/errorHandling';
import type {
  WidgetInstance,
  WidgetType,
  Position,
  Viewport,
  Annotation,
  Language,
  Workspace,
} from '../types';
import type { FastBuyFlowResult } from '../utils/fastBuyFlow';

interface CanvasState {
  widgets: WidgetInstance[];
  viewport: Viewport;
  zoom: number;
  pan: Position;
  annotations: Annotation[];
  currentLanguage: Language;
}

interface CanvasActions {
  addWidget: (type: WidgetType, position?: Position) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetInstance>) => void;
  duplicateWidget: (id: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  saveWorkspace: () => void;
  loadWorkspace: (language: Language) => void;
  setLanguage: (language: Language) => void;
  fastBuyFlow: (tokenAddress: string, viewportCenter?: Position) => FastBuyFlowResult | null;
}

export type CanvasStore = CanvasState & CanvasActions;

// Default viewport
const DEFAULT_VIEWPORT: Viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  offsetX: 0,
  offsetY: 0,
};

// Initial state
const initialState: CanvasState = {
  widgets: [],
  viewport: DEFAULT_VIEWPORT,
  zoom: 1,
  pan: { x: 0, y: 0 },
  annotations: [],
  currentLanguage: 'en',
};

// Helper function to get storage key
const getStorageKey = (language: Language): string => {
  return `workspace_${language}`;
};

// Helper function to save workspace to localStorage
const saveToLocalStorage = (state: CanvasState): void => {
  try {
    const workspace: Workspace = {
      language: state.currentLanguage,
      widgets: state.widgets,
      annotations: state.annotations,
      viewport: state.viewport,
      zoom: state.zoom,
      pan: state.pan,
      version: 1,
      lastModified: Date.now(),
    };

    const key = getStorageKey(state.currentLanguage);
    safeStorage.setItem(key, JSON.stringify(workspace));
  } catch (error) {
    const appError = handleError(error, 'saveWorkspace');
    console.error('Failed to save workspace:', appError.userMessage);
    
    // Handle quota exceeded specifically
    if (error instanceof StorageError && error.message.includes('quota')) {
      console.warn('Storage quota exceeded. Consider clearing old data.');
      // Could trigger a notification to the user here
    }
  }
};

// Debounced save function to prevent excessive localStorage writes
// Requirement 18.4: Debounce canvas updates
const debouncedSave = debounce((state: CanvasState) => {
  saveToLocalStorage(state);
}, PERFORMANCE_TIMINGS.AUTO_SAVE);

// Helper function to load workspace from localStorage
const loadFromLocalStorage = (language: Language): Partial<CanvasState> | null => {
  try {
    const key = getStorageKey(language);
    const stored = safeStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const workspace: Workspace = JSON.parse(stored);

    // Validate workspace structure
    if (!workspace.widgets || !Array.isArray(workspace.widgets)) {
      console.warn('Invalid workspace structure, resetting to default');
      return null;
    }

    return {
      widgets: workspace.widgets,
      annotations: workspace.annotations || [],
      viewport: workspace.viewport || DEFAULT_VIEWPORT,
      zoom: workspace.zoom || 1,
      pan: workspace.pan || { x: 0, y: 0 },
      currentLanguage: language,
    };
  } catch (error) {
    const appError = handleError(error, 'loadWorkspace');
    console.error('Failed to load workspace:', appError.userMessage);
    
    // Handle corrupted data gracefully
    if (error instanceof SyntaxError) {
      console.warn('Corrupted workspace data detected, resetting to default');
    }
    
    return null;
  }
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,

  addWidget: (type: WidgetType, position?: Position) => {
    // Get widget definition from registry
    const widgetDef = getWidgetDefinition(type);
    if (!widgetDef) {
      console.error(`Widget type "${type}" not found in registry`);
      return;
    }

    const defaultSize = widgetDef.defaultSize;
    const defaultPosition = position || { x: 100, y: 100 };

    // Calculate next z-index
    const widgets = get().widgets;
    const maxZIndex = widgets.length > 0 ? Math.max(...widgets.map((w) => w.zIndex)) : 0;

    const newWidget: WidgetInstance = {
      id: uuidv4(),
      type,
      position: defaultPosition,
      size: defaultSize,
      zIndex: maxZIndex + 1,
      config: { ...widgetDef.defaultConfig }, // Use default config from registry
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      widgets: [...state.widgets, newWidget],
    }));

    // Auto-save after adding widget
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  removeWidget: (id: string) => {
    set((state) => ({
      widgets: state.widgets.filter((widget) => widget.id !== id),
    }));

    // Auto-save after removing widget
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  updateWidget: (id: string, updates: Partial<WidgetInstance>) => {
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === id
          ? { ...widget, ...updates, updatedAt: Date.now() }
          : widget
      ),
    }));

    // Auto-save after updating widget
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  duplicateWidget: (id: string) => {
    const widget = get().widgets.find((w) => w.id === id);
    if (!widget) {
      console.warn(`Widget with id ${id} not found`);
      return;
    }

    // Calculate next z-index
    const widgets = get().widgets;
    const maxZIndex = Math.max(...widgets.map((w) => w.zIndex));

    // Offset position slightly for visibility
    const newPosition = {
      x: widget.position.x + 20,
      y: widget.position.y + 20,
    };

    const duplicatedWidget: WidgetInstance = {
      ...widget,
      id: uuidv4(),
      position: newPosition,
      zIndex: maxZIndex + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Deep copy config and state to avoid reference issues
      config: JSON.parse(JSON.stringify(widget.config)),
      state: JSON.parse(JSON.stringify(widget.state)),
    };

    set((state) => ({
      widgets: [...state.widgets, duplicatedWidget],
    }));

    // Auto-save after duplicating widget
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  setZoom: (zoom: number) => {
    // Clamp zoom between 0.1 and 5.0
    const clampedZoom = Math.max(0.1, Math.min(5.0, zoom));
    set({ zoom: clampedZoom });

    // Auto-save after zoom change
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  setPan: (pan: Position) => {
    set({ pan });

    // Auto-save after pan change (debounced in practice)
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  addAnnotation: (annotation: Annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));

    // Auto-save after adding annotation
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  removeAnnotation: (id: string) => {
    set((state) => ({
      annotations: state.annotations.filter((annotation) => annotation.id !== id),
    }));

    // Auto-save after removing annotation
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  clearAnnotations: () => {
    set({ annotations: [] });

    // Auto-save after clearing annotations
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);
  },

  saveWorkspace: () => {
    const state = get();
    debouncedSave(state);
  },

  loadWorkspace: (language: Language) => {
    const loaded = loadFromLocalStorage(language);

    if (loaded) {
      set({
        ...loaded,
        currentLanguage: language,
      });
    } else {
      // Reset to initial state if no workspace found
      set({
        ...initialState,
        currentLanguage: language,
      });
    }
  },

  setLanguage: (language: Language) => {
    // Save current workspace before switching
    get().saveWorkspace();

    // Load workspace for new language
    get().loadWorkspace(language);
  },

  fastBuyFlow: (tokenAddress: string, viewportCenter?: Position): FastBuyFlowResult | null => {
    // Validate token address
    if (!isValidTokenAddress(tokenAddress)) {
      console.error('Invalid token address provided to Fast Buy flow:', tokenAddress);
      return null;
    }

    // Calculate optimal layout positions
    const positions = calculateFastBuyLayout(viewportCenter);

    // Get current widgets to calculate z-index
    const widgets = get().widgets;
    const maxZIndex = widgets.length > 0 ? Math.max(...widgets.map((w) => w.zIndex)) : 0;

    // Create widget instances
    const chartWidget: WidgetInstance = {
      id: uuidv4(),
      type: 'dexscreener',
      position: positions.chart,
      size: { width: 800, height: 600 },
      zIndex: maxZIndex + 1,
      config: { tokenAddress },
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const overviewWidget: WidgetInstance = {
      id: uuidv4(),
      type: 'token-overview',
      position: positions.overview,
      size: { width: 400, height: 300 },
      zIndex: maxZIndex + 2,
      config: { tokenAddress },
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const swapWidget: WidgetInstance = {
      id: uuidv4(),
      type: 'swap',
      position: positions.swap,
      size: { width: 400, height: 400 },
      zIndex: maxZIndex + 3,
      config: {
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: tokenAddress,
        slippageBps: 100, // 1%
      },
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add all widgets to canvas
    set((state) => ({
      widgets: [...state.widgets, chartWidget, overviewWidget, swapWidget],
    }));

    // Auto-save workspace
    setTimeout(() => {
      get().saveWorkspace();
    }, 0);

    // Return result with widget IDs and positions
    return {
      chartWidgetId: chartWidget.id,
      overviewWidgetId: overviewWidget.id,
      swapWidgetId: swapWidget.id,
      positions,
    };
  },
}));
