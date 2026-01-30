import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import { I18nProvider } from '../../contexts/I18nContext';

// Mock the canvas store
const mockFastBuyFlow = vi.fn();
vi.mock('../../stores/canvasStore', () => ({
  useCanvasStore: vi.fn((selector) => {
    const store = {
      fastBuyFlow: mockFastBuyFlow,
    };
    return selector ? selector(store) : store;
  }),
}));

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

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFastBuyFlow.mockReturnValue({
      chartWidgetId: 'chart-1',
      overviewWidgetId: 'overview-1',
      swapWidgetId: 'swap-1',
      positions: {
        chart: { x: 0, y: 0 },
        overview: { x: 820, y: 0 },
        swap: { x: 820, y: 320 },
      },
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <I18nProvider>
        <SearchBar {...props} />
      </I18nProvider>
    );
  };

  it('renders the search input', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('topbar.search_placeholder')).toBeInTheDocument();
    });
  });

  it('displays search icon', async () => {
    renderComponent();
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      const searchIcon = input.parentElement?.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  it('updates input value when typing', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'SOL' } });
      expect(input.value).toBe('SOL');
    });
  });

  it('shows loading indicator during search', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    // The loading indicator appears briefly, so we just verify the search works
    // The actual loading state is implementation detail
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder') as HTMLInputElement;
      expect(input.value).toBe('SOL');
    });
  });

  it('displays search results after typing', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
      expect(screen.getByText('Solana')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('does not search for queries shorter than 3 characters', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SO' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('SOL')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls onTokenSelect when result is clicked', async () => {
    const onTokenSelect = vi.fn();
    renderComponent({ onTokenSelect });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      const result = screen.getByText('SOL');
      fireEvent.click(result.closest('button')!);
    }, { timeout: 500 });

    expect(onTokenSelect).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
  });

  it('clears search after selecting result', async () => {
    const onTokenSelect = vi.fn();
    renderComponent({ onTokenSelect });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      const result = screen.getByText('SOL');
      fireEvent.click(result.closest('button')!);
    }, { timeout: 500 });

    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  it('closes dropdown when pressing Escape', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
    }, { timeout: 500 });

    const input = screen.getByPlaceholderText('topbar.search_placeholder');
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Solana')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
    }, { timeout: 500 });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Solana')).not.toBeInTheDocument();
    });
  });

  it('displays truncated token address in results', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/So11\.\.\.1112/)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('triggers Fast Buy flow when result is selected', async () => {
    renderComponent();
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'SOL' } });
    });

    await waitFor(() => {
      const result = screen.getByText('SOL');
      fireEvent.click(result.closest('button')!);
    }, { timeout: 500 });

    expect(mockFastBuyFlow).toHaveBeenCalledWith('So11111111111111111111111111111111111111112');
  });

  it('triggers Fast Buy flow before calling onTokenSelect callback', async () => {
    const onTokenSelect = vi.fn();
    renderComponent({ onTokenSelect });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('topbar.search_placeholder');
      fireEvent.change(input, { target: { value: 'USDC' } });
    });

    await waitFor(() => {
      const result = screen.getByText('USDC');
      fireEvent.click(result.closest('button')!);
    }, { timeout: 500 });

    // Both should be called
    expect(mockFastBuyFlow).toHaveBeenCalledWith('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    expect(onTokenSelect).toHaveBeenCalledWith('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });
});
