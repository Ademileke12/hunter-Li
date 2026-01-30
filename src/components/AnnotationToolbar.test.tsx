import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationToolbar } from './AnnotationToolbar';
import { useUIStore } from '../stores/uiStore';
import { useCanvasStore } from '../stores/canvasStore';

// Mock the stores
vi.mock('../stores/uiStore');
vi.mock('../stores/canvasStore');

describe('AnnotationToolbar', () => {
  const mockSetAnnotationMode = vi.fn();
  const mockSetSelectedTool = vi.fn();
  const mockClearAnnotations = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('should render all drawing tools', () => {
    vi.mocked(useUIStore).mockReturnValue({
      annotationMode: false,
      selectedTool: null,
      toolLibraryCollapsed: false,
      toggleToolLibrary: vi.fn(),
      setAnnotationMode: mockSetAnnotationMode,
      setSelectedTool: mockSetSelectedTool,
    });

    vi.mocked(useCanvasStore).mockReturnValue({
      annotations: [],
      clearAnnotations: mockClearAnnotations,
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      zoom: 1,
      pan: { x: 0, y: 0 },
      widgets: [],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      currentLanguage: 'en',
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      updateWidget: vi.fn(),
      duplicateWidget: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      saveWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      setLanguage: vi.fn(),
    });

    const { container } = render(<AnnotationToolbar />);
    
    // Check that toolbar is rendered
    expect(container.querySelector('.annotation-toolbar')).toBeTruthy();
  });

  it('should toggle annotation mode when visibility button is clicked', () => {
    vi.mocked(useUIStore).mockReturnValue({
      annotationMode: false,
      selectedTool: null,
      toolLibraryCollapsed: false,
      toggleToolLibrary: vi.fn(),
      setAnnotationMode: mockSetAnnotationMode,
      setSelectedTool: mockSetSelectedTool,
    });

    vi.mocked(useCanvasStore).mockReturnValue({
      annotations: [],
      clearAnnotations: mockClearAnnotations,
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      zoom: 1,
      pan: { x: 0, y: 0 },
      widgets: [],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      currentLanguage: 'en',
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      updateWidget: vi.fn(),
      duplicateWidget: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      saveWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      setLanguage: vi.fn(),
    });

    const { container } = render(<AnnotationToolbar />);
    
    // Find and click the visibility toggle button (Eye/EyeOff icon)
    const buttons = container.querySelectorAll('button');
    const visibilityButton = Array.from(buttons).find(btn => 
      btn.getAttribute('title')?.includes('annotations')
    );
    
    expect(visibilityButton).toBeTruthy();
    fireEvent.click(visibilityButton!);
    
    expect(mockSetAnnotationMode).toHaveBeenCalledWith(true);
  });

  it('should call clearAnnotations when clear button is clicked with confirmation', () => {
    const mockAnnotations = [
      {
        id: '1',
        type: 'pencil' as const,
        points: [10, 10, 20, 20],
        color: '#00d4ff',
        strokeWidth: 2,
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useUIStore).mockReturnValue({
      annotationMode: true,
      selectedTool: 'pencil',
      toolLibraryCollapsed: false,
      toggleToolLibrary: vi.fn(),
      setAnnotationMode: mockSetAnnotationMode,
      setSelectedTool: mockSetSelectedTool,
    });

    vi.mocked(useCanvasStore).mockReturnValue({
      annotations: mockAnnotations,
      clearAnnotations: mockClearAnnotations,
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      zoom: 1,
      pan: { x: 0, y: 0 },
      widgets: [],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      currentLanguage: 'en',
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      updateWidget: vi.fn(),
      duplicateWidget: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      saveWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      setLanguage: vi.fn(),
    });

    const { container } = render(<AnnotationToolbar />);
    
    // Find and click the clear button (Trash icon)
    const buttons = container.querySelectorAll('button');
    const clearButton = Array.from(buttons).find(btn => 
      btn.getAttribute('title')?.includes('Clear')
    );
    
    expect(clearButton).toBeTruthy();
    fireEvent.click(clearButton!);
    
    expect(mockClearAnnotations).toHaveBeenCalled();
  });

  it('should display annotation count when annotations exist', () => {
    const mockAnnotations = [
      {
        id: '1',
        type: 'pencil' as const,
        points: [10, 10, 20, 20],
        color: '#00d4ff',
        strokeWidth: 2,
        timestamp: Date.now(),
      },
      {
        id: '2',
        type: 'arrow' as const,
        points: [30, 30, 40, 40],
        color: '#00d4ff',
        strokeWidth: 2,
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useUIStore).mockReturnValue({
      annotationMode: true,
      selectedTool: null,
      toolLibraryCollapsed: false,
      toggleToolLibrary: vi.fn(),
      setAnnotationMode: mockSetAnnotationMode,
      setSelectedTool: mockSetSelectedTool,
    });

    vi.mocked(useCanvasStore).mockReturnValue({
      annotations: mockAnnotations,
      clearAnnotations: mockClearAnnotations,
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      zoom: 1,
      pan: { x: 0, y: 0 },
      widgets: [],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      currentLanguage: 'en',
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      updateWidget: vi.fn(),
      duplicateWidget: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      saveWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      setLanguage: vi.fn(),
    });

    render(<AnnotationToolbar />);
    
    expect(screen.getByText('2 annotations')).toBeTruthy();
  });

  it('should disable clear button when no annotations exist', () => {
    vi.mocked(useUIStore).mockReturnValue({
      annotationMode: true,
      selectedTool: null,
      toolLibraryCollapsed: false,
      toggleToolLibrary: vi.fn(),
      setAnnotationMode: mockSetAnnotationMode,
      setSelectedTool: mockSetSelectedTool,
    });

    vi.mocked(useCanvasStore).mockReturnValue({
      annotations: [],
      clearAnnotations: mockClearAnnotations,
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      zoom: 1,
      pan: { x: 0, y: 0 },
      widgets: [],
      viewport: { width: 1920, height: 1080, offsetX: 0, offsetY: 0 },
      currentLanguage: 'en',
      addWidget: vi.fn(),
      removeWidget: vi.fn(),
      updateWidget: vi.fn(),
      duplicateWidget: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      saveWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      setLanguage: vi.fn(),
    });

    const { container } = render(<AnnotationToolbar />);
    
    const buttons = container.querySelectorAll('button');
    const clearButton = Array.from(buttons).find(btn => 
      btn.getAttribute('title')?.includes('Clear')
    );
    
    expect(clearButton?.hasAttribute('disabled')).toBe(true);
  });
});
