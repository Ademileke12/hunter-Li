import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { TokenOverview } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface BirdeyeWidgetProps {
  instance: WidgetInstance;
}

/**
 * Birdeye Widget
 * 
 * Fetches and displays token data from Birdeye API including price, volume, and market cap.
 * Implements auto-refresh every 30 seconds with skeleton loader during fetch.
 * 
 * Requirements: 5.3, 5.9
 */
const BirdeyeWidget: React.FC<BirdeyeWidgetProps> = ({ instance }) => {
  const [tokenData, setTokenData] = useState<TokenOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenAddress = instance.config?.tokenAddress || '';
  const autoRefresh = instance.config?.autoRefresh !== false; // Default true
  const refreshInterval = instance.config?.refreshInterval || 30000; // Default 30 seconds

  const fetchTokenData = useCallback(async () => {
    if (!tokenAddress) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await birdeyeClient.getTokenOverview(tokenAddress);
      setTokenData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token data';
      setError(errorMessage);
      console.error('Birdeye widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress]);

  // Initial fetch
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenData();
    }
  }, [tokenAddress, fetchTokenData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !tokenAddress) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTokenData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, tokenAddress, refreshInterval, fetchTokenData]);

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

  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    }
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // If no token address, show input prompt
  if (!tokenAddress) {
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
          color: '#a0a0a0',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          👁️
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          Birdeye Token Data
        </div>
        <div style={{ fontSize: '14px', color: '#808080' }}>
          Configure a token address to view data
        </div>
      </div>
    );
  }

  // Show skeleton loader during initial load
  if (isLoading && !tokenData) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && !tokenData) {
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
          Failed to Load Token Data
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={fetchTokenData}
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

  // Show token data
  if (!tokenData) {
    return null;
  }

  const priceChangeColor = tokenData.priceChange24h >= 0 ? '#4ade80' : '#f87171';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'auto',
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
          }}
        />
      )}

      {/* Token Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {tokenData.logoURI && (
          <img
            src={tokenData.logoURI}
            alt={tokenData.symbol}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0', marginBottom: '4px' }}>
            {tokenData.symbol}
          </div>
          <div style={{ fontSize: '14px', color: '#808080' }}>
            {tokenData.name}
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '8px' }}>
          Price
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatPrice(tokenData.price)}
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: priceChangeColor,
            }}
          >
            {formatPercentage(tokenData.priceChange24h)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {/* Volume 24h */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px' }}>
            Volume 24h
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
            {formatNumber(tokenData.volume24h)}
          </div>
        </div>

        {/* Market Cap */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px' }}>
            Market Cap
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
            {formatNumber(tokenData.marketCap)}
          </div>
        </div>

        {/* Liquidity */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px' }}>
            Liquidity
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
            {formatNumber(tokenData.liquidity)}
          </div>
        </div>

        {/* Supply */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px' }}>
            Supply
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0e0' }}>
            {tokenData.supply.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Token Address */}
      <div
        style={{
          padding: '12px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px' }}>
          Token Address
        </div>
        <div
          style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#a0a0a0',
            wordBreak: 'break-all',
          }}
        >
          {tokenData.address}
        </div>
      </div>

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

export default BirdeyeWidget;
