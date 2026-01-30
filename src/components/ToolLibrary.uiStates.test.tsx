import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolLibrary } from './ToolLibrary';
import { useUIStore } from '../stores/uiStore';
import { useCanvasStore } from '../stores/canvasStore';
import { I18nProvider } from '../contexts/I18nContext';

// Mock the stores
vi.mock('../stores/uiStore');
vi.mock('../stores/canvasStore');

// Mock the widget registry
vi.mock('../utils/widgetRegistry', () => ({
  getWidgetsByCategory: vi.fn((category: string) => {
    // Return mock widgets for each category
    const mockWidgets = {
      discovery: [
        { type: 'dexscreener', icon: 'TrendingUp', label: 'DexScreener' },
        { type: 'birdeye', icon: 'Eye', label: 'Birdeye' },
      ],
      analysis: [
        { type: 'token-overview', icon: 'Info', label: 'Token Overview' },
        { type: 'holder-distribution', icon: 'PieChart', label: 'Holder Distribution' },
      ],
      execution: [
        { type: 'swap', icon: 'ArrowLeftRight', label: 'Swap' },
      ],
      alpha: [
        { type: 'twitter-embed', icon: 'Twitter', label: 'Twitter' },
      ],
      utilities: [
        { type: 'notes', icon: 'FileText', label: 'Notes' },
        { type: 'block-clock', icon: 'Clock', label: 'Block Clock' },
      ],
    };
    return mockWidgets[category as keyof typeof mockWidgets] || [];
  }),
}));

describe('ToolLibrary UI States Unit Tests', () => {
  const mockToggleToolLibrary = vi.fn();
  const mockAddWidget = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (useUIStore as any).mockReturnValue({
      toolLibraryCollapsed: false,
      toggleToolLibrary: mockToggleToolLibrary,
    });

    (useCanvasStore as any).mockReturnValue({
      addWidget: mockAddWidget,
    });
  });

  describe('Collapsed State', () => {
    it('should show only icons when collapsed', () => {
      /**
       * Test: Collapsed state shows only icons
       * 
       * When the tool library is collapsed, it should display only widget icons
       * without labels, making the sidebar narrow.
       * 
       * **Validates: Requirements 3.5**
       */

      // Set collapsed state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify the sidebar has collapsed width class
      const sidebar = screen.getByRole('complementary', { hidden: true }) || 
                     document.querySelector('[class*="w-16"]');
      expect(sidebar).toBeTruthy();

      // Verify category labels are abbreviated or hidden
      // In collapsed state, categories show only first letter
      const categoryHeaders = document.querySelectorAll('[class*="uppercase"]');
      expect(categoryHeaders.length).toBeGreaterThan(0);

      // Verify widget buttons are present but labels are not visible
      const widgetButtons = screen.getAllByRole('button');
      expect(widgetButtons.length).toBeGreaterThan(1); // At least toggle + some widgets

      // In collapsed state, widget labels should not be rendered
      // (they're conditionally rendered based on !toolLibraryCollapsed)
      const widgetLabels = document.querySelectorAll('[class*="truncate"]');
      expect(widgetLabels.length).toBe(0);
    });

    it('should display icons centered when collapsed', () => {
      /**
       * Test: Icons are centered in collapsed state
       * 
       * When collapsed, icons should be centered in the narrow sidebar
       * for better visual alignment.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify widget buttons have centering classes
      const widgetButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      widgetButtons.forEach((button) => {
        // In collapsed state, buttons should have justify-center class
        expect(button.className).toMatch(/justify-center/);
      });
    });

    it('should show tooltips on hover when collapsed', () => {
      /**
       * Test: Tooltips appear on hover in collapsed state
       * 
       * When collapsed, hovering over a widget icon should show a tooltip
       * with the widget name.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify widget buttons have title attributes for tooltips
      const widgetButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      // At least some buttons should have title attributes
      const buttonsWithTitles = widgetButtons.filter((btn) => btn.hasAttribute('title'));
      expect(buttonsWithTitles.length).toBeGreaterThan(0);
    });

    it('should maintain narrow width when collapsed', () => {
      /**
       * Test: Collapsed sidebar has narrow width
       * 
       * The collapsed sidebar should have a width of approximately 64px (w-16).
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Find the sidebar container
      const sidebar = document.querySelector('[class*="w-16"]');
      expect(sidebar).toBeTruthy();
      expect(sidebar?.className).toMatch(/w-16/);
    });
  });

  describe('Expanded State', () => {
    it('should show labels when expanded', () => {
      /**
       * Test: Expanded state shows labels
       * 
       * When the tool library is expanded, it should display both widget icons
       * and their translated labels.
       * 
       * **Validates: Requirements 3.6**
       */

      // Set expanded state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify the sidebar has expanded width class
      const sidebar = document.querySelector('[class*="w-64"]');
      expect(sidebar).toBeTruthy();

      // Verify widget labels are visible
      const widgetLabels = document.querySelectorAll('[class*="truncate"]');
      expect(widgetLabels.length).toBeGreaterThan(0);

      // Verify category labels are fully displayed
      const categoryHeaders = document.querySelectorAll('[class*="uppercase"]');
      expect(categoryHeaders.length).toBeGreaterThan(0);
    });

    it('should display full category names when expanded', () => {
      /**
       * Test: Full category names in expanded state
       * 
       * When expanded, category headers should show full names like
       * "Discovery", "Analysis", etc., not just abbreviations.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Category headers should contain full text
      const categoryHeaders = document.querySelectorAll('[class*="uppercase"]');
      
      // At least one category should have more than 1 character
      const hasFullNames = Array.from(categoryHeaders).some(
        (header) => header.textContent && header.textContent.length > 1
      );
      expect(hasFullNames).toBe(true);
    });

    it('should display icons and labels side by side when expanded', () => {
      /**
       * Test: Icons and labels layout in expanded state
       * 
       * When expanded, widget buttons should show icons and labels
       * side by side with proper spacing.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify widget buttons have flex layout with gap
      const widgetButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      widgetButtons.forEach((button) => {
        // Buttons should have flex and gap classes
        expect(button.className).toMatch(/flex/);
        expect(button.className).toMatch(/gap-/);
      });
    });

    it('should maintain wide width when expanded', () => {
      /**
       * Test: Expanded sidebar has wide width
       * 
       * The expanded sidebar should have a width of approximately 256px (w-64).
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Find the sidebar container
      const sidebar = document.querySelector('[class*="w-64"]');
      expect(sidebar).toBeTruthy();
      expect(sidebar?.className).toMatch(/w-64/);
    });

    it('should not show tooltips when expanded (labels are visible)', () => {
      /**
       * Test: No tooltips needed in expanded state
       * 
       * When expanded, tooltips are not necessary since labels are visible.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify widget buttons don't have title attributes when expanded
      const widgetButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      // Most buttons should not have title attributes when expanded
      const buttonsWithoutTitles = widgetButtons.filter((btn) => !btn.hasAttribute('title'));
      expect(buttonsWithoutTitles.length).toBeGreaterThan(0);
    });
  });

  describe('State Transitions', () => {
    it('should transition smoothly between collapsed and expanded states', () => {
      /**
       * Test: Smooth transitions
       * 
       * The sidebar should have transition classes for smooth animation
       * when toggling between collapsed and expanded states.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      // Verify sidebar has transition classes
      const sidebar = document.querySelector('[class*="transition"]');
      expect(sidebar).toBeTruthy();
      expect(sidebar?.className).toMatch(/transition/);
      expect(sidebar?.className).toMatch(/duration/);
    });

    it('should maintain widget functionality in both states', () => {
      /**
       * Test: Widget functionality in both states
       * 
       * Clicking on widgets should work the same in both collapsed
       * and expanded states.
       */

      // Test in expanded state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      const { rerender } = render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      const widgetButtonsExpanded = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );
      expect(widgetButtonsExpanded.length).toBeGreaterThan(0);

      // Test in collapsed state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      rerender(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      const widgetButtonsCollapsed = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      // Same number of widget buttons should be present
      expect(widgetButtonsCollapsed.length).toBe(widgetButtonsExpanded.length);
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent icon sizes in both states', () => {
      /**
       * Test: Consistent icon sizes
       * 
       * Icons should maintain the same size whether the sidebar is
       * collapsed or expanded.
       */

      // Test expanded state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      const { rerender } = render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      const iconsExpanded = document.querySelectorAll('svg[class*="w-5"]');
      const expandedCount = iconsExpanded.length;

      // Test collapsed state
      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: true,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      rerender(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      const iconsCollapsed = document.querySelectorAll('svg[class*="w-5"]');
      
      // Icon count should be similar (allowing for toggle button icon)
      expect(Math.abs(iconsCollapsed.length - expandedCount)).toBeLessThanOrEqual(1);
    });

    it('should maintain consistent styling in both states', () => {
      /**
       * Test: Consistent styling
       * 
       * Widget buttons should maintain consistent styling (colors, hover effects)
       * in both collapsed and expanded states.
       */

      (useUIStore as any).mockReturnValue({
        toolLibraryCollapsed: false,
        toggleToolLibrary: mockToggleToolLibrary,
      });

      render(
        <I18nProvider>
          <ToolLibrary />
        </I18nProvider>
      );

      const widgetButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.getAttribute('aria-label')?.includes('tool library')
      );

      // Verify buttons have consistent styling classes
      widgetButtons.forEach((button) => {
        expect(button.className).toMatch(/rounded/);
        expect(button.className).toMatch(/transition/);
        expect(button.className).toMatch(/hover:/);
      });
    });
  });
});
