import type { Language, TranslationMap } from '../types';

/**
 * Translation Service
 * Handles loading and managing translations for the application
 */
class TranslationService {
  private translations: Record<Language, TranslationMap> = {
    en: {},
    'zh-CN': {},
  };
  
  private currentLanguage: Language = 'en';
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('app_language') as Language | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh-CN')) {
      this.currentLanguage = savedLanguage;
    }
  }

  /**
   * Load translations for a specific language
   */
  async loadTranslations(lang: Language): Promise<TranslationMap> {
    try {
      // Load all translation files for the language
      const [common, widgets, errors] = await Promise.all([
        import(`../locales/${lang}/common.json`),
        import(`../locales/${lang}/widgets.json`),
        import(`../locales/${lang}/errors.json`),
      ]);

      // Merge all translation files
      const translations: TranslationMap = {
        ...common.default,
        widgets: widgets.default,
        errors: errors.default,
      };

      this.translations[lang] = translations;
      return translations;
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      return {};
    }
  }

  /**
   * Get the current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Set the current language and persist to localStorage
   */
  async setLanguage(lang: Language): Promise<void> {
    if (lang !== 'en' && lang !== 'zh-CN') {
      console.warn(`Invalid language: ${lang}. Defaulting to 'en'.`);
      lang = 'en';
    }

    this.currentLanguage = lang;
    
    // Persist to localStorage
    localStorage.setItem('app_language', lang);

    // Load translations if not already loaded
    if (Object.keys(this.translations[lang]).length === 0) {
      await this.loadTranslations(lang);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Translate a key to the current language
   * Supports nested keys using dot notation (e.g., "app.title")
   * Supports interpolation with params (e.g., t("greeting", { name: "John" }))
   */
  t(key: string, params?: Record<string, any>): string {
    const translation = this.getNestedTranslation(key, this.currentLanguage);
    
    // If translation not found, return the key as fallback
    if (translation === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Handle interpolation
    if (params && typeof translation === 'string') {
      return this.interpolate(translation, params);
    }

    return translation as string;
  }

  /**
   * Get nested translation using dot notation
   */
  private getNestedTranslation(key: string, lang: Language): string | null {
    const keys = key.split('.');
    let current: any = this.translations[lang];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate parameters into translation string
   * Example: interpolate("Hello {name}", { name: "John" }) => "Hello John"
   */
  private interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Subscribe to language changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of language change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Initialize the service by loading translations for current language
   */
  async initialize(): Promise<void> {
    await this.loadTranslations(this.currentLanguage);
  }
}

// Export singleton instance
export const translationService = new TranslationService();
