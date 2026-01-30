import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HolderDistributionWidget from './HolderDistributionWidget';
import type { WidgetInstance } from '../types';
import type { HolderData } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';

// Mock the BirdeyeClient
vi.mock('../services/BirdeyeClient', () => ({
  birdeyeClient: {
    getHolderDistribution: vi.fn(),
  },
}));

// Mock SkeletonLoader
vi.mock('../components/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, label }: any) => (
    <div data-testid="pie">
      {data.map((item: any, idx: number) => (
        <div key={idx} data-testid={`pie-segment-${idx}`}>
          {label && label({ percentage: item.value })}
        </div>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('HolderDistributionWidget', () => {
  const mockHolderData: HolderData[] = [
    { address: 'Holder1111111111111111111111111111111111111', balance: 100000000, percentage: 25.5, rank: 1 },
    { address: 'Holder2222222222222222222222222222222222222', balance: 80000000, percentage: 20.0, rank: 2 },
    { address: 'Holder3333333333333333333333333333333333333', balance: 60000000, percentage: 15.0, rank: 3 },
    { address: 'Holder4444444444444444444444444444444444444', balance: 40000000, percentage: 10.0, rank: 4 },
    { address: 'Holder5555555555555555555555555555555555555', balance: 30000000, percentage: 7.5, rank: 5 },
    { address: 'Holder6666666666666666666666666666666666666', balance: 20000000, percentage: 5.0, rank: 6 },
    { address: 'Holder7777777777777777777777777777777777777', balance: 15000000, percentage: 3.75, rank: 7 },
    { address: 'Holder8888888888888888888888888888888888888', balance: 10000000, percentage: 2.5, rank: 8 },
    { address: 'Holder9999999999999999999999999999999999999', balance: 8000000, percentage: 2.0, rank: 9 },
    { address: 'Holder0000000000000000000000000000000000000', balance: 5000000, percentage: 1.25, rank: 10 },
  ];

  const createMockInstance = (config: Record<string, any> = {}): WidgetInstance => ({
    id: 'test-widget-1',
    type: 'holder-distribution',
    position: { x: 0, y: 0 },
    size: { width: 500, height: 400 },
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
      render(<HolderDistributionWidget instance={instance} />);

      expect(screen.getByText('Holder Distribution')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByText('Load Holders')).toBeInTheDocument();
    });

    it('should display chart icon in empty state', () => {
      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should have input field with empty value initially', () => {
      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Token Address Input', () => {
    it('should update input value when user types', () => {
      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-address' } });

      expect(input.value).toBe('test-address');
    });

    it('should fetch holder data when form is submitted', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const button = screen.getByText('Load Holders');

      const testAddress = 'So11111111111111111111111111111111111111112';
      fireEvent.change(input, { target: { value: testAddress } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledWith(testAddress);
      });
    });

    it('should trim whitespace from token address before fetching', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      const input = screen.getByPlaceholderText('Enter token address...');
      const button = screen.getByText('Load Holders');

      const testAddress = 'So11111111111111111111111111111111111111112';
      fireEvent.change(input, { target: { value: '  ' + testAddress + '  ' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledWith(testAddress);
      });
    });

    it('should not fetch if input is empty', async () => {
      const instance = createMockInstance();
      render(<HolderDistributionWidget instance={instance} />);

      const button = screen.getByText('Load Holders');
      fireEvent.click(button);

      expect(birdeyeClient.getHolderDistribution).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should show skeleton loader during initial fetch', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockHolderData), 100))
      );

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
      });
    });

    it('should fetch holder data on mount if address is provided in config', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledWith(testAddress);
      });
    });

    it('should display holder data after successful fetch', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
        expect(screen.getByText('Concentration Metric')).toBeInTheDocument();
      });
    });

    it('should only display top 10 holders even if more data is returned', async () => {
      const manyHolders = [...mockHolderData, ...mockHolderData]; // 20 holders
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(manyHolders);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
      });

      // Should only show 10 holders in the list
      const holderElements = screen.getAllByText(/#\d+/);
      expect(holderElements.length).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Failed to fetch holder data';
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValue(new Error(errorMessage));

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Holder Data')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValue(new Error('Network error'));

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button is clicked', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockHolderData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
      });
    });

    it('should show change address button on error', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValue(new Error('Invalid address'));

      const instance = createMockInstance({ tokenAddress: 'invalid-address' });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change Address')).toBeInTheDocument();
      });
    });

    it('should reset to input form when change address button is clicked', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockRejectedValue(new Error('Invalid address'));

      const instance = createMockInstance({ tokenAddress: 'invalid-address' });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change Address')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change Address');
      fireEvent.click(changeButton);

      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
      expect(screen.getByText('Load Holders')).toBeInTheDocument();
    });
  });

  describe('Holder Data Display', () => {
    beforeEach(() => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);
    });

    it('should display top 10 holders title', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
      });
    });

    it('should display concentration metric', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Concentration Metric')).toBeInTheDocument();
        // Sum of all percentages: 25.5 + 20 + 15 + 10 + 7.5 + 5 + 3.75 + 2.5 + 2 + 1.25 = 92.5
        expect(screen.getByText('92.50%')).toBeInTheDocument();
      });
    });

    it('should display warning for high concentration (>50%)', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText(/High concentration - potential risk/)).toBeInTheDocument();
      });
    });

    it('should not display warning for low concentration (<50%)', async () => {
      const lowConcentrationData = mockHolderData.map((holder, index) => ({
        ...holder,
        percentage: 4.0, // Total = 40%
      }));
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(lowConcentrationData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('40.00%')).toBeInTheDocument();
      });

      expect(screen.queryByText(/High concentration - potential risk/)).not.toBeInTheDocument();
    });

    it('should render pie chart', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie')).toBeInTheDocument();
      });
    });

    it('should display all 10 holders in the list', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Holder Details')).toBeInTheDocument();
      });

      // Check for all 10 ranks
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`#${i}`)).toBeInTheDocument();
      }
    });

    it('should display holder percentages', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('25.50%')).toBeInTheDocument();
        expect(screen.getByText('20.00%')).toBeInTheDocument();
        expect(screen.getByText('15.00%')).toBeInTheDocument();
      });
    });

    it('should format holder addresses (truncate)', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Addresses should be truncated to format: "Holder...1111"
        expect(screen.getByText('Holder...1111')).toBeInTheDocument();
      });
    });

    it('should show change button when holder data is displayed', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change')).toBeInTheDocument();
      });
    });

    it('should reset to input form when change button is clicked', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(screen.getByPlaceholderText('Enter token address...')).toBeInTheDocument();
    });
  });

  describe('Concentration Metric Calculation', () => {
    it('should calculate concentration correctly', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);
      
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Sum: 25.5 + 20 + 15 + 10 + 7.5 + 5 + 3.75 + 2.5 + 2 + 1.25 = 92.5
        expect(screen.getByText('92.50%')).toBeInTheDocument();
      });
    });

    it('should use green color for low concentration (<30%)', async () => {
      const lowConcentrationData = mockHolderData.map((holder) => ({
        ...holder,
        percentage: 2.5, // Total = 25%
      }));
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(lowConcentrationData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        const concentrationValue = screen.getByText('25.00%');
        expect(concentrationValue).toHaveStyle({ color: '#4ade80' }); // Green
      });
    });

    it('should use yellow color for medium concentration (30-50%)', async () => {
      const mediumConcentrationData = mockHolderData.map((holder) => ({
        ...holder,
        percentage: 4.0, // Total = 40%
      }));
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mediumConcentrationData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        const concentrationValue = screen.getByText('40.00%');
        expect(concentrationValue).toHaveStyle({ color: '#fbbf24' }); // Yellow
      });
    });

    it('should use red color for high concentration (>50%)', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);
      
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        const concentrationValue = screen.getByText('92.50%');
        expect(concentrationValue).toHaveStyle({ color: '#f87171' }); // Red
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no holders are returned', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue([]);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('No Holder Data Available')).toBeInTheDocument();
        expect(screen.getByText('No holder information found for this token')).toBeInTheDocument();
      });
    });

    it('should show change address button in empty state', async () => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue([]);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Change Address')).toBeInTheDocument();
      });
    });
  });

  describe('Requirements Validation', () => {
    beforeEach(() => {
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(mockHolderData);
    });

    it('should satisfy requirement 6.2: fetch from Birdeye /defi/v3/token/holder endpoint', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(birdeyeClient.getHolderDistribution).toHaveBeenCalledWith(testAddress);
      });
    });

    it('should satisfy requirement 6.2: display pie chart of top 10 holders', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByText('Top 10 Holders')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 6.2: show percentage for each holder', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Check that percentages are displayed
        expect(screen.getByText('25.50%')).toBeInTheDocument();
        expect(screen.getByText('20.00%')).toBeInTheDocument();
        expect(screen.getByText('15.00%')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 6.2: calculate and display concentration metric', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        expect(screen.getByText('Concentration Metric')).toBeInTheDocument();
        expect(screen.getByText('92.50%')).toBeInTheDocument();
        expect(screen.getByText('held by top 10')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 6.2: use recharts library for visualization', async () => {
      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Verify recharts components are rendered
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single holder', async () => {
      const singleHolder = [mockHolderData[0]];
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(singleHolder);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Use getAllByText since percentage appears in both concentration metric and holder list
        const percentages = screen.getAllByText('25.50%');
        expect(percentages.length).toBeGreaterThan(0);
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
    });

    it('should handle holders with zero percentage', async () => {
      const zeroPercentageData = mockHolderData.map((holder) => ({
        ...holder,
        percentage: 0,
      }));
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(zeroPercentageData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Use getAllByText since 0.00% appears multiple times (concentration + all holders)
        const zeroPercentages = screen.getAllByText('0.00%');
        expect(zeroPercentages.length).toBeGreaterThan(0);
      });
    });

    it('should handle very long addresses', async () => {
      const longAddressData = [{
        ...mockHolderData[0],
        address: 'A'.repeat(100),
      }];
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(longAddressData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Should truncate long addresses
        expect(screen.getByText('AAAAAA...AAAA')).toBeInTheDocument();
      });
    });

    it('should handle short addresses without truncation', async () => {
      const shortAddressData = [{
        ...mockHolderData[0],
        address: 'Short',
      }];
      vi.mocked(birdeyeClient.getHolderDistribution).mockResolvedValue(shortAddressData);

      const testAddress = 'So11111111111111111111111111111111111111112';
      const instance = createMockInstance({ tokenAddress: testAddress });
      render(<HolderDistributionWidget instance={instance} />);

      await waitFor(() => {
        // Should not truncate short addresses
        expect(screen.getByText('Short')).toBeInTheDocument();
      });
    });
  });
});
