import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useWalletStore } from '../../stores/walletStore';
import type { WalletProvider } from '../../types';

/**
 * WalletButton Component
 * Displays wallet connection status and provides connect/disconnect functionality
 */
export function WalletButton() {
  const { t } = useTranslation();
  const { select, connect: adapterConnect, disconnect: adapterDisconnect, wallet } = useWallet();
  const { connected, connecting, publicKey, provider, connect: storeConnect, disconnect: storeDisconnect } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleConnect = async (walletProvider: WalletProvider) => {
    try {
      // proper mapping to adapter names
      const adapterNameMap: Record<WalletProvider, string> = {
        phantom: 'Phantom',
        solflare: 'Solflare',
        backpack: 'Backpack',
        walletConnect: 'WalletConnect'
      };

      const adapterName = adapterNameMap[walletProvider];

      // Select the wallet in the adapter
      select(adapterName as any);

      // Also update our store
      await storeConnect(walletProvider);

      // Attempt to connect (sometimes select is enough if autoConnect is on, but explicit is safer for UI interactions)
      // Note: 'connect' might throw if already connecting or other issues, handle gracefully
      // We rely on the adapter's state changes to update our store via WalletContextProvider

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    await adapterDisconnect();
    storeDisconnect();
    setIsOpen(false);
  };

  const walletProviders: { name: WalletProvider; label: string; icon: string }[] = [
    { name: 'phantom', label: 'Phantom', icon: '👻' },
    { name: 'solflare', label: 'Solflare', icon: '🔥' },
    { name: 'backpack', label: 'Backpack', icon: '🎒' },
    { name: 'walletConnect', label: 'WalletConnect', icon: '🔗' },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 border border-accent-blue/50 hover:border-accent-blue transition-all duration-200"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-200">{formatAddress(publicKey)}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-dark-card/95 backdrop-blur-md border border-dark-border shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-dark-border">
              <div className="text-xs text-gray-500 mb-1">{t('topbar.wallet_connected')}</div>
              <div className="text-sm text-gray-300 font-mono">{formatAddress(publicKey)}</div>
              {provider && (
                <div className="text-xs text-gray-500 mt-1 capitalize">{provider}</div>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-dark-border/50 transition-colors duration-150"
            >
              {t('topbar.wallet_disconnect')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-200"
      >
        {connecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('common.loading')}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="text-sm">{t('topbar.wallet_connect')}</span>
          </>
        )}
      </button>

      {isOpen && !connected && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-dark-card/95 backdrop-blur-md border border-dark-border shadow-lg overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-dark-border">
            <div className="text-xs text-gray-500">{t('topbar.wallet_connect')}</div>
          </div>
          {walletProviders.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              className="w-full px-4 py-3 text-left hover:bg-dark-border/50 transition-colors duration-150 flex items-center gap-3"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <span className="text-sm text-gray-300">{wallet.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
