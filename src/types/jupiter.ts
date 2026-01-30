/**
 * Jupiter SDK Type Definitions
 * 
 * Type definitions for Jupiter aggregator swap functionality
 */

/**
 * Parameters for getting a swap quote
 */
export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}

/**
 * Route information for a swap step
 */
export interface RouteInfo {
  dex: string;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  feeAmount?: number;
  feeMint?: string;
}

/**
 * Swap quote response from Jupiter
 */
export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

/**
 * Parameters for executing a swap
 */
export interface SwapParams {
  quoteResponse: SwapQuote;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  feeAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
}

/**
 * Result of a swap execution
 */
export interface SwapResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  inputAmount: number;
  outputAmount: number;
  timestamp: number;
  error?: string;
}

/**
 * Swap transaction response from Jupiter
 */
export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}
