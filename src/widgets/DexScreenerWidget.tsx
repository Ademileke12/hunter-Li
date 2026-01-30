import React, { useState } from 'react';
import type { WidgetInstance } from '../types';

interface DexScreenerWidgetProps {
  instance: WidgetInstance;
}

/**
 * DexScreener Widget
 * 
 * Embeds DexScreener iframe for token chart viewing.
 * Implements iframe sandbox security and error handling.
 * 
 * Requirements: 5.1
 */
const DexScreenerWidget: React.FC<DexScreenerWidgetProps> = ({ instance }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tokenAddress = instance.config?.tokenAddress || '';

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setIsLoading(false);
    setHasError(true);
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
          📊
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#e0e0e0' }}>
          DexScreener Chart
        </div>
        <div style={{ fontSize: '14px', color: '#808080' }}>
          Configure a token address to view the chart
        </div>
      </div>
    );
  }

  const iframeUrl = `https://dexscreener.com/solana/${tokenAddress}`;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(20, 20, 30, 0.9)',
            zIndex: 10,
          }}
        >
          <div style={{ color: '#a0a0a0', fontSize: '14px' }}>Loading chart...</div>
        </div>
      )}

      {hasError ? (
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
            Failed to Load Chart
          </div>
          <div style={{ fontSize: '14px', color: '#808080', marginBottom: '16px' }}>
            Unable to load DexScreener for this token
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
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
      ) : (
        <iframe
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={`DexScreener chart for ${tokenAddress}`}
        />
      )}
    </div>
  );
};

export default DexScreenerWidget;
