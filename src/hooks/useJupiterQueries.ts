import { useQuery } from '@tanstack/react-query';
import { jupiterClient } from '../services/JupiterClient';
import { queryKeys, CACHE_DURATIONS } from '../lib/queryClient';
import type { QuoteParams } from '../types/jupiter';

/**
 * React Query hooks for Jupiter API
 * 
 * Provides cached swap quotes with automatic refetching
 * 
 * Requirements: 18.4, 18.5, 18.6
 */

/**
 * Fetch swap quote
 * Cache duration: 5 seconds (real-time pricing)
 */
export function useSwapQuote(params: QuoteParams, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.jupiter.quote(
      params.inputMint,
      params.outputMint,
      params.amount,
      params.slippageBps
    ),
    queryFn: () => jupiterClient.getQuote(params),
    enabled: enabled && !!params.inputMint && !!params.outputMint && params.amount > 0,
    staleTime: CACHE_DURATIONS.REALTIME_DATA,
    retry: 2, // Fewer retries for quotes (they expire quickly)
  });
}
