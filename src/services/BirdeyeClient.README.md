# Birdeye API Client

A robust TypeScript client for interacting with the Birdeye public API for Solana token data.

## Features

- ✅ **Token Overview**: Fetch comprehensive token data including price, volume, and market cap
- ✅ **Holder Distribution**: Get token holder data with rankings and percentages
- ✅ **New Pairs**: Discover recently created token pairs
- ✅ **Trending Tokens**: Find tokens with volume spikes
- ✅ **Exponential Backoff**: Automatic retry logic with exponential backoff for failed requests
- ✅ **Error Handling**: Comprehensive error handling with custom error types
- ✅ **Type Safety**: Full TypeScript support with detailed type definitions

## Installation

The client is already included in the project. Import it from:

```typescript
import { birdeyeClient } from '@/services/BirdeyeClient';
```

## Usage

### Get Token Overview

Fetch comprehensive token data including price, volume, and market cap.

```typescript
import { birdeyeClient } from '@/services/BirdeyeClient';

try {
  const tokenData = await birdeyeClient.getTokenOverview(
    'So11111111111111111111111111111111111111112' // SOL token address
  );
  
  console.log(`${tokenData.name} (${tokenData.symbol})`);
  console.log(`Price: $${tokenData.price}`);
  console.log(`24h Volume: $${tokenData.volume24h}`);
  console.log(`Market Cap: $${tokenData.marketCap}`);
} catch (error) {
  console.error('Failed to fetch token data:', error);
}
```

### Get Holder Distribution

Fetch token holder data sorted by balance.

```typescript
try {
  const holders = await birdeyeClient.getHolderDistribution('token-address');
  
  holders.forEach(holder => {
    console.log(`Rank ${holder.rank}: ${holder.address}`);
    console.log(`  Balance: ${holder.balance}`);
    console.log(`  Percentage: ${holder.percentage}%`);
  });
  
  // Calculate concentration
  const top10Concentration = holders
    .slice(0, 10)
    .reduce((sum, h) => sum + h.percentage, 0);
  console.log(`Top 10 holders own: ${top10Concentration}%`);
} catch (error) {
  console.error('Failed to fetch holder data:', error);
}
```

### Get New Pairs

Discover recently created token pairs.

```typescript
try {
  const newPairs = await birdeyeClient.getNewPairs(20); // Fetch 20 pairs
  
  newPairs.forEach(pair => {
    const ageHours = (Date.now() - pair.createdAt) / (1000 * 60 * 60);
    console.log(`${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
    console.log(`  Age: ${ageHours.toFixed(1)} hours`);
    console.log(`  Liquidity: $${pair.liquidity}`);
    console.log(`  24h Volume: $${pair.volume24h}`);
  });
} catch (error) {
  console.error('Failed to fetch new pairs:', error);
}
```

### Get Trending Tokens

Find tokens with volume spikes.

```typescript
try {
  const trending = await birdeyeClient.getTrendingTokens(10); // Top 10 trending
  
  trending.forEach(token => {
    console.log(`${token.name} (${token.symbol})`);
    console.log(`  Price: $${token.price}`);
    console.log(`  24h Volume: $${token.volume24h}`);
    console.log(`  Volume Change: ${token.volumeChange24h}%`);
  });
} catch (error) {
  console.error('Failed to fetch trending tokens:', error);
}
```

## API Methods

### `getTokenOverview(address: string): Promise<TokenOverview>`

Fetches comprehensive token data.

**Parameters:**
- `address` - Solana token address

**Returns:** `TokenOverview` object containing:
- `address` - Token address
- `symbol` - Token symbol
- `name` - Token name
- `decimals` - Token decimals
- `supply` - Total supply
- `price` - Current price in USD
- `priceChange24h` - 24-hour price change percentage
- `volume24h` - 24-hour trading volume
- `marketCap` - Market capitalization
- `liquidity` - Total liquidity
- `logoURI` - Token logo URL (optional)

### `getHolderDistribution(address: string): Promise<HolderData[]>`

Fetches token holder distribution data.

**Parameters:**
- `address` - Solana token address

**Returns:** Array of `HolderData` objects containing:
- `address` - Holder wallet address
- `balance` - Token balance
- `percentage` - Percentage of total supply
- `rank` - Holder rank by balance

### `getNewPairs(limit?: number): Promise<TokenPair[]>`

Fetches recently created token pairs.

**Parameters:**
- `limit` - Maximum number of pairs to return (default: 20)

**Returns:** Array of `TokenPair` objects containing:
- `pairAddress` - Pair address
- `baseToken` - Base token info (address, symbol, name, decimals)
- `quoteToken` - Quote token info (address, symbol, name, decimals)
- `liquidity` - Total liquidity
- `volume24h` - 24-hour trading volume
- `priceChange24h` - 24-hour price change percentage
- `createdAt` - Creation timestamp

### `getTrendingTokens(limit?: number): Promise<TrendingToken[]>`

Fetches trending tokens with volume spikes.

**Parameters:**
- `limit` - Maximum number of tokens to return (default: 20)

**Returns:** Array of `TrendingToken` objects containing:
- `address` - Token address
- `symbol` - Token symbol
- `name` - Token name
- `price` - Current price in USD
- `priceChange24h` - 24-hour price change percentage
- `volume24h` - 24-hour trading volume
- `volumeChange24h` - 24-hour volume change percentage
- `marketCap` - Market capitalization
- `logoURI` - Token logo URL (optional)

## Error Handling

The client throws `BirdeyeAPIError` for all API-related errors.

```typescript
import { birdeyeClient, BirdeyeAPIError } from '@/services/BirdeyeClient';

try {
  const data = await birdeyeClient.getTokenOverview('invalid-address');
} catch (error) {
  if (error instanceof BirdeyeAPIError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Endpoint:', error.endpoint);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1000ms
- **Max Delay**: 10000ms
- **Backoff Multiplier**: 2x

**Retry Conditions:**
- ✅ 500-level server errors
- ✅ 429 rate limit errors
- ✅ Network errors (TypeError)
- ❌ 400-level client errors (no retry)

**Example Retry Sequence:**
1. Initial request fails (500 error)
2. Wait 1000ms, retry
3. Retry fails, wait 2000ms
4. Retry fails, wait 4000ms
5. Final retry fails, throw error

## Rate Limiting

The Birdeye public API has rate limits. The client automatically handles 429 responses with exponential backoff. For production use, consider:

1. Implementing request caching (e.g., with React Query)
2. Debouncing user-triggered requests
3. Using the API key for higher rate limits (if available)

## Testing

The client includes comprehensive unit tests covering:

- ✅ Successful API responses
- ✅ Error handling
- ✅ Retry logic
- ✅ Network errors
- ✅ Rate limiting
- ✅ Data parsing

Run tests:

```bash
npm test -- src/services/BirdeyeClient.test.ts
```

## Type Definitions

All type definitions are available in `src/types/birdeye.ts`:

```typescript
import type {
  TokenOverview,
  TokenPair,
  HolderData,
  TrendingToken,
} from '@/types/birdeye';
```

## Requirements

This implementation satisfies the following requirements:

- **Requirement 5.3**: Birdeye widget data fetching
- **Requirement 6.1**: Token overview data
- **Requirement 6.2**: Holder distribution data
- **Requirement 6.3**: LP overview metrics

## Base URL

The client uses the Birdeye public API base URL:

```
https://public-api.birdeye.so
```

## Endpoints Used

- `/defi/v3/token/overview` - Token overview data
- `/defi/v3/token/holder` - Holder distribution
- `/defi/v3/pairs/new` - New token pairs
- `/defi/v3/tokens/trending` - Trending tokens

## Notes

- All numeric values are properly parsed from string responses
- Timestamps are in Unix milliseconds
- The client is exported as a singleton instance for convenience
- Custom instances can be created using `new BirdeyeClient()`
