import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { LiquidityPool } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface LPOverviewWidgetProps {
  instance: WidgetInstance;
}

/**
 * LP Overview Widget
 * 
 * Displays liquidity pool information and metrics for a token.
 * Fetches data from Birdeye liquidity pool endpoint.
 * Shows warning if LP locked percentage is below 50%.
 * Displays lock duration if available.
 * 
 * Requirements: 6.3
 */
const LPOverviewWidget: React.FC<LPOverviewWidgetProps> = ({ instance }) => {
  const [lpData, setLpData] = useState<LiquidityPool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState(instance.config?.tokenAddress || '');
  const [inputValue, setInputValue] = useState(instance.config?.tokenAddress || '');

  const fetchLPData = useCallback(async (address: string) => {
    if (!address || address.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await birdeyeClient.getLiquidityPool(address.trim());
      setLpData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch LP data';
      setError(errorMessage);
      console.error('LP Overview widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch if token address is provided
  useEffect(() => {
    if (tokenAddress) {
      fetchLPData(tokenAddress);
    }
  }, [tokenAddress, fetchLPData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTokenAddress(inputValue.trim());
    }
  };

  const handleRefresh = () => {
    if (tokenAddress) {
      fetchLPData(tokenAddress);
    }
  };

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

  // Format lock duration
  const formatLockDuration = (timestamp: number): string => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 365) {
      const years = Math.floor(days / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  // Format lock expiry date
  const formatLockDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
          💧
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          LP Overview
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '20px' }}>
          Enter a token address to view liquidity pool details
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
            Load LP Data
          </button>
        </form>
      </div>
    );
  }

  // Show skeleton loader during initial load
  if (isLoading && !lpData) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && !lpData) {
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
          Failed to Load LP Data
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
              setLpData(null);
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

  // Show LP data
  if (!lpData) {
    return null;
  }

  // Determine LP status color and warning
  const lpPercentageColor = lpData.lockedPercentage >= 50 
    ? '#4ade80' 
    : lpData.lockedPercentage >= 30 
    ? '#fbbf24' 
    : '#f87171';
  
  const showWarning = lpData.lockedPercentage < 50;

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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#e0e0e0', marginBottom: '4px' }}>
            Liquidity Pool Overview
          </div>
          <div style={{ fontSize: '12px', color: '#808080' }}>
            LP metrics and lock status
          </div>
        </div>
        <button
          onClick={() => {
            setTokenAddress('');
            setInputValue('');
            setLpData(null);
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

      {/* Warning Banner */}
      {showWarning && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '20px' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171', marginBottom: '2px' }}>
              Low Liquidity Lock
            </div>
            <div style={{ fontSize: '12px', color: '#fca5a5' }}>
              Less than 50% of LP is locked - potential risk
            </div>
          </div>
        </div>
      )}

      {/* LP Locked Percentage */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          LP Locked
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: lpPercentageColor }}>
            {lpData.lockedPercentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: '14px', color: '#808080' }}>
            {lpData.locked ? 'Locked' : 'Unlocked'}
          </div>
        </div>
        
        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${lpData.lockedPercentage}%`,
              height: '100%',
              background: lpPercentageColor,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
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
        {/* Total LP Value */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total LP Value
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {formatNumber(lpData.totalValue)}
          </div>
        </div>

        {/* LP Providers */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            LP Providers
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0' }}>
            {lpData.providersCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Lock Duration */}
      {lpData.lockedUntil && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Lock Duration
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#e0e0e0' }}>
              {formatLockDuration(lpData.lockedUntil)}
            </div>
            <div style={{ fontSize: '12px', color: '#808080' }}>
              Until {formatLockDate(lpData.lockedUntil)}
            </div>
          </div>
        </div>
      )}

      {/* LP Address */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          LP Address
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
          {lpData.address}
        </div>
      </div>

      {/* Status Summary */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Status Summary
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: lpData.locked ? '#4ade80' : '#f87171',
              }}
            />
            <span style={{ color: '#e0e0e0' }}>
              {lpData.locked ? 'Liquidity is locked' : 'Liquidity is not locked'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: lpPercentageColor,
              }}
            />
            <span style={{ color: '#e0e0e0' }}>
              {lpData.lockedPercentage >= 50 
                ? 'Good lock percentage' 
                : lpData.lockedPercentage >= 30 
                ? 'Moderate lock percentage' 
                : 'Low lock percentage'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: lpData.providersCount > 10 ? '#4ade80' : '#fbbf24',
              }}
            />
            <span style={{ color: '#e0e0e0' }}>
              {lpData.providersCount > 10 
                ? 'Multiple LP providers' 
                : 'Limited LP providers'}
            </span>
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

export default LPOverviewWidget;
