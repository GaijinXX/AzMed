import { useLanguageContext } from '../contexts/LanguageContext.jsx';

/**
 * Custom hook for accessing translation functionality
 * Provides a simplified interface to the language context
 * 
 * @returns {Object} Translation utilities
 */
export const useTranslation = () => {
  const {
    currentLanguage,
    setLanguage,
    t,
    isLoading,
    error,
    isRTL,
    supportedLanguages
  } = useLanguageContext();

  /**
   * Enhanced translation function with interpolation support
   * @param {string} key - Translation key (dot notation)
   * @param {Object|string} options - Interpolation values or fallback string
   * @returns {string} Translated text
   */
  const translate = (key, options = {}) => {
    // Handle simple fallback string
    if (typeof options === 'string') {
      return t(key, options);
    }

    // Get base translation
    let translation = t(key);

    // Handle interpolation if options is an object
    if (options && typeof options === 'object') {
      const { fallback, ...interpolationValues } = options;
      
      // Use fallback if translation not found
      if (translation === key && fallback) {
        translation = fallback;
      }

      // Perform interpolation
      Object.entries(interpolationValues).forEach(([placeholder, value]) => {
        const regex = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
        translation = translation.replace(regex, String(value));
      });
    }

    return translation;
  };

  /**
   * Get translation for a specific language (useful for comparisons)
   * @param {string} key - Translation key
   * @param {string} languageCode - Specific language code
   * @returns {string} Translated text in specified language
   */
  const translateFor = (key, languageCode) => {
    const { getTranslations, getTranslationByKey } = require('../translations/index.js');
    const translations = getTranslations(languageCode);
    return getTranslationByKey(translations, key);
  };

  /**
   * Check if a translation key exists
   * @param {string} key - Translation key to check
   * @returns {boolean} True if translation exists
   */
  const hasTranslation = (key) => {
    const translation = t(key);
    return translation !== key;
  };

  /**
   * Get language-specific formatting utilities
   * @returns {Object} Formatting utilities
   */
  const getFormatters = () => {
    return {
      // Number formatting based on language
      number: (value) => {
        try {
          return new Intl.NumberFormat(getLocaleCode(currentLanguage)).format(value);
        } catch {
          return String(value);
        }
      },
      
      // Date formatting based on language
      date: (date, options = {}) => {
        try {
          return new Intl.DateTimeFormat(getLocaleCode(currentLanguage), options).format(new Date(date));
        } catch {
          return String(date);
        }
      },
      
      // Currency formatting (if needed in future)
      currency: (value, currency = 'AZN') => {
        try {
          return new Intl.NumberFormat(getLocaleCode(currentLanguage), {
            style: 'currency',
            currency
          }).format(value);
        } catch {
          return `${value} ${currency}`;
        }
      }
    };
  };

  return {
    // Core translation function (alias for convenience)
    t: translate,
    translate,
    translateFor,
    hasTranslation,
    
    // Language state
    currentLanguage,
    setLanguage,
    isLoading,
    error,
    
    // Utility properties
    isRTL,
    supportedLanguages,
    
    // Formatting utilities
    formatters: getFormatters(),
    
    // Convenience methods
    isEnglish: currentLanguage === 'en',
    isAzeri: currentLanguage === 'az',
    isRussian: currentLanguage === 'ru'
  };
};

/**
 * Helper function to get locale code for Intl APIs
 * @param {string} languageCode - Language code
 * @returns {string} Locale code
 */
const getLocaleCode = (languageCode) => {
  const localeMap = {
    'en': 'en-US',
    'az': 'az-AZ',
    'ru': 'ru-RU'
  };
  
  return localeMap[languageCode] || 'en-US';
};

export default useTranslation;