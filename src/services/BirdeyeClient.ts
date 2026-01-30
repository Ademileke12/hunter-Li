/**
 * Birdeye API Client
 * 
 * Provides methods to interact with the Birdeye public API for Solana token data.
 * Implements exponential backoff retry logic for failed requests.
 * 
 * Requirements: 5.3, 6.1, 6.2, 6.3
 */

import type {
  TokenOverview,
  TokenPair,
  HolderData,
  TrendingToken,
  LiquidityPool,
  BirdeyeTokenResponse,
  BirdeyeNewPairsResponse,
  BirdeyeHolderResponse,
  BirdeyeTrendingResponse,
  BirdeyeLiquidityPoolResponse,
} from '../types/birdeye';

export class BirdeyeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'BirdeyeAPIError';
  }
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class BirdeyeClient {
  private readonly baseURL = 'https://public-api.birdeye.so';
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  };

  /**
   * Fetch token overview data including price, volume, and market cap
   * @param address - Solana token address
   * @returns Token overview data
   */
  async getTokenOverview(address: string): Promise<TokenOverview> {
    const endpoint = `/defi/v3/token/overview`;
    const params = new URLSearchParams({ address });

    const response = await this.fetchWithRetry<BirdeyeTokenResponse>(
      `${endpoint}?${params.toString()}`
    );

    if (!response.success || !response.data) {
      throw new BirdeyeAPIError(
        'Failed to fetch token overview',
        undefined,
        endpoint
      );
    }

    const data = response.data;
    return {
      address: data.address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      supply: parseFloat(data.supply),
      price: data.price,
      priceChange24h: data.priceChange24h,
      volume24h: data.volume24h,
      marketCap: data.mc,
      liquidity: data.liquidity,
      logoURI: data.logoURI,
    };
  }

  /**
   * Fetch holder distribution data for a token
   * @param address - Solana token address
   * @returns Array of holder data sorted by balance
   */
  async getHolderDistribution(address: string): Promise<HolderData[]> {
    const endpoint = `/defi/v3/token/holder`;
    const params = new URLSearchParams({ address });

    const response = await this.fetchWithRetry<BirdeyeHolderResponse>(
      `${endpoint}?${params.toString()}`
    );

    if (!response.success || !response.data?.items) {
      throw new BirdeyeAPIError(
        'Failed to fetch holder distribution',
        undefined,
        endpoint
      );
    }

    return response.data.items.map((item, index) => ({
      address: item.address,
      balance: parseFloat(item.balance),
      percentage: item.percentage,
      rank: index + 1,
    }));
  }

  /**
   * Fetch recently created token pairs
   * @param limit - Maximum number of pairs to return (default: 20)
   * @returns Array of new token pairs
   */
  async getNewPairs(limit: number = 20): Promise<TokenPair[]> {
    const endpoint = `/defi/v3/pairs/new`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_by: 'createdAt',
      sort_type: 'desc',
    });

    const response = await this.fetchWithRetry<BirdeyeNewPairsResponse>(
      `${endpoint}?${params.toString()}`
    );

    if (!response.success || !response.data?.items) {
      throw new BirdeyeAPIError(
        'Failed to fetch new pairs',
        undefined,
        endpoint
      );
    }

    return response.data.items.map(item => ({
      pairAddress: item.address,
      baseToken: {
        address: item.baseToken.address,
        symbol: item.baseToken.symbol,
        name: item.baseToken.name,
        decimals: item.baseToken.decimals,
      },
      quoteToken: {
        address: item.quoteToken.address,
        symbol: item.quoteToken.symbol,
        name: item.quoteToken.name,
        decimals: item.quoteToken.decimals,
      },
      liquidity: item.liquidity,
      volume24h: item.volume24h,
      priceChange24h: item.priceChange24h,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Fetch trending tokens with volume spikes
   * @param limit - Maximum number of tokens to return (default: 20)
   * @returns Array of trending tokens
   */
  async getTrendingTokens(limit: number = 20): Promise<TrendingToken[]> {
    const endpoint = `/defi/v3/tokens/trending`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_by: 'volumeChange24h',
      sort_type: 'desc',
    });

    const response = await this.fetchWithRetry<BirdeyeTrendingResponse>(
      `${endpoint}?${params.toString()}`
    );

    if (!response.success || !response.data?.items) {
      throw new BirdeyeAPIError(
        'Failed to fetch trending tokens',
        undefined,
        endpoint
      );
    }

    return response.data.items.map(item => ({
      address: item.address,
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      priceChange24h: item.priceChange24h,
      volume24h: item.volume24h,
      volumeChange24h: item.volumeChange24h,
      marketCap: item.mc,
      logoURI: item.logoURI,
    }));
  }

  /**
   * Fetch liquidity pool data for a token
   * @param address - Solana token address
   * @returns Liquidity pool data
   */
  async getLiquidityPool(address: string): Promise<LiquidityPool> {
    const endpoint = `/defi/v3/token/liquidity`;
    const params = new URLSearchParams({ address });

    const response = await this.fetchWithRetry<BirdeyeLiquidityPoolResponse>(
      `${endpoint}?${params.toString()}`
    );

    if (!response.success || !response.data) {
      throw new BirdeyeAPIError(
        'Failed to fetch liquidity pool data',
        undefined,
        endpoint
      );
    }

    const data = response.data;
    return {
      address: data.address,
      locked: data.locked,
      lockedPercentage: data.lockedPercentage,
      lockedUntil: data.lockedUntil,
      totalValue: data.totalValue,
      providersCount: data.providersCount,
    };
  }

  /**
   * Fetch data with exponential backoff retry logic
   * @param endpoint - API endpoint path (relative to baseURL)
   * @returns Parsed JSON response
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    attempt: number = 0
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': import.meta.env.VITE_BIRDEYE_API_KEY || '',
          'x-chain': 'solana',
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          await this.sleep(delay);
          return this.fetchWithRetry<T>(endpoint, attempt + 1);
        }
        throw new BirdeyeAPIError(
          'Rate limit exceeded',
          429,
          endpoint
        );
      }

      // Handle server errors with retry
      if (response.status >= 500) {
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          await this.sleep(delay);
          return this.fetchWithRetry<T>(endpoint, attempt + 1);
        }
        throw new BirdeyeAPIError(
          `Server error: ${response.status}`,
          response.status,
          endpoint
        );
      }

      // Handle client errors (no retry)
      if (!response.ok) {
        throw new BirdeyeAPIError(
          `HTTP error: ${response.status}`,
          response.status,
          endpoint
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Network errors - retry
      if (error instanceof TypeError && attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoffDelay(attempt);
        await this.sleep(delay);
        return this.fetchWithRetry<T>(endpoint, attempt + 1);
      }

      // Re-throw BirdeyeAPIError as-is
      if (error instanceof BirdeyeAPIError) {
        throw error;
      }

      // Wrap other errors
      throw new BirdeyeAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        undefined,
        endpoint
      );
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt - Current retry attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const birdeyeClient = new BirdeyeClient();
