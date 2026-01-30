// Birdeye API type definitions

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;

  logoURI?: string;
  pairAddress?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface TokenPair {
  pairAddress: string;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  createdAt: number;
}

export interface HolderData {
  address: string;
  balance: number;
  percentage: number;
  rank: number;
}

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  logoURI?: string;
  pairAddress?: string;
}

export interface LiquidityPool {
  address: string;
  locked: boolean;
  lockedPercentage: number;
  lockedUntil?: number;
  totalValue: number;
  providersCount: number;
}

// Birdeye API Response Types
export interface BirdeyeTokenResponse {
  success: boolean;
  data: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    supply: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    mc: number;
    logoURI?: string;
  };
}

export interface BirdeyeNewPairsResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      baseToken: { address: string; symbol: string; name: string; decimals: number };
      quoteToken: { address: string; symbol: string; name: string; decimals: number };
      liquidity: number;
      volume24h: number;
      priceChange24h: number;
      createdAt: number;
    }>;
  };
}

export interface BirdeyeHolderResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      balance: string;
      percentage: number;
    }>;
  };
}

export interface BirdeyeTrendingResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      symbol: string;
      name: string;
      price: number;
      priceChange24h: number;
      volume24h: number;
      volumeChange24h: number;
      mc: number;
      logoURI?: string;
    }>;
  };
}

export interface BirdeyeLiquidityPoolResponse {
  success: boolean;
  data: {
    address: string;
    locked: boolean;
    lockedPercentage: number;
    lockedUntil?: number;
    totalValue: number;
    providersCount: number;
  };
}
