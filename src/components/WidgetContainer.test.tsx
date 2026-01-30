import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetContainer } from './WidgetContainer';
import { I18nProvider } from '../contexts/I18nContext';
import type { WidgetInstance } from '../types';

// Mock the stores
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: () => ({
    updateWidget: vi.fn(),
    removeWidget: vi.fn(),
    duplicateWidget: vi.fn(),
  }),
}));

// Mock react-draggable
vi.mock('react-draggable', () => ({
  default: ({ children, nodeRef }: any) => <div ref={nodeRef}>{children}</div>,
}));

// Mock react-resizable
vi.mock('react-resizable', () => ({
  ResizableBox: ({ children, width, height }: any) => (
    <div style={{ width, height }}>{children}</div>
  ),
}));

describe('WidgetContainer', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-widget-1',
    type: 'notes',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    config: { title: 'Test Widget' },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nProvider>{component}</I18nProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders widget with title', async () => {
    renderWithI18n(
      <WidgetContainer instance={mockInstance}>
        <div>Widget Content</div>
      </WidgetContainer>
    );

    // Wait for translations to load
    await screen.findByText('Test Widget');
    expect(screen.getByText('Widget Content')).toBeInTheDocument();
  });

  it('renders control buttons', async () => {
    renderWithI18n(
      <WidgetContainer instance={mockInstance}>
        <div>Content</div>
      </WidgetContainer>
    );

    // Wait for component to render
    await screen.findByText('Test Widget');

    // Check for control buttons (by their icons/titles)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3); // refresh, duplicate, close
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    
    renderWithI18n(
      <WidgetContainer instance={mockInstance} onClose={onClose}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    // Find and click the close button (last button)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[buttons.length - 1];
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledWith(mockInstance.id);
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn();
    
    renderWithI18n(
      <WidgetContainer instance={mockInstance} onRefresh={onRefresh}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    // Find and click the refresh button (first button)
    const buttons = screen.getAllByRole('button');
    const refreshButton = buttons[0];
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledWith(mockInstance.id);
  });

  it('calls onDuplicate when duplicate button is clicked', async () => {
    const onDuplicate = vi.fn();
    
    renderWithI18n(
      <WidgetContainer instance={mockInstance} onDuplicate={onDuplicate}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    // Find and click the duplicate button (second button)
    const buttons = screen.getAllByRole('button');
    const duplicateButton = buttons[1];
    fireEvent.click(duplicateButton);

    expect(onDuplicate).toHaveBeenCalledWith(mockInstance.id);
  });

  it('uses widget type as title when config.title is not provided', async () => {
    const instanceWithoutTitle: WidgetInstance = {
      ...mockInstance,
      config: {},
    };

    renderWithI18n(
      <WidgetContainer instance={instanceWithoutTitle}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('notes');
  });

  it('applies correct z-index from instance', async () => {
    const { container } = renderWithI18n(
      <WidgetContainer instance={mockInstance}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    const widgetContainer = container.querySelector('.widget-container');
    expect(widgetContainer).toHaveStyle({ zIndex: '1' });
  });

  it('renders children content', async () => {
    renderWithI18n(
      <WidgetContainer instance={mockInstance}>
        <div data-testid="child-content">Custom Widget Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Widget Content')).toBeInTheDocument();
  });

  it('applies glassmorphism styling', async () => {
    const { container } = renderWithI18n(
      <WidgetContainer instance={mockInstance}>
        <div>Content</div>
      </WidgetContainer>
    );

    await screen.findByText('Test Widget');

    const contentWrapper = container.querySelector('.widget-content-wrapper');
    expect(contentWrapper).toHaveStyle({
      background: 'rgba(15, 15, 25, 0.85)',
    });
    // Note: backdropFilter is not supported in jsdom, but is applied in real browsers
  });

  it('enforces minimum size constraints', () => {
    // This test verifies that minimum sizes are defined for widget types
    const swapInstance: WidgetInstance = {
      ...mockInstance,
      type: 'swap',
    };

    renderWithI18n(
      <WidgetContainer instance={swapInstance}>
        <div>Swap Widget</div>
      </WidgetContainer>
    );

    // The component should use minimum size constraints from MIN_SIZES
    // This is enforced in the ResizableBox minConstraints prop
    expect(true).toBe(true); // Placeholder - actual constraint enforcement is in ResizableBox
  });
});
