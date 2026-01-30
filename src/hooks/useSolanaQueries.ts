import { useQuery } from '@tanstack/react-query';
import { solanaClient } from '../services/SolanaClient';
import { queryKeys, CACHE_DURATIONS } from '../lib/queryClient';
import { PublicKey } from '@solana/web3.js';

/**
 * React Query hooks for Solana RPC
 * 
 * Provides cached blockchain data with automatic refetching
 * 
 * Requirements: 18.4, 18.5, 18.6
 */

/**
 * Fetch current slot
 * Cache duration: 5 seconds (real-time data)
 */
export function useCurrentSlot(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.solana.currentSlot(),
    queryFn: async () => {
      const connection = solanaClient.getConnection();
      return await connection.getSlot();
    },
    enabled,
    staleTime: CACHE_DURATIONS.REALTIME_DATA,
    refetchInterval: 400, // Solana block time
    retry: 3,
  });
}

/**
 * Fetch token accounts for owner
 * Cache duration: 30 seconds (market data)
 */
export function useTokenAccounts(ownerAddress: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.solana.tokenAccounts(ownerAddress),
    queryFn: async () => {
      const connection = solanaClient.getConnection();
      const owner = new PublicKey(ownerAddress);
      return await connection.getParsedTokenAccountsByOwner(owner, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });
    },
    enabled: enabled && !!ownerAddress,
    staleTime: CACHE_DURATIONS.MARKET_DATA,
    retry: 3,
  });
}

/**
 * Fetch account info
 * Cache duration: 30 seconds (market data)
 */
export function useAccountInfo(address: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.solana.accountInfo(address),
    queryFn: async () => {
      const connection = solanaClient.getConnection();
      const pubkey = new PublicKey(address);
      return await connection.getAccountInfo(pubkey);
    },
    enabled: enabled && !!address,
    staleTime: CACHE_DURATIONS.MARKET_DATA,
    retry: 3,
  });
}
