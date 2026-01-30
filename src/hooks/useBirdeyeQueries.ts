import { useQuery } from '@tanstack/react-query';
import { birdeyeClient } from '../services/BirdeyeClient';
import { queryKeys, CACHE_DURATIONS } from '../lib/queryClient';

/**
 * React Query hooks for Birdeye API
 * 
 * Provides cached, deduplicated API calls with automatic refetching
 * and error handling.
 * 
 * Requirements: 18.4, 18.5, 18.6
 */

/**
 * Fetch token overview data
 * Cache duration: 30 seconds (market data)
 */
export function useTokenOverview(tokenAddress: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.birdeye.tokenOverview(tokenAddress),
    queryFn: () => birdeyeClient.getTokenOverview(tokenAddress),
    enabled: enabled && !!tokenAddress,
    staleTime: CACHE_DURATIONS.MARKET_DATA,
    retry: 3,
  });
}

/**
 * Fetch holder distribution data
 * Cache duration: 5 minutes (static data)
 */
export function useHolderDistribution(tokenAddress: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.birdeye.holderDistribution(tokenAddress),
    queryFn: () => birdeyeClient.getHolderDistribution(tokenAddress),
    enabled: enabled && !!tokenAddress,
    staleTime: CACHE_DURATIONS.STATIC_DATA,
    retry: 3,
  });
}

/**
 * Fetch new pairs data
 * Cache duration: 30 seconds (market data)
 */
export function useNewPairs(limit: number = 20, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.birdeye.newPairs(limit),
    queryFn: () => birdeyeClient.getNewPairs(limit),
    enabled,
    staleTime: CACHE_DURATIONS.MARKET_DATA,
    retry: 3,
  });
}

/**
 * Fetch trending tokens data
 * Cache duration: 30 seconds (market data)
 */
export function useTrendingTokens(limit: number = 20, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.birdeye.trending(limit),
    queryFn: () => birdeyeClient.getTrendingTokens(limit),
    enabled,
    staleTime: CACHE_DURATIONS.MARKET_DATA,
    retry: 3,
  });
}
