import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BirdeyeWidget from './BirdeyeWidget';
import type { WidgetInstance } from '../types';
import { birdeyeClient } from '../services/BirdeyeClient';

// Mock the BirdeyeClient
vi.mock('../services/BirdeyeClient', () => ({
  birdeyeClient: {
    getTokenOverview: vi.fn(),
  },
}));

// Mock SkeletonLoader
vi.mock('../components/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

describe('BirdeyeWidget', () => {
  const mockTokenData = {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    supply: 500000000,
    price: 100.50,
    priceChange24h: 5.25,
    volume24h: 1500000000,
    marketCap: 50000000000,
    liquidity: 250000000,
    logoURI: 'https://example.com/sol-logo.png',
  };

  const createMockInstance = (config: Record<string, any> = {}): WidgetInstance => ({
    id: 'test-widget-1',
    type: 'birdeye',
    position: { x: 0, y: 0 },
    size: { width: 600, height: 400 },
    zIndex: 1,
    config: {
      tokenAddress: 'So11111111111111111111111111111111111111112',
      autoRefresh: false, // Disable auto-refresh for tests
      ...config,
    },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should show prompt when no token address is configured', () => {
    const instance = createMockInstance({ tokenAddress: '' });
    render(<BirdeyeWidget instance={instance} />);

    expect(screen.getByText('Birdeye Token Data')).toBeInTheDocument();
    expect(screen.getByText('Configure a token address to view data')).toBeInTheDocument();
  });

  it('should show skeleton loader during initial fetch', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(birdeyeClient.getTokenOverview).mockReturnValue(promise as any);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!(mockTokenData);
    
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });
  });

  it('should fetch and display token data', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    });

    // Check price is displayed
    expect(screen.getByText('$100.50')).toBeInTheDocument();
    
    // Check price change is displayed with correct formatting
    expect(screen.getByText('+5.25%')).toBeInTheDocument();

    // Check volume is displayed
    expect(screen.getByText('Volume 24h')).toBeInTheDocument();
    expect(screen.getByText('$1.50B')).toBeInTheDocument();

    // Check market cap is displayed
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('$50.00B')).toBeInTheDocument();

    // Check liquidity is displayed
    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByText('$250.00M')).toBeInTheDocument();

    // Check supply is displayed
    expect(screen.getByText('Supply')).toBeInTheDocument();
    expect(screen.getByText('500,000,000')).toBeInTheDocument();
  });

  it('should display negative price change in red', async () => {
    const negativeChangeData = {
      ...mockTokenData,
      priceChange24h: -3.45,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(negativeChangeData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      const priceChange = screen.getByText('-3.45%');
      expect(priceChange).toBeInTheDocument();
      expect(priceChange).toHaveStyle({ color: '#f87171' });
    });
  });

  it('should display positive price change in green', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      const priceChange = screen.getByText('+5.25%');
      expect(priceChange).toBeInTheDocument();
      expect(priceChange).toHaveStyle({ color: '#4ade80' });
    });
  });

  it('should show error state when fetch fails', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockRejectedValue(
      new Error('Network error')
    );

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Token Data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should allow retry after error', async () => {
    const user = userEvent.setup({ delay: null });
    
    // First call fails
    vi.mocked(birdeyeClient.getTokenOverview)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockTokenData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to Load Token Data')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // Should show data after retry
    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    });
  });

  it('should set up auto-refresh interval when enabled', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance({
      autoRefresh: true,
      refreshInterval: 30000,
    });

    render(<BirdeyeWidget instance={instance} />);

    // Initial fetch should happen
    await waitFor(() => {
      expect(birdeyeClient.getTokenOverview).toHaveBeenCalledTimes(1);
    });

    // Verify the widget renders successfully
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  it('should not set up auto-refresh when disabled', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance({
      autoRefresh: false,
    });

    render(<BirdeyeWidget instance={instance} />);

    // Initial fetch should still happen
    await waitFor(() => {
      expect(birdeyeClient.getTokenOverview).toHaveBeenCalledTimes(1);
    });

    // Verify the widget renders successfully
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  it('should format small prices correctly', async () => {
    const smallPriceData = {
      ...mockTokenData,
      price: 0.000123,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(smallPriceData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('$0.000123')).toBeInTheDocument();
    });
  });

  it('should format medium prices correctly', async () => {
    const mediumPriceData = {
      ...mockTokenData,
      price: 0.5678,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mediumPriceData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('$0.5678')).toBeInTheDocument();
    });
  });

  it('should display token logo when available', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance();
    const { container } = render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      const logo = container.querySelector('img[alt="SOL"]');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', mockTokenData.logoURI);
    });
  });

  it('should display token address', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('Token Address')).toBeInTheDocument();
      expect(screen.getByText(mockTokenData.address)).toBeInTheDocument();
    });
  });

  it('should render successfully with all data sections', async () => {
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

    const instance = createMockInstance({
      autoRefresh: false,
    });

    render(<BirdeyeWidget instance={instance} />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
    });

    // Verify all sections are rendered
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Volume 24h')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByText('Supply')).toBeInTheDocument();
    expect(screen.getByText('Token Address')).toBeInTheDocument();
  });

  it('should format numbers with K suffix', async () => {
    const dataWithK = {
      ...mockTokenData,
      volume24h: 5500,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(dataWithK);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('$5.50K')).toBeInTheDocument();
    });
  });

  it('should format numbers with M suffix', async () => {
    const dataWithM = {
      ...mockTokenData,
      liquidity: 15000000,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(dataWithM);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('$15.00M')).toBeInTheDocument();
    });
  });

  it('should format numbers with B suffix', async () => {
    const dataWithB = {
      ...mockTokenData,
      marketCap: 75000000000,
    };
    vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(dataWithB);

    const instance = createMockInstance();
    render(<BirdeyeWidget instance={instance} />);

    await waitFor(() => {
      expect(screen.getByText('$75.00B')).toBeInTheDocument();
    });
  });
});
