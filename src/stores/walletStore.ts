import { create } from 'zustand';
import { WalletProvider } from '../types';
import type { Transaction } from '@solana/web3.js';

interface WalletStore {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  provider: WalletProvider | null;
  balance: number;
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => void;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  updateBalance: (balance: number) => void;
}

const WALLET_PROVIDER_KEY = 'app_wallet_provider';

export const useWalletStore = create<WalletStore>((set, get) => ({
  connected: false,
  connecting: false,
  publicKey: null,
  provider: null,
  balance: 0,

  connect: async (provider: WalletProvider) => {
    set({ connecting: true });
    
    try {
      // Store the provider preference
      localStorage.setItem(WALLET_PROVIDER_KEY, provider);
      
      // In a real implementation, this would integrate with @solana/wallet-adapter-react
      // For now, we'll set up the basic state structure
      // The actual wallet connection will be handled by the WalletProvider context
      
      set({
        connected: true,
        connecting: false,
        provider,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ connecting: false });
      throw error;
    }
  },

  disconnect: () => {
    // Clear wallet state
    set({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
    });
    
    // Keep the provider preference in localStorage for auto-reconnect
    // but clear the connection state
  },

  signTransaction: async (tx: Transaction) => {
    const { connected } = get();
    
    if (!connected) {
      throw new Error('Wallet not connected');
    }
    
    // In a real implementation, this would use the wallet adapter to sign
    // For now, we'll just return the transaction
    // The actual signing will be handled by the wallet adapter
    return tx;
  },

  updateBalance: (balance: number) => {
    set({ balance });
  },
}));

// Helper function to get persisted wallet provider
export const getPersistedWalletProvider = (): WalletProvider | null => {
  try {
    const provider = localStorage.getItem(WALLET_PROVIDER_KEY);
    if (provider && ['phantom', 'solflare', 'backpack'].includes(provider)) {
      return provider as WalletProvider;
    }
  } catch (error) {
    console.error('Failed to get persisted wallet provider:', error);
  }
  return null;
};

// Helper function to set public key (to be called from wallet adapter context)
export const setWalletPublicKey = (publicKey: string | null) => {
  useWalletStore.setState({ publicKey });
};

// Helper function to set connected state (to be called from wallet adapter context)
export const setWalletConnected = (connected: boolean) => {
  useWalletStore.setState({ connected, connecting: false });
};
