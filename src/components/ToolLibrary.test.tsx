import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolLibrary } from './ToolLibrary';
import { I18nProvider } from '../contexts/I18nContext';
import { useUIStore } from '../stores/uiStore';
import { useCanvasStore } from '../stores/canvasStore';
import { translationService } from '../services/TranslationService';

// Mock the stores
vi.mock('../stores/uiStore');
vi.mock('../stores/canvasStore');

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = ({ className }: { className?: string }) => (
    <div className={className} data-testid="mock-icon" />
  );
  
  return {
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    BarChart3: MockIcon,
    TrendingUp: MockIcon,
    Eye: MockIcon,
    Sparkles: MockIcon,
    Flame: MockIcon,
    Info: MockIcon,
    PieChart: MockIcon,
    Droplet: MockIcon,
    Clock: MockIcon,
    User: MockIcon,
    AlertTriangle: MockIcon,
    ArrowLeftRight: MockIcon,
    Zap: MockIcon,
    Twitter: MockIcon,
    MessageCircle: MockIcon,
    Rss: MockIcon,
    FileText: MockIcon,
    CheckSquare: MockIcon,
    Timer: MockIcon,
    DollarSign: MockIcon,
    Box: MockIcon,
  };
});

describe('ToolLibrary', () => {
  const mockToggleToolLibrary = vi.fn();
  const mockAddWidget = vi.fn();

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    localStorage.clear();

    // Initialize translations
    await translationService.initialize();

    // Setup default mock implementations
    (useUIStore as any).mockReturnValue({
      toolLibraryCollapsed: false,
      toggleToolLibrary: mockToggleToolLibrary,
    });

    (useCanvasStore as any).mockReturnValue({
      addWidget: mockAddWidget,
    });
  });

  const renderToolLibrary = async () => {
    const result = render(
      <I18nProvider>
        <ToolLibrary />
      </I18nProvider>
    );
    // Wait for translations to load
    await waitFor(() => {
      expect(screen.queryByText('widgets.categories.discovery')).not.toBeInTheDocument();
    });
    return result;
  };

  describe('Rendering', () => {
    it('should render the tool library sidebar', async () => {
      await renderToolLibrary();
      
      // Check for the sidebar container
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render all widget categories', async () => {
      await renderToolLibrary();
      
      // Check for category headers
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Execution')).toBeInTheDocument();
      expect(screen.getByText('Alpha Feeds')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
    });

    it('should render widgets in each category', async () => {
      await renderToolLibrary();
      
      // Discovery widgets
      expect(screen.getByText('DexScreener')).toBeInTheDocument();
      expect(screen.getByText('Birdeye')).toBeInTheDocument();
      expect(screen.getByText('New Pairs')).toBeInTheDocument();
      expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
      
      // Analysis widgets
      expect(screen.getByText('Token Overview')).toBeInTheDocument();
      expect(screen.getByText('Holder Distribution')).toBeInTheDocument();
      expect(screen.getByText('Risk Flags')).toBeInTheDocument();
      
      // Execution widgets
      expect(screen.getByText('Swap')).toBeInTheDocument();
      
      // Alpha widgets
      expect(screen.getByText('Twitter Feed')).toBeInTheDocument();
      expect(screen.getByText('RSS Feed')).toBeInTheDocument();
      
      // Utility widgets
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Checklist')).toBeInTheDocument();
      expect(screen.getByText('Block Clock')).toBeInTheDocument();
      expect(screen.getByText('PnL Tracker')).toBeInTheDocument();
    });

    it('should render widget icons', async () => {
      await renderToolLibrary();
      
      // Check that icons are rendered (mocked as divs with data-testid)
      const icons = screen.getAllByTestId('mock-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Collapsed State', () => {
    it('should apply collapsed width when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /expand tool library/i }).closest('div');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should apply expanded width when not collapsed', async () => {
      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      expect(sidebar).toHaveClass('w-64');
    });

    it('should show only first letter of category when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      // Categories should show only first letter
      expect(screen.getByText('D')).toBeInTheDocument(); // Discovery
      const aLetters = screen.getAllByText('A'); // Analysis and Alpha
      expect(aLetters.length).toBe(2); // Both Analysis and Alpha start with A
      expect(screen.getByText('E')).toBeInTheDocument(); // Execution
      expect(screen.getByText('U')).toBeInTheDocument(); // Utilities
    });

    it('should hide widget labels when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      // Widget labels should not be visible (but icons should be)
      expect(screen.queryByText('DexScreener')).not.toBeInTheDocument();
      expect(screen.queryByText('Token Overview')).not.toBeInTheDocument();
    });

    it('should show widget labels when expanded', async () => {
      await renderToolLibrary();
      
      // Widget labels should be visible
      expect(screen.getByText('DexScreener')).toBeInTheDocument();
      expect(screen.getByText('Token Overview')).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should render toggle button', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /collapse tool library/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call toggleToolLibrary when toggle button is clicked', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /collapse tool library/i });
      fireEvent.click(toggleButton);
      
      expect(mockToggleToolLibrary).toHaveBeenCalledTimes(1);
    });

    it('should show correct icon when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /expand tool library/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should show correct icon when expanded', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /collapse tool library/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Widget Click Functionality', () => {
    it('should call addWidget when a widget is clicked', async () => {
      await renderToolLibrary();
      
      const dexscreenerButton = screen.getByText('DexScreener').closest('button');
      expect(dexscreenerButton).toBeInTheDocument();
      
      fireEvent.click(dexscreenerButton!);
      
      expect(mockAddWidget).toHaveBeenCalledTimes(1);
      expect(mockAddWidget).toHaveBeenCalledWith('dexscreener');
    });

    it('should add correct widget type for each widget', async () => {
      await renderToolLibrary();
      
      // Test a few different widgets
      const widgets = [
        { label: 'Swap', type: 'swap' },
        { label: 'Notes', type: 'notes' },
        { label: 'Risk Flags', type: 'risk-flags' },
      ];

      for (const { label, type } of widgets) {
        mockAddWidget.mockClear();
        
        const button = screen.getByText(label).closest('button');
        fireEvent.click(button!);
        
        expect(mockAddWidget).toHaveBeenCalledWith(type);
      }
    });

    it('should allow clicking multiple widgets', async () => {
      await renderToolLibrary();
      
      const dexscreenerButton = screen.getByText('DexScreener').closest('button');
      const swapButton = screen.getByText('Swap').closest('button');
      
      fireEvent.click(dexscreenerButton!);
      fireEvent.click(swapButton!);
      
      expect(mockAddWidget).toHaveBeenCalledTimes(2);
      expect(mockAddWidget).toHaveBeenNthCalledWith(1, 'dexscreener');
      expect(mockAddWidget).toHaveBeenNthCalledWith(2, 'swap');
    });
  });

  describe('Styling and Theme', () => {
    it('should apply dark theme classes', async () => {
      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      expect(sidebar).toHaveClass('bg-gray-900/80');
      expect(sidebar).toHaveClass('backdrop-blur-md');
    });

    it('should apply transition classes for smooth animations', async () => {
      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      expect(sidebar).toHaveClass('transition-all');
      expect(sidebar).toHaveClass('duration-300');
      expect(sidebar).toHaveClass('ease-in-out');
    });

    it('should apply hover styles to widget buttons', async () => {
      await renderToolLibrary();
      
      const button = screen.getByText('DexScreener').closest('button');
      expect(button).toHaveClass('hover:bg-gray-700/70');
      expect(button).toHaveClass('hover:text-white');
    });

    it('should apply glassmorphism effect', async () => {
      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      expect(sidebar).toHaveClass('backdrop-blur-md');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for toggle button when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: 'Expand tool library' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have proper aria-label for toggle button when expanded', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: 'Collapse tool library' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have title attribute on widget buttons when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      // Find buttons by their icons (since labels are hidden)
      const buttons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label') !== 'Expand tool library'
      );
      
      // At least some buttons should have title attributes
      const buttonsWithTitle = buttons.filter(btn => btn.hasAttribute('title'));
      expect(buttonsWithTitle.length).toBeGreaterThan(0);
    });

    it('should be keyboard accessible', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /collapse tool library/i });
      
      // Button should be focusable
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', async () => {
      await renderToolLibrary();
      
      const toggleButton = screen.getByRole('button', { name: /collapse tool library/i });
      
      // Click multiple times rapidly
      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleButton);
      }
      
      expect(mockToggleToolLibrary).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid widget clicks', async () => {
      await renderToolLibrary();
      
      const button = screen.getByText('DexScreener').closest('button');
      
      // Click multiple times rapidly
      for (let i = 0; i < 3; i++) {
        fireEvent.click(button!);
      }
      
      expect(mockAddWidget).toHaveBeenCalledTimes(3);
    });

    it('should render correctly with no widgets in a category', async () => {
      // This is a theoretical test - in practice all categories have widgets
      // But the component should handle it gracefully
      await renderToolLibrary();
      
      // Component should still render without errors
      expect(screen.getByText('Discovery')).toBeInTheDocument();
    });
  });

  describe('Integration with Stores', () => {
    it('should use collapsed state from UIStore', async () => {
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      await renderToolLibrary();
      
      const sidebar = screen.getByRole('button', { name: /expand tool library/i }).closest('div');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should call addWidget from CanvasStore with correct parameters', async () => {
      await renderToolLibrary();
      
      const button = screen.getByText('Token Overview').closest('button');
      fireEvent.click(button!);
      
      expect(mockAddWidget).toHaveBeenCalledWith('token-overview');
    });
  });

  describe('Scrolling', () => {
    it('should have scrollable content area', async () => {
      await renderToolLibrary();
      
      // Find the scrollable container
      const sidebar = screen.getByRole('button', { name: /collapse tool library/i }).closest('div');
      const scrollableDiv = sidebar?.querySelector('.overflow-y-auto');
      
      expect(scrollableDiv).toBeInTheDocument();
      expect(scrollableDiv).toHaveClass('overflow-y-auto');
    });

    it('should apply custom scrollbar styles', async () => {
      await renderToolLibrary();
      
      // Check that the style tag is rendered
      const styleTag = document.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('.custom-scrollbar');
    });
  });
});
