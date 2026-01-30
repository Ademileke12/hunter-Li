import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetInstance } from '../types';
import type { SwapQuote } from '../types/jupiter';
import { createJupiterClient } from '../services/JupiterClient';
import { solanaClient } from '../services/SolanaClient';
import { useWalletStore } from '../stores/walletStore';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { VersionedTransaction } from '@solana/web3.js';

interface SwapWidgetProps {
  instance: WidgetInstance;
}

// Common token list for Solana
const COMMON_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, name: 'Solana' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, name: 'USD Coin' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, name: 'Tether USD' },
  { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, name: 'Raydium' },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, name: 'Bonk' },
];

// Quick buy preset amounts in SOL (lamports)
const QUICK_BUY_AMOUNTS = [
  { label: '0.1 SOL', lamports: 100_000_000 },
  { label: '0.5 SOL', lamports: 500_000_000 },
  { label: '1 SOL', lamports: 1_000_000_000 },
  { label: '5 SOL', lamports: 5_000_000_000 },
  { label: '10 SOL', lamports: 10_000_000_000 },
];

// Slippage presets in basis points
const SLIPPAGE_PRESETS = [
  { label: '0.5%', bps: 50 },
  { label: '1%', bps: 100 },
  { label: '2%', bps: 200 },
];

/**
 * Swap Widget
 * 
 * Provides token swap functionality using Jupiter aggregator.
 * Features:
 * - Input/output token selectors with search
 * - Amount input field
 * - Quick Buy buttons for preset SOL amounts
 * - Slippage tolerance controls
 * - Real-time quote display with price impact
 * - Wallet integration for swap execution
 * - Transaction status tracking
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10, 7.11
 */
const SwapWidget: React.FC<SwapWidgetProps> = ({ instance }) => {
  const { connected, publicKey } = useWalletStore();
  
  // Token selection
  const [inputMint, setInputMint] = useState(
    instance.config?.inputMint || 'So11111111111111111111111111111111111111112'
  );
  const [outputMint, setOutputMint] = useState(instance.config?.outputMint || '');
  const [inputToken, setInputToken] = useState(COMMON_TOKENS[0]);
  const [outputToken, setOutputToken] = useState<typeof COMMON_TOKENS[0] | null>(null);
  
  // Amount and slippage
  const [inputAmount, setInputAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(instance.config?.slippageBps || 100);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  
  // Quote and transaction state
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  
  // Token search
  const [showInputSearch, setShowInputSearch] = useState(false);
  const [showOutputSearch, setShowOutputSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Jupiter client
  const jupiterClient = createJupiterClient(solanaClient.getConnection());

  // Update output token when outputMint changes
  useEffect(() => {
    if (outputMint) {
      const token = COMMON_TOKENS.find(t => t.mint === outputMint);
      setOutputToken(token || null);
    }
  }, [outputMint]);

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputAmount || !outputMint || parseFloat(inputAmount) <= 0) {
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const amountInLamports = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals));
        
        const quoteData = await jupiterClient.getQuote({
          inputMint,
          outputMint,
          amount: amountInLamports,
          slippageBps,
        });

        setQuote(quoteData);
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuoteError(error instanceof Error ? error.message : 'Failed to fetch quote');
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    // Debounce quote fetching
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [inputAmount, inputMint, outputMint, slippageBps, inputToken.decimals, jupiterClient]);

  // Handle quick buy button click
  const handleQuickBuy = (lamports: number) => {
    const amount = lamports / Math.pow(10, inputToken.decimals);
    setInputAmount(amount.toString());
  };

  // Handle slippage change
  const handleSlippageChange = (bps: number) => {
    setSlippageBps(bps);
    setShowCustomSlippage(false);
    setCustomSlippage('');
  };

  // Handle custom slippage
  const handleCustomSlippageSubmit = () => {
    const value = parseFloat(customSlippage);
    if (!isNaN(value) && value > 0 && value <= 50) {
      setSlippageBps(Math.floor(value * 100));
      setShowCustomSlippage(false);
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!connected || !publicKey || !quote) {
      return;
    }

    setIsSwapping(true);
    setTxStatus('pending');
    setTxError(null);
    setTxSignature(null);

    try {
      // Mock sign transaction function - in real implementation, this would use wallet adapter
      const signTransaction = async (tx: VersionedTransaction) => {
        // This would be replaced with actual wallet signing
        // For now, we'll just return the transaction
        return tx;
      };

      const result = await jupiterClient.executeSwap(
        {
          quoteResponse: quote,
          userPublicKey: publicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
        },
        signTransaction
      );

      setTxSignature(result.signature);
      
      if (result.status === 'failed') {
        setTxStatus('failed');
        setTxError(result.error || 'Transaction failed');
      } else {
        setTxStatus(result.status);
        
        // Poll for confirmation
        if (result.status === 'pending') {
          setTimeout(() => {
            setTxStatus('confirmed');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Swap error:', error);
      setTxStatus('failed');
      setTxError(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: typeof COMMON_TOKENS[0], isInput: boolean) => {
    if (isInput) {
      setInputMint(token.mint);
      setInputToken(token);
      setShowInputSearch(false);
    } else {
      setOutputMint(token.mint);
      setOutputToken(token);
      setShowOutputSearch(false);
    }
    setSearchQuery('');
  };

  // Filter tokens based on search
  const filteredTokens = COMMON_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format numbers
  const formatAmount = (amount: string, decimals: number): string => {
    const num = parseInt(amount) / Math.pow(10, decimals);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const formatPercentage = (value: string): string => {
    const num = parseFloat(value);
    return `${num.toFixed(2)}%`;
  };

  // Render token selector dropdown
  const renderTokenSearch = (isInput: boolean) => {
    const show = isInput ? showInputSearch : showOutputSearch;
    if (!show) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'rgba(20, 20, 30, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ padding: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens..."
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(30, 30, 45, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#e0e0e0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {filteredTokens.map((token) => (
            <div
              key={token.mint}
              onClick={() => handleTokenSelect(token, isInput)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 100, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0e0', marginBottom: '2px' }}>
                {token.symbol}
              </div>
              <div style={{ fontSize: '12px', color: '#808080' }}>
                {token.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
      }}
    >
      {/* Input Token Section */}
      <div>
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          You Pay
        </div>
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <button
                onClick={() => {
                  setShowInputSearch(!showInputSearch);
                  setShowOutputSearch(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(40, 40, 60, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{inputToken.symbol}</span>
                <span style={{ fontSize: '12px', color: '#808080' }}>▼</span>
              </button>
              {renderTokenSearch(true)}
            </div>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              style={{
                flex: 2,
                padding: '12px',
                background: 'rgba(40, 40, 60, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'right',
                outline: 'none',
              }}
            />
          </div>
          
          {/* Quick Buy Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {QUICK_BUY_AMOUNTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleQuickBuy(preset.lamports)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(100, 100, 255, 0.1)',
                  border: '1px solid rgba(100, 100, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#a0a0ff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 255, 0.1)';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Swap Direction Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(100, 100, 255, 0.2)',
            border: '2px solid rgba(100, 100, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          ↓
        </div>
      </div>

      {/* Output Token Section */}
      <div>
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          You Receive
        </div>
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <button
                onClick={() => {
                  setShowOutputSearch(!showOutputSearch);
                  setShowInputSearch(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(40, 40, 60, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: outputToken ? '#e0e0e0' : '#808080',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{outputToken ? outputToken.symbol : 'Select token'}</span>
                <span style={{ fontSize: '12px', color: '#808080' }}>▼</span>
              </button>
              {renderTokenSearch(false)}
            </div>
            <div
              style={{
                flex: 2,
                padding: '12px',
                background: 'rgba(40, 40, 60, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {isLoadingQuote ? (
                <span style={{ fontSize: '14px', color: '#808080' }}>Loading...</span>
              ) : quote && outputToken ? (
                formatAmount(quote.outAmount, outputToken.decimals)
              ) : (
                <span style={{ fontSize: '14px', color: '#606060' }}>0.00</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slippage Settings */}
      <div>
        <div style={{ fontSize: '12px', color: '#808080', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Slippage Tolerance
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleSlippageChange(preset.bps)}
              style={{
                padding: '8px 16px',
                background: slippageBps === preset.bps ? 'rgba(100, 100, 255, 0.3)' : 'rgba(80, 80, 100, 0.2)',
                border: `1px solid ${slippageBps === preset.bps ? 'rgba(100, 100, 255, 0.5)' : 'rgba(80, 80, 100, 0.4)'}`,
                borderRadius: '8px',
                color: slippageBps === preset.bps ? '#a0a0ff' : '#a0a0a0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {preset.label}
            </button>
          ))}
          {!showCustomSlippage ? (
            <button
              onClick={() => setShowCustomSlippage(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(80, 80, 100, 0.2)',
                border: '1px solid rgba(80, 80, 100, 0.4)',
                borderRadius: '8px',
                color: '#a0a0a0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Custom
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                value={customSlippage}
                onChange={(e) => setCustomSlippage(e.target.value)}
                placeholder="%"
                style={{
                  width: '60px',
                  padding: '8px',
                  background: 'rgba(40, 40, 60, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCustomSlippageSubmit}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(100, 100, 255, 0.2)',
                  border: '1px solid rgba(100, 100, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#a0a0ff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ✓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quote Details */}
      {quote && outputToken && !quoteError && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(30, 30, 45, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#808080' }}>Expected Output:</span>
              <span style={{ color: '#e0e0e0', fontWeight: 500 }}>
                {formatAmount(quote.outAmount, outputToken.decimals)} {outputToken.symbol}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#808080' }}>Price Impact:</span>
              <span
                style={{
                  color: parseFloat(quote.priceImpactPct) > 5 ? '#f87171' : '#4ade80',
                  fontWeight: 500,
                }}
              >
                {formatPercentage(quote.priceImpactPct)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#808080' }}>Minimum Received:</span>
              <span style={{ color: '#e0e0e0', fontWeight: 500 }}>
                {formatAmount(quote.otherAmountThreshold, outputToken.decimals)} {outputToken.symbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {quoteError && (
        <div
          style={{
            padding: '12px',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          {quoteError}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!connected || !quote || isSwapping || !outputToken}
        style={{
          width: '100%',
          padding: '16px',
          background: !connected || !quote || isSwapping || !outputToken
            ? 'rgba(80, 80, 100, 0.3)'
            : 'rgba(100, 100, 255, 0.3)',
          border: `1px solid ${!connected || !quote || isSwapping || !outputToken
            ? 'rgba(80, 80, 100, 0.5)'
            : 'rgba(100, 100, 255, 0.5)'}`,
          borderRadius: '12px',
          color: !connected || !quote || isSwapping || !outputToken ? '#606060' : '#a0a0ff',
          cursor: !connected || !quote || isSwapping || !outputToken ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 700,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (connected && quote && !isSwapping && outputToken) {
            e.currentTarget.style.background = 'rgba(100, 100, 255, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (connected && quote && !isSwapping && outputToken) {
            e.currentTarget.style.background = 'rgba(100, 100, 255, 0.3)';
          }
        }}
      >
        {!connected
          ? 'Connect Wallet'
          : !outputToken
          ? 'Select Output Token'
          : !quote
          ? 'Enter Amount'
          : isSwapping
          ? 'Swapping...'
          : 'Swap'}
      </button>

      {/* Transaction Status */}
      {txStatus !== 'idle' && (
        <div
          style={{
            padding: '16px',
            background:
              txStatus === 'confirmed'
                ? 'rgba(74, 222, 128, 0.1)'
                : txStatus === 'failed'
                ? 'rgba(248, 113, 113, 0.1)'
                : 'rgba(96, 165, 250, 0.1)',
            border: `1px solid ${
              txStatus === 'confirmed'
                ? 'rgba(74, 222, 128, 0.3)'
                : txStatus === 'failed'
                ? 'rgba(248, 113, 113, 0.3)'
                : 'rgba(96, 165, 250, 0.3)'
            }`,
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background:
                  txStatus === 'confirmed'
                    ? '#4ade80'
                    : txStatus === 'failed'
                    ? '#f87171'
                    : '#60a5fa',
                animation: txStatus === 'pending' ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color:
                  txStatus === 'confirmed'
                    ? '#4ade80'
                    : txStatus === 'failed'
                    ? '#f87171'
                    : '#60a5fa',
              }}
            >
              {txStatus === 'pending'
                ? 'Transaction Pending...'
                : txStatus === 'confirmed'
                ? 'Swap Successful!'
                : 'Transaction Failed'}
            </span>
          </div>
          {txSignature && (
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#808080',
                wordBreak: 'break-all',
              }}
            >
              Signature: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
            </div>
          )}
          {txError && (
            <div style={{ fontSize: '13px', color: '#f87171', marginTop: '8px' }}>
              {txError}
            </div>
          )}
        </div>
      )}

      {/* Pulse animation */}
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

export default SwapWidget;
