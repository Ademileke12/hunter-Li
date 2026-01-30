/**
 * GeckoTerminal API Client
 * 
 * Provides methods to interact with the GeckoTerminal public API for Solana token data.
 * This API is free and does not require an API key.
 */

export interface GeckoPool {
    id: string;
    type: string;
    attributes: {
        base_token_price_usd: string;
        quote_token_price_usd: string;
        address: string;
        name: string;
        pool_created_at: string;
        fdv_usd: string;
        market_cap_usd: string | null;
        volume_usd: {
            h24: string;
        };
        reserve_in_usd: string;
        price_change_percentage: {
            h24: string;
        };
    };
    relationships: {
        base_token: {
            data: {
                id: string;
                type: string;
            };
        };
        quote_token: {
            data: {
                id: string;
                type: string;
            };
        };
        dex: {
            data: {
                id: string;
                type: string;
            };
        };
    };
}

export interface GeckoTerminalResponse {
    data: GeckoPool[];
}

export class GeckoTerminalClient {
    private readonly baseURL = 'https://api.geckoterminal.com/api/v2';

    /**
     * Fetch trending pools for Solana
     */
    async getTrendingPools(limit: number = 20): Promise<GeckoPool[]> {
        const endpoint = `/networks/solana/trending_pools?page=1&limit=${limit}`;
        return this.fetchData(endpoint);
    }

    /**
     * Fetch newly created pools for Solana
     */
    async getNewPools(limit: number = 20): Promise<GeckoPool[]> {
        const endpoint = `/networks/solana/new_pools?page=1&limit=${limit}`;
        return this.fetchData(endpoint);
    }

    /**
     * Fetch pool info by address (closest proxy to token info)
     */
    async getPoolsByToken(tokenAddress: string): Promise<GeckoPool[]> {
        const endpoint = `/networks/solana/tokens/${tokenAddress}/pools?page=1&limit=1`;
        return this.fetchData(endpoint);
    }

    /**
     * Search for pools by query (symbol, name, or address)
     * Note: This is a global search, so we'll filter for Solana pools client-side if needed,
     * though the API might return mixed results.
     */
    async searchPools(query: string): Promise<GeckoPool[]> {
        const endpoint = `/search/pools?query=${encodeURIComponent(query)}&network=solana&page=1`;
        return this.fetchData(endpoint);
    }

    /**
     * Helper to fetch data
     */
    private async fetchData(endpoint: string): Promise<GeckoPool[]> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const json = await response.json() as GeckoTerminalResponse;
            return json.data;
        } catch (error) {
            console.error('GeckoTerminal API error:', error);
            return [];
        }
    }
}

export const geckoTerminalClient = new GeckoTerminalClient();
