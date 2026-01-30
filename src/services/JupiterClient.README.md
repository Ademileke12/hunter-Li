# JupiterClient

A wrapper around the Jupiter API for executing token swaps on Solana with optimal routing across multiple DEXes.

## Overview

The `JupiterClient` provides a simple interface to:
- Get swap quotes with price impact and route information
- Execute swaps through the Jupiter aggregator
- Calculate minimum received amounts based on slippage
- Track transaction status

## Requirements

- **7.6**: Use Jupiter SDK to find the best swap route
- **7.7**: Display expected output amount and price impact
- **7.8**: Execute swap transaction via wallet adapter

## Usage

### Basic Setup

```typescript
import { Connection } from '@solana/web3.js';
import { JupiterClient, createJupiterClient } from './services/JupiterClient';

// Create a Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Create Jupiter client
const jupiterClient = createJupiterClient(connection);
```

### Getting a Quote

```typescript
import type { QuoteParams } from './types/jupiter';

const quoteParams: QuoteParams = {
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1000000000, // 1 SOL (in lamports)
  slippageBps: 50, // 0.5% slippage
};

try {
  const quote = await jupiterClient.getQuote(quoteParams);
  
  console.log('Input:', quote.inAmount);
  console.log('Output:', quote.outAmount);
  console.log('Price Impact:', quote.priceImpactPct);
  console.log('Route:', jupiterClient.getRouteSummary(quote));
  
  // Calculate minimum received
  const minReceived = jupiterClient.calculateMinimumReceived(quote);
  console.log('Minimum Received:', minReceived);
} catch (error) {
  console.error('Failed to get quote:', error);
}
```

### Executing a Swap

```typescript
import { VersionedTransaction } from '@solana/web3.js';
import type { SwapParams } from './types/jupiter';

// Assume we have a quote from the previous step
const swapParams: SwapParams = {
  quoteResponse: quote,
  userPublicKey: wallet.publicKey.toString(),
  wrapAndUnwrapSol: true,
  dynamicComputeUnitLimit: true,
};

// Sign transaction function from wallet adapter
const signTransaction = async (tx: VersionedTransaction) => {
  return await wallet.signTransaction(tx);
};

try {
  const result = await jupiterClient.executeSwap(swapParams, signTransaction);
  
  console.log('Transaction Signature:', result.signature);
  console.log('Status:', result.status);
  
  if (result.status === 'failed') {
    console.error('Swap failed:', result.error);
  }
} catch (error) {
  console.error('Failed to execute swap:', error);
}
```

### Advanced Options

#### Direct Routes Only

```typescript
const quoteParams: QuoteParams = {
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1000000000,
  slippageBps: 50,
  onlyDirectRoutes: true, // Only use direct swaps, no intermediate tokens
};
```

#### Custom Prioritization Fee

```typescript
const swapParams: SwapParams = {
  quoteResponse: quote,
  userPublicKey: wallet.publicKey.toString(),
  prioritizationFeeLamports: 10000, // Add priority fee for faster execution
};
```

## API Reference

### `getQuote(params: QuoteParams): Promise<SwapQuote>`

Get a swap quote from Jupiter.

**Parameters:**
- `inputMint`: Input token mint address
- `outputMint`: Output token mint address
- `amount`: Input amount in token's smallest unit
- `slippageBps`: Slippage tolerance in basis points (50 = 0.5%)
- `onlyDirectRoutes` (optional): Only use direct routes
- `asLegacyTransaction` (optional): Use legacy transaction format

**Returns:** `SwapQuote` with route information and price impact

**Throws:** Error if quote cannot be obtained

### `executeSwap(params: SwapParams, signTransaction): Promise<SwapResult>`

Execute a swap transaction.

**Parameters:**
- `params.quoteResponse`: Quote from `getQuote()`
- `params.userPublicKey`: User's wallet public key
- `params.wrapAndUnwrapSol` (optional): Auto wrap/unwrap SOL (default: true)
- `params.dynamicComputeUnitLimit` (optional): Use dynamic compute units (default: true)
- `params.prioritizationFeeLamports` (optional): Priority fee in lamports
- `signTransaction`: Function to sign the transaction with wallet

**Returns:** `SwapResult` with transaction signature and status

### `calculatePriceImpact(quote: SwapQuote): number`

Calculate the price impact percentage from a quote.

**Returns:** Price impact as a decimal (e.g., 0.15 for 0.15%)

### `calculateMinimumReceived(quote: SwapQuote): number`

Calculate the minimum amount that will be received based on slippage.

**Returns:** Minimum output amount in token's smallest unit

### `getRouteSummary(quote: SwapQuote): string[]`

Get a summary of DEXes used in the swap route.

**Returns:** Array of DEX names (e.g., ['Orca', 'Raydium'])

### `updateConnection(connection: Connection): void`

Update the Solana connection instance.

## Types

### QuoteParams

```typescript
interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}
```

### SwapQuote

```typescript
interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RouteStep[];
  contextSlot?: number;
  timeTaken?: number;
}
```

### SwapParams

```typescript
interface SwapParams {
  quoteResponse: SwapQuote;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  feeAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
}
```

### SwapResult

```typescript
interface SwapResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  inputAmount: number;
  outputAmount: number;
  timestamp: number;
  error?: string;
}
```

## Error Handling

The client handles various error scenarios:

1. **No Quote Available**: When Jupiter cannot find a route
2. **API Errors**: Network issues or Jupiter API downtime
3. **Transaction Errors**: Failed transaction execution
4. **Wallet Errors**: User rejection or signing failures

All errors are caught and returned with descriptive messages.

## Best Practices

1. **Always check price impact** before executing swaps
2. **Use appropriate slippage** based on market conditions
3. **Handle transaction failures** gracefully
4. **Monitor transaction status** after execution
5. **Update connection** if RPC endpoint changes

## Example: Complete Swap Flow

```typescript
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { createJupiterClient } from './services/JupiterClient';

async function performSwap(
  wallet: any,
  inputMint: string,
  outputMint: string,
  amount: number
) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  try {
    // Step 1: Get quote
    const quote = await jupiterClient.getQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps: 50,
    });

    // Step 2: Check price impact
    const priceImpact = jupiterClient.calculatePriceImpact(quote);
    if (priceImpact > 1.0) {
      console.warn('High price impact:', priceImpact);
      // Optionally ask user for confirmation
    }

    // Step 3: Show quote details
    const minReceived = jupiterClient.calculateMinimumReceived(quote);
    const route = jupiterClient.getRouteSummary(quote);
    console.log('Route:', route.join(' → '));
    console.log('Minimum Received:', minReceived);

    // Step 4: Execute swap
    const result = await jupiterClient.executeSwap(
      {
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString(),
      },
      (tx: VersionedTransaction) => wallet.signTransaction(tx)
    );

    // Step 5: Handle result
    if (result.status === 'failed') {
      throw new Error(result.error);
    }

    console.log('Swap successful!');
    console.log('Signature:', result.signature);
    
    return result;
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
}
```

## Testing

The client includes comprehensive unit tests covering:
- Quote retrieval with various parameters
- Swap execution success and failure cases
- Price impact calculations
- Minimum received calculations
- Route summary generation
- Error handling scenarios

Run tests with:
```bash
npm test JupiterClient.test.ts
```

## Dependencies

- `@jup-ag/api`: Jupiter API client
- `@solana/web3.js`: Solana web3 library

## Related Files

- `src/types/jupiter.ts`: Type definitions
- `src/services/JupiterClient.test.ts`: Unit tests
- `src/widgets/SwapWidget.tsx`: UI component using this client
