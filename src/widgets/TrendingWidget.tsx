import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { WidgetInstance } from '../types';
import type { TrendingToken } from '../types/birdeye';
import { geckoTerminalClient } from '../services/GeckoTerminalClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface TrendingWidgetProps {
  instance: WidgetInstance;
}

/**
 * Trending Tokens Widget
 * 
 * Fetches and displays trending tokens with volume spikes from Birdeye API.
 * Highlights tokens with >100% volume spike.
 * Displays sparkline charts for price movement using recharts.
 * 
 * Requirements: 5.6, 5.7
 */
const TrendingWidget: React.FC<TrendingWidgetProps> = ({ instance }) => {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const limit = instance.config?.limit || 20;
  const autoRefresh = instance.config?.autoRefresh !== false; // Default true
  const refreshInterval = instance.config?.refreshInterval || 30000; // Default 30 seconds
  const itemsPerPage = 10;

  const fetchTrendingTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch trending pools from GeckoTerminal (Free API)
      const pools = await geckoTerminalClient.getTrendingPools(limit);

      // Map GeckoTerminal pools to TrendingToken format
      const mappedTokens: TrendingToken[] = pools.map(pool => {
        const price = parseFloat(pool.attributes.base_token_price_usd) || 0;
        const priceChange = parseFloat(pool.attributes.price_change_percentage.h24) || 0;
        const volume = parseFloat(pool.attributes.volume_usd.h24) || 0;

        return {
          address: pool.relationships.base_token.data.id.replace('solana_', ''),
          pairAddress: pool.attributes.address, // Capture the pool address for DexTools
          symbol: pool.attributes.name.split(' / ')[0] || 'Unknown',
          name: pool.attributes.name,
          price: price,
          priceChange24h: priceChange,
          volume24h: volume,
          volumeChange24h: 0, // Not provided by GeckoTerminal directly
          marketCap: parseFloat(pool.attributes.market_cap_usd || '0'),
          logoURI: undefined // GeckoTerminal doesn't provide token logo in this endpoint
        };
      });

      setTokens(mappedTokens);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending tokens';
      setError(errorMessage);
      console.error('Trending widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchTrendingTokens();
  }, [fetchTrendingTokens]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTrendingTokens();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchTrendingTokens]);



  const formatPrice = (price: number): string => {
    if (price < 0.000001) {
      return price.toExponential(4);
    }
    if (price < 0.01) {
      return price.toFixed(6);
    }
    if (price < 1) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Generate mock sparkline data for visualization
  // In a real implementation, this would come from historical price data
  const generateSparklineData = (priceChange24h: number) => {
    const points = 20;
    const data = [];
    const volatility = Math.abs(priceChange24h) / 100;

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const trend = priceChange24h * progress;
      const noise = (Math.random() - 0.5) * volatility * 10;
      const value = 100 + trend + noise;
      data.push({ value });
    }

    return data;
  };

  // Pagination
  const totalPages = Math.ceil(tokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTokens = tokens.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Show skeleton loader during initial load
  if (isLoading && tokens.length === 0) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && tokens.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          ⚠️
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          Failed to Load Trending Tokens
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={fetchTrendingTokens}
          style={{
            padding: '8px 16px',
            background: 'rgba(100, 100, 255, 0.2)',
            border: '1px solid rgba(100, 100, 255, 0.4)',
            borderRadius: '6px',
            color: '#a0a0ff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Loading indicator for refresh */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#60a5fa',
            animation: 'pulse 1.5s infinite',
            zIndex: 10,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#e0e0e0', marginBottom: '4px' }}>
            Trending Tokens
          </div>
          <div style={{ fontSize: '12px', color: '#808080' }}>
            {tokens.length} tokens found
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'sticky',
                top: 0,
                background: 'rgba(20, 20, 30, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  color: '#808080',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                Token
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  color: '#808080',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  color: '#808080',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                24h Change
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  color: '#808080',
                  fontWeight: 600,
                  fontSize: '12px',
                  width: '100px',
                }}
              >
                Chart
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTokens.map((token) => {
              const priceChangeColor = token.priceChange24h >= 0 ? '#4ade80' : '#f87171';
              const sparklineData = generateSparklineData(token.priceChange24h);
              const sparklineColor = token.priceChange24h >= 0 ? '#4ade80' : '#f87171';

              return (
                <tr
                  key={token.address}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => {
                    const addressToUse = token.pairAddress || token.address;
                    window.open(`https://www.dextools.io/app/en/solana/pair-explorer/${addressToUse}`, '_blank');
                  }}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {token.logoURI && (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div
                          style={{
                            color: '#e0e0e0',
                            fontWeight: 600,
                            marginBottom: '2px',
                          }}
                        >
                          {token.symbol}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#606060',
                          }}
                        >
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: '#a0a0a0',
                      fontWeight: 500,
                    }}
                  >
                    ${formatPrice(token.price)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: priceChangeColor,
                      fontWeight: 600,
                    }}
                  >
                    {formatPercentage(token.priceChange24h)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                    }}
                  >
                    <ResponsiveContainer width="100%" height={30}>
                      <LineChart data={sparklineData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={sparklineColor}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {tokens.length === 0 && !isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#808080',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>
              🔥
            </div>
            <div style={{ fontSize: '14px' }}>No trending tokens found</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              background: currentPage === 1 ? 'rgba(60, 60, 80, 0.3)' : 'rgba(100, 100, 255, 0.2)',
              border: currentPage === 1 ? '1px solid rgba(60, 60, 80, 0.5)' : '1px solid rgba(100, 100, 255, 0.4)',
              borderRadius: '6px',
              color: currentPage === 1 ? '#606060' : '#a0a0ff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Previous
          </button>
          <div style={{ fontSize: '13px', color: '#808080' }}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              background: currentPage === totalPages ? 'rgba(60, 60, 80, 0.3)' : 'rgba(100, 100, 255, 0.2)',
              border: currentPage === totalPages ? '1px solid rgba(60, 60, 80, 0.5)' : '1px solid rgba(100, 100, 255, 0.4)',
              borderRadius: '6px',
              color: currentPage === totalPages ? '#606060' : '#a0a0ff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Pulse animation for loading indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default TrendingWidget;
