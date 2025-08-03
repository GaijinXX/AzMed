import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  getTranslations,
  getTranslationByKey,
  isLanguageSupported,
  getDefaultLanguage,
  getSupportedLanguages
} from '../index.js';

describe('Translation utilities', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constants', () => {
    it('should export correct language constants', () => {
      expect(LANGUAGES).toEqual({
        EN: 'en',
        AZ: 'az',
        RU: 'ru'
      });

      expect(LANGUAGE_LABELS).toEqual({
        en: 'English',
        az: 'Azərbaycan',
        ru: 'Русский'
      });

      expect(LANGUAGE_FLAGS).toEqual({
        en: '🇺🇸',
        az: '🇦🇿',
        ru: '🇷🇺'
      });
    });
  });

  describe('getTranslations', () => {
    it('should return English translations for valid English code', () => {
      const translations = getTranslations('en');
      expect(translations.common.search).toBe('Search');
      expect(translations.header.title).toBe('Azerbaijan Drug Database');
    });

    it('should return Azeri translations for valid Azeri code', () => {
      const translations = getTranslations('az');
      expect(translations.common.search).toBe('Axtarış');
      expect(translations.header.title).toBe('Azərbaycan Dərman Bazası');
    });

    it('should return Russian translations for valid Russian code', () => {
      const translations = getTranslations('ru');
      expect(translations.common.search).toBe('Поиск');
      expect(translations.header.title).toBe('База данных лекарств Азербайджана');
    });

    it('should handle case insensitive language codes', () => {
      const translations = getTranslations('EN');
      expect(translations.common.search).toBe('Search');
    });

    it('should fallback to English for invalid language code', () => {
      const translations = getTranslations('invalid');
      expect(translations.common.search).toBe('Search');
      expect(console.warn).toHaveBeenCalledWith('Unsupported language code: invalid, falling back to English');
    });

    it('should fallback to English for null/undefined language code', () => {
      const translations1 = getTranslations(null);
      const translations2 = getTranslations(undefined);
      
      expect(translations1.common.search).toBe('Search');
      expect(translations2.common.search).toBe('Search');
      expect(console.warn).toHaveBeenCalledWith('Invalid language code provided, falling back to English');
    });

    it('should fallback to English for non-string language code', () => {
      const translations = getTranslations(123);
      expect(translations.common.search).toBe('Search');
      expect(console.warn).toHaveBeenCalledWith('Invalid language code provided, falling back to English');
    });
  });

  describe('getTranslationByKey', () => {
    it('should return correct translation for valid key path', () => {
      const translations = getTranslations('en');
      const result = getTranslationByKey(translations, 'common.search');
      expect(result).toBe('Search');
    });

    it('should return correct translation for nested key path', () => {
      const translations = getTranslations('en');
      const result = getTranslationByKey(translations, 'table.headers.product_name');
      expect(result).toBe('Product Name');
    });

    it('should return key path for missing translation', () => {
      const translations = getTranslations('en');
      const result = getTranslationByKey(translations, 'nonexistent.key');
      expect(result).toBe('nonexistent.key');
      expect(console.warn).toHaveBeenCalledWith('Translation missing for key: nonexistent.key, returning key as fallback');
    });

    it('should fallback to English for missing translation in other language', () => {
      const translations = getTranslations('az');
      // Simulate missing translation by using a key that doesn't exist
      const result = getTranslationByKey(translations, 'missing.key', 'en');
      expect(result).toBe('missing.key');
    });

    it('should handle invalid key path', () => {
      const translations = getTranslations('en');
      const result1 = getTranslationByKey(translations, null);
      const result2 = getTranslationByKey(translations, '');
      
      expect(result1).toBe('');
      expect(result2).toBe('');
    });

    it('should handle non-string key path', () => {
      const translations = getTranslations('en');
      const result = getTranslationByKey(translations, 123);
      expect(result).toBe('123');
    });

    it('should handle partial key paths', () => {
      const translations = getTranslations('en');
      const result = getTranslationByKey(translations, 'common.nonexistent');
      expect(result).toBe('common.nonexistent');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('az')).toBe(true);
      expect(isLanguageSupported('ru')).toBe(true);
    });

    it('should handle case insensitive check', () => {
      expect(isLanguageSupported('EN')).toBe(true);
      expect(isLanguageSupported('AZ')).toBe(true);
      expect(isLanguageSupported('RU')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('fr')).toBe(false);
      expect(isLanguageSupported('de')).toBe(false);
      expect(isLanguageSupported('invalid')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isLanguageSupported(null)).toBe(false);
      expect(isLanguageSupported(undefined)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isLanguageSupported(123)).toBe(false);
      expect(isLanguageSupported({})).toBe(false);
      expect(isLanguageSupported([])).toBe(false);
    });
  });

  describe('getDefaultLanguage', () => {
    it('should return English as default language', () => {
      expect(getDefaultLanguage()).toBe('en');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages with metadata', () => {
      const languages = getSupportedLanguages();
      
      expect(languages).toHaveLength(3);
      expect(languages).toEqual([
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' }
      ]);
    });

    it('should return languages in consistent order', () => {
      const languages1 = getSupportedLanguages();
      const languages2 = getSupportedLanguages();
      
      expect(languages1).toEqual(languages2);
    });
  });
});