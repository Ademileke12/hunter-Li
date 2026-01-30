import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BlockClockWidget from './BlockClockWidget';
import solanaClient from '../services/SolanaClient';
import type { WidgetInstance } from '../types';

vi.mock('../services/SolanaClient');

describe('BlockClockWidget', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-block-clock',
    type: 'block-clock',
    position: { x: 0, y: 0 },
    size: { width: 300, height: 200 },
    config: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    vi.mocked(solanaClient.getCurrentSlot).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<BlockClockWidget instance={mockInstance} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays current slot and epoch', async () => {
    const mockSlot = 123456789;
    const mockEpoch = 456;

    vi.mocked(solanaClient.getCurrentSlot).mockResolvedValue(mockSlot);
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: mockEpoch }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('123,456,789')).toBeInTheDocument();
    });

    expect(screen.getByText(mockEpoch.toString())).toBeInTheDocument();
    expect(screen.getByText('Current Slot')).toBeInTheDocument();
    expect(screen.getByText('Epoch')).toBeInTheDocument();
  });

  it('calculates and displays estimated time', async () => {
    const mockSlot = 1000; // 1000 slots * 400ms = 400,000ms = 400s = 6m 40s

    vi.mocked(solanaClient.getCurrentSlot).mockResolvedValue(mockSlot);
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 100 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText(/6m 40s/)).toBeInTheDocument();
    });
  });

  it('updates slot every 400ms', async () => {
    let slotValue = 1000;

    vi.mocked(solanaClient.getCurrentSlot).mockImplementation(async () => {
      return slotValue;
    });
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 100 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Advance time and update slot
    slotValue = 1001;
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText('1,001')).toBeInTheDocument();
    });

    // Advance again
    slotValue = 1002;
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText('1,002')).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    vi.mocked(solanaClient.getCurrentSlot).mockRejectedValue(
      new Error('Network error')
    );

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays RPC endpoint name', async () => {
    vi.mocked(solanaClient.getCurrentSlot).mockResolvedValue(1000);
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 100 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Fallback RPC',
      url: 'https://fallback.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('Fallback RPC')).toBeInTheDocument();
    });
  });

  it('cleans up interval on unmount', async () => {
    vi.mocked(solanaClient.getCurrentSlot).mockResolvedValue(1000);
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 100 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    const { unmount } = render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    const callCountBeforeUnmount = vi.mocked(solanaClient.getCurrentSlot).mock.calls.length;

    unmount();

    // Advance time after unmount
    vi.advanceTimersByTime(1000);

    // Should not have made additional calls
    expect(vi.mocked(solanaClient.getCurrentSlot).mock.calls.length).toBe(
      callCountBeforeUnmount
    );
  });

  it('handles large slot numbers correctly', async () => {
    const largeSlot = 999999999999;

    vi.mocked(solanaClient.getCurrentSlot).mockResolvedValue(largeSlot);
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 1000 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('999,999,999,999')).toBeInTheDocument();
    });
  });

  it('recovers from error on subsequent fetch', async () => {
    let shouldFail = true;

    vi.mocked(solanaClient.getCurrentSlot).mockImplementation(async () => {
      if (shouldFail) {
        throw new Error('Temporary error');
      }
      return 2000;
    });
    vi.mocked(solanaClient.getConnection).mockReturnValue({
      getEpochInfo: vi.fn().mockResolvedValue({ epoch: 200 }),
    } as any);
    vi.mocked(solanaClient.getCurrentEndpoint).mockReturnValue({
      name: 'Primary RPC',
      url: 'https://api.mainnet-beta.solana.com',
    });

    render(<BlockClockWidget instance={mockInstance} />);

    await waitFor(() => {
      expect(screen.getByText('Temporary error')).toBeInTheDocument();
    });

    // Fix the error
    shouldFail = false;
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText('2,000')).toBeInTheDocument();
      expect(screen.queryByText('Temporary error')).not.toBeInTheDocument();
    });
  });
});
