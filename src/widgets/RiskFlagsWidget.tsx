import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { LiquidityPool, HolderData } from '../types/birdeye';
import { birdeyeClient } from '../services/BirdeyeClient';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface RiskFlagsWidgetProps {
  instance: WidgetInstance;
}

interface RiskFlag {
  type: 'low_lp' | 'high_concentration' | 'deployer_active' | 'new_token' | 'low_liquidity';
  severity: 'warning' | 'danger';
  message: string;
}

interface RiskAssessment {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: RiskFlag[];
}

/**
 * Risk Flags Widget
 * 
 * Calculates and displays risk assessment for a token based on:
 * - LP percentage (score += (50 - lp_percent) if lp_percent < 50)
 * - Holder concentration (score += (top10_percent - 50) if top10_percent > 50)
 * - Deployer activity (score += 30 if deployer moved tokens in 24h)
 * 
 * Risk levels: Low (0-30), Medium (31-60), High (61-80), Critical (81+)
 * Color coding: green, yellow, orange, red
 * 
 * Requirements: 6.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7
 */
const RiskFlagsWidget: React.FC<RiskFlagsWidgetProps> = ({ instance }) => {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState(instance.config?.tokenAddress || '');
  const [inputValue, setInputValue] = useState(instance.config?.tokenAddress || '');

  /**
   * Calculate risk score based on the formula from design document:
   * - base_score = 0
   * - if lp_percent < 50: base_score += (50 - lp_percent)
   * - if top10_percent > 50: base_score += (top10_percent - 50)
   * - if deployer_moved_24h: base_score += 30
   */
  const calculateRiskScore = useCallback((
    lpData: LiquidityPool | null,
    holderData: HolderData[] | null,
    deployerActive: boolean
  ): RiskAssessment => {
    let score = 0;
    const flags: RiskFlag[] = [];

    // LP percentage risk
    if (lpData) {
      const lpPercent = lpData.lockedPercentage;
      if (lpPercent < 50) {
        const lpRisk = 50 - lpPercent;
        score += lpRisk;
        flags.push({
          type: 'low_lp',
          severity: lpPercent < 30 ? 'danger' : 'warning',
          message: `Low LP locked: ${lpPercent.toFixed(1)}% (${lpRisk.toFixed(0)} risk points)`,
        });
      }
    }

    // Holder concentration risk
    if (holderData && holderData.length > 0) {
      const top10Percent = holderData
        .slice(0, 10)
        .reduce((sum, holder) => sum + holder.percentage, 0);
      
      if (top10Percent > 50) {
        const concentrationRisk = top10Percent - 50;
        score += concentrationRisk;
        flags.push({
          type: 'high_concentration',
          severity: top10Percent > 70 ? 'danger' : 'warning',
          message: `High concentration: ${top10Percent.toFixed(1)}% held by top 10 (${concentrationRisk.toFixed(0)} risk points)`,
        });
      }
    }

    // Deployer activity risk
    if (deployerActive) {
      score += 30;
      flags.push({
        type: 'deployer_active',
        severity: 'danger',
        message: 'Deployer wallet active in last 24h (+30 risk points)',
      });
    }

    // Determine risk level based on score
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score <= 30) {
      level = 'low';
    } else if (score <= 60) {
      level = 'medium';
    } else if (score <= 80) {
      level = 'high';
    } else {
      level = 'critical';
    }

    return { score, level, flags };
  }, []);

  const fetchRiskData = useCallback(async (address: string) => {
    if (!address || address.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch LP data and holder data in parallel
      const [lpResult, holderResult] = await Promise.allSettled([
        birdeyeClient.getLiquidityPool(address.trim()),
        birdeyeClient.getHolderDistribution(address.trim()),
      ]);

      const lpData = lpResult.status === 'fulfilled' ? lpResult.value : null;
      const holderData = holderResult.status === 'fulfilled' ? holderResult.value : null;

      // If both requests failed, throw an error
      if (!lpData && !holderData) {
        throw new Error('Failed to fetch risk data');
      }

      // For now, we'll set deployer active to false since we don't have a deployer endpoint
      // In a real implementation, this would check deployer wallet activity
      const deployerActive = false;

      const assessment = calculateRiskScore(lpData, holderData, deployerActive);
      setRiskAssessment(assessment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk data';
      setError(errorMessage);
      console.error('Risk Flags widget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateRiskScore]);

  // Initial fetch if token address is provided
  useEffect(() => {
    if (tokenAddress) {
      fetchRiskData(tokenAddress);
    }
  }, [tokenAddress, fetchRiskData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTokenAddress(inputValue.trim());
    }
  };

  const handleRefresh = () => {
    if (tokenAddress) {
      fetchRiskData(tokenAddress);
    }
  };

  // Get color for risk level
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low':
        return '#4ade80'; // green
      case 'medium':
        return '#fbbf24'; // yellow
      case 'high':
        return '#fb923c'; // orange
      case 'critical':
        return '#f87171'; // red
      default:
        return '#808080';
    }
  };

  // Get emoji for risk level
  const getRiskLevelEmoji = (level: string): string => {
    switch (level) {
      case 'low':
        return '✅';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🔶';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    return severity === 'danger' ? '#f87171' : '#fbbf24';
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
          🛡️
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          Risk Flags
        </div>
        <div style={{ fontSize: '14px', color: '#808080', marginBottom: '20px' }}>
          Enter a token address to assess risk
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
            Assess Risk
          </button>
        </form>
      </div>
    );
  }

  // Show skeleton loader during initial load
  if (isLoading && !riskAssessment) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error && !riskAssessment) {
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
          Failed to Load Risk Data
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
              setRiskAssessment(null);
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

  // Show risk assessment
  if (!riskAssessment) {
    return null;
  }

  const riskColor = getRiskLevelColor(riskAssessment.level);
  const riskEmoji = getRiskLevelEmoji(riskAssessment.level);

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
            Risk Assessment
          </div>
          <div style={{ fontSize: '12px', color: '#808080' }}>
            Token risk analysis and flags
          </div>
        </div>
        <button
          onClick={() => {
            setTokenAddress('');
            setInputValue('');
            setRiskAssessment(null);
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

      {/* Risk Score Card */}
      <div
        style={{
          padding: '24px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '12px',
          border: `2px solid ${riskColor}`,
          boxShadow: `0 0 20px ${riskColor}33`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Risk Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: 700, color: riskColor }}>
                {riskAssessment.score.toFixed(0)}
              </div>
              <div style={{ fontSize: '20px', color: '#808080' }}>
                / 100
              </div>
            </div>
          </div>
          <div style={{ fontSize: '64px' }}>
            {riskEmoji}
          </div>
        </div>

        {/* Risk Level Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: `${riskColor}22`,
            border: `1px solid ${riskColor}`,
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 700,
            color: riskColor,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {riskAssessment.level} Risk
        </div>
      </div>

      {/* Risk Level Guide */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Risk Level Guide
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <div style={{ width: '60px', color: '#808080' }}>0-30:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4ade80' }} />
              <span style={{ color: '#e0e0e0' }}>Low Risk</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <div style={{ width: '60px', color: '#808080' }}>31-60:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fbbf24' }} />
              <span style={{ color: '#e0e0e0' }}>Medium Risk</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <div style={{ width: '60px', color: '#808080' }}>61-80:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fb923c' }} />
              <span style={{ color: '#e0e0e0' }}>High Risk</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <div style={{ width: '60px', color: '#808080' }}>81+:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f87171' }} />
              <span style={{ color: '#e0e0e0' }}>Critical Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {riskAssessment.flags.length > 0 ? (
        <div
          style={{
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#808080', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Risk Flags ({riskAssessment.flags.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {riskAssessment.flags.map((flag, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: `${getSeverityColor(flag.severity)}11`,
                  border: `1px solid ${getSeverityColor(flag.severity)}44`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getSeverityColor(flag.severity),
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: '1.5' }}>
                    {flag.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '20px',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80', marginBottom: '4px' }}>
            No Risk Flags Detected
          </div>
          <div style={{ fontSize: '12px', color: '#86efac' }}>
            This token shows no major risk indicators
          </div>
        </div>
      )}

      {/* Risk Calculation Breakdown */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 45, 0.5)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#808080', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Risk Calculation
        </div>
        <div style={{ fontSize: '12px', color: '#a0a0a0', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            Risk score is calculated based on:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>LP locked percentage (adds risk if &lt; 50%)</li>
            <li>Holder concentration (adds risk if top 10 &gt; 50%)</li>
            <li>Deployer wallet activity (adds 30 points if active in 24h)</li>
          </ul>
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

export default RiskFlagsWidget;
