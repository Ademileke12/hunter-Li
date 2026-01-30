import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { WidgetInstance } from '../types';
import type { HolderData } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface HolderDistributionWidgetProps {
  instance: WidgetInstance;
}

/**
 * Holder Distribution Widget
 * 
 * Displays a pie chart visualization of the top 10 token holders.
 * Fetches data from Birdeye /defi/v3/token/holder endpoint.
 * Shows percentage for each holder and calculates concentration metric.
 * 
 * Requirements: 6.2
 */
const HolderDistributionWidget: React.FC<HolderDistributionWidgetProps> = ({ instance }) => {
  const [holderData, setHolderData] = useState<HolderData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState(instance.config?.tokenAddress || '');
  const [inputValue, setInputValue] = useState(instance.config?.tokenAddress || '');

  const fetchHolderData = useCallback(async (address: string) => {
    if (!address || address.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await birdeyeClient.getHolderDistribution(address.trim());
      // Take only top 10 holders
      const top10 = data.slice(0, 10);
      setHolderData(top10);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch holder data';
      setError(errorMessage);
      console.error('Holder Distribution widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch if token address is provided
  useEffect(() => {
    if (tokenAddress) {
      fetchHolderData(tokenAddress);
    }
  }, [tokenAddress, fetchHolderData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTokenAddress(inputValue.trim());
    }
  };

  const handleRefresh = () => {
    if (tokenAddress) {
      fetchHolderData(tokenAddress);
    }
  };

  // Calculate concentration metric (sum of top 10 holder percentages)
  const calculateConcentration = (): number => {
    if (!holderData || holderData.length === 0) return 0;
    return holderData.reduce((sum, holder) => sum + holder.percentage, 0);
  };

  // Format address for display (truncate middle)
  const formatAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Generate colors for pie chart
  const COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
  ];

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
          📊
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          Holder Distribution
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '20px' }}>
          Enter a token address to view holder distribution
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
            Load Holders
          </button>
        </form>
      </div>
    );
  }

  // Show skeleton loader during initial load
  if (isLoading && !holderData) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && !holderData) {
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
          Failed to Load Holder Data
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
              setHolderData(null);
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

  // Show holder data
  if (!holderData || holderData.length === 0) {
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
          📭
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          No Holder Data Available
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '16px' }}>
          No holder information found for this token
        </div>
        <button
          onClick={() => {
            setTokenAddress('');
            setInputValue('');
            setHolderData(null);
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
    );
  }

  const concentration = calculateConcentration();
  const concentrationColor = concentration > 50 ? '#f87171' : concentration > 30 ? '#fbbf24' : '#4ade80';

  // Prepare data for pie chart
  const chartData = holderData.map((holder) => ({
    name: formatAddress(holder.address),
    value: holder.percentage,
    fullAddress: holder.address,
    rank: holder.rank,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: 'rgba(20, 20, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#808080', marginBottom: '4px' }}>
            Rank #{data.rank}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#a0a0a0', marginBottom: '8px' }}>
            {data.fullAddress}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0' }}>
            {data.value.toFixed(2)}%
          </div>
        </div>
      );
    }
    return null;
  };

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
            Top 10 Holders
          </div>
          <div style={{ fontSize: '12px', color: '#808080' }}>
            Token holder distribution analysis
          </div>
        </div>
        <button
          onClick={() => {
            setTokenAddress('');
            setInputValue('');
            setHolderData(null);
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

      {/* Concentration Metric */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Concentration Metric
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: concentrationColor }}>
            {concentration.toFixed(2)}%
          </div>
          <div style={{ fontSize: '14px', color: '#808080' }}>
            held by top 10
          </div>
        </div>
        {concentration > 50 && (
          <div style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>
            ⚠️ High concentration - potential risk
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <div
        style={{
          flex: 1,
          minHeight: '250px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }: any) => `${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ fontSize: '11px', color: '#a0a0a0' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Holder List */}
      <div
        style={{
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Holder Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {holderData.map((holder, index) => (
            <div
              key={holder.address}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(20, 20, 30, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: COLORS[index % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: '11px', color: '#606060', minWidth: '24px' }}>
                  #{holder.rank}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#a0a0a0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={holder.address}
                >
                  {formatAddress(holder.address)}
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0' }}>
                {holder.percentage.toFixed(2)}%
              </div>
            </div>
          ))}
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

export default HolderDistributionWidget;
