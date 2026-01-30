
import { FC, ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, WalletConnectWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { setWalletConnected, setWalletPublicKey } from '../stores/walletStore';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

// Component to sync wallet adapter state with the Zustand store
const WalletStoreUpdater = () => {
    const { connected, publicKey, wallet } = useWallet();
    // connect is not needed as we sync state *from* adapter *to* store
    // const { connect } = useWalletStore();

    useEffect(() => {
        setWalletConnected(connected);
        setWalletPublicKey(publicKey ? publicKey.toBase58() : null);

        // If connected and wallet is present, we might want to update the provider in the store
        // slightly redundant if we rely on useWallet() but good for compatibility with existing store logic
        if (connected && wallet && wallet.adapter) {
            // The store expects a specific 'WalletProvider' type which might differ from the adapter
            // For now, we mainly care about connected state and public key
        }
    }, [connected, publicKey, wallet]);

    return null;
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => {
        if (import.meta.env.VITE_SOLANA_RPC_URL) {
            return import.meta.env.VITE_SOLANA_RPC_URL;
        }
        return clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new WalletConnectWalletAdapter({
                network,
                options: {
                    projectId: '3b09071569046c483cc12140b9048386',
                    metadata: {
                        name: 'Assistant Hunter Li',
                        description: 'Crypto Discovery Platform',
                        url: 'http://localhost:5173',
                        icons: ['https://avatars.githubusercontent.com/u/37784886']
                    },
                },
            }),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} onError={(error) => console.error('Wallet Error:', error)} autoConnect>
                <WalletModalProvider>
                    <WalletStoreUpdater />
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
