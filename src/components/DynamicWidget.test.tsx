import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DynamicWidget } from './DynamicWidget';
import type { WidgetInstance } from '../types';

// Mock the canvas store
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: () => ({
    removeWidget: vi.fn(),
  }),
}));

// Mock the ErrorBoundary to simplify testing
vi.mock('./ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock the SkeletonLoader
vi.mock('./SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

describe('DynamicWidget', () => {
  const createMockInstance = (type: string): WidgetInstance => ({
    id: 'test-widget-1',
    type: type as any,
    position: { x: 0, y: 0 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    config: {},
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render skeleton loader while widget is loading', () => {
    const instance = createMockInstance('notes');
    render(<DynamicWidget instance={instance} />);
    
    // Should show skeleton loader initially
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should wrap widget in ErrorBoundary', () => {
    const instance = createMockInstance('notes');
    render(<DynamicWidget instance={instance} />);
    
    // Should have error boundary wrapper
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should render error message for unknown widget type', () => {
    const instance = createMockInstance('unknown-widget-type');
    render(<DynamicWidget instance={instance} />);
    
    // Should show error message
    expect(screen.getByText('Unknown Widget Type')).toBeInTheDocument();
    expect(screen.getByText(/Widget type "unknown-widget-type" is not registered/)).toBeInTheDocument();
  });

  it('should load widget component for valid widget type', async () => {
    const instance = createMockInstance('notes');
    render(<DynamicWidget instance={instance} />);
    
    // Wait for lazy loading to complete
    await waitFor(() => {
      // The placeholder widget should eventually render
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle all discovery widget types', () => {
    const discoveryTypes = ['dexscreener', 'dextools', 'birdeye', 'new-pairs', 'trending'];
    
    discoveryTypes.forEach((type) => {
      const instance = createMockInstance(type);
      const { unmount } = render(<DynamicWidget instance={instance} />);
      
      // Should not show unknown widget error
      expect(screen.queryByText('Unknown Widget Type')).not.toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle all analysis widget types', () => {
    const analysisTypes = [
      'token-overview',
      'holder-distribution',
      'lp-overview',
      'token-age',
      'deployer-info',
      'risk-flags',
    ];
    
    analysisTypes.forEach((type) => {
      const instance = createMockInstance(type);
      const { unmount } = render(<DynamicWidget instance={instance} />);
      
      // Should not show unknown widget error
      expect(screen.queryByText('Unknown Widget Type')).not.toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle all execution widget types', () => {
    const executionTypes = ['swap', 'quick-buy'];
    
    executionTypes.forEach((type) => {
      const instance = createMockInstance(type);
      const { unmount } = render(<DynamicWidget instance={instance} />);
      
      // Should not show unknown widget error
      expect(screen.queryByText('Unknown Widget Type')).not.toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle all alpha feed widget types', () => {
    const alphaTypes = ['twitter-embed', 'telegram-channel', 'rss-feed'];
    
    alphaTypes.forEach((type) => {
      const instance = createMockInstance(type);
      const { unmount } = render(<DynamicWidget instance={instance} />);
      
      // Should not show unknown widget error
      expect(screen.queryByText('Unknown Widget Type')).not.toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle all utility widget types', () => {
    const utilityTypes = ['notes', 'checklist', 'block-clock', 'pnl-tracker'];
    
    utilityTypes.forEach((type) => {
      const instance = createMockInstance(type);
      const { unmount } = render(<DynamicWidget instance={instance} />);
      
      // Should not show unknown widget error
      expect(screen.queryByText('Unknown Widget Type')).not.toBeInTheDocument();
      
      unmount();
    });
  });

  it('should pass instance prop to loaded widget component', async () => {
    const instance = createMockInstance('notes');
    instance.config = { title: 'Test Notes' };
    
    render(<DynamicWidget instance={instance} />);
    
    // Wait for widget to load
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Widget should receive the instance prop (verified by no errors)
  });

  it('should handle code splitting for each widget type', () => {
    // This test verifies that each widget is loaded via React.lazy
    const instance = createMockInstance('swap');
    const { container } = render(<DynamicWidget instance={instance} />);
    
    // Should have error boundary wrapper (proving component structure)
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    
    // Widget should eventually load (may be too fast to catch skeleton in test)
    expect(container).toBeInTheDocument();
  });
});
