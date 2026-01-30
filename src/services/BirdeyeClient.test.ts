import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BirdeyeClient, BirdeyeAPIError } from './BirdeyeClient';

describe('BirdeyeClient', () => {
  let client: BirdeyeClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new BirdeyeClient();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTokenOverview', () => {
    it('should fetch and parse token overview successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          address: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          supply: '1000000000',
          price: 100.5,
          priceChange24h: 5.2,
          volume24h: 1000000,
          liquidity: 5000000,
          mc: 100000000,
          logoURI: 'https://example.com/sol.png',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getTokenOverview('So11111111111111111111111111111111111111112');

      expect(result).toEqual({
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        supply: 1000000000,
        price: 100.5,
        priceChange24h: 5.2,
        volume24h: 1000000,
        liquidity: 5000000,
        marketCap: 100000000,
        logoURI: 'https://example.com/sol.png',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/defi/v3/token/overview'),
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('should throw error when API returns unsuccessful response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false }),
      });

      await expect(
        client.getTokenOverview('invalid-address')
      ).rejects.toThrow(BirdeyeAPIError);
    });

    it('should throw error when API returns 404', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.getTokenOverview('invalid-address')
      ).rejects.toThrow(BirdeyeAPIError);
    });
  });

  describe('getHolderDistribution', () => {
    it('should fetch and parse holder distribution successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            { address: 'holder1', balance: '1000000', percentage: 10.5 },
            { address: 'holder2', balance: '500000', percentage: 5.2 },
            { address: 'holder3', balance: '250000', percentage: 2.6 },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getHolderDistribution('token-address');

      expect(result).toEqual([
        { address: 'holder1', balance: 1000000, percentage: 10.5, rank: 1 },
        { address: 'holder2', balance: 500000, percentage: 5.2, rank: 2 },
        { address: 'holder3', balance: 250000, percentage: 2.6, rank: 3 },
      ]);
    });

    it('should throw error when holder data is missing', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await expect(
        client.getHolderDistribution('token-address')
      ).rejects.toThrow(BirdeyeAPIError);
    });
  });

  describe('getNewPairs', () => {
    it('should fetch and parse new pairs successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              address: 'pair1',
              baseToken: {
                address: 'base1',
                symbol: 'BASE',
                name: 'Base Token',
                decimals: 9,
              },
              quoteToken: {
                address: 'quote1',
                symbol: 'QUOTE',
                name: 'Quote Token',
                decimals: 6,
              },
              liquidity: 100000,
              volume24h: 50000,
              priceChange24h: 15.5,
              createdAt: 1234567890,
            },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getNewPairs(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        pairAddress: 'pair1',
        baseToken: {
          address: 'base1',
          symbol: 'BASE',
          name: 'Base Token',
          decimals: 9,
        },
        quoteToken: {
          address: 'quote1',
          symbol: 'QUOTE',
          name: 'Quote Token',
          decimals: 6,
        },
        liquidity: 100000,
        volume24h: 50000,
        priceChange24h: 15.5,
        createdAt: 1234567890,
      });
    });

    it('should use default limit when not specified', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { items: [] } }),
      });

      await client.getNewPairs();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
    });
  });

  describe('getTrendingTokens', () => {
    it('should fetch and parse trending tokens successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              address: 'token1',
              symbol: 'TKN1',
              name: 'Token 1',
              price: 1.5,
              priceChange24h: 25.5,
              volume24h: 1000000,
              volumeChange24h: 150.0,
              mc: 10000000,
              logoURI: 'https://example.com/token1.png',
            },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getTrendingTokens(5);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        address: 'token1',
        symbol: 'TKN1',
        name: 'Token 1',
        price: 1.5,
        priceChange24h: 25.5,
        volume24h: 1000000,
        volumeChange24h: 150.0,
        marketCap: 10000000,
        logoURI: 'https://example.com/token1.png',
      });
    });
  });

  describe('getLiquidityPool', () => {
    it('should fetch and parse liquidity pool data successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          address: 'LP123456789',
          locked: true,
          lockedPercentage: 75.5,
          lockedUntil: 1735689600000,
          totalValue: 1500000,
          providersCount: 25,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getLiquidityPool('So11111111111111111111111111111111111111112');

      expect(result).toEqual({
        address: 'LP123456789',
        locked: true,
        lockedPercentage: 75.5,
        lockedUntil: 1735689600000,
        totalValue: 1500000,
        providersCount: 25,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/defi/v3/token/liquidity'),
        expect.any(Object)
      );
    });

    it('should handle LP data without lock duration', async () => {
      const mockResponse = {
        success: true,
        data: {
          address: 'LP123456789',
          locked: false,
          lockedPercentage: 30.0,
          totalValue: 500000,
          providersCount: 10,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getLiquidityPool('token-address');

      expect(result).toEqual({
        address: 'LP123456789',
        locked: false,
        lockedPercentage: 30.0,
        lockedUntil: undefined,
        totalValue: 500000,
        providersCount: 10,
      });
    });

    it('should throw error when API returns unsuccessful response', async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await expect(
        client.getLiquidityPool('token-address')
      ).rejects.toThrow('Failed to fetch liquidity pool data');
    });

    it('should throw error when data is missing', async () => {
      const mockResponse = {
        success: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await expect(
        client.getLiquidityPool('token-address')
      ).rejects.toThrow('Failed to fetch liquidity pool data');
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 server error and succeed', async () => {
      const mockSuccessResponse = {
        success: true,
        data: {
          address: 'token',
          symbol: 'TKN',
          name: 'Token',
          decimals: 9,
          supply: '1000000',
          price: 1.0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          mc: 0,
        },
      };

      // First call fails with 500, second succeeds
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        });

      const result = await client.getTokenOverview('token-address');

      expect(result.symbol).toBe('TKN');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 rate limit and succeed', async () => {
      const mockSuccessResponse = {
        success: true,
        data: {
          address: 'token',
          symbol: 'TKN',
          name: 'Token',
          decimals: 9,
          supply: '1000000',
          price: 1.0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          mc: 0,
        },
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        });

      const result = await client.getTokenOverview('token-address');

      expect(result.symbol).toBe('TKN');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries on 500 error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        client.getTokenOverview('token-address')
      ).rejects.toThrow(BirdeyeAPIError);

      // Should retry 3 times (initial + 3 retries = 4 total)
      expect(fetchMock).toHaveBeenCalledTimes(4);
    }, 15000); // Increase timeout for retry delays

    it('should throw error after max retries on 429 rate limit', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(
        client.getTokenOverview('token-address')
      ).rejects.toThrow('Rate limit exceeded');

      expect(fetchMock).toHaveBeenCalledTimes(4);
    }, 15000); // Increase timeout for retry delays

    it('should retry on network error and succeed', async () => {
      const mockSuccessResponse = {
        success: true,
        data: {
          address: 'token',
          symbol: 'TKN',
          name: 'Token',
          decimals: 9,
          supply: '1000000',
          price: 1.0,
          priceChange24h: 0,
          volume24h: 0,
          liquidity: 0,
          mc: 0,
        },
      };

      // First call throws network error, second succeeds
      fetchMock
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        });

      const result = await client.getTokenOverview('token-address');

      expect(result.symbol).toBe('TKN');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 client error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.getTokenOverview('token-address')
      ).rejects.toThrow(BirdeyeAPIError);

      // Should only call once (no retries for client errors)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should include status code in error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      try {
        await client.getTokenOverview('token-address');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BirdeyeAPIError);
        expect((error as BirdeyeAPIError).statusCode).toBe(404);
      }
    });

    it('should include endpoint in error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await client.getTokenOverview('token-address');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BirdeyeAPIError);
        expect((error as BirdeyeAPIError).endpoint).toContain('/defi/v3/token/overview');
      }
    }, 15000); // Increase timeout for retry delays

    it('should wrap unknown errors in BirdeyeAPIError', async () => {
      fetchMock.mockRejectedValue(new Error('Unknown error'));

      // Exhaust retries
      await expect(
        client.getTokenOverview('token-address')
      ).rejects.toThrow(BirdeyeAPIError);
    });
  });
});
