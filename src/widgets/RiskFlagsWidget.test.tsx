import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RiskFlagsWidget from './RiskFlagsWidget';
import type { WidgetInstance } from '../types';
import type { LiquidityPool, HolderData } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';

// Mock the BirdeyeClient
vi.mock('../services/BirdeyeClient', () => ({
  birdeyeClient: {
    getLiquidityPool: vi.fn(),
    getHolderDistribution: vi.fn(),
  },
}));

// Mock SkeletonLoader
vi.mock('../components/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

describe('RiskFlagsWidget', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-risk-flags-1',
    type: 'risk-flags',
    position: { x: 0, y: 0 },
    size: { width: 450, height: 350 },
    zIndex: 1,
    config: {},
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockLPData: LiquidityPool = {
    address: 'LP123456789',
    locked: true,
    lockedPercentage: 75,
    lockedUntil: Date.now() + 86400000,
    totalValue: 1000000,
    providersCount: 50,
  };

  const mockHolderData: HolderData[] = [
    { address: 'holder1', balance: 1000, percentage: 10, rank: 1 },
    { address: 'holder2', balance: 900, percentage: 9, rank: 2 },
    { address: 'holder3', balance: 800, percentage: 8, rank: 3 },
    { address: 'holder4', balance: 700, percentage: 7, rank: 4 },
    { address: 'holder5', balance: 600, percentage: 6, rank: 5 },
    { address: 'holder6', balance: 500, percentage: 5, rank: 6 },
    { address: 'holder7', balance: 400, percentage: 4, rank: 7 },
    { address: 'holder8', balance: 300, percentage: 3, rank: 8 },
    { address: 'holder9', balance: 200, percentage: 2, rank: 9 },
    { address: 'holder10', balance: 100, percentage: 1, rank: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render empty state when no token address is provided', () => {
      render(<RiskFlagsWidget instance={mockInstance} />);

      expect(screen.getByText('Risk Flags')).toBeInTheDocument();
      expect(screen.getByText('Enter a token address to assess risk')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /assess risk/i })).toBeInTheDocument();
    });

    it('should render with pre-configured token address', async () => {
      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate low risk score (0-30) when LP is high and concentration is low', async () => {
      const lowRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 80, // No LP risk
      };

      const lowRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: 3, // Total 30% for top 10 - no concentration risk
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(lowRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(lowRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/LOW RISK/i)[0]).toBeInTheDocument();
      });

      // Should show no risk flags
      expect(screen.getByText('No Risk Flags Detected')).toBeInTheDocument();
    });

    it('should calculate medium risk score (31-60) with moderate LP and concentration', async () => {
      const mediumRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 30, // 20 risk points (50 - 30)
      };

      const mediumRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 7 : 0, // Total 70% for top 10 - 20 concentration risk points
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mediumRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mediumRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/MEDIUM RISK/i)[0]).toBeInTheDocument();
      });

      // Should show risk flags
      expect(screen.getByText(/Low LP locked/i)).toBeInTheDocument();
      expect(screen.getByText(/High concentration/i)).toBeInTheDocument();
    });

    it('should calculate high risk score (61-80) with low LP and high concentration', async () => {
      const highRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 15, // 35 risk points (50 - 15)
      };

      const highRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 8 : 0, // Total 80% for top 10 - 30 concentration risk points
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(highRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(highRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/HIGH RISK/i)[0]).toBeInTheDocument();
      });

      // Should show both risk flags
      expect(screen.getByText(/Low LP locked/i)).toBeInTheDocument();
      expect(screen.getByText(/High concentration/i)).toBeInTheDocument();
    });

    it('should calculate critical risk score (81+) with very low LP and very high concentration', async () => {
      const criticalRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 5, // 45 risk points (50 - 5)
      };

      const criticalRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 9.5 : 0, // Total 95% for top 10 - 45 concentration risk points
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(criticalRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(criticalRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/CRITICAL RISK/i)[0]).toBeInTheDocument();
      });

      // Should show both risk flags with danger severity
      expect(screen.getByText(/Low LP locked/i)).toBeInTheDocument();
      expect(screen.getByText(/High concentration/i)).toBeInTheDocument();
    });
  });

  describe('Risk Flags', () => {
    it('should display Low LP flag when LP percentage is below 50%', async () => {
      const lowLPData: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 30,
      };

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(lowLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText(/Low LP locked: 30\.0%/i)).toBeInTheDocument();
      });
    });

    it('should display High Concentration flag when top 10 holders own more than 50%', async () => {
      const highConcentrationHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 8 : 0, // Total 80% for top 10
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(highConcentrationHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText(/High concentration: 80\.0% held by top 10/i)).toBeInTheDocument();
      });
    });

    it('should not display flags when LP is high and concentration is low', async () => {
      const safeLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 90,
      };

      const safeHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: 2, // Total 20% for top 10
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(safeLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(safeHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('No Risk Flags Detected')).toBeInTheDocument();
      });
    });
  });

  describe('Color Coding', () => {
    it('should use green color for low risk', async () => {
      const lowRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 80,
      };

      const lowRiskHolders: HolderData[] = mockHolderData.map((h) => ({
        ...h,
        percentage: 3,
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(lowRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(lowRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      const { container } = render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/LOW RISK/i)[0]).toBeInTheDocument();
      });

      // Check for green color in the risk level badge
      const badge = screen.getAllByText(/LOW RISK/i)[0];
      expect(badge).toHaveStyle({ color: '#4ade80' });
    });

    it('should use yellow color for medium risk', async () => {
      const mediumRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 30,
      };

      const mediumRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 7 : 0,
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mediumRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mediumRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/MEDIUM RISK/i)[0]).toBeInTheDocument();
      });

      const badge = screen.getAllByText(/MEDIUM RISK/i)[0];
      expect(badge).toHaveStyle({ color: '#fbbf24' });
    });

    it('should use orange color for high risk', async () => {
      const highRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 10,
      };

      const highRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 9 : 0,
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(highRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(highRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/HIGH RISK/i)[0]).toBeInTheDocument();
      });

      const badge = screen.getAllByText(/HIGH RISK/i)[0];
      expect(badge).toHaveStyle({ color: '#fb923c' });
    });

    it('should use red color for critical risk', async () => {
      const criticalRiskLP: LiquidityPool = {
        ...mockLPData,
        lockedPercentage: 5,
      };

      const criticalRiskHolders: HolderData[] = mockHolderData.map((h, i) => ({
        ...h,
        percentage: i < 10 ? 9.5 : 0,
      }));

      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(criticalRiskLP);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(criticalRiskHolders);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getAllByText(/CRITICAL RISK/i)[0]).toBeInTheDocument();
      });

      const badge = screen.getAllByText(/CRITICAL RISK/i)[0];
      expect(badge).toHaveStyle({ color: '#f87171' });
    });
  });

  describe('User Interactions', () => {
    it('should allow user to input token address and fetch risk data', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      render(<RiskFlagsWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const button = screen.getByRole('button', { name: /assess risk/i });

      fireEvent.change(input, { target: { value: 'So11111111111111111111111111111111111111112' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(birdeyeClient.getLiquidityPool).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
      });

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });
    });

    it('should allow user to change token address', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });

      const changeButton = screen.getByRole('button', { name: /change/i });
      fireEvent.click(changeButton);

      expect(screen.getByText('Enter a token address to assess risk')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockRejectedValue(new Error('API Error'));
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValue(new Error('API Error'));

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Risk Data')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch risk data')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockRejectedValueOnce(new Error('API Error'));
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValueOnce(new Error('API Error'));

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Risk Data')).toBeInTheDocument();
      });

      // Mock successful response for retry
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });
    });

    it('should handle partial data gracefully (LP data only)', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(null as any);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });

      // Should still calculate risk based on available data
      expect(screen.queryByText(/High concentration/i)).not.toBeInTheDocument();
    });

    it('should handle partial data gracefully (holder data only)', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(null as any);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });

      // Should still calculate risk based on available data
      expect(screen.queryByText(/Low LP/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show skeleton loader during initial load', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLPData), 100))
      );
      vi.mocked(birdeyeClient.getHolderDistribution).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockHolderData), 100))
      );

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
      });
    });
  });

  describe('Risk Level Guide', () => {
    it('should display risk level guide with all categories', async () => {
      vi.mocked(birdeyeClient.getLiquidityPool).mockResolvedValue(mockLPData);
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instanceWithToken: WidgetInstance = {
        ...mockInstance,
        config: { tokenAddress: 'So11111111111111111111111111111111111111112' },
      };

      render(<RiskFlagsWidget instance={instanceWithToken} />);

      await waitFor(() => {
        expect(screen.getByText('Risk Level Guide')).toBeInTheDocument();
      });

      expect(screen.getByText('0-30:')).toBeInTheDocument();
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
      expect(screen.getByText('31-60:')).toBeInTheDocument();
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
      expect(screen.getByText('61-80:')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
      expect(screen.getByText('81+:')).toBeInTheDocument();
      expect(screen.getByText('Critical Risk')).toBeInTheDocument();
    });
  });
});
