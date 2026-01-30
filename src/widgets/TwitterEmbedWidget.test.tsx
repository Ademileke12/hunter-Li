/**
 * Unit tests for TwitterEmbedWidget
 * 
 * Tests:
 * - Initial empty state rendering
 * - Configuration input and submission
 * - Tweet URL fetching and embedding
 * - Error handling for failed embeds
 * - Loading states
 * - Username vs tweet URL handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwitterEmbedWidget from './TwitterEmbedWidget';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

// Mock the canvas store
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('TwitterEmbedWidget', () => {
  let mockUpdateWidget: ReturnType<typeof vi.fn>;
  let mockInstance: WidgetInstance;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
    });

    mockInstance = {
      id: 'test-widget-1',
      type: 'twitter-embed',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      zIndex: 1,
      config: {},
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Reset fetch mock
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render empty state when no tweet URL is configured', () => {
      render(<TwitterEmbedWidget instance={mockInstance} />);

      expect(screen.getByText('Twitter Embed')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('@username or tweet URL')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load tweet/i })).toBeInTheDocument();
    });

    it('should show input field with placeholder text', () => {
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      expect(input).toHaveValue('');
    });
  });

  describe('Configuration Input', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      await user.type(input, 'https://twitter.com/user/status/123');

      expect(input).toHaveValue('https://twitter.com/user/status/123');
    });

    it('should call updateWidget when form is submitted with tweet URL', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      const button = screen.getByRole('button', { name: /load tweet/i });

      await user.type(input, 'https://twitter.com/user/status/123');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          tweetUrl: 'https://twitter.com/user/status/123',
          isUsername: false,
        },
      });
    });

    it('should handle username input starting with @', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      const button = screen.getByRole('button', { name: /load tweet/i });

      await user.type(input, '@elonmusk');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          tweetUrl: 'https://twitter.com/elonmusk',
          isUsername: true,
        },
      });
    });

    it('should handle username input without @', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      const button = screen.getByRole('button', { name: /load tweet/i });

      await user.type(input, 'elonmusk');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          tweetUrl: 'https://twitter.com/elonmusk',
          isUsername: true,
        },
      });
    });

    it('should not submit empty input', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const button = screen.getByRole('button', { name: /load tweet/i });
      await user.click(button);

      expect(mockUpdateWidget).not.toHaveBeenCalled();
    });

    it('should trim whitespace from input', async () => {
      const user = userEvent.setup();
      render(<TwitterEmbedWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@username or tweet URL');
      const button = screen.getByRole('button', { name: /load tweet/i });

      await user.type(input, '  https://twitter.com/user/status/123  ');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          tweetUrl: 'https://twitter.com/user/status/123',
          isUsername: false,
        },
      });
    });
  });

  describe('Tweet Embedding', () => {
    it('should show loading state while fetching tweet', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      // Mock fetch to never resolve
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Loading tweet...')).toBeInTheDocument();
      });
    });

    it('should fetch and display tweet embed successfully', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      const mockEmbedHtml = '<blockquote class="twitter-tweet"><p>Test tweet</p></blockquote>';
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: mockEmbedHtml,
          url: 'https://twitter.com/user/status/123',
          author_name: 'Test User',
          author_url: 'https://twitter.com/user',
          width: 550,
          height: null,
        }),
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        const container = screen.getByText((content, element) => {
          return element?.className === 'twitter-embed-container';
        });
        expect(container).toBeInTheDocument();
      });
    });

    it('should call Twitter oEmbed API with correct URL', async () => {
      const tweetUrl = 'https://twitter.com/user/status/123';
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: '<blockquote></blockquote>',
          url: tweetUrl,
          author_name: 'Test',
          author_url: 'https://twitter.com/test',
          width: 550,
          height: null,
        }),
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Tweet')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch tweet embed')).toBeInTheDocument();
      });
    });

    it('should display error message when network error occurs', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Tweet')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show special error message for username embeds', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: {
          tweetUrl: 'https://twitter.com/elonmusk',
          isUsername: true,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Username Embed Not Supported')).toBeInTheDocument();
        expect(
          screen.getByText(/Twitter oEmbed API only supports individual tweet URLs/i)
        ).toBeInTheDocument();
      });
    });

    it('should allow user to try another tweet after error', async () => {
      const user = userEvent.setup();
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Tweet')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /try another tweet/i });
      await user.click(tryAgainButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: { tweetUrl: '' },
      });
    });
  });

  describe('Twitter Widgets Script Loading', () => {
    it('should load Twitter widgets script when embed HTML is available', async () => {
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      const mockEmbedHtml = '<blockquote class="twitter-tweet"><p>Test tweet</p></blockquote>';
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: mockEmbedHtml,
          url: 'https://twitter.com/user/status/123',
          author_name: 'Test User',
          author_url: 'https://twitter.com/user',
          width: 550,
          height: null,
        }),
      });

      render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        // Check if script was added to document
        const scripts = document.querySelectorAll('script[src*="twitter.com/widgets.js"]');
        expect(scripts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config object', () => {
      const instanceWithEmptyConfig = {
        ...mockInstance,
        config: {},
      };

      render(<TwitterEmbedWidget instance={instanceWithEmptyConfig} />);

      expect(screen.getByText('Twitter Embed')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('@username or tweet URL')).toBeInTheDocument();
    });

    it('should handle undefined config', () => {
      const instanceWithUndefinedConfig = {
        ...mockInstance,
        config: undefined as any,
      };

      render(<TwitterEmbedWidget instance={instanceWithUndefinedConfig} />);

      expect(screen.getByText('Twitter Embed')).toBeInTheDocument();
    });

    it('should clear error when tweet URL is removed', async () => {
      const user = userEvent.setup();
      const instanceWithUrl = {
        ...mockInstance,
        config: { tweetUrl: 'https://twitter.com/user/status/123' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { rerender } = render(<TwitterEmbedWidget instance={instanceWithUrl} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Tweet')).toBeInTheDocument();
      });

      // Update instance to remove URL
      const updatedInstance = {
        ...instanceWithUrl,
        config: { tweetUrl: '' },
      };

      rerender(<TwitterEmbedWidget instance={updatedInstance} />);

      // Should show empty state again
      expect(screen.getByText('Twitter Embed')).toBeInTheDocument();
      expect(screen.queryByText('Failed to Load Tweet')).not.toBeInTheDocument();
    });
  });
});
