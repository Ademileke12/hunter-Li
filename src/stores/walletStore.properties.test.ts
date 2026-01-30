import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useWalletStore, setWalletPublicKey, setWalletConnected } from './walletStore';
import type { WalletProvider } from '../types';

describe('Wallet Store Property-Based Tests', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWalletStore.setState({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
    });
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Property 29: Wallet State Sharing', () => {
    it('should share wallet state consistently across all store accesses', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 29: Wallet State Sharing
       * 
       * For any connected wallet, all widgets requiring wallet information
       * should have access to the same wallet public key and connection state.
       * 
       * **Validates: Requirements 12.6**
       */

      // Generator for wallet providers
      const walletProviderGen = fc.constantFrom<WalletProvider>(
        'phantom',
        'solflare',
        'backpack'
      );

      // Generator for public keys (simulating Solana public keys)
      const publicKeyGen = fc.string({
        minLength: 32,
        maxLength: 44,
      }).filter(key => key.length > 0);

      // Generator for balance values
      const balanceGen = fc.double({
        min: 0,
        max: 1000000,
        noNaN: true,
        noDefaultInfinity: true,
      });

      // Generator for connection state
      const connectionStateGen = fc.boolean();

      fc.assert(
        fc.property(
          walletProviderGen,
          publicKeyGen,
          balanceGen,
          connectionStateGen,
          (provider, publicKey, balance, connected) => {
            // Set up wallet state
            useWalletStore.setState({
              provider,
              publicKey,
              balance,
              connected,
              connecting: false,
            });

            // Simulate multiple widgets accessing the wallet store
            // (In a real app, these would be different components/widgets)
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();
            const access3 = useWalletStore.getState();

            // All accesses should see the same wallet state
            expect(access1.publicKey).toBe(publicKey);
            expect(access2.publicKey).toBe(publicKey);
            expect(access3.publicKey).toBe(publicKey);

            expect(access1.connected).toBe(connected);
            expect(access2.connected).toBe(connected);
            expect(access3.connected).toBe(connected);

            expect(access1.provider).toBe(provider);
            expect(access2.provider).toBe(provider);
            expect(access3.provider).toBe(provider);

            expect(access1.balance).toBe(balance);
            expect(access2.balance).toBe(balance);
            expect(access3.balance).toBe(balance);

            // Verify that all accesses are referencing the same state
            expect(access1).toEqual(access2);
            expect(access2).toEqual(access3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent state when wallet connects', () => {
      /**
       * Property 29 Extension: Connection State Consistency
       * 
       * When a wallet connects, all subsequent accesses to the store
       * should see the updated connection state consistently.
       */

      const walletProviderGen = fc.constantFrom<WalletProvider>(
        'phantom',
        'solflare',
        'backpack'
      );

      const publicKeyGen = fc.hexaString({ minLength: 32, maxLength: 44 });

      fc.assert(
        fc.property(
          walletProviderGen,
          publicKeyGen,
          (provider, publicKey) => {
            // Set wallet state directly (simulating a connection)
            useWalletStore.setState({
              connected: true,
              provider,
              publicKey,
              connecting: false,
            });

            // Multiple accesses after connection
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();
            const access3 = useWalletStore.getState();

            // All should see connected state
            expect(access1.connected).toBe(true);
            expect(access2.connected).toBe(true);
            expect(access3.connected).toBe(true);

            // All should see the same public key
            expect(access1.publicKey).toBe(publicKey);
            expect(access2.publicKey).toBe(publicKey);
            expect(access3.publicKey).toBe(publicKey);

            // All should see the same provider
            expect(access1.provider).toBe(provider);
            expect(access2.provider).toBe(provider);
            expect(access3.provider).toBe(provider);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent state when wallet disconnects', () => {
      /**
       * Property 29 Extension: Disconnection State Consistency
       * 
       * When a wallet disconnects, all subsequent accesses to the store
       * should see the cleared wallet state consistently.
       */

      const walletProviderGen = fc.constantFrom<WalletProvider>(
        'phantom',
        'solflare',
        'backpack'
      );

      const publicKeyGen = fc.hexaString({ minLength: 32, maxLength: 44 });

      const balanceGen = fc.double({
        min: 0,
        max: 1000000,
        noNaN: true,
        noDefaultInfinity: true,
      });

      fc.assert(
        fc.property(
          walletProviderGen,
          publicKeyGen,
          balanceGen,
          (provider, publicKey, balance) => {
            // Set connected state first
            useWalletStore.setState({
              connected: true,
              provider,
              publicKey,
              balance,
              connecting: false,
            });

            // Disconnect wallet
            useWalletStore.getState().disconnect();

            // Multiple accesses after disconnection
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();
            const access3 = useWalletStore.getState();

            // All should see disconnected state
            expect(access1.connected).toBe(false);
            expect(access2.connected).toBe(false);
            expect(access3.connected).toBe(false);

            // All should see cleared public key
            expect(access1.publicKey).toBe(null);
            expect(access2.publicKey).toBe(null);
            expect(access3.publicKey).toBe(null);

            // All should see cleared provider
            expect(access1.provider).toBe(null);
            expect(access2.provider).toBe(null);
            expect(access3.provider).toBe(null);

            // All should see cleared balance
            expect(access1.balance).toBe(0);
            expect(access2.balance).toBe(0);
            expect(access3.balance).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent state when balance updates', () => {
      /**
       * Property 29 Extension: Balance Update Consistency
       * 
       * When the wallet balance is updated, all subsequent accesses
       * should see the updated balance consistently.
       */

      const balanceSequenceGen = fc.array(
        fc.double({
          min: 0,
          max: 1000000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        { minLength: 1, maxLength: 10 }
      );

      fc.assert(
        fc.property(balanceSequenceGen, (balances) => {
          const { updateBalance } = useWalletStore.getState();

          // Update balance multiple times
          balances.forEach((balance) => {
            updateBalance(balance);

            // Multiple accesses after each update
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();
            const access3 = useWalletStore.getState();

            // All should see the same updated balance
            expect(access1.balance).toBe(balance);
            expect(access2.balance).toBe(balance);
            expect(access3.balance).toBe(balance);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain state consistency across concurrent accesses', () => {
      /**
       * Property 29 Extension: Concurrent Access Consistency
       * 
       * Multiple simultaneous accesses to the wallet store should
       * always see a consistent snapshot of the wallet state.
       */

      const walletProviderGen = fc.constantFrom<WalletProvider>(
        'phantom',
        'solflare',
        'backpack'
      );

      const publicKeyGen = fc.hexaString({ minLength: 32, maxLength: 44 });

      const balanceGen = fc.double({
        min: 0,
        max: 1000000,
        noNaN: true,
        noDefaultInfinity: true,
      });

      fc.assert(
        fc.property(
          walletProviderGen,
          publicKeyGen,
          balanceGen,
          (provider, publicKey, balance) => {
            // Set up wallet state
            useWalletStore.setState({
              connected: true,
              provider,
              publicKey,
              balance,
              connecting: false,
            });

            // Simulate many concurrent accesses (like multiple widgets rendering)
            const accesses = Array.from({ length: 20 }, () =>
              useWalletStore.getState()
            );

            // All accesses should see identical state
            const firstAccess = accesses[0];
            accesses.forEach((access) => {
              expect(access.publicKey).toBe(firstAccess.publicKey);
              expect(access.connected).toBe(firstAccess.connected);
              expect(access.provider).toBe(firstAccess.provider);
              expect(access.balance).toBe(firstAccess.balance);
            });

            // Verify the expected values
            expect(firstAccess.publicKey).toBe(publicKey);
            expect(firstAccess.connected).toBe(true);
            expect(firstAccess.provider).toBe(provider);
            expect(firstAccess.balance).toBe(balance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state consistency when using helper functions', () => {
      /**
       * Property 29 Extension: Helper Function Consistency
       * 
       * When wallet state is updated via helper functions (setWalletPublicKey,
       * setWalletConnected), all accesses should see the updated state consistently.
       */

      const publicKeyGen = fc.string({
        minLength: 32,
        maxLength: 44,
      }).filter(key => key.length > 0);

      const connectedGen = fc.boolean();

      fc.assert(
        fc.property(
          publicKeyGen,
          connectedGen,
          (publicKey, connected) => {
            // Update state via helper functions
            setWalletPublicKey(publicKey);
            setWalletConnected(connected);

            // Multiple accesses
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();
            const access3 = useWalletStore.getState();

            // All should see the same state
            expect(access1.publicKey).toBe(publicKey);
            expect(access2.publicKey).toBe(publicKey);
            expect(access3.publicKey).toBe(publicKey);

            expect(access1.connected).toBe(connected);
            expect(access2.connected).toBe(connected);
            expect(access3.connected).toBe(connected);

            // When setWalletConnected is called, connecting should be false
            expect(access1.connecting).toBe(false);
            expect(access2.connecting).toBe(false);
            expect(access3.connecting).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state isolation between different state properties', () => {
      /**
       * Property 29 Extension: State Property Isolation
       * 
       * Updating one property of the wallet state should not affect
       * other properties, and all accesses should see consistent values
       * for all properties.
       */

      const walletProviderGen = fc.constantFrom<WalletProvider>(
        'phantom',
        'solflare',
        'backpack'
      );

      const publicKeyGen = fc.hexaString({ minLength: 32, maxLength: 44 });

      const balanceGen = fc.double({
        min: 0,
        max: 1000000,
        noNaN: true,
        noDefaultInfinity: true,
      });

      fc.assert(
        fc.property(
          walletProviderGen,
          publicKeyGen,
          balanceGen,
          (provider, publicKey, balance) => {
            // Set up initial state
            useWalletStore.setState({
              connected: true,
              provider,
              publicKey: null,
              balance: 0,
              connecting: false,
            });
            
            const initialState = useWalletStore.getState();

            // Update public key
            setWalletPublicKey(publicKey);
            const afterKeyUpdate = useWalletStore.getState();
            
            // Provider and connected state should remain unchanged
            expect(afterKeyUpdate.provider).toBe(initialState.provider);
            expect(afterKeyUpdate.connected).toBe(initialState.connected);
            // Public key should be updated
            expect(afterKeyUpdate.publicKey).toBe(publicKey);

            // Update balance
            useWalletStore.getState().updateBalance(balance);
            const afterBalanceUpdate = useWalletStore.getState();
            
            // Provider, connected state, and public key should remain unchanged
            expect(afterBalanceUpdate.provider).toBe(initialState.provider);
            expect(afterBalanceUpdate.connected).toBe(initialState.connected);
            expect(afterBalanceUpdate.publicKey).toBe(publicKey);
            // Balance should be updated
            expect(afterBalanceUpdate.balance).toBe(balance);

            // All subsequent accesses should see the final consistent state
            const access1 = useWalletStore.getState();
            const access2 = useWalletStore.getState();

            expect(access1).toEqual(access2);
            expect(access1.provider).toBe(provider);
            expect(access1.publicKey).toBe(publicKey);
            expect(access1.balance).toBe(balance);
            expect(access1.connected).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
