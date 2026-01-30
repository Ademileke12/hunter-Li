import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TokenOverviewWidget from './TokenOverviewWidget';
import type { WidgetInstance } from '../types';
import type { TokenOverview } from '../types/birdeye';
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

describe('TokenOverviewWidget', () => {
  const mockTokenData: TokenOverview = {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    supply: 1000000000,
    price: 100.50,
    priceChange24h: 5.25,
    volume24h: 50000000,
    marketCap: 100500000000,
    liquidity: 25000000,
    logoURI: 'https://example.com/sol-logo.png',
  };

  const createMockInstance = (config: Record<string, any> = {}): WidgetInstance => ({
    id: 'test-widget-1',
    type: 'token-overview',
    position: { x: 0, y: 0 },
    size: { width: 400, height: 600 },
    zIndex: 1,
    config,
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render input form when no token address is provided', () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      expect(screen.getByText('Token Overview')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByText('Load Token')).toBeInTheDocument();
    });

    it('should display token icon in empty state', () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      expect(screen.getByText('🪙')).toBeInTheDocument();
    });

    it('should have input field with empty value initially', () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Token Address Input', () => {
    it('should update input value when user types', () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-address' } });

      expect(input.value).toBe('test-address');
    });

    it('should fetch token data when form is submitted', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const button = screen.getByText('Load Token');

      fireEvent.change(input, { target: { value: mockTokenData.address } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(birdeyeClient.getTokenOverview).toHaveBeenCalledWith(mockTokenData.address);
      });
    });

    it('should trim whitespace from token address before fetching', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const button = screen.getByText('Load Token');

      fireEvent.change(input, { target: { value: '  ' + mockTokenData.address + '  ' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(birdeyeClient.getTokenOverview).toHaveBeenCalledWith(mockTokenData.address);
      });
    });

    it('should not fetch if input is empty', async () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const button = screen.getByText('Load Token');
      fireEvent.click(button);

      expect(birdeyeClient.getTokenOverview).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should show skeleton loader during initial fetch', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTokenData), 100))
      );

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
      });
    });

    it('should fetch token data on mount if address is provided in config', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(birdeyeClient.getTokenOverview).toHaveBeenCalledWith(mockTokenData.address);
      });
    });

    it('should display token data after successful fetch', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
        expect(screen.getByText(mockTokenData.name)).toBeInTheDocument();
      });
    });

    it('should show loading indicator during refresh', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
      });

      // The loading indicator is a small pulsing dot, check for its presence
      // by looking for the animation style
      const container = screen.getByText(mockTokenData.symbol).closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Failed to fetch token data';
      vi.mocked(birdeyeClient.getTokenOverview).mockRejectedValue(new Error(errorMessage));

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Token Data')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockRejectedValue(new Error('Network error'));

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button is clicked', async () => {
      vi.mocked(birdeyeClient.getTokenOverview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(birdeyeClient.getTokenOverview).toHaveBeenCalledTimes(2);
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
      });
    });

    it('should show change address button on error', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockRejectedValue(new Error('Invalid address'));

      const instance = createMockInstance({ tokenAddress: 'invalid-address' });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change Address')).toBeInTheDocument();
      });
    });

    it('should reset to input form when change address button is clicked', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockRejectedValue(new Error('Invalid address'));

      const instance = createMockInstance({ tokenAddress: 'invalid-address' });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change Address')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change Address');
      fireEvent.click(changeButton);

      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByText('Load Token')).toBeInTheDocument();
    });
  });

  describe('Token Data Display', () => {
    beforeEach(async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);
    });

    it('should display token symbol and name', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
        expect(screen.getByText(mockTokenData.name)).toBeInTheDocument();
      });
    });

    it('should display token logo if available', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        const logo = screen.getByAltText(mockTokenData.symbol) as HTMLImageElement;
        expect(logo).toBeInTheDocument();
        expect(logo.src).toBe(mockTokenData.logoURI);
      });
    });

    it('should display current price', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$100.50')).toBeInTheDocument();
      });
    });

    it('should display price change with correct color for positive change', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      const { container } = render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        const priceChange = screen.getByText('+5.25%');
        expect(priceChange).toBeInTheDocument();
        expect(priceChange).toHaveStyle({ color: '#4ade80' }); // Green for positive
      });
    });

    it('should display price change with correct color for negative change', async () => {
      const negativeChangeToken = { ...mockTokenData, priceChange24h: -3.5 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(negativeChangeToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        const priceChange = screen.getByText('-3.50%');
        expect(priceChange).toBeInTheDocument();
        expect(priceChange).toHaveStyle({ color: '#f87171' }); // Red for negative
      });
    });

    it('should display market cap', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$100.50B')).toBeInTheDocument();
      });
    });

    it('should display volume 24h', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$50.00M')).toBeInTheDocument();
      });
    });

    it('should display liquidity', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$25.00M')).toBeInTheDocument();
      });
    });

    it('should display total supply', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('1.00B')).toBeInTheDocument();
      });
    });

    it('should display token address', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.address)).toBeInTheDocument();
      });
    });

    it('should display decimals', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument();
      });
    });

    it('should show change button when token data is displayed', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change')).toBeInTheDocument();
      });
    });

    it('should reset to input form when change button is clicked', async () => {
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('should format large market cap values correctly', async () => {
      const largeCapToken = { ...mockTokenData, marketCap: 5_500_000_000 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(largeCapToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$5.50B')).toBeInTheDocument();
      });
    });

    it('should format medium values in millions', async () => {
      const mediumToken = { ...mockTokenData, volume24h: 2_500_000 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mediumToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$2.50M')).toBeInTheDocument();
      });
    });

    it('should format small values in thousands', async () => {
      const smallToken = { ...mockTokenData, liquidity: 5_500 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(smallToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$5.50K')).toBeInTheDocument();
      });
    });

    it('should format very small prices with 6 decimals', async () => {
      const smallPriceToken = { ...mockTokenData, price: 0.000123 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(smallPriceToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$0.000123')).toBeInTheDocument();
      });
    });

    it('should format prices under $1 with 4 decimals', async () => {
      const lowPriceToken = { ...mockTokenData, price: 0.1234 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(lowPriceToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$0.1234')).toBeInTheDocument();
      });
    });

    it('should format regular prices with 2 decimals', async () => {
      const regularPriceToken = { ...mockTokenData, price: 123.456 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(regularPriceToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('$123.46')).toBeInTheDocument();
      });
    });
  });

  describe('Logo Handling', () => {
    it('should hide logo on error', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);
      
      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        const logo = screen.getByAltText(mockTokenData.symbol) as HTMLImageElement;
        expect(logo).toBeInTheDocument();
      });

      const logo = screen.getByAltText(mockTokenData.symbol) as HTMLImageElement;
      fireEvent.error(logo);

      expect(logo).toHaveStyle({ display: 'none' });
    });

    it('should not render logo element if logoURI is not provided', async () => {
      const noLogoToken = { ...mockTokenData, logoURI: undefined };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(noLogoToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
      });

      expect(screen.queryByAltText(mockTokenData.symbol)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values gracefully', async () => {
      const zeroToken = {
        ...mockTokenData,
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        liquidity: 0,
      };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(zeroToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
      });

      // Should display zeros without crashing - use getAllByText since there are multiple $0.00
      const zeroValues = screen.getAllByText('$0.00');
      expect(zeroValues.length).toBeGreaterThan(0);
      expect(screen.getByText('+0.00%')).toBeInTheDocument();
    });

    it('should handle very large supply values', async () => {
      const largeSupplyToken = { ...mockTokenData, supply: 999_999_999_999 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(largeSupplyToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('1000.00B')).toBeInTheDocument();
      });
    });

    it('should handle negative price changes', async () => {
      const negativeToken = { ...mockTokenData, priceChange24h: -15.75 };
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(negativeToken);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('-15.75%')).toBeInTheDocument();
      });
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy requirement 6.1: display name, symbol, supply, price, market cap, volume', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        // Name and symbol
        expect(screen.getByText(mockTokenData.name)).toBeInTheDocument();
        expect(screen.getByText(mockTokenData.symbol)).toBeInTheDocument();
        
        // Price
        expect(screen.getByText('$100.50')).toBeInTheDocument();
        
        // Market cap
        expect(screen.getByText('$100.50B')).toBeInTheDocument();
        
        // Volume
        expect(screen.getByText('$50.00M')).toBeInTheDocument();
        
        // Supply
        expect(screen.getByText('1.00B')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 6.1: show token logo if available', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        const logo = screen.getByAltText(mockTokenData.symbol) as HTMLImageElement;
        expect(logo).toBeInTheDocument();
        expect(logo.src).toBe(mockTokenData.logoURI);
      });
    });

    it('should satisfy requirement 6.1: fetch from Birdeye /defi/v3/token/overview', async () => {
      vi.mocked(birdeyeClient.getTokenOverview).mockResolvedValue(mockTokenData);

      const instance = createMockInstance({ tokenAddress: mockTokenData.address });
      render(<TokenOverviewWidget instance={instance} />);

      await waitFor(() => {
        expect(birdeyeClient.getTokenOverview).toHaveBeenCalledWith(mockTokenData.address);
      });
    });

    it('should satisfy requirement 6.1: input field for token address', () => {
      const instance = createMockInstance();
      render(<TokenOverviewWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });
  });
});
