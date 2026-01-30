/**
 * SolanaClient Usage Examples
 * 
 * This file demonstrates various ways to use the SolanaClient
 * for interacting with the Solana blockchain.
 */

import { SolanaClient, solanaClient } from './SolanaClient';
import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Example 1: Using the Singleton Instance
// ============================================================================

export async function example1_GetCurrentSlot() {
  console.log('Example 1: Get Current Slot');
  
  try {
    const slot = await solanaClient.getCurrentSlot();
    console.log('Current slot:', slot);
    
    // Calculate estimated time (Solana block time ~400ms)
    const estimatedTime = slot * 400;
    console.log('Estimated time (ms):', estimatedTime);
    
    return slot;
  } catch (error) {
    console.error('Failed to get current slot:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Get Token Accounts for a Wallet
// ============================================================================

export async function example2_GetTokenAccounts(walletAddress: string) {
  console.log('Example 2: Get Token Accounts');
  
  try {
    const publicKey = new PublicKey(walletAddress);
    const accounts = await solanaClient.getTokenAccountsByOwner(publicKey);
    
    console.log(`Found ${accounts.length} token accounts`);
    
    accounts.forEach((account, index) => {
      console.log(`\nAccount ${index + 1}:`);
      console.log('  Address:', account.pubkey.toBase58());
      console.log('  Lamports:', account.account.lamports);
      console.log('  Owner:', account.account.owner.toBase58());
    });
    
    return accounts;
  } catch (error) {
    console.error('Failed to get token accounts:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Get Account Info
// ============================================================================

export async function example3_GetAccountInfo(accountAddress: string) {
  console.log('Example 3: Get Account Info');
  
  try {
    const publicKey = new PublicKey(accountAddress);
    const accountInfo = await solanaClient.getAccountInfo(publicKey);
    
    if (accountInfo) {
      console.log('Account found:');
      console.log('  Lamports:', accountInfo.lamports);
      console.log('  Owner:', accountInfo.owner.toBase58());
      console.log('  Executable:', accountInfo.executable);
      console.log('  Data length:', accountInfo.data.length);
    } else {
      console.log('Account not found');
    }
    
    return accountInfo;
  } catch (error) {
    console.error('Failed to get account info:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: Get Token Supply
// ============================================================================

export async function example4_GetTokenSupply(mintAddress: string) {
  console.log('Example 4: Get Token Supply');
  
  try {
    const publicKey = new PublicKey(mintAddress);
    const supply = await solanaClient.getTokenSupply(publicKey);
    
    console.log('Token supply:');
    console.log('  Amount:', supply.value.amount);
    console.log('  Decimals:', supply.value.decimals);
    console.log('  UI Amount:', supply.value.uiAmount);
    console.log('  UI Amount String:', supply.value.uiAmountString);
    
    return supply;
  } catch (error) {
    console.error('Failed to get token supply:', error);
    throw error;
  }
}

// ============================================================================
// Example 5: Monitor Endpoint Status
// ============================================================================

export function example5_MonitorEndpoints() {
  console.log('Example 5: Monitor Endpoints');
  
  // Get current endpoint
  const currentEndpoint = solanaClient.getCurrentEndpoint();
  console.log('Current endpoint:', currentEndpoint.name, currentEndpoint.url);
  
  // Get all endpoints
  const allEndpoints = solanaClient.getAllEndpoints();
  console.log('\nAll configured endpoints:');
  allEndpoints.forEach((endpoint, index) => {
    const isCurrent = endpoint.url === currentEndpoint.url;
    console.log(`  ${index + 1}. ${endpoint.name} ${isCurrent ? '(current)' : ''}`);
    console.log(`     ${endpoint.url}`);
  });
}

// ============================================================================
// Example 6: Custom Client with Specific Endpoints
// ============================================================================

export function example6_CustomClient() {
  console.log('Example 6: Custom Client');
  
  // Create a custom client with specific endpoints
  const customClient = new SolanaClient([
    { url: 'https://api.mainnet-beta.solana.com', name: 'Mainnet Beta' },
    { url: 'https://rpc.ankr.com/solana', name: 'Ankr' },
  ]);
  
  console.log('Custom client created with endpoints:');
  customClient.getAllEndpoints().forEach((endpoint, index) => {
    console.log(`  ${index + 1}. ${endpoint.name}: ${endpoint.url}`);
  });
  
  return customClient;
}

// ============================================================================
// Example 7: Error Handling with Fallback
// ============================================================================

export async function example7_ErrorHandling() {
  console.log('Example 7: Error Handling');
  
  try {
    // This will automatically try fallback endpoints if primary fails
    const slot = await solanaClient.getCurrentSlot();
    console.log('Successfully got slot:', slot);
    
    // Check which endpoint was used
    const endpoint = solanaClient.getCurrentEndpoint();
    console.log('Used endpoint:', endpoint.name);
    
    return slot;
  } catch (error) {
    // This only happens if ALL endpoints fail
    console.error('All RPC endpoints failed!');
    console.error('Error:', error);
    
    // You might want to:
    // 1. Show user-friendly error message
    // 2. Retry after a delay
    // 3. Use cached data
    // 4. Disable features that require RPC
    
    throw error;
  }
}

// ============================================================================
// Example 8: Block Clock Widget Implementation
// ============================================================================

export class BlockClockExample {
  private intervalId: NodeJS.Timeout | null = null;
  private currentSlot: number = 0;
  
  async start(onUpdate: (slot: number, time: number) => void) {
    console.log('Example 8: Block Clock Widget');
    
    const updateSlot = async () => {
      try {
        this.currentSlot = await solanaClient.getCurrentSlot();
        const estimatedTime = this.currentSlot * 400; // 400ms per slot
        onUpdate(this.currentSlot, estimatedTime);
      } catch (error) {
        console.error('Failed to update slot:', error);
      }
    };
    
    // Initial update
    await updateSlot();
    
    // Update every 400ms (Solana block time)
    this.intervalId = setInterval(updateSlot, 400);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  getCurrentSlot(): number {
    return this.currentSlot;
  }
}

// ============================================================================
// Example 9: Wallet Balance Checker
// ============================================================================

export async function example9_CheckWalletBalance(walletAddress: string) {
  console.log('Example 9: Check Wallet Balance');
  
  try {
    const publicKey = new PublicKey(walletAddress);
    const connection = solanaClient.getConnection();
    
    // Get SOL balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9; // Convert lamports to SOL
    
    console.log('Wallet:', walletAddress);
    console.log('Balance:', solBalance, 'SOL');
    console.log('Balance (lamports):', balance);
    
    // Get token accounts
    const tokenAccounts = await solanaClient.getTokenAccountsByOwner(publicKey);
    console.log('Token accounts:', tokenAccounts.length);
    
    return {
      address: walletAddress,
      solBalance,
      lamports: balance,
      tokenAccountCount: tokenAccounts.length,
    };
  } catch (error) {
    console.error('Failed to check wallet balance:', error);
    throw error;
  }
}

// ============================================================================
// Example 10: Batch Operations with Error Recovery
// ============================================================================

export async function example10_BatchOperations(addresses: string[]) {
  console.log('Example 10: Batch Operations');
  
  const results = [];
  
  for (const address of addresses) {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await solanaClient.getAccountInfo(publicKey);
      
      results.push({
        address,
        success: true,
        data: accountInfo,
      });
      
      console.log(`✓ ${address}: Success`);
    } catch (error) {
      results.push({
        address,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      console.log(`✗ ${address}: Failed`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nCompleted: ${successCount}/${addresses.length} successful`);
  
  return results;
}

// ============================================================================
// Example 11: Connection Health Check
// ============================================================================

export async function example11_HealthCheck() {
  console.log('Example 11: Connection Health Check');
  
  const startTime = Date.now();
  
  try {
    // Try to get current slot
    const slot = await solanaClient.getCurrentSlot();
    const latency = Date.now() - startTime;
    
    const endpoint = solanaClient.getCurrentEndpoint();
    
    console.log('Health check: PASSED');
    console.log('  Endpoint:', endpoint.name);
    console.log('  Current slot:', slot);
    console.log('  Latency:', latency, 'ms');
    
    return {
      healthy: true,
      endpoint: endpoint.name,
      slot,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    console.log('Health check: FAILED');
    console.log('  Latency:', latency, 'ms');
    console.log('  Error:', error);
    
    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Example 12: Using Direct Connection for Advanced Operations
// ============================================================================

export async function example12_AdvancedOperations() {
  console.log('Example 12: Advanced Operations');
  
  try {
    // Get the underlying Connection for advanced operations
    const connection = solanaClient.getConnection();
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('Recent blockhash:', blockhash);
    
    // Get epoch info
    const epochInfo = await connection.getEpochInfo();
    console.log('Epoch info:');
    console.log('  Epoch:', epochInfo.epoch);
    console.log('  Slot index:', epochInfo.slotIndex);
    console.log('  Slots in epoch:', epochInfo.slotsInEpoch);
    
    // Get version
    const version = await connection.getVersion();
    console.log('Solana version:', version['solana-core']);
    
    return {
      blockhash,
      epochInfo,
      version,
    };
  } catch (error) {
    console.error('Advanced operations failed:', error);
    throw error;
  }
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('SOLANA CLIENT EXAMPLES');
  console.log('='.repeat(80));
  
  try {
    // Example 1: Get current slot
    await example1_GetCurrentSlot();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Example 5: Monitor endpoints
    example5_MonitorEndpoints();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Example 6: Custom client
    example6_CustomClient();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Example 7: Error handling
    await example7_ErrorHandling();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Example 11: Health check
    await example11_HealthCheck();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Example 12: Advanced operations
    await example12_AdvancedOperations();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Examples failed:', error);
  }
}

// Uncomment to run examples:
// runAllExamples();
