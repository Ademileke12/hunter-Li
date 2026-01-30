import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { I18nProvider } from './contexts/I18nContext';

// Mock the wallet store
vi.mock('./stores/walletStore', () => ({
  useWalletStore: vi.fn(() => ({
    connected: false,
    connecting: false,
    publicKey: null,
    provider: null,
    balance: 0,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTransaction: vi.fn(),
    updateBalance: vi.fn(),
  })),
}));

describe('App', () => {
  it('renders the application title', async () => {
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Assistant Hunter Li Crypto Workspace/i)).toBeInTheDocument();
    });
  });

  it('renders the subtitle', async () => {
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Professional-grade Solana trading and analysis platform/i)).toBeInTheDocument();
    });
  });

  it('renders the TopBar component', async () => {
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    await waitFor(() => {
      // Check for search bar
      const searchInput = screen.getByPlaceholderText(/Search token/i);
      expect(searchInput).toBeInTheDocument();
    });
  });
});
