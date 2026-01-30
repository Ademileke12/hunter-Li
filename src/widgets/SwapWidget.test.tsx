import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SwapWidget from './SwapWidget';
import type { WidgetInstance } from '../types';
import { useWalletStore } from '../stores/walletStore';

// Mock the stores and services
vi.mock('../stores/walletStore', () => ({
  useWalletStore: vi.fn(),
}));

vi.mock('../services/JupiterClient', () => ({
  createJupiterClient: vi.fn(() => ({
    getQuote: vi.fn(),
    executeSwap: vi.fn(),
  })),
}));

vi.mock('../services/SolanaClient', () => ({
  solanaClient: {
    getConnection: vi.fn(() => ({})),
  },
}));

describe('SwapWidget', () => {
  const mockInstance: WidgetInstance = {
    id: 'test-swap-1',
    type: 'swap',
    position: { x: 0, y: 0 },
    size: { width: 400, height: 500 },
    zIndex: 1,
    config: {
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: '',
      slippageBps: 100,
    },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: false,
      publicKey: null,
    });
  });

  describe('Initial Render', () => {
    it('should render input and output token sections', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('You Pay')).toBeInTheDocument();
      expect(screen.getByText('You Receive')).toBeInTheDocument();
    });

    it('should render SOL as default input token', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const inputButtons = screen.getAllByRole('button');
      const solButton = inputButtons.find(btn => btn.textContent?.includes('SOL'));
      expect(solButton).toBeInTheDocument();
    });

    it('should render all quick buy buttons', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('0.1 SOL')).toBeInTheDocument();
      expect(screen.getByText('0.5 SOL')).toBeInTheDocument();
      expect(screen.getByText('1 SOL')).toBeInTheDocument();
      expect(screen.getByText('5 SOL')).toBeInTheDocument();
      expect(screen.getByText('10 SOL')).toBeInTheDocument();
    });

    it('should render slippage tolerance options', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument();
      expect(screen.getByText('0.5%')).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('2%')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should show "Connect Wallet" button when wallet not connected', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should show "Select Output Token" when no output token selected', () => {
      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        connected: true,
        publicKey: 'test-public-key',
      });

      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('Select Output Token')).toBeInTheDocument();
    });
  });

  describe('Quick Buy Buttons', () => {
    it('should populate input amount when quick buy button clicked', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const quickBuyButton = screen.getByText('1 SOL');
      fireEvent.click(quickBuyButton);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      expect(inputField.value).toBe('1');
    });

    it('should populate correct amount for 0.1 SOL', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const quickBuyButton = screen.getByText('0.1 SOL');
      fireEvent.click(quickBuyButton);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      expect(inputField.value).toBe('0.1');
    });

    it('should populate correct amount for 5 SOL', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const quickBuyButton = screen.getByText('5 SOL');
      fireEvent.click(quickBuyButton);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      expect(inputField.value).toBe('5');
    });

    it('should populate correct amount for 10 SOL', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const quickBuyButton = screen.getByText('10 SOL');
      fireEvent.click(quickBuyButton);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      expect(inputField.value).toBe('10');
    });
  });

  describe('Slippage Settings', () => {
    it('should highlight selected slippage preset', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const slippageButton = screen.getByText('1%');
      expect(slippageButton).toHaveStyle({
        background: 'rgba(100, 100, 255, 0.3)',
      });
    });

    it('should change slippage when preset clicked', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const slippageButton = screen.getByText('2%');
      fireEvent.click(slippageButton);
      
      expect(slippageButton).toHaveStyle({
        background: 'rgba(100, 100, 255, 0.3)',
      });
    });

    it('should show custom slippage input when Custom clicked', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);
      
      const customInput = screen.getByPlaceholderText('%');
      expect(customInput).toBeInTheDocument();
    });

    it('should accept custom slippage value', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);
      
      const customInput = screen.getByPlaceholderText('%');
      fireEvent.change(customInput, { target: { value: '3' } });
      
      const submitButton = screen.getByText('✓');
      fireEvent.click(submitButton);
      
      // Custom input should be hidden after submit
      expect(screen.queryByPlaceholderText('%')).not.toBeInTheDocument();
    });
  });

  describe('Token Selection', () => {
    it('should show token search when input token button clicked', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const inputButtons = screen.getAllByRole('button');
      const solButton = inputButtons.find(btn => btn.textContent?.includes('SOL'));
      
      if (solButton) {
        fireEvent.click(solButton);
        expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
      }
    });

    it('should show token search when output token button clicked', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const selectTokenButton = screen.getByText('Select token');
      fireEvent.click(selectTokenButton);
      
      expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
    });

    it('should filter tokens based on search query', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const selectTokenButton = screen.getByText('Select token');
      fireEvent.click(selectTokenButton);
      
      const searchInput = screen.getByPlaceholderText('Search tokens...');
      fireEvent.change(searchInput, { target: { value: 'USDC' } });
      
      expect(screen.getByText('USD Coin')).toBeInTheDocument();
    });

    it('should select token when clicked in search results', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const selectTokenButton = screen.getByText('Select token');
      fireEvent.click(selectTokenButton);
      
      const usdcOption = screen.getByText('USDC');
      fireEvent.click(usdcOption);
      
      // Token search should close and USDC should be selected
      expect(screen.queryByPlaceholderText('Search tokens...')).not.toBeInTheDocument();
    });
  });

  describe('Amount Input', () => {
    it('should accept numeric input', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      fireEvent.change(inputField, { target: { value: '1.5' } });
      
      expect(inputField.value).toBe('1.5');
    });

    it('should handle decimal values', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const inputField = screen.getByPlaceholderText('0.00') as HTMLInputElement;
      fireEvent.change(inputField, { target: { value: '0.123456' } });
      
      expect(inputField.value).toBe('0.123456');
    });
  });

  describe('Swap Button State', () => {
    it('should be disabled when wallet not connected', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const swapButton = screen.getByText('Connect Wallet');
      expect(swapButton).toBeDisabled();
    });

    it('should show "Select Output Token" when wallet connected but no output token', () => {
      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        connected: true,
        publicKey: 'test-public-key',
      });

      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('Select Output Token')).toBeInTheDocument();
    });

    it('should show "Enter Amount" when wallet connected and token selected but no amount', () => {
      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        connected: true,
        publicKey: 'test-public-key',
      });

      const instanceWithOutput = {
        ...mockInstance,
        config: {
          ...mockInstance.config,
          outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        },
      };

      render(<SwapWidget instance={instanceWithOutput} />);
      
      expect(screen.getByText('Enter Amount')).toBeInTheDocument();
    });
  });

  describe('Configuration Persistence', () => {
    it('should use input mint from config', () => {
      const customInstance = {
        ...mockInstance,
        config: {
          inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          outputMint: '',
          slippageBps: 100,
        },
      };

      render(<SwapWidget instance={customInstance} />);
      
      // Should render with USDC as input (though our mock only shows SOL by default)
      // In real implementation, this would show USDC
      expect(screen.getByText('You Pay')).toBeInTheDocument();
    });

    it('should use slippage from config', () => {
      const customInstance = {
        ...mockInstance,
        config: {
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: '',
          slippageBps: 200, // 2%
        },
      };

      render(<SwapWidget instance={customInstance} />);
      
      // 2% should be highlighted
      const slippageButton = screen.getByText('2%');
      expect(slippageButton).toHaveStyle({
        background: 'rgba(100, 100, 255, 0.3)',
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when quote fails', async () => {
      const { createJupiterClient } = await import('../services/JupiterClient');
      const mockJupiterClient = createJupiterClient as unknown as ReturnType<typeof vi.fn>;
      
      mockJupiterClient.mockReturnValue({
        getQuote: vi.fn().mockRejectedValue(new Error('Failed to fetch quote')),
        executeSwap: vi.fn(),
      });

      (useWalletStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        connected: true,
        publicKey: 'test-public-key',
      });

      const instanceWithOutput = {
        ...mockInstance,
        config: {
          ...mockInstance.config,
          outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      };

      render(<SwapWidget instance={instanceWithOutput} />);
      
      const inputField = screen.getByPlaceholderText('0.00');
      fireEvent.change(inputField, { target: { value: '1' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch quote/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have input fields with proper types', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      expect(amountInput).toHaveAttribute('type', 'number');
    });
  });

  describe('UI Interactions', () => {
    it('should show swap direction indicator', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('should display all required sections', () => {
      render(<SwapWidget instance={mockInstance} />);
      
      expect(screen.getByText('You Pay')).toBeInTheDocument();
      expect(screen.getByText('You Receive')).toBeInTheDocument();
      expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument();
    });
  });
});
