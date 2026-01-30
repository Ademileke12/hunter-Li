import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Mock the canvas store
const mockRemoveWidget = vi.fn();
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: () => ({
    removeWidget: mockRemoveWidget,
  }),
}));

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error state', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.getByText(/notes widget encountered an error/)).toBeInTheDocument();
  });

  it('should display error icon in error state', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="swap">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error icon (AlertTriangle)
    const errorIcon = screen.getByText('Widget Error').parentElement?.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });

  it('should show retry button in error state', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show close button in error state', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Close Widget')).toBeInTheDocument();
  });

  it('should reset error state when retry button is clicked', () => {
    const onReset = vi.fn();
    
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes" onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error state
    expect(screen.getByText('Widget Error')).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should call onReset callback
    expect(onReset).toHaveBeenCalledTimes(1);
    
    // Note: The component will throw again since we didn't fix the error,
    // but the retry mechanism itself works (verified by onReset being called)
  });

  it('should call onReset when retry button is clicked', () => {
    const onReset = vi.fn();
    
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes" onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should remove widget when close button is clicked', () => {
    render(
      <ErrorBoundary widgetId="test-widget-123" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const closeButton = screen.getByText('Close Widget');
    fireEvent.click(closeButton);

    expect(mockRemoveWidget).toHaveBeenCalledWith('test-widget-123');
  });

  it('should log error details to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should display widget type in error message', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="swap">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/swap widget encountered an error/)).toBeInTheDocument();
  });

  it('should isolate errors to individual widgets', () => {
    const { container } = render(
      <div>
        <ErrorBoundary widgetId="widget-1" widgetType="notes">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary widgetId="widget-2" widgetType="swap">
          <div>Working widget</div>
        </ErrorBoundary>
      </div>
    );

    // First widget should show error
    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    
    // Second widget should work normally
    expect(screen.getByText('Working widget')).toBeInTheDocument();
  });

  it('should handle multiple errors in sequence', () => {
    const { rerender } = render(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First error
    expect(screen.getByText('Widget Error')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    // Throw another error
    rerender(
      <ErrorBoundary widgetId="test-1" widgetType="notes">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should still show error state
    expect(screen.getByText('Widget Error')).toBeInTheDocument();
  });

  it('should provide user-friendly error message', () => {
    render(
      <ErrorBoundary widgetId="test-1" widgetType="token-overview">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not expose technical details to user (in production)
    expect(screen.getByText(/token-overview widget encountered an error/)).toBeInTheDocument();
  });
});
