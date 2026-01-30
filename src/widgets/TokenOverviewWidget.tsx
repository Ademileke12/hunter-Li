import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { TokenOverview } from '../types/birdeye';
import { geckoTerminalClient } from '../services/GeckoTerminalClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface TokenOverviewWidgetProps {
  instance: WidgetInstance;
}

/**
 * Token Overview Widget
 * 
 * Displays comprehensive token metadata including name, symbol, supply, price, market cap, and volume.
 * Fetches data from Birdeye /defi/v3/token/overview endpoint.
 * Shows token logo if available.
 * 
 * Requirements: 6.1
 */
const TokenOverviewWidget: React.FC<TokenOverviewWidgetProps> = ({ instance }) => {
  const [tokenData, setTokenData] = useState<TokenOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState(instance.config?.tokenAddress || '');
  const [inputValue, setInputValue] = useState(instance.config?.tokenAddress || '');

  const fetchTokenData = useCallback(async (address: string) => {
    if (!address || address.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use GeckoTerminal to find the top pool for this token
      const pools = await geckoTerminalClient.getPoolsByToken(address.trim());

      if (pools.length > 0) {
        const pool = pools[0];
        const isBase = pool.relationships.base_token.data.id === `solana_${address.trim()}`;

        setTokenData({
          address: address.trim(),
          symbol: isBase ? pool.attributes.name.split(' / ')[0] : pool.attributes.name.split(' / ')[1],
          name: isBase ? pool.attributes.name.split(' / ')[0] : pool.attributes.name.split(' / ')[1],
          decimals: 9,
          supply: 0,
          price: parseFloat(isBase ? pool.attributes.base_token_price_usd : pool.attributes.quote_token_price_usd) || 0,
          priceChange24h: parseFloat(pool.attributes.price_change_percentage.h24) || 0,
          volume24h: parseFloat(pool.attributes.volume_usd.h24) || 0,
          marketCap: parseFloat(pool.attributes.fdv_usd || '0'),
          liquidity: parseFloat(pool.attributes.reserve_in_usd) || 0,
          logoURI: undefined,
          pairAddress: pool.attributes.address // Capture pool address
        });
      } else {
        setError('No pool data found for this token');
      }

    } catch (err) {
      console.error('Token Overview widget error:', err);
      setError('Failed to fetch token data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch if token address is provided
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenData(tokenAddress);
    }
  }, [tokenAddress, fetchTokenData]);

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

  const formatSupply = (supply: number): string => {
    if (supply >= 1_000_000_000) {
      return `${(supply / 1_000_000_000).toFixed(2)}B`;
    }
    if (supply >= 1_000_000) {
      return `${(supply / 1_000_000).toFixed(2)}M`;
    }
    if (supply >= 1_000) {
      return `${(supply / 1_000).toFixed(2)}K`;
    }
    return supply.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTokenAddress(inputValue.trim());
    }
  };

  const handleRefresh = () => {
    if (tokenAddress) {
      fetchTokenData(tokenAddress);
    }
  };

  // If no token address, show input form
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
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          🪙
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          Token Overview
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '20px' }}>
          Enter a token address to view details
        </div>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter token address..."
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 30, 45, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '12px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(100, 100, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(100, 100, 255, 0.2)',
              border: '1px solid rgba(100, 100, 255, 0.4)',
              borderRadius: '8px',
              color: '#a0a0ff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 100, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(100, 100, 255, 0.2)';
            }}
          >
            Load Token
          </button>
        </form>
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRefresh}
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
          <button
            onClick={() => {
              setTokenAddress('');
              setInputValue('');
              setTokenData(null);
              setError(null);
            }}
            style={{
              padding: '8px 16px',
              background: 'rgba(80, 80, 100, 0.2)',
              border: '1px solid rgba(80, 80, 100, 0.4)',
              borderRadius: '6px',
              color: '#a0a0a0',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Change Address
          </button>
        </div>
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
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#e0e0e0', marginBottom: '4px' }}>
            {tokenData.symbol}
          </div>
          <div style={{ fontSize: '14px', color: '#808080' }}>
            {tokenData.name}
          </div>
        </div>
        <button
          onClick={() => {
            const url = tokenData.pairAddress
              ? `https://www.dextools.io/app/en/solana/pair-explorer/${tokenData.pairAddress}`
              : `https://www.dextools.io/app/en/solana/pair-explorer/${tokenData.address}`; // Fallback to token search if needed
            window.open(url, '_blank');
          }}
          style={{
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '6px',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          View Chart
        </button>
        <button
          onClick={() => {
            setTokenAddress('');
            setInputValue('');
            setTokenData(null);
            setError(null);
          }}
          style={{
            padding: '6px 12px',
            background: 'rgba(80, 80, 100, 0.2)',
            border: '1px solid rgba(80, 80, 100, 0.4)',
            borderRadius: '6px',
            color: '#a0a0a0',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          Change
        </button>
      </div>

      {/* Price Section */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Current Price
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatPrice(tokenData.price)}
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: priceChangeColor,
            }}
          >
            {formatPercentage(tokenData.priceChange24h)}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#606060' }}>
          24h change
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
        {/* Market Cap */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Market Cap
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatNumber(tokenData.marketCap)}
          </div>
        </div>

        {/* Volume 24h */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Volume 24h
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatNumber(tokenData.volume24h)}
          </div>
        </div>

        {/* Liquidity */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Liquidity
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatNumber(tokenData.liquidity)}
          </div>
        </div>

        {/* Supply */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Supply
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatSupply(tokenData.supply)}
          </div>
        </div>
      </div>

      {/* Token Address */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Token Address
        </div>
        <div
          style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#a0a0a0',
            wordBreak: 'break-all',
            lineHeight: '1.5',
          }}
        >
          {tokenData.address}
        </div>
      </div>

      {/* Additional Info */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Token Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#808080' }}>Decimals:</span>
            <span style={{ color: '#e0e0e0', fontWeight: 500 }}>{tokenData.decimals}</span>
          </div>
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

export default TokenOverviewWidget;
