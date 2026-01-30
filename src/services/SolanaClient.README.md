# SolanaClient

A robust wrapper around `@solana/web3.js` Connection that provides automatic fallback to secondary RPC endpoints when the primary endpoint fails.

## Overview

The `SolanaClient` ensures reliable access to Solana blockchain data by implementing automatic failover between multiple RPC endpoints. When a request fails on the primary endpoint, it automatically retries on fallback endpoints, providing resilience against RPC downtime or rate limiting.

## Features

- **Automatic Fallback**: Seamlessly switches to backup RPC endpoints on failure
- **Multiple Endpoints**: Supports configurable primary and fallback RPC endpoints
- **Error Recovery**: Automatically resets to primary endpoint after successful fallback
- **Type Safety**: Full TypeScript support with proper type definitions
- **Comprehensive API**: Wraps common Solana RPC methods with fallback support

## Requirements Satisfied

- **Requirement 7.9**: Use Public_RPC endpoints for all blockchain interactions
- **Requirement 9.6**: Support Block Clock widget with real-time slot updates
- **Requirement 19.4**: Implement fallback RPC endpoints for reliability

## Installation

The SolanaClient is already included in the project. Import it from the services directory:

```typescript
import { SolanaClient, solanaClient } from '@/services/SolanaClient';
```

## Usage

### Using the Singleton Instance

The simplest way to use SolanaClient is through the exported singleton:

```typescript
import solanaClient from '@/services/SolanaClient';

// Get current slot
const slot = await solanaClient.getCurrentSlot();
console.log('Current slot:', slot);

// Get token accounts for a wallet
const publicKey = new PublicKey('YourWalletAddressHere');
const accounts = await solanaClient.getTokenAccountsByOwner(publicKey);
console.log('Token accounts:', accounts);

// Get the underlying Connection instance
const connection = solanaClient.getConnection();
```

### Creating a Custom Instance

You can create a custom instance with your own RPC endpoints:

```typescript
import { SolanaClient } from '@/services/SolanaClient';

const client = new SolanaClient([
  { url: 'https://api.mainnet-beta.solana.com', name: 'Mainnet Beta' },
  { url: 'https://solana-api.projectserum.com', name: 'Project Serum' },
  { url: 'https://rpc.ankr.com/solana', name: 'Ankr' },
]);
```

## API Reference

### Constructor

```typescript
constructor(endpoints?: RPCEndpoint[])
```

Creates a new SolanaClient instance.

**Parameters:**
- `endpoints` (optional): Array of RPC endpoint configurations. If not provided, uses default public endpoints.

**Example:**
```typescript
const client = new SolanaClient([
  { url: 'https://primary.rpc.com', name: 'Primary' },
  { url: 'https://backup.rpc.com', name: 'Backup' },
]);
```

### getConnection()

```typescript
getConnection(): Connection
```

Returns the current Solana Connection instance.

**Returns:** `Connection` - The active Solana web3.js Connection

**Example:**
```typescript
const connection = solanaClient.getConnection();
const balance = await connection.getBalance(publicKey);
```

### getCurrentSlot()

```typescript
async getCurrentSlot(): Promise<number>
```

Gets the current slot number from the Solana blockchain.

**Returns:** `Promise<number>` - The current slot number

**Example:**
```typescript
const slot = await solanaClient.getCurrentSlot();
console.log('Current slot:', slot);

// Calculate estimated time (Solana block time ~400ms)
const estimatedTime = slot * 400;
```

### getTokenAccountsByOwner()

```typescript
async getTokenAccountsByOwner(owner: PublicKey): Promise<TokenAccount[]>
```

Gets all token accounts owned by a wallet.

**Parameters:**
- `owner`: PublicKey of the wallet

**Returns:** `Promise<TokenAccount[]>` - Array of token accounts

**Example:**
```typescript
import { PublicKey } from '@solana/web3.js';

const walletAddress = new PublicKey('YourWalletAddressHere');
const accounts = await solanaClient.getTokenAccountsByOwner(walletAddress);

accounts.forEach(account => {
  console.log('Token account:', account.pubkey.toBase58());
  console.log('Balance:', account.account.lamports);
});
```

### getAccountInfo()

```typescript
async getAccountInfo(address: PublicKey): Promise<AccountInfo | null>
```

Gets account information for a given public key.

**Parameters:**
- `address`: PublicKey to query

**Returns:** `Promise<AccountInfo | null>` - Account info or null if not found

**Example:**
```typescript
const address = new PublicKey('AccountAddressHere');
const accountInfo = await solanaClient.getAccountInfo(address);

if (accountInfo) {
  console.log('Lamports:', accountInfo.lamports);
  console.log('Owner:', accountInfo.owner.toBase58());
}
```

### getTokenSupply()

```typescript
async getTokenSupply(mint: PublicKey): Promise<TokenSupply>
```

Gets the token supply for a given mint.

**Parameters:**
- `mint`: Token mint PublicKey

**Returns:** `Promise<TokenSupply>` - Token supply information

**Example:**
```typescript
const mintAddress = new PublicKey('TokenMintAddressHere');
const supply = await solanaClient.getTokenSupply(mintAddress);

console.log('Total supply:', supply.value.uiAmount);
console.log('Decimals:', supply.value.decimals);
```

### getCurrentEndpoint()

```typescript
getCurrentEndpoint(): RPCEndpoint
```

Gets information about the currently active RPC endpoint.

**Returns:** `RPCEndpoint` - Current endpoint information

**Example:**
```typescript
const endpoint = solanaClient.getCurrentEndpoint();
console.log('Using RPC:', endpoint.name, endpoint.url);
```

### getAllEndpoints()

```typescript
getAllEndpoints(): RPCEndpoint[]
```

Gets all configured RPC endpoints.

**Returns:** `RPCEndpoint[]` - Array of all endpoints

**Example:**
```typescript
const endpoints = solanaClient.getAllEndpoints();
endpoints.forEach((endpoint, index) => {
  console.log(`Endpoint ${index}:`, endpoint.name, endpoint.url);
});
```

## Fallback Mechanism

The SolanaClient automatically handles RPC failures:

1. **Primary Endpoint**: All requests start with the primary (first) endpoint
2. **Automatic Fallback**: If a request fails, it automatically retries on the next endpoint
3. **Cascading Fallback**: Continues through all endpoints until one succeeds
4. **Error Reporting**: If all endpoints fail, throws an error with details
5. **Smart Reset**: After failures, stays on working endpoint for subsequent requests

### Example Fallback Flow

```typescript
// Configured with 3 endpoints: Primary, Fallback1, Fallback2

// Request 1: Primary fails, Fallback1 succeeds
const slot1 = await solanaClient.getCurrentSlot();
// Now using Fallback1

// Request 2: Fallback1 succeeds (stays on Fallback1)
const slot2 = await solanaClient.getCurrentSlot();

// Request 3: All endpoints fail
try {
  const slot3 = await solanaClient.getCurrentSlot();
} catch (error) {
  console.error('All RPC endpoints failed:', error);
  // Automatically reset to Primary for next attempt
}
```

## Error Handling

The SolanaClient provides clear error messages:

```typescript
try {
  const slot = await solanaClient.getCurrentSlot();
} catch (error) {
  if (error.message.includes('All RPC endpoints failed')) {
    // All endpoints are down
    console.error('RPC service unavailable');
  } else {
    // Other error
    console.error('RPC error:', error);
  }
}
```

## Integration Examples

### Block Clock Widget

```typescript
import solanaClient from '@/services/SolanaClient';

function BlockClockWidget() {
  const [slot, setSlot] = useState<number>(0);

  useEffect(() => {
    const updateSlot = async () => {
      try {
        const currentSlot = await solanaClient.getCurrentSlot();
        setSlot(currentSlot);
      } catch (error) {
        console.error('Failed to fetch slot:', error);
      }
    };

    // Update every 400ms (Solana block time)
    const interval = setInterval(updateSlot, 400);
    updateSlot(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Current Slot</h3>
      <p>{slot.toLocaleString()}</p>
    </div>
  );
}
```

### Wallet Token Accounts

```typescript
import solanaClient from '@/services/SolanaClient';
import { PublicKey } from '@solana/web3.js';

async function fetchWalletTokens(walletAddress: string) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const accounts = await solanaClient.getTokenAccountsByOwner(publicKey);
    
    return accounts.map(account => ({
      address: account.pubkey.toBase58(),
      balance: account.account.lamports,
      // Parse token info from account.account.data
    }));
  } catch (error) {
    console.error('Failed to fetch token accounts:', error);
    return [];
  }
}
```

### Swap Widget Integration

```typescript
import solanaClient from '@/services/SolanaClient';

function SwapWidget() {
  const connection = solanaClient.getConnection();
  
  const executeSwap = async (transaction: Transaction) => {
    try {
      // Use the connection for transaction
      const signature = await connection.sendTransaction(transaction, []);
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  };

  // ... rest of swap widget
}
```

## Best Practices

1. **Use the Singleton**: For most cases, use the exported `solanaClient` singleton
2. **Handle Errors**: Always wrap RPC calls in try-catch blocks
3. **Monitor Endpoints**: Check `getCurrentEndpoint()` to see which RPC is being used
4. **Rate Limiting**: Be mindful of rate limits on public RPC endpoints
5. **Caching**: Cache responses when appropriate to reduce RPC calls

## Testing

The SolanaClient includes comprehensive unit tests covering:

- Basic functionality (all methods)
- Fallback mechanism
- Error handling
- Edge cases
- Requirements validation

Run tests with:

```bash
npm run test -- src/services/SolanaClient.test.ts
```

## Default RPC Endpoints

The default configuration includes these public Solana RPC endpoints:

1. **Primary**: `https://api.mainnet-beta.solana.com` (Solana Foundation)
2. **Fallback 1**: `https://solana-api.projectserum.com` (Project Serum)
3. **Fallback 2**: `https://rpc.ankr.com/solana` (Ankr)

These are free, public endpoints suitable for development and production use.

## Performance Considerations

- **Latency**: Fallback adds latency only when primary fails
- **Retry Logic**: Each endpoint is tried once before moving to next
- **Connection Reuse**: Connection instances are reused for efficiency
- **No Caching**: SolanaClient doesn't cache responses; implement caching at the application level

## Troubleshooting

### All endpoints failing

```typescript
// Check endpoint status
const endpoints = solanaClient.getAllEndpoints();
for (const endpoint of endpoints) {
  console.log('Testing:', endpoint.name);
  try {
    const client = new SolanaClient([endpoint]);
    await client.getCurrentSlot();
    console.log('✓ Working');
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
}
```

### Slow responses

```typescript
// Add timeout to requests
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 5000)
);

try {
  const slot = await Promise.race([
    solanaClient.getCurrentSlot(),
    timeoutPromise
  ]);
} catch (error) {
  console.error('Request timed out or failed:', error);
}
```

## Related Documentation

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Solana RPC API Reference](https://docs.solana.com/api/http)
- [BirdeyeClient Documentation](./BirdeyeClient.README.md)

## License

Part of the Alpha Hunter Crypto Workspace project.
