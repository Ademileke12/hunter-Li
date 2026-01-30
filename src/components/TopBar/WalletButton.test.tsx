import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletButton } from './WalletButton';
import { I18nProvider } from '../../contexts/I18nContext';
import { useWalletStore } from '../../stores/walletStore';

// Mock the translation service
vi.mock('../../services/TranslationService', () => ({
  translationService: {
    getLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(async () => {}),
    t: vi.fn((key: string) => key),
    initialize: vi.fn(async () => {}),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock the wallet store
vi.mock('../../stores/walletStore', () => ({
  useWalletStore: vi.fn(),
}));

describe('WalletButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <I18nProvider>
        <WalletButton />
      </I18nProvider>
    );
  };

  it('renders connect button when wallet is not connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('topbar.wallet_connect')).toBeInTheDocument();
    });
  });

  it('shows loading state when connecting', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: true,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });
  });

  it('displays wallet address when connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: 'So11111111111111111111111111111111111111112',
      provider: 'phantom',
      balance: 10.5,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('So11...1112')).toBeInTheDocument();
    });
  });

  it('shows green indicator when connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: 'So11111111111111111111111111111111111111112',
      provider: 'phantom',
      balance: 10.5,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  it('opens wallet provider dropdown when not connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('topbar.wallet_connect');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Phantom')).toBeInTheDocument();
      expect(screen.getByText('Solflare')).toBeInTheDocument();
      expect(screen.getByText('Backpack')).toBeInTheDocument();
    });
  });

  it('calls connect when wallet provider is selected', async () => {
    const mockConnect = vi.fn();
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: mockConnect,
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('topbar.wallet_connect');
      fireEvent.click(button);
    });

    await waitFor(() => {
      const phantomButton = screen.getByText('Phantom');
      fireEvent.click(phantomButton);
    });

    expect(mockConnect).toHaveBeenCalledWith('phantom');
  });

  it('opens disconnect dropdown when connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: 'So11111111111111111111111111111111111111112',
      provider: 'phantom',
      balance: 10.5,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('So11...1112');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('topbar.wallet_disconnect')).toBeInTheDocument();
      expect(screen.getByText('topbar.wallet_connected')).toBeInTheDocument();
    });
  });

  it('calls disconnect when disconnect button is clicked', async () => {
    const mockDisconnect = vi.fn();
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: 'So11111111111111111111111111111111111111112',
      provider: 'phantom',
      balance: 10.5,
      connect: vi.fn(),
      disconnect: mockDisconnect,
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('So11...1112');
      fireEvent.click(button);
    });

    await waitFor(() => {
      const disconnectButton = screen.getByText('topbar.wallet_disconnect');
      fireEvent.click(disconnectButton);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('displays provider name when connected', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: 'So11111111111111111111111111111111111111112',
      provider: 'phantom',
      balance: 10.5,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('So11...1112');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('phantom')).toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByText('topbar.wallet_connect');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Phantom')).not.toBeInTheDocument();
    });
  });

  it('disables button when connecting', async () => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      connecting: true,
      publicKey: null,
      provider: null,
      balance: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      updateBalance: vi.fn(),
    });

    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
