import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nProvider, useTranslation } from './I18nContext';
import { act } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the translation hook
function TestComponent() {
  const { t, language, setLanguage, isLoading } = useTranslation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="translation">{t('app.title')}</div>
      <button onClick={() => setLanguage('zh-CN')} data-testid="change-lang">
        Change Language
      </button>
    </div>
  );
}

describe('I18nContext', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    // Reset to English before each test
    localStorageMock.setItem('app_language', 'en');
    // Import and reset the translation service
    const { translationService } = await import('../services/TranslationService');
    await translationService.setLanguage('en');
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('I18nProvider', () => {
    it('should provide translation context to children', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Wait for translations to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('language')).toHaveTextContent('en');
      expect(screen.getByTestId('translation')).toHaveTextContent('Alpha Hunter');
    });

    it('should allow language changes', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Change language
      const button = screen.getByTestId('change-lang');
      await act(async () => {
        button.click();
      });

      // Wait for language change
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('zh-CN');
      });
    });

    it('should show loading state during initialization', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('useTranslation hook', () => {
    it('should throw error when used outside I18nProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTranslation must be used within an I18nProvider');

      console.error = originalError;
    });

    it('should provide t function for translations', async () => {
      function TranslationTestComponent() {
        const { t, isLoading } = useTranslation();

        if (isLoading) return <div data-testid="loading-state">Loading...</div>;

        return (
          <div>
            <div data-testid="title">{t('app.title')}</div>
            <div data-testid="subtitle">{t('app.subtitle')}</div>
            <div data-testid="loading">{t('common.loading')}</div>
          </div>
        );
      }

      render(
        <I18nProvider>
          <TranslationTestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('title')).toHaveTextContent('Alpha Hunter');
      expect(screen.getByTestId('subtitle')).toHaveTextContent('Crypto Discovery Platform');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    });

    it('should provide current language', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });

    it('should provide setLanguage function', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const button = screen.getByTestId('change-lang');
      
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('zh-CN');
      });
    });
  });

  describe('Language persistence', () => {
    it('should persist language changes to localStorage', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const button = screen.getByTestId('change-lang');
      
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('app_language')).toBe('zh-CN');
      });
    });
  });
});
