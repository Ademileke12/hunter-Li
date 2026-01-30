/**
 * JupiterClient - Wrapper around Jupiter API for token swaps
 * 
 * This client provides access to Jupiter's swap aggregator functionality,
 * enabling users to get quotes and execute swaps across multiple DEXes
 * on Solana for the best rates.
 * 
 * Requirements:
 * - 7.6: Use Jupiter SDK to find the best swap route
 * - 7.7: Display expected output amount and price impact
 * - 7.8: Execute swap transaction via wallet adapter
 */

import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { createJupiterApiClient, QuoteGetRequest, QuoteResponse, SwapPostRequest } from '@jup-ag/api';
import type { QuoteParams, SwapQuote, SwapParams, SwapResult, SwapTransaction } from '../types/jupiter';

/**
 * JupiterClient provides swap quote and execution functionality
 */
export class JupiterClient {
  private jupiterApi: ReturnType<typeof createJupiterApiClient>;
  private connection: Connection;

  /**
   * Initialize JupiterClient
   * @param connection - Solana connection instance
   */
  constructor(connection: Connection) {
    this.connection = connection;
    this.jupiterApi = createJupiterApiClient();
  }

  /**
   * Get a swap quote from Jupiter
   * @param params - Quote parameters
   * @returns Swap quote with route information
   */
  async getQuote(params: QuoteParams): Promise<SwapQuote> {
    try {
      const quoteRequest: QuoteGetRequest = {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
        onlyDirectRoutes: params.onlyDirectRoutes,
        asLegacyTransaction: params.asLegacyTransaction,
      };

      const quote = await this.jupiterApi.quoteGet(quoteRequest);

      if (!quote) {
        throw new Error('No quote received from Jupiter');
      }

      // Transform the response to our SwapQuote type
      return this.transformQuoteResponse(quote);
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      throw new Error(
        `Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute a swap transaction
   * @param params - Swap parameters including quote and user public key
   * @param signTransaction - Function to sign the transaction with wallet
   * @returns Swap result with transaction signature
   */
  async executeSwap(
    params: SwapParams,
    signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>
  ): Promise<SwapResult> {
    try {
      // Get the swap transaction from Jupiter
      const swapRequest: SwapPostRequest = {
        quoteResponse: params.quoteResponse as unknown as QuoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
      };

      const swapResponse = await this.jupiterApi.swapPost({
        swapRequest,
      });

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error('No swap transaction received from Jupiter');
      }

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction with the user's wallet
      const signedTransaction = await signTransaction(transaction);

      // Send the transaction
      const rawTransaction = signedTransaction.serialize();
      const signature = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Return pending result immediately
      const result: SwapResult = {
        signature,
        status: 'pending',
        inputAmount: parseInt(params.quoteResponse.inAmount),
        outputAmount: parseInt(params.quoteResponse.outAmount),
        timestamp: Date.now(),
      };

      // Confirm transaction in background
      this.confirmTransaction(signature, result);

      return result;
    } catch (error) {
      console.error('Error executing swap:', error);
      
      return {
        signature: '',
        status: 'failed',
        inputAmount: parseInt(params.quoteResponse.inAmount),
        outputAmount: parseInt(params.quoteResponse.outAmount),
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Confirm a transaction and update its status
   * @param signature - Transaction signature
   * @param result - Swap result to update
   */
  private async confirmTransaction(signature: string, result: SwapResult): Promise<void> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        result.status = 'failed';
        result.error = 'Transaction failed on-chain';
      } else {
        result.status = 'confirmed';
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Confirmation failed';
    }
  }

  /**
   * Transform Jupiter API quote response to our SwapQuote type
   * @param quote - Jupiter API quote response
   * @returns Transformed swap quote
   */
  private transformQuoteResponse(quote: QuoteResponse): SwapQuote {
    return {
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      otherAmountThreshold: quote.otherAmountThreshold,
      swapMode: quote.swapMode,
      slippageBps: quote.slippageBps,
      priceImpactPct: quote.priceImpactPct,
      routePlan: quote.routePlan.map((step) => ({
        swapInfo: {
          ammKey: step.swapInfo.ammKey,
          label: step.swapInfo.label || '',
          inputMint: step.swapInfo.inputMint,
          outputMint: step.swapInfo.outputMint,
          inAmount: step.swapInfo.inAmount,
          outAmount: step.swapInfo.outAmount,
          feeAmount: step.swapInfo.feeAmount,
          feeMint: step.swapInfo.feeMint,
        },
        percent: step.percent,
      })),
      contextSlot: quote.contextSlot,
      timeTaken: quote.timeTaken,
    };
  }

  /**
   * Calculate price impact percentage from quote
   * @param quote - Swap quote
   * @returns Price impact as a percentage
   */
  calculatePriceImpact(quote: SwapQuote): number {
    return parseFloat(quote.priceImpactPct);
  }

  /**
   * Calculate minimum received amount based on slippage
   * @param quote - Swap quote
   * @returns Minimum amount that will be received
   */
  calculateMinimumReceived(quote: SwapQuote): number {
    const outAmount = parseInt(quote.outAmount);
    const slippageMultiplier = 1 - quote.slippageBps / 10000;
    return Math.floor(outAmount * slippageMultiplier);
  }

  /**
   * Get route summary from quote
   * @param quote - Swap quote
   * @returns Array of DEX names used in the route
   */
  getRouteSummary(quote: SwapQuote): string[] {
    return quote.routePlan.map((step) => step.swapInfo.label);
  }

  /**
   * Update the connection instance
   * @param connection - New Solana connection
   */
  updateConnection(connection: Connection): void {
    this.connection = connection;
  }
}

// Export a factory function to create instances
export const createJupiterClient = (connection: Connection): JupiterClient => {
  return new JupiterClient(connection);
};

export default JupiterClient;
