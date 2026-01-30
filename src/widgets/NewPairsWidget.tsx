import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { TokenPair } from '../types/birdeye';
import { geckoTerminalClient } from '../services/GeckoTerminalClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface NewPairsWidgetProps {
  instance: WidgetInstance;
}

/**
 * New Pairs Widget
 * 
 * Fetches and displays recently created token pairs from Birdeye API.
 * Highlights tokens less than 24 hours old with a blue badge.
 * Implements pagination and auto-refresh.
 * 
 * Requirements: 5.4, 5.5
 */
const NewPairsWidget: React.FC<NewPairsWidgetProps> = ({ instance }) => {
  const [pairs, setPairs] = useState<TokenPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const limit = instance.config?.limit || 20;
  const autoRefresh = instance.config?.autoRefresh !== false; // Default true
  const refreshInterval = instance.config?.refreshInterval || 30000; // Default 30 seconds
  const itemsPerPage = 10;

  const fetchNewPairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pools = await geckoTerminalClient.getNewPools(limit);

      const mappedPairs: TokenPair[] = pools.map(pool => {
        return {
          pairAddress: pool.attributes.address,
          baseToken: {
            address: pool.relationships.base_token.data.id.replace('solana_', ''),
            symbol: pool.attributes.name.split(' / ')[0],
            name: pool.attributes.name.split(' / ')[0], // Best effort name
            decimals: 9 // Default
          },
          quoteToken: {
            address: pool.relationships.quote_token.data.id.replace('solana_', ''),
            symbol: pool.attributes.name.split(' / ')[1] || 'Unknown',
            name: 'Quote Token',
            decimals: 9
          },
          liquidity: parseFloat(pool.attributes.reserve_in_usd || '0'),
          volume24h: parseFloat(pool.attributes.volume_usd.h24 || '0'),
          priceChange24h: parseFloat(pool.attributes.price_change_percentage.h24 || '0'),
          createdAt: new Date(pool.attributes.pool_created_at).getTime()
        };
      });

      setPairs(mappedPairs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch new pairs';
      setError(errorMessage);
      console.error('New pairs widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchNewPairs();
  }, [fetchNewPairs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchNewPairs();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchNewPairs]);

  // Format number with commas and appropriate decimals
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(decimals)}`;
  };

  // Calculate token age in hours
  const getTokenAgeHours = (createdAt: number): number => {
    const now = Date.now();
    const ageMs = now - createdAt;
    return ageMs / (1000 * 60 * 60);
  };

  // Format token age for display
  const formatTokenAge = (createdAt: number): string => {
    const ageHours = getTokenAgeHours(createdAt);

    if (ageHours < 1) {
      const minutes = Math.floor(ageHours * 60);
      return `${minutes}m`;
    }
    if (ageHours < 24) {
      return `${Math.floor(ageHours)}h`;
    }
    const days = Math.floor(ageHours / 24);
    return `${days}d`;
  };

  // Check if token is less than 24 hours old
  const isNewToken = (createdAt: number): boolean => {
    return getTokenAgeHours(createdAt) < 24;
  };

  // Pagination
  const totalPages = Math.ceil(pairs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPairs = pairs.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Show skeleton loader during initial load
  if (isLoading && pairs.length === 0) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && pairs.length === 0) {
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
          Failed to Load New Pairs
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={fetchNewPairs}
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
            New Pairs
          </div>
          <div style={{ fontSize: '12px', color: '#808080' }}>
            {pairs.length} pairs found
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
                Symbol
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
                Age
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
                Liquidity
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
                Volume 24h
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPairs.map((pair) => {
              const isNew = isNewToken(pair.createdAt);
              return (
                <tr
                  key={pair.pairAddress}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => {
                    window.open(`https://www.dextools.io/app/en/solana/pair-explorer/${pair.pairAddress}`, '_blank');
                  }}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div
                          style={{
                            color: '#e0e0e0',
                            fontWeight: 600,
                            marginBottom: '2px',
                          }}
                        >
                          {pair.baseToken.symbol}/{pair.quoteToken.symbol}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#606060',
                            fontFamily: 'monospace',
                          }}
                        >
                          {pair.baseToken.address.slice(0, 4)}...{pair.baseToken.address.slice(-4)}
                        </div>
                      </div>
                      {isNew && (
                        <div
                          style={{
                            padding: '2px 6px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#60a5fa',
                            textTransform: 'uppercase',
                          }}
                        >
                          New
                        </div>
                      )}
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
                    {formatTokenAge(pair.createdAt)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: '#a0a0a0',
                      fontWeight: 500,
                    }}
                  >
                    {formatNumber(pair.liquidity)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: '#a0a0a0',
                      fontWeight: 500,
                    }}
                  >
                    {formatNumber(pair.volume24h)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {pairs.length === 0 && !isLoading && (
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
              ✨
            </div>
            <div style={{ fontSize: '14px' }}>No new pairs found</div>
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

export default NewPairsWidget;
