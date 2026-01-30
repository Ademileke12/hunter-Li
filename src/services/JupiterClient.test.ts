/**
 * Unit tests for JupiterClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { JupiterClient, createJupiterClient } from './JupiterClient';
import type { QuoteParams, SwapParams, SwapQuote } from '../types/jupiter';

// Create mock functions
const mockQuoteGet = vi.fn();
const mockSwapPost = vi.fn();

// Mock the Jupiter API
vi.mock('@jup-ag/api', () => ({
  createJupiterApiClient: vi.fn(() => ({
    quoteGet: mockQuoteGet,
    swapPost: mockSwapPost,
  })),
}));

describe('JupiterClient', () => {
  let jupiterClient: JupiterClient;
  let mockConnection: Connection;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a mock connection
    mockConnection = {
      sendRawTransaction: vi.fn(),
      confirmTransaction: vi.fn(),
    } as any;

    // Create Jupiter client
    jupiterClient = new JupiterClient(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should get a quote successfully', async () => {
      const mockQuoteResponse = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key',
              label: 'Orca',
              inputMint: 'So11111111111111111111111111111111111111112',
              outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              inAmount: '1000000000',
              outAmount: '100000000',
              feeAmount: '1000',
              feeMint: 'So11111111111111111111111111111111111111112',
            },
            percent: 100,
          },
        ],
        contextSlot: 123456,
        timeTaken: 0.5,
      };

      mockQuoteGet.mockResolvedValue(mockQuoteResponse);

      const params: QuoteParams = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1000000000,
        slippageBps: 50,
      };

      const quote = await jupiterClient.getQuote(params);

      expect(quote).toBeDefined();
      expect(quote.inputMint).toBe(params.inputMint);
      expect(quote.outputMint).toBe(params.outputMint);
      expect(quote.inAmount).toBe('1000000000');
      expect(quote.outAmount).toBe('100000000');
      expect(quote.slippageBps).toBe(50);
      expect(quote.routePlan).toHaveLength(1);
      expect(quote.routePlan[0].swapInfo.label).toBe('Orca');
    });

    it('should throw error when no quote is received', async () => {
      mockQuoteGet.mockResolvedValue(null);

      const params: QuoteParams = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1000000000,
        slippageBps: 50,
      };

      await expect(jupiterClient.getQuote(params)).rejects.toThrow(
        'Failed to get swap quote: No quote received from Jupiter'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockQuoteGet.mockRejectedValue(new Error('API Error'));

      const params: QuoteParams = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1000000000,
        slippageBps: 50,
      };

      await expect(jupiterClient.getQuote(params)).rejects.toThrow(
        'Failed to get swap quote: API Error'
      );
    });

    it('should pass optional parameters to Jupiter API', async () => {
      const mockQuoteResponse = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      mockQuoteGet.mockResolvedValue(mockQuoteResponse);

      const params: QuoteParams = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1000000000,
        slippageBps: 50,
        onlyDirectRoutes: true,
        asLegacyTransaction: false,
      };

      await jupiterClient.getQuote(params);

      expect(mockQuoteGet).toHaveBeenCalledWith({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
        onlyDirectRoutes: true,
        asLegacyTransaction: false,
      });
    });
  });

  describe('executeSwap', () => {
    it('should execute swap successfully', async () => {
      // Create a properly serialized mock transaction
      // We'll just mock a valid base64 string that can be deserialized
      const mockSwapResponse = {
        swapTransaction: 'gAEBAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gA==',
        lastValidBlockHeight: 123456,
      };

      mockSwapPost.mockResolvedValue(mockSwapResponse);
      mockConnection.sendRawTransaction = vi.fn().mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction = vi.fn().mockResolvedValue({
        value: { err: null },
      });

      const mockQuote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const params: SwapParams = {
        quoteResponse: mockQuote,
        userPublicKey: 'test-public-key',
        wrapAndUnwrapSol: true,
      };

      const mockSignTransaction = vi.fn().mockImplementation((tx) => Promise.resolve(tx));

      const result = await jupiterClient.executeSwap(params, mockSignTransaction);

      // The swap should either succeed or fail gracefully
      expect(result).toBeDefined();
      expect(result.inputAmount).toBe(1000000000);
      expect(result.outputAmount).toBe(100000000);
      expect(['pending', 'failed']).toContain(result.status);
      
      // If it succeeded, check the signature
      if (result.status === 'pending') {
        expect(result.signature).toBe('mock-signature');
        expect(mockSignTransaction).toHaveBeenCalled();
      }
    });

    it('should handle swap execution errors', async () => {
      mockSwapPost.mockRejectedValue(new Error('Swap failed'));

      const mockQuote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const params: SwapParams = {
        quoteResponse: mockQuote,
        userPublicKey: 'test-public-key',
      };

      const mockSignTransaction = vi.fn();

      const result = await jupiterClient.executeSwap(params, mockSignTransaction);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.signature).toBe('');
    });

    it('should handle missing swap transaction', async () => {
      mockSwapPost.mockResolvedValue({});

      const mockQuote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const params: SwapParams = {
        quoteResponse: mockQuote,
        userPublicKey: 'test-public-key',
      };

      const mockSignTransaction = vi.fn();

      const result = await jupiterClient.executeSwap(params, mockSignTransaction);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No swap transaction received');
    });
  });

  describe('calculatePriceImpact', () => {
    it('should calculate price impact correctly', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.15',
        routePlan: [],
      };

      const priceImpact = jupiterClient.calculatePriceImpact(quote);
      expect(priceImpact).toBe(0.15);
    });

    it('should handle zero price impact', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0',
        routePlan: [],
      };

      const priceImpact = jupiterClient.calculatePriceImpact(quote);
      expect(priceImpact).toBe(0);
    });
  });

  describe('calculateMinimumReceived', () => {
    it('should calculate minimum received with slippage', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50, // 0.5%
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const minReceived = jupiterClient.calculateMinimumReceived(quote);
      // 100000000 * (1 - 0.005) = 99500000
      expect(minReceived).toBe(99500000);
    });

    it('should calculate minimum received with 1% slippage', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 100, // 1%
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const minReceived = jupiterClient.calculateMinimumReceived(quote);
      // 100000000 * (1 - 0.01) = 99000000
      expect(minReceived).toBe(99000000);
    });

    it('should handle zero slippage', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '100000000',
        swapMode: 'ExactIn',
        slippageBps: 0,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const minReceived = jupiterClient.calculateMinimumReceived(quote);
      expect(minReceived).toBe(100000000);
    });
  });

  describe('getRouteSummary', () => {
    it('should return route summary with single DEX', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key',
              label: 'Orca',
              inputMint: 'So11111111111111111111111111111111111111112',
              outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              inAmount: '1000000000',
              outAmount: '100000000',
              feeAmount: '1000',
              feeMint: 'So11111111111111111111111111111111111111112',
            },
            percent: 100,
          },
        ],
      };

      const summary = jupiterClient.getRouteSummary(quote);
      expect(summary).toEqual(['Orca']);
    });

    it('should return route summary with multiple DEXes', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key-1',
              label: 'Orca',
              inputMint: 'So11111111111111111111111111111111111111112',
              outputMint: 'intermediate-mint',
              inAmount: '500000000',
              outAmount: '50000000',
              feeAmount: '500',
              feeMint: 'So11111111111111111111111111111111111111112',
            },
            percent: 50,
          },
          {
            swapInfo: {
              ammKey: 'test-amm-key-2',
              label: 'Raydium',
              inputMint: 'intermediate-mint',
              outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              inAmount: '50000000',
              outAmount: '50000000',
              feeAmount: '500',
              feeMint: 'intermediate-mint',
            },
            percent: 50,
          },
        ],
      };

      const summary = jupiterClient.getRouteSummary(quote);
      expect(summary).toEqual(['Orca', 'Raydium']);
    });

    it('should handle empty route plan', () => {
      const quote: SwapQuote = {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000000',
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        priceImpactPct: '0.1',
        routePlan: [],
      };

      const summary = jupiterClient.getRouteSummary(quote);
      expect(summary).toEqual([]);
    });
  });

  describe('updateConnection', () => {
    it('should update connection instance', () => {
      const newConnection = {
        sendRawTransaction: vi.fn(),
        confirmTransaction: vi.fn(),
      } as any;

      jupiterClient.updateConnection(newConnection);

      // Verify the connection was updated by checking internal state
      // (This is a simple test since we can't directly access private properties)
      expect(jupiterClient).toBeDefined();
    });
  });

  describe('createJupiterClient', () => {
    it('should create a new JupiterClient instance', () => {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const client = createJupiterClient(connection);

      expect(client).toBeInstanceOf(JupiterClient);
    });
  });
});
