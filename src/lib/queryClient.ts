import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Configures caching behavior for API requests:
 * - Market data: 30 second cache (frequently changing)
 * - Static data: 5 minute cache (rarely changing)
 * - Request deduplication enabled
 * - Automatic retry with exponential backoff
 * 
 * Requirements: 18.4, 18.5, 18.6
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 30 * 1000, // 30 seconds (market data default)
      
      // Cache time: how long unused data stays in cache
      gcTime: 5 * 60 * 1000, // 5 minutes
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Request deduplication
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
    },
  },
});

/**
 * Query key factories for consistent cache keys
 */
export const queryKeys = {
  // Birdeye API keys
  birdeye: {
    all: ['birdeye'] as const,
    tokenOverview: (address: string) => ['birdeye', 'token-overview', address] as const,
    holderDistribution: (address: string) => ['birdeye', 'holder-distribution', address] as const,
    newPairs: (limit: number) => ['birdeye', 'new-pairs', limit] as const,
    trending: (limit: number) => ['birdeye', 'trending', limit] as const,
  },
  
  // Solana RPC keys
  solana: {
    all: ['solana'] as const,
    currentSlot: () => ['solana', 'current-slot'] as const,
    tokenAccounts: (owner: string) => ['solana', 'token-accounts', owner] as const,
    accountInfo: (address: string) => ['solana', 'account-info', address] as const,
  },
  
  // Jupiter API keys
  jupiter: {
    all: ['jupiter'] as const,
    quote: (inputMint: string, outputMint: string, amount: number, slippageBps: number) =>
      ['jupiter', 'quote', inputMint, outputMint, amount, slippageBps] as const,
  },
};

/**
 * Cache duration presets
 */
export const CACHE_DURATIONS = {
  // Market data (frequently changing)
  MARKET_DATA: 30 * 1000, // 30 seconds
  
  // Static data (rarely changing)
  STATIC_DATA: 5 * 60 * 1000, // 5 minutes
  
  // Real-time data (very frequently changing)
  REALTIME_DATA: 5 * 1000, // 5 seconds
  
  // Historical data (never changes)
  HISTORICAL_DATA: 60 * 60 * 1000, // 1 hour
};
