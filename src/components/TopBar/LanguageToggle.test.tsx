import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageToggle } from './LanguageToggle';
import { I18nProvider } from '../../contexts/I18nContext';

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

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>
    );
  };

  it('renders the language toggle button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('displays the current language', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('language.en')).toBeInTheDocument();
    });
  });

  it('opens dropdown when clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('language.zh-CN')).toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('language.zh-CN')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('language.zh-CN')).not.toBeInTheDocument();
    });
  });

  it('changes language when option is selected', async () => {
    const { translationService } = await import('../../services/TranslationService');
    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    await waitFor(() => {
      const zhOption = screen.getByText('language.zh-CN');
      fireEvent.click(zhOption);
    });

    await waitFor(() => {
      expect(translationService.setLanguage).toHaveBeenCalledWith('zh-CN');
    });
  });

  it('highlights the current language in dropdown', async () => {
    renderComponent();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // Find the button with the current language in the dropdown
      const enButton = buttons.find(btn => 
        btn.textContent === 'language.en' && btn.className.includes('bg-accent-blue/20')
      );
      expect(enButton).toBeDefined();
    });
  });

  it('rotates chevron icon when dropdown is open', async () => {
    renderComponent();
    
    const button = await waitFor(() => screen.getByRole('button'));
    const chevron = button.querySelector('svg:last-child');
    
    expect(chevron).not.toHaveClass('rotate-180');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(chevron).toHaveClass('rotate-180');
    });
  });
});
