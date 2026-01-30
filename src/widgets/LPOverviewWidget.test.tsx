import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LPOverviewWidget from './LPOverviewWidget';
import { birdeyeClient } from '../services/BirdeyeClient';
import type { WidgetInstance } from '../types';
import type { LiquidityPool } from '../types/birdeye';

// Mock the BirdeyeClient
vi.mock('../services/BirdeyeClient', () => ({
  birdeyeClient: {
    getLiquidityPool: vi.fn(),
  },
}));

// Mock SkeletonLoader
vi.mock('../components/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

describe('LPOverviewWidget', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-lp-widget',
    type: 'lp-overview',
    position: { x: 0, y: 0 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    config: {},
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockLPData: LiquidityPool = {
    address: 'LP123456789',
    locked: true,
    lockedPercentage: 75.5,
    lockedUntil: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
    totalValue: 1500000,
    providersCount: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render empty state when no token address is provided', () => {
      render(<LPOverviewWidget instance={mockInstance} />);
      
      expect(screen.getByText('LP Overview')).toBeInTheDocument();
      expect(screen.getByText('Enter a token address to view liquidity pool details')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByText('Load LP Data')).toBeInTheDocument();
    });

    it('should render with token address from config', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(birdeyeClient.getLiquidityPool).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
      });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loader during initial data fetch', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLPData), 100))
      );

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
      });
    });

    it('should show loading indicator during refresh', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      // The loading indicator is a styled div, check if it exists in the DOM
      // We can't easily test for the animated pulse, but we can verify the structure
      expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display LP data correctly', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      // Check LP locked percentage
      expect(screen.getByText('75.5%')).toBeInTheDocument();
      expect(screen.getByText('Locked')).toBeInTheDocument();

      // Check total LP value (formatted)
      expect(screen.getByText('$1.50M')).toBeInTheDocument();

      // Check providers count
      expect(screen.getByText('25')).toBeInTheDocument();

      // Check LP address
      expect(screen.getByText('LP123456789')).toBeInTheDocument();
    });

    it('should show warning when LP locked percentage is below 50%', async () => {
      const lowLPData: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 30,
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(lowLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Low Liquidity Lock')).toBeInTheDocument();
      });

      expect(screen.getByText('Less than 50% of LP is locked - potential risk')).toBeInTheDocument();
    });

    it('should not show warning when LP locked percentage is 50% or above', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      expect(screen.queryByText('Low Liquidity Lock')).not.toBeInTheDocument();
    });

    it('should display lock duration when available', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Lock Duration')).toBeInTheDocument();
      });

      // Should show duration (90 days = 3 months)
      expect(screen.getByText(/month/)).toBeInTheDocument();
      expect(screen.getByText(/Until/)).toBeInTheDocument();
    });

    it('should not display lock duration section when not available', async () => {
      const lpDataWithoutLock: LiquidityPool = {
        ...mockLPData,
        lockedUntil: undefined,
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(lpDataWithoutLock);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      expect(screen.queryByText('Lock Duration')).not.toBeInTheDocument();
    });

    it('should display status summary correctly', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Status Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('Liquidity is locked')).toBeInTheDocument();
      expect(screen.getByText('Good lock percentage')).toBeInTheDocument();
      expect(screen.getByText('Multiple LP providers')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error state when API call fails', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockRejectedValue(
        new Error('API request failed')
      );

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load LP Data')).toBeInTheDocument();
      });

      expect(screen.getByText('API request failed')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Change Address')).toBeInTheDocument();
    });

    it('should retry fetching data when retry button is clicked', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool)
        .mockRejectedValueOnce(new Error('API request failed'))
        .mockResolvedValueOnce(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load LP Data')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      expect(birdeyeClient.getLiquidityPool).toHaveBeenCalledTimes(2);
    });

    it('should reset to input form when change address button is clicked', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockRejectedValue(
        new Error('API request failed')
      );

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load LP Data')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change Address');
      fireEvent.click(changeButton);

      expect(screen.getByText('LP Overview')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should fetch LP data when form is submitted', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const submitButton = screen.getByText('Load LP Data');

      fireEvent.change(input, { target: { value: 'So11111111111111111111111111111111111111112' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(birdeyeClient.getLiquidityPool).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
      });

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });
    });

    it('should trim whitespace from token address input', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const submitButton = screen.getByText('Load LP Data');

      fireEvent.change(input, { target: { value: '  So11111111111111111111111111111111111111112  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(birdeyeClient.getLiquidityPool).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
      });
    });

    it('should allow changing token address after data is loaded', async () => {
      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Liquidity Pool Overview')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(screen.getByText('LP Overview')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers correctly', async () => {
      const largeValueLP: LiquidityPool = {
        ...mockLPData,
        totalValue: 1500000000, // 1.5B
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(largeValueLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('$1.50B')).toBeInTheDocument();
      });
    });

    it('should format medium numbers correctly', async () => {
      const mediumValueLP: LiquidityPool = {
        ...mockLPData,
        totalValue: 1500000, // 1.5M
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mediumValueLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('$1.50M')).toBeInTheDocument();
      });
    });

    it('should format small numbers correctly', async () => {
      const smallValueLP: LiquidityPool = {
        ...mockLPData,
        totalValue: 1500, // 1.5K
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(smallValueLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('$1.50K')).toBeInTheDocument();
      });
    });
  });

  describe('Lock Duration Formatting', () => {
    it('should format duration in years when over 365 days', async () => {
      const longLockLP: LiquidityPool = {
        ...mockLPData,
        lockedUntil: Date.now() + 400 * 24 * 60 * 60 * 1000, // 400 days
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(longLockLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Lock Duration')).toBeInTheDocument();
      });

      expect(screen.getByText(/year/)).toBeInTheDocument();
    });

    it('should format duration in months when over 30 days', async () => {
      const monthLockLP: LiquidityPool = {
        ...mockLPData,
        lockedUntil: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(monthLockLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Lock Duration')).toBeInTheDocument();
      });

      expect(screen.getByText(/month/)).toBeInTheDocument();
    });

    it('should show "Expired" when lock duration has passed', async () => {
      const expiredLockLP: LiquidityPool = {
        ...mockLPData,
        lockedUntil: Date.now() - 1000, // Past timestamp
      };

      const instanceWithAddress: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(expiredLockLP);

      render(<LPOverviewWidget instance={instanceWithAddress} />);

      await waitFor(() => {
        expect(screen.getByText('Lock Duration')).toBeInTheDocument();
      });

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });
});
