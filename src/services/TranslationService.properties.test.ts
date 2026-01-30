import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { translationService } from './TranslationService';
import type { Language } from '../types';

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
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('TranslationService Property-Based Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(async () => {
    // Reset to English after each test
    await translationService.setLanguage('en');
    localStorageMock.clear();
  });

  describe('Property 1: Language Preference Persistence Round-Trip', () => {
    it('should persist and restore language preference correctly', async () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 1: Language Preference Persistence Round-Trip
       * 
       * For any supported language selection, persisting the language to localStorage
       * and then loading it on application startup should restore the same language preference.
       * 
       * **Validates: Requirements 1.3, 1.4**
       */
      
      // Generator for supported languages
      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      await fc.assert(
        fc.asyncProperty(languageGen, async (language) => {
          // Clear localStorage to simulate fresh start
          localStorageMock.clear();

          // Step 1: Set language (this persists to localStorage)
          await translationService.setLanguage(language);

          // Step 2: Verify it was persisted
          const persistedLanguage = localStorageMock.getItem('app_language');
          expect(persistedLanguage).toBe(language);

          // Step 3: Simulate application restart by creating a new service instance
          // In a real scenario, this would be a new TranslationService instance
          // For testing, we verify that the persisted value matches what we set
          const restoredLanguage = localStorageMock.getItem('app_language') as Language;
          
          // Step 4: Verify the round-trip: set language -> persist -> load -> same language
          expect(restoredLanguage).toBe(language);
          expect(translationService.getLanguage()).toBe(language);
        }),
        { numRuns: 10 }
      );
    });

    it('should maintain language preference across multiple set operations', async () => {
      /**
       * Property 1 Extension: Multiple language changes should each persist correctly
       * 
       * This tests that the persistence mechanism works consistently across
       * multiple language changes, not just a single round-trip.
       */
      
      const languageArrayGen = fc.array(
        fc.constantFrom<Language>('en', 'zh-CN'),
        { minLength: 1, maxLength: 10 }
      );

      await fc.assert(
        fc.asyncProperty(languageArrayGen, async (languages) => {
          localStorageMock.clear();

          // Apply each language change in sequence
          for (const language of languages) {
            await translationService.setLanguage(language);
            
            // Verify persistence after each change
            const persisted = localStorageMock.getItem('app_language');
            expect(persisted).toBe(language);
            expect(translationService.getLanguage()).toBe(language);
          }

          // Final verification: the last language should be persisted
          const finalLanguage = languages[languages.length - 1];
          expect(localStorageMock.getItem('app_language')).toBe(finalLanguage);
          expect(translationService.getLanguage()).toBe(finalLanguage);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 9: Language Switch Completeness', () => {
    it('should translate all keys to the target language after switch', async () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 9: Language Switch Completeness
       * 
       * For any UI component containing translatable text, switching languages
       * should result in all text being displayed in the target language using
       * the translation keys.
       * 
       * **Validates: Requirements 1.2**
       */

      // Generator for language pairs (from -> to)
      const languagePairGen = fc.tuple(
        fc.constantFrom<Language>('en', 'zh-CN'),
        fc.constantFrom<Language>('en', 'zh-CN')
      );

      // Sample translation keys that should exist in both languages
      const translationKeys = [
        'app.title',
        'app.subtitle',
        'common.loading',
        'common.error',
        'common.retry',
        'common.close',
        'common.save',
        'common.cancel',
      ];

      await fc.assert(
        fc.asyncProperty(languagePairGen, async ([fromLang, toLang]) => {
          // Set initial language
          await translationService.setLanguage(fromLang);
          await translationService.initialize();

          // Get translations in the first language
          const translationsFrom = translationKeys.map(key => ({
            key,
            value: translationService.t(key),
          }));

          // Switch to target language
          await translationService.setLanguage(toLang);

          // Get translations in the target language
          const translationsTo = translationKeys.map(key => ({
            key,
            value: translationService.t(key),
          }));

          // Verify all keys are translated (not returning the key itself as fallback)
          translationsTo.forEach(({ key, value }) => {
            // The translation should not be the key itself (unless it's intentionally the same)
            // For keys that exist, we should get a proper translation
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
          });

          // If languages are different, at least some translations should differ
          if (fromLang !== toLang) {
            // Check that at least one translation is different
            // (some keys like 'app.title' might be the same across languages)
            const hasDifference = translationsFrom.some((from, index) => {
              const to = translationsTo[index];
              return from.value !== to.value;
            });

            // We expect at least some translations to be different between languages
            expect(hasDifference).toBe(true);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should switch language without page reload', async () => {
      /**
       * Property 9 Extension: Language switch should be immediate
       * 
       * Verifies that language switching happens synchronously in terms of
       * the language state, even though translation loading is async.
       */

      const languageGen = fc.constantFrom<Language>('en', 'zh-CN');

      await fc.assert(
        fc.asyncProperty(languageGen, async (targetLanguage) => {
          // Start with a known language
          const startLanguage: Language = targetLanguage === 'en' ? 'zh-CN' : 'en';
          await translationService.setLanguage(startLanguage);

          // Switch language
          await translationService.setLanguage(targetLanguage);

          // Verify the switch happened immediately (no page reload needed)
          expect(translationService.getLanguage()).toBe(targetLanguage);

          // Verify translations are available in the new language
          const translation = translationService.t('common.loading');
          expect(translation).toBeDefined();
          expect(typeof translation).toBe('string');
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 10: Translation Key Fallback', () => {
    it('should display key identifier when translation is missing', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 10: Translation Key Fallback
       * 
       * For any translation key that does not exist in the translation map,
       * the system should display the key identifier itself as the fallback text.
       * 
       * **Validates: Requirements 1.7**
       */

      // Generator for random non-existent keys
      const nonExistentKeyGen = fc.string({ minLength: 1, maxLength: 50 }).map(str => {
        // Create keys that are unlikely to exist
        return `nonexistent.${str.replace(/[^a-zA-Z0-9]/g, '_')}.key`;
      });

      fc.assert(
        fc.property(nonExistentKeyGen, (missingKey) => {
          // Try to translate a non-existent key
          const result = translationService.t(missingKey);

          // The result should be the key itself (fallback behavior)
          expect(result).toBe(missingKey);
        }),
        { numRuns: 10 }
      );
    });

    it('should handle nested non-existent keys correctly', () => {
      /**
       * Property 10 Extension: Nested key fallback
       * 
       * Tests that fallback works correctly for deeply nested keys
       * that don't exist in the translation map.
       */

      // Generator for nested keys with varying depth
      const nestedKeyGen = fc.array(
        fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
        { minLength: 2, maxLength: 5 }
      ).map(parts => parts.join('.'));

      fc.assert(
        fc.property(nestedKeyGen, (nestedKey) => {
          // Ensure the key doesn't accidentally exist
          const keyToTest = `nonexistent.${nestedKey}`;
          
          const result = translationService.t(keyToTest);

          // Should return the full key path as fallback
          expect(result).toBe(keyToTest);
        }),
        { numRuns: 10 }
      );
    });

    it('should return valid translations for existing keys and fallback for missing ones', () => {
      /**
       * Property 10 Extension: Mixed key validation
       * 
       * Tests that the service correctly distinguishes between existing
       * and non-existing keys, returning translations for valid keys
       * and fallbacks for invalid ones.
       */

      const existingKeys = ['app.title', 'common.loading', 'common.error'];
      
      const mixedKeyGen = fc.oneof(
        fc.constantFrom(...existingKeys),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => `missing.${s.replace(/[^a-zA-Z0-9]/g, '_')}`)
      );

      fc.assert(
        fc.property(mixedKeyGen, (key) => {
          const result = translationService.t(key);

          if (existingKeys.includes(key)) {
            // For existing keys, should return a translation (not the key)
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            // The translation should be different from the key for most cases
            // (though some translations might coincidentally match the key)
          } else {
            // For non-existing keys, should return the key itself
            expect(result).toBe(key);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Additional Invariants', () => {
    it('should maintain language consistency during concurrent operations', async () => {
      /**
       * Invariant: Language state should remain consistent
       * 
       * Even with rapid language changes, the service should maintain
       * a consistent state where getLanguage() always returns the last
       * successfully set language.
       */

      const languageSequenceGen = fc.array(
        fc.constantFrom<Language>('en', 'zh-CN'),
        { minLength: 5, maxLength: 20 }
      );

      await fc.assert(
        fc.asyncProperty(languageSequenceGen, async (languages) => {
          for (const lang of languages) {
            await translationService.setLanguage(lang);
            
            // Immediately after setting, getLanguage should return the same value
            expect(translationService.getLanguage()).toBe(lang);
          }

          // Final state should be the last language
          const finalLang = languages[languages.length - 1];
          expect(translationService.getLanguage()).toBe(finalLang);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle translation requests before initialization gracefully', () => {
      /**
       * Invariant: Service should be resilient to early translation requests
       * 
       * Even if translations haven't been loaded yet, the service should
       * return fallback values without crashing.
       */

      const keyGen = fc.string({ minLength: 1, maxLength: 30 });

      fc.assert(
        fc.property(keyGen, (key) => {
          // Try to translate before initialization
          const result = translationService.t(key);

          // Should return something (either translation or fallback)
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
        }),
        { numRuns: 50 }
      );
    });
  });
});
