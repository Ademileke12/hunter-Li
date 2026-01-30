/**
 * Unit tests for SolanaClient
 * 
 * Tests cover:
 * - Basic functionality (getConnection, getCurrentSlot, getTokenAccountsByOwner)
 * - Fallback RPC endpoint switching on failure
 * - Error handling and recovery
 * - Endpoint management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SolanaClient } from './SolanaClient';
import { Connection, PublicKey } from '@solana/web3.js';

// Mock @solana/web3.js
vi.mock('@solana/web3.js', () => {
  const mockConnection = {
    getSlot: vi.fn(),
    getParsedTokenAccountsByOwner: vi.fn(),
    getAccountInfo: vi.fn(),
    getTokenSupply: vi.fn(),
  };

  return {
    Connection: vi.fn(() => mockConnection),
    PublicKey: vi.fn((key: string) => ({ toBase58: () => key })),
  };
});

describe('SolanaClient', () => {
  let client: SolanaClient;
  let mockConnection: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Create a new client instance
    client = new SolanaClient([
      { url: 'https://primary.example.com', name: 'Primary' },
      { url: 'https://fallback1.example.com', name: 'Fallback1' },
      { url: 'https://fallback2.example.com', name: 'Fallback2' },
    ]);

    // Get the mock connection instance
    mockConnection = client.getConnection();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default endpoints when none provided', () => {
      const defaultClient = new SolanaClient();
      const endpoints = defaultClient.getAllEndpoints();
      
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0].url).toBeTruthy();
      expect(endpoints[0].name).toBeTruthy();
    });

    it('should initialize with custom endpoints', () => {
      const customEndpoints = [
        { url: 'https://custom.rpc.com', name: 'Custom' },
      ];
      const customClient = new SolanaClient(customEndpoints);
      const endpoints = customClient.getAllEndpoints();
      
      expect(endpoints).toEqual(customEndpoints);
    });

    it('should start with primary endpoint', () => {
      const endpoint = client.getCurrentEndpoint();
      expect(endpoint.name).toBe('Primary');
      expect(endpoint.url).toBe('https://primary.example.com');
    });
  });

  describe('getConnection', () => {
    it('should return a Connection instance', () => {
      const connection = client.getConnection();
      expect(connection).toBeDefined();
      expect(connection).toBeInstanceOf(Object);
    });

    it('should return the same connection instance on multiple calls', () => {
      const conn1 = client.getConnection();
      const conn2 = client.getConnection();
      expect(conn1).toBe(conn2);
    });
  });

  describe('getCurrentSlot', () => {
    it('should return current slot number', async () => {
      const mockSlot = 123456789;
      mockConnection.getSlot.mockResolvedValue(mockSlot);

      const slot = await client.getCurrentSlot();
      
      expect(slot).toBe(mockSlot);
      expect(mockConnection.getSlot).toHaveBeenCalledTimes(1);
    });

    it('should handle slot fetch errors', async () => {
      mockConnection.getSlot.mockRejectedValue(new Error('Network error'));

      await expect(client.getCurrentSlot()).rejects.toThrow();
    });
  });

  describe('getTokenAccountsByOwner', () => {
    it('should return token accounts for a wallet', async () => {
      const mockOwner = new PublicKey('11111111111111111111111111111111');
      const mockAccounts = {
        value: [
          {
            pubkey: new PublicKey('TokenAccount1'),
            account: {
              data: { parsed: { info: { mint: 'TokenMint1' } } },
              executable: false,
              lamports: 1000000,
              owner: new PublicKey('TokenProgram'),
              rentEpoch: 100,
            },
          },
        ],
      };

      mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue(mockAccounts);

      const accounts = await client.getTokenAccountsByOwner(mockOwner);
      
      expect(accounts).toHaveLength(1);
      expect(accounts[0].pubkey).toBeDefined();
      expect(accounts[0].account.lamports).toBe(1000000);
      expect(mockConnection.getParsedTokenAccountsByOwner).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when wallet has no token accounts', async () => {
      const mockOwner = new PublicKey('11111111111111111111111111111111');
      mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

      const accounts = await client.getTokenAccountsByOwner(mockOwner);
      
      expect(accounts).toHaveLength(0);
    });

    it('should handle errors when fetching token accounts', async () => {
      const mockOwner = new PublicKey('11111111111111111111111111111111');
      mockConnection.getParsedTokenAccountsByOwner.mockRejectedValue(
        new Error('RPC error')
      );

      await expect(client.getTokenAccountsByOwner(mockOwner)).rejects.toThrow();
    });
  });

  describe('getAccountInfo', () => {
    it('should return account info for a valid address', async () => {
      const mockAddress = new PublicKey('11111111111111111111111111111111');
      const mockAccountInfo = {
        lamports: 5000000,
        owner: new PublicKey('11111111111111111111111111111111'),
        data: Buffer.from([]),
        executable: false,
      };

      mockConnection.getAccountInfo.mockResolvedValue(mockAccountInfo);

      const accountInfo = await client.getAccountInfo(mockAddress);
      
      expect(accountInfo).toEqual(mockAccountInfo);
      expect(mockConnection.getAccountInfo).toHaveBeenCalledWith(mockAddress);
    });

    it('should return null for non-existent account', async () => {
      const mockAddress = new PublicKey('11111111111111111111111111111111');
      mockConnection.getAccountInfo.mockResolvedValue(null);

      const accountInfo = await client.getAccountInfo(mockAddress);
      
      expect(accountInfo).toBeNull();
    });
  });

  describe('getTokenSupply', () => {
    it('should return token supply for a mint', async () => {
      const mockMint = new PublicKey('TokenMint111111111111111111111111');
      const mockSupply = {
        value: {
          amount: '1000000000',
          decimals: 9,
          uiAmount: 1,
          uiAmountString: '1',
        },
      };

      mockConnection.getTokenSupply.mockResolvedValue(mockSupply);

      const supply = await client.getTokenSupply(mockMint);
      
      expect(supply).toEqual(mockSupply);
      expect(mockConnection.getTokenSupply).toHaveBeenCalledWith(mockMint);
    });
  });

  describe('RPC Fallback Mechanism - Requirement 19.4', () => {
    it('should switch to fallback endpoint on primary failure', async () => {
      // First call fails on primary
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Primary RPC failed'))
        .mockResolvedValueOnce(999999);

      const slot = await client.getCurrentSlot();
      
      expect(slot).toBe(999999);
      expect(mockConnection.getSlot).toHaveBeenCalledTimes(2);
      
      // Should now be on fallback endpoint
      const currentEndpoint = client.getCurrentEndpoint();
      expect(currentEndpoint.name).toBe('Fallback1');
    });

    it('should try all fallback endpoints before failing', async () => {
      // All endpoints fail
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Fallback1 failed'))
        .mockRejectedValueOnce(new Error('Fallback2 failed'));

      await expect(client.getCurrentSlot()).rejects.toThrow('All RPC endpoints failed');
      
      // Should have tried all 3 endpoints
      expect(mockConnection.getSlot).toHaveBeenCalledTimes(3);
    });

    it('should reset to primary endpoint after all endpoints fail', async () => {
      // All endpoints fail
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Fallback1 failed'))
        .mockRejectedValueOnce(new Error('Fallback2 failed'));

      await expect(client.getCurrentSlot()).rejects.toThrow();
      
      // Should be back on primary
      const currentEndpoint = client.getCurrentEndpoint();
      expect(currentEndpoint.name).toBe('Primary');
    });

    it('should handle multiple consecutive failures with fallback', async () => {
      // First request: primary fails, fallback1 succeeds
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce(111111);

      const slot1 = await client.getCurrentSlot();
      expect(slot1).toBe(111111);

      // Second request: should still be on fallback1, succeeds
      mockConnection.getSlot.mockResolvedValueOnce(222222);
      
      const slot2 = await client.getCurrentSlot();
      expect(slot2).toBe(222222);
    });

    it('should work with getTokenAccountsByOwner fallback', async () => {
      const mockOwner = new PublicKey('11111111111111111111111111111111');
      const mockAccounts = { value: [] };

      // Primary fails, fallback succeeds
      mockConnection.getParsedTokenAccountsByOwner
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce(mockAccounts);

      const accounts = await client.getTokenAccountsByOwner(mockOwner);
      
      expect(accounts).toHaveLength(0);
      expect(mockConnection.getParsedTokenAccountsByOwner).toHaveBeenCalledTimes(2);
    });
  });

  describe('Endpoint Management', () => {
    it('should return current endpoint information', () => {
      const endpoint = client.getCurrentEndpoint();
      
      expect(endpoint).toHaveProperty('url');
      expect(endpoint).toHaveProperty('name');
      expect(endpoint.name).toBe('Primary');
    });

    it('should return all configured endpoints', () => {
      const endpoints = client.getAllEndpoints();
      
      expect(endpoints).toHaveLength(3);
      expect(endpoints[0].name).toBe('Primary');
      expect(endpoints[1].name).toBe('Fallback1');
      expect(endpoints[2].name).toBe('Fallback2');
    });

    it('should not mutate internal endpoints array when getting all endpoints', () => {
      const endpoints1 = client.getAllEndpoints();
      endpoints1.push({ url: 'https://hacker.com', name: 'Hacker' });
      
      const endpoints2 = client.getAllEndpoints();
      expect(endpoints2).toHaveLength(3);
    });
  });

  describe('Error Messages', () => {
    it('should include last error message in final error', async () => {
      const errorMessage = 'Specific RPC error';
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error(errorMessage));

      await expect(client.getCurrentSlot()).rejects.toThrow(errorMessage);
    });

    it('should handle non-Error objects in catch', async () => {
      mockConnection.getSlot
        .mockRejectedValueOnce('String error')
        .mockRejectedValueOnce({ message: 'Object error' })
        .mockRejectedValueOnce(null);

      await expect(client.getCurrentSlot()).rejects.toThrow('All RPC endpoints failed');
    });
  });

  describe('Requirements Validation', () => {
    it('should validate Requirement 7.9: Use Public_RPC endpoints', () => {
      const defaultClient = new SolanaClient();
      const endpoints = defaultClient.getAllEndpoints();
      
      // All endpoints should be public RPC URLs
      endpoints.forEach(endpoint => {
        expect(endpoint.url).toMatch(/^https:\/\//);
        expect(endpoint.url).toBeTruthy();
      });
    });

    it('should validate Requirement 9.6: Support Block Clock widget', async () => {
      // Block Clock needs getCurrentSlot to work
      mockConnection.getSlot.mockResolvedValue(123456789);
      
      const slot = await client.getCurrentSlot();
      
      expect(typeof slot).toBe('number');
      expect(slot).toBeGreaterThan(0);
    });

    it('should validate Requirement 19.4: Implement fallback RPC endpoints', async () => {
      // Test that fallback mechanism works
      mockConnection.getSlot
        .mockRejectedValueOnce(new Error('Primary unavailable'))
        .mockResolvedValueOnce(999999);

      const slot = await client.getCurrentSlot();
      
      expect(slot).toBe(999999);
      
      // Verify we're on a fallback endpoint
      const currentEndpoint = client.getCurrentEndpoint();
      expect(currentEndpoint.name).not.toBe('Primary');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single endpoint configuration', async () => {
      const singleClient = new SolanaClient([
        { url: 'https://only.rpc.com', name: 'Only' },
      ]);

      const mockConn = singleClient.getConnection();
      (mockConn as any).getSlot = vi.fn().mockRejectedValue(new Error('Failed'));

      await expect(singleClient.getCurrentSlot()).rejects.toThrow();
      
      // Should still be on the only endpoint
      expect(singleClient.getCurrentEndpoint().name).toBe('Only');
    });

    it('should handle very large slot numbers', async () => {
      const largeSlot = Number.MAX_SAFE_INTEGER;
      mockConnection.getSlot.mockResolvedValue(largeSlot);

      const slot = await client.getCurrentSlot();
      
      expect(slot).toBe(largeSlot);
    });

    it('should handle empty token accounts response', async () => {
      const mockOwner = new PublicKey('11111111111111111111111111111111');
      mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

      const accounts = await client.getTokenAccountsByOwner(mockOwner);
      
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(0);
    });
  });
});
