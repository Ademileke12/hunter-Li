/**
 * Unit tests for RSSFeedWidget
 * 
 * Tests:
 * - Initial state shows configuration form
 * - Feed URL submission updates widget config
 * - RSS feed parsing and display
 * - Error handling for invalid feeds
 * - Click to open in new tab
 * - Date formatting
 * - HTML stripping from descriptions
 * - Auto-refresh functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RSSFeedWidget from './RSSFeedWidget';
import type { WidgetInstance } from '../types';

// Mock canvas store
const mockUpdateWidget = vi.fn();
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: () => ({
    updateWidget: mockUpdateWidget,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const createMockInstance = (config: Record<string, any> = {}): WidgetInstance => ({
  id: 'test-rss-feed-1',
  type: 'rss-feed',
  position: { x: 0, y: 0 },
  size: { width: 500, height: 600 },
  zIndex: 1,
  config: {
    feedUrl: '',
    limit: 10,
    autoRefresh: true,
    refreshInterval: 300000,
    ...config,
  },
  state: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <description>Test RSS Feed</description>
    <item>
      <title>First Article</title>
      <description>This is the first article description</description>
      <link>https://example.com/article1</link>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <guid>article-1</guid>
    </item>
    <item>
      <title>Second Article</title>
      <description><![CDATA[<p>This is <strong>HTML</strong> content</p>]]></description>
      <link>https://example.com/article2</link>
      <pubDate>Mon, 01 Jan 2024 11:00:00 GMT</pubDate>
      <guid>article-2</guid>
    </item>
  </channel>
</rss>`;

describe('RSSFeedWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should show configuration form when no feed URL is set', () => {
      const instance = createMockInstance();
      render(<RSSFeedWidget instance={instance} />);

      expect(screen.getByText('RSS Feed')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/rss.xml')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load feed/i })).toBeInTheDocument();
    });

    it('should show example feed URL hint', () => {
      const instance = createMockInstance();
      render(<RSSFeedWidget instance={instance} />);

      expect(screen.getByText(/example: https:\/\/solana.com\/rss.xml/i)).toBeInTheDocument();
    });
  });

  describe('Feed URL Configuration', () => {
    it('should update widget config when feed URL is submitted', async () => {
      const user = userEvent.setup({ delay: null });
      const instance = createMockInstance();
      render(<RSSFeedWidget instance={instance} />);

      const input = screen.getByPlaceholderText('https://example.com/rss.xml');
      const submitButton = screen.getByRole('button', { name: /load feed/i });

      await user.type(input, 'https://example.com/feed.xml');
      await user.click(submitButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-rss-feed-1', {
        config: expect.objectContaining({
          feedUrl: 'https://example.com/feed.xml',
        }),
      });
    });

    it('should trim whitespace from feed URL', async () => {
      const user = userEvent.setup({ delay: null });
      const instance = createMockInstance();
      render(<RSSFeedWidget instance={instance} />);

      const input = screen.getByPlaceholderText('https://example.com/rss.xml');
      const submitButton = screen.getByRole('button', { name: /load feed/i });

      await user.type(input, '  https://example.com/feed.xml  ');
      await user.click(submitButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-rss-feed-1', {
        config: expect.objectContaining({
          feedUrl: 'https://example.com/feed.xml',
        }),
      });
    });

    it('should not submit empty feed URL', async () => {
      const user = userEvent.setup({ delay: null });
      const instance = createMockInstance();
      render(<RSSFeedWidget instance={instance} />);

      const submitButton = screen.getByRole('button', { name: /load feed/i });
      await user.click(submitButton);

      expect(mockUpdateWidget).not.toHaveBeenCalled();
    });
  });

  describe('RSS Feed Fetching and Parsing', () => {
    it('should fetch and display RSS feed items', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      // Should show loading state initially
      expect(screen.getByText('Loading feed...')).toBeInTheDocument();

      // Wait for feed to load
      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });

      expect(screen.getByText('Second Article')).toBeInTheDocument();
      expect(screen.getByText(/this is the first article description/i)).toBeInTheDocument();
    });

    it('should strip HTML from descriptions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Second Article')).toBeInTheDocument();
      });

      // Should strip HTML tags from description
      const description = screen.getByText(/this is html content/i);
      expect(description.textContent).not.toContain('<p>');
      expect(description.textContent).not.toContain('<strong>');
    });

    it('should limit items to configured limit', async () => {
      const largeFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    ${Array.from({ length: 20 }, (_, i) => `
      <item>
        <title>Article ${i + 1}</title>
        <description>Description ${i + 1}</description>
        <link>https://example.com/article${i + 1}</link>
        <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      </item>
    `).join('')}
  </channel>
</rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: largeFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
        limit: 5,
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Article 1')).toBeInTheDocument();
      });

      // Should only show 5 items
      expect(screen.getByText('Article 5')).toBeInTheDocument();
      expect(screen.queryByText('Article 6')).not.toBeInTheDocument();
    });

    it('should display publish dates in relative format', async () => {
      const recentFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Recent Article</title>
      <description>Recent content</description>
      <link>https://example.com/recent</link>
      <pubDate>Mon, 01 Jan 2024 12:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: recentFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Article')).toBeInTheDocument();
      });

      // Should show some relative time format (could be minutes, hours, or days depending on current time)
      const timeElement = screen.getByText(/ago|Jan|2024/);
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Feed')).toBeInTheDocument();
      });

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should display error when RSS parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: 'Invalid XML content' }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Feed')).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Feed')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });
    });

    it('should allow changing feed URL after error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Feed')).toBeInTheDocument();
      });

      const changeButton = screen.getByRole('button', { name: /change feed/i });
      fireEvent.click(changeButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-rss-feed-1', {
        config: expect.objectContaining({
          feedUrl: '',
        }),
      });
    });
  });

  describe('Item Interaction', () => {
    it('should open article in new tab when clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      // Mock window.open
      const mockOpen = vi.fn();
      window.open = mockOpen;

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });

      const article = screen.getByText('First Article').closest('div');
      fireEvent.click(article!);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://example.com/article1',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Auto-refresh', () => {
    it('should display auto-refresh message when enabled', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });

      expect(screen.getByText(/auto-refreshes every 5 minutes/i)).toBeInTheDocument();
    });

    it('should not display auto-refresh message when disabled', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
        autoRefresh: false,
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });

      expect(screen.queryByText(/auto-refreshes/i)).not.toBeInTheDocument();
    });
  });

  describe('Manual Refresh', () => {
    it('should show refresh button', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ contents: mockRSSFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('First Article')).toBeInTheDocument();
      });

      // Refresh button should be visible
      const refreshButton = screen.getByTitle('Refresh feed');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Empty Feed', () => {
    it('should display message when feed has no items', async () => {
      const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <link>https://example.com</link>
    <description>Empty RSS Feed</description>
  </channel>
</rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contents: emptyFeed }),
      });

      const instance = createMockInstance({
        feedUrl: 'https://example.com/feed.xml',
      });

      render(<RSSFeedWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('No items found in feed')).toBeInTheDocument();
      });
    });
  });
});
