import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '../types';
import { translationService } from '../services/TranslationService';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18nProvider Component
 * Provides internationalization context to the entire application
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(translationService.getLanguage());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize translations on mount
  useEffect(() => {
    const initTranslations = async () => {
      setIsLoading(true);
      await translationService.initialize();
      setIsLoading(false);
    };

    initTranslations();
  }, []);

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = translationService.subscribe(() => {
      setLanguageState(translationService.getLanguage());
    });

    return unsubscribe;
  }, []);

  const setLanguage = async (lang: Language) => {
    setIsLoading(true);
    await translationService.setLanguage(lang);
    setIsLoading(false);
  };

  const t = (key: string, params?: Record<string, any>) => {
    return translationService.t(key, params);
  };

  const value: I18nContextValue = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * useTranslation Hook
 * Custom hook to access translation functionality in components
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  return context;
}
