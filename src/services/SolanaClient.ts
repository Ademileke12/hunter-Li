/**
 * SolanaClient - Wrapper around @solana/web3.js Connection with fallback RPC support
 * 
 * This client provides reliable access to Solana blockchain data by implementing
 * automatic fallback to secondary RPC endpoints when the primary endpoint fails.
 * 
 * Requirements:
 * - 7.9: Use Public_RPC endpoints for all blockchain interactions
 * - 9.6: Block Clock widget updates using RPC
 * - 19.4: Implement fallback RPC endpoints for reliability
 */

import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';

/**
 * RPC endpoint configuration
 */
interface RPCEndpoint {
  url: string;
  name: string;
}

/**
 * Token account information
 */
export interface TokenAccount {
  pubkey: PublicKey;
  account: {
    data: ParsedAccountData;
    executable: boolean;
    lamports: number;
    owner: PublicKey;
    rentEpoch?: number;
  };
}

/**
 * SolanaClient provides reliable RPC access with automatic fallback
 */
export class SolanaClient {
  private endpoints: RPCEndpoint[];
  private currentEndpointIndex: number = 0;
  private connection: Connection;

  /**
   * Initialize SolanaClient with RPC endpoints
   * @param endpoints - Array of RPC endpoints (primary, fallback1, fallback2, ...)
   */
  constructor(endpoints?: RPCEndpoint[]) {
    // Default public RPC endpoints
    this.endpoints = endpoints || [
      { url: 'https://api.mainnet-beta.solana.com', name: 'Mainnet Beta' },
      { url: 'https://solana-api.projectserum.com', name: 'Project Serum' },
      { url: 'https://rpc.ankr.com/solana', name: 'Ankr' },
    ];

    // Initialize connection with primary endpoint
    this.connection = new Connection(this.endpoints[0].url, 'confirmed');
  }

  /**
   * Get the current Connection instance
   * @returns Current Solana Connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Switch to the next fallback RPC endpoint
   * @returns true if switched to fallback, false if no more fallbacks available
   */
  private switchToFallback(): boolean {
    if (this.currentEndpointIndex >= this.endpoints.length - 1) {
      // No more fallbacks available
      return false;
    }

    this.currentEndpointIndex++;
    const endpoint = this.endpoints[this.currentEndpointIndex];
    
    console.warn(`Switching to fallback RPC: ${endpoint.name} (${endpoint.url})`);
    
    this.connection = new Connection(endpoint.url, 'confirmed');
    return true;
  }

  /**
   * Reset to primary RPC endpoint
   */
  private resetToPrimary(): void {
    if (this.currentEndpointIndex !== 0) {
      this.currentEndpointIndex = 0;
      const endpoint = this.endpoints[0];
      console.log(`Resetting to primary RPC: ${endpoint.name}`);
      this.connection = new Connection(endpoint.url, 'confirmed');
    }
  }

  /**
   * Execute an RPC call with automatic fallback on failure
   * @param operation - Async operation to execute
   * @returns Result of the operation
   * @throws Error if all endpoints fail
   */
  private async executeWithFallback<T>(
    operation: (connection: Connection) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    const startIndex = this.currentEndpointIndex;

    // Try current endpoint and all fallbacks
    do {
      try {
        const result = await operation(this.connection);
        
        // Success - reset to primary for next call if we're on a fallback
        if (this.currentEndpointIndex !== 0) {
          // Don't reset immediately, but mark for potential reset
          // This prevents thrashing between endpoints
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        const currentEndpoint = this.endpoints[this.currentEndpointIndex];
        console.error(
          `RPC call failed on ${currentEndpoint.name}:`,
          error instanceof Error ? error.message : error
        );

        // Try to switch to fallback
        if (!this.switchToFallback()) {
          // No more fallbacks, reset to primary and throw
          this.resetToPrimary();
          break;
        }
      }
    } while (this.currentEndpointIndex !== startIndex);

    // All endpoints failed
    throw new Error(
      `All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get token accounts owned by a wallet
   * @param owner - Wallet public key
   * @returns Array of token accounts
   */
  async getTokenAccountsByOwner(owner: PublicKey): Promise<TokenAccount[]> {
    return this.executeWithFallback(async (connection) => {
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      
      const response = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
      });

      return response.value.map((item) => ({
        pubkey: item.pubkey,
        account: {
          data: item.account.data as ParsedAccountData,
          executable: item.account.executable,
          lamports: item.account.lamports,
          owner: item.account.owner,
          rentEpoch: item.account.rentEpoch,
        },
      }));
    });
  }

  /**
   * Get the current slot number
   * @returns Current slot number
   */
  async getCurrentSlot(): Promise<number> {
    return this.executeWithFallback(async (connection) => {
      return await connection.getSlot();
    });
  }

  /**
   * Get account info for a given public key
   * @param address - Public key to query
   * @returns Account info or null if not found
   */
  async getAccountInfo(address: PublicKey) {
    return this.executeWithFallback(async (connection) => {
      return await connection.getAccountInfo(address);
    });
  }

  /**
   * Get token supply for a given mint
   * @param mint - Token mint public key
   * @returns Token supply information
   */
  async getTokenSupply(mint: PublicKey) {
    return this.executeWithFallback(async (connection) => {
      return await connection.getTokenSupply(mint);
    });
  }

  /**
   * Get the current endpoint being used
   * @returns Current RPC endpoint information
   */
  getCurrentEndpoint(): RPCEndpoint {
    return this.endpoints[this.currentEndpointIndex];
  }

  /**
   * Get all configured endpoints
   * @returns Array of all RPC endpoints
   */
  getAllEndpoints(): RPCEndpoint[] {
    return [...this.endpoints];
  }
}

// Export a singleton instance for convenience
export const solanaClient = new SolanaClient();

// Export default instance
export default solanaClient;
