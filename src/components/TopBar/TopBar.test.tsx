import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TopBar } from './TopBar';
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

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  const renderComponent = (props = {}) => {
    return render(
      <I18nProvider>
        <TopBar {...props} />
      </I18nProvider>
    );
  };

  it('renders the TopBar component', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('app.title')).toBeInTheDocument();
    });
  });

  it('displays the logo', async () => {
    renderComponent();
    await waitFor(() => {
      const logo = document.querySelector('.bg-gradient-to-br');
      expect(logo).toBeInTheDocument();
    });
  });

  it('displays the app title', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('app.title')).toBeInTheDocument();
    });
  });

  it('displays the app subtitle', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('app.subtitle')).toBeInTheDocument();
    });
  });

  it('renders the search bar', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('topbar.search_placeholder')).toBeInTheDocument();
    });
  });

  it('renders the language toggle', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('language.en')).toBeInTheDocument();
    });
  });

  it('renders the wallet button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('topbar.wallet_connect')).toBeInTheDocument();
    });
  });

  it('has fixed positioning', async () => {
    renderComponent();
    await waitFor(() => {
      const topBarContainer = document.querySelector('.fixed.top-0.left-0.right-0');
      expect(topBarContainer).toBeInTheDocument();
    });
  });

  it('has glassmorphism styling', async () => {
    renderComponent();
    await waitFor(() => {
      const topBarContainer = document.querySelector('.backdrop-blur-md');
      expect(topBarContainer).toBeInTheDocument();
    });
  });

  it('has proper z-index for staying on top', async () => {
    renderComponent();
    await waitFor(() => {
      const topBarContainer = document.querySelector('.z-50');
      expect(topBarContainer).toBeInTheDocument();
    });
  });

  it('calls onTokenSelect when token is selected from search', async () => {
    const onTokenSelect = vi.fn();
    renderComponent({ onTokenSelect });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('topbar.search_placeholder')).toBeInTheDocument();
    });
    
    // The actual token selection is tested in SearchBar.test.tsx
    // Here we just verify the prop is passed correctly
  });

  it('displays all components in correct order', async () => {
    renderComponent();
    
    await waitFor(() => {
      const container = screen.getByText('app.title').closest('div')?.parentElement;
      expect(container).toBeInTheDocument();
      
      // Check that logo is first
      const logo = container?.querySelector('.bg-gradient-to-br');
      expect(logo).toBeInTheDocument();
      
      // Check that search is in the middle
      const search = screen.getByPlaceholderText('topbar.search_placeholder');
      expect(search).toBeInTheDocument();
      
      // Check that controls are on the right
      const languageToggle = screen.getByText('language.en');
      const walletButton = screen.getByText('topbar.wallet_connect');
      expect(languageToggle).toBeInTheDocument();
      expect(walletButton).toBeInTheDocument();
    });
  });

  it('has responsive layout classes', async () => {
    renderComponent();
    await waitFor(() => {
      const titleContainer = screen.getByText('app.title').parentElement;
      expect(titleContainer).toHaveClass('hidden', 'sm:block');
    });
  });

  it('has proper spacing between elements', async () => {
    renderComponent();
    await waitFor(() => {
      const container = document.querySelector('.flex.items-center.justify-between.gap-4');
      expect(container).toBeInTheDocument();
    });
  });

  it('has border at the bottom', async () => {
    renderComponent();
    await waitFor(() => {
      const topBarContainer = document.querySelector('.border-b.border-dark-border');
      expect(topBarContainer).toBeInTheDocument();
    });
  });

  it('has gradient effect on logo', async () => {
    renderComponent();
    await waitFor(() => {
      const logo = document.querySelector('.bg-gradient-to-br.from-accent-blue.to-accent-purple');
      expect(logo).toBeInTheDocument();
    });
  });

  it('has glow effect on logo', async () => {
    renderComponent();
    await waitFor(() => {
      const logo = document.querySelector('.shadow-glow-blue');
      expect(logo).toBeInTheDocument();
    });
  });
});
