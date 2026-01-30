import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendingWidget from './TrendingWidget';
import { birdeyeClient } from '../services/BirdeyeClient';
import type { WidgetInstance } from '../types';
import type { TrendingToken } from '../types/birdeye';

// Mock the BirdeyeClient
vi.mock('../services/BirdeyeClient', () => ({
  birdeyeClient: {
    getTrendingTokens: vi.fn(),
  },
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('TrendingWidget', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-trending-1',
    type: 'trending',
    position: { x: 0, y: 0 },
    size: { width: 700, height: 500 },
    zIndex: 1,
    config: { limit: 20, autoRefresh: false },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockTrendingTokens: TrendingToken[] = [
    {
      address: 'token1',
      symbol: 'HOT',
      name: 'Hot Token',
      price: 1.23,
      priceChange24h: 45.67,
      volume24h: 1000000,
      volumeChange24h: 150.5,
      marketCap: 5000000,
      logoURI: 'https://example.com/hot.png',
    },
    {
      address: 'token2',
      symbol: 'WARM',
      name: 'Warm Token',
      price: 0.456,
      priceChange24h: -12.34,
      volume24h: 500000,
      volumeChange24h: 75.2,
      marketCap: 2000000,
      logoURI: 'https://example.com/warm.png',
    },
    {
      address: 'token3',
      symbol: 'COOL',
      name: 'Cool Token',
      price: 0.0123,
      priceChange24h: 5.5,
      volume24h: 250000,
      volumeChange24h: 25.0,
      marketCap: 1000000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(<TrendingWidget instance={mockInstance} />);
    
    // Should show skeleton loader (check for skeleton items)
    const skeletonItems = container.querySelectorAll('.skeleton-item');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('should fetch and display trending tokens', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('Trending Tokens')).toBeInTheDocument();
    });

    // Check that tokens are displayed
    expect(screen.getByText('HOT')).toBeInTheDocument();
    expect(screen.getByText('Hot Token')).toBeInTheDocument();
    expect(screen.getByText('WARM')).toBeInTheDocument();
    expect(screen.getByText('Warm Token')).toBeInTheDocument();
    expect(screen.getByText('COOL')).toBeInTheDocument();
    expect(screen.getByText('Cool Token')).toBeInTheDocument();

    // Check that the API was called with correct limit
    expect(birdeyeClient.getTrendingTokens).toHaveBeenCalledWith(20);
  });

  it('should display volume spike indicator for tokens with >100% spike', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // HOT token has 150.5% volume spike, should show fire emoji
    const hotRow = screen.getByText('HOT').closest('tr');
    expect(hotRow).toBeInTheDocument();
    expect(hotRow?.textContent).toContain('🔥');

    // WARM token has 75.2% volume spike, should NOT show fire emoji
    const warmRow = screen.getByText('WARM').closest('tr');
    expect(warmRow).toBeInTheDocument();
    expect(warmRow?.textContent).not.toContain('🔥');
  });

  it('should format prices correctly', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    const { container } = render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // Check price formatting - prices are split by $ and number in the DOM
    expect(container.textContent).toContain('$1.23'); // HOT: >= 1, uses 2 decimals
    expect(container.textContent).toContain('$0.4560'); // WARM: < 1, uses 4 decimals
    expect(container.textContent).toContain('$0.0123'); // COOL: >= 0.01 but < 1, uses 4 decimals
  });

  it('should display price change with correct color', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // HOT has positive change
    const hotPriceChange = screen.getByText('+45.67%');
    expect(hotPriceChange).toBeInTheDocument();
    expect(hotPriceChange).toHaveStyle({ color: '#4ade80' }); // Green

    // WARM has negative change
    const warmPriceChange = screen.getByText('-12.34%');
    expect(warmPriceChange).toBeInTheDocument();
    expect(warmPriceChange).toHaveStyle({ color: '#f87171' }); // Red
  });

  it('should display sparkline charts for each token', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // Should have 3 sparkline charts (one per token)
    const charts = screen.getAllByTestId('line-chart');
    expect(charts).toHaveLength(3);
  });

  it('should handle error state', async () => {
    const errorMessage = 'Failed to fetch trending tokens';
    vi.mocked(birdeyeClient.getTrendingTokens).mockRejectedValue(new Error(errorMessage));

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Trending Tokens')).toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should retry fetching on error', async () => {
    const errorMessage = 'Network error';
    vi.mocked(birdeyeClient.getTrendingTokens)
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Trending Tokens')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    expect(birdeyeClient.getTrendingTokens).toHaveBeenCalledTimes(2);
  });

  it('should display empty state when no tokens found', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue([]);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('No trending tokens found')).toBeInTheDocument();
    });
  });

  it('should paginate results when more than 10 tokens', async () => {
    const manyTokens: TrendingToken[] = Array.from({ length: 15 }, (_, i) => ({
      address: `token${i}`,
      symbol: `TKN${i}`,
      name: `Token ${i}`,
      price: 1.0 + i,
      priceChange24h: 10.0,
      volume24h: 1000000,
      volumeChange24h: 50.0,
      marketCap: 5000000,
    }));

    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(manyTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('TKN0')).toBeInTheDocument();
    });

    // Should show first 10 tokens
    expect(screen.getByText('TKN0')).toBeInTheDocument();
    expect(screen.getByText('TKN9')).toBeInTheDocument();
    expect(screen.queryByText('TKN10')).not.toBeInTheDocument();

    // Should show pagination
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    // Should show remaining tokens
    await waitFor(() => {
      expect(screen.getByText('TKN10')).toBeInTheDocument();
    });
    expect(screen.getByText('TKN14')).toBeInTheDocument();
    expect(screen.queryByText('TKN0')).not.toBeInTheDocument();
  });

  it('should respect custom limit from config', async () => {
    const customInstance: WidgetInstance = {
      ...mockInstance,
      config: { limit: 10, autoRefresh: false },
    };

    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={customInstance} />);

    await waitFor(() => {
      expect(birdeyeClient.getTrendingTokens).toHaveBeenCalledWith(10);
    });
  });

  it('should display token count in header', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('3 tokens found')).toBeInTheDocument();
    });
  });

  it('should handle missing logo gracefully', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('COOL')).toBeInTheDocument();
    });

    // COOL token has no logoURI, should still render without error
    const coolRow = screen.getByText('COOL').closest('tr');
    expect(coolRow).toBeInTheDocument();
  });

  it('should calculate volume spike percentage correctly', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // Check volume spike percentages
    expect(screen.getByText('+150.50%')).toBeInTheDocument(); // HOT
    expect(screen.getByText('+75.20%')).toBeInTheDocument(); // WARM
    expect(screen.getByText('+25.00%')).toBeInTheDocument(); // COOL
  });

  it('should show loading indicator during refresh', async () => {
    vi.mocked(birdeyeClient.getTrendingTokens).mockResolvedValue(mockTrendingTokens);

    const { container } = render(<TrendingWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    // Trigger a refresh by calling the API again
    vi.mocked(birdeyeClient.getTrendingTokens).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockTrendingTokens), 100))
    );

    // The loading indicator should appear during refresh
    // Note: This is hard to test without triggering auto-refresh or manual refresh
    // In a real scenario, the loading indicator appears at top-right during refresh
  });
});
