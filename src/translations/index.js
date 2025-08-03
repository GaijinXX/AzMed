// Import translations directly for synchronous access
import en from './en.js';
import az from './az.js';
import ru from './ru.js';

// Keep lazy loader for future optimization
import { 
  preloadTranslations,
  LANGUAGES as LAZY_LANGUAGES 
} from './lazyLoader.js';

// Supported languages configuration
export const LANGUAGES = LAZY_LANGUAGES;

// Translation files mapping for synchronous access
const translations = {
  [LANGUAGES.EN]: en,
  [LANGUAGES.AZ]: az,
  [LANGUAGES.RU]: ru
};

export const LANGUAGE_LABELS = {
  [LANGUAGES.EN]: 'English',
  [LANGUAGES.AZ]: 'Azərbaycan',
  [LANGUAGES.RU]: 'Русский'
};

export const LANGUAGE_FLAGS = {
  [LANGUAGES.EN]: '🇺🇸',
  [LANGUAGES.AZ]: '🇦🇿',
  [LANGUAGES.RU]: '🇷🇺'
};



/**
 * Get translation for a specific language
 * @param {string} languageCode - Language code (en, az, ru)
 * @returns {Object} Translation object
 */
export const getTranslations = (languageCode) => {
  // Validate language code
  if (!languageCode || typeof languageCode !== 'string') {
    console.warn('Invalid language code provided, falling back to English');
    return translations[LANGUAGES.EN];
  }

  const normalizedCode = languageCode.toLowerCase();
  
  // Check if language is supported
  if (!Object.values(LANGUAGES).includes(normalizedCode)) {
    console.warn(`Unsupported language code: ${languageCode}, falling back to English`);
    return translations[LANGUAGES.EN];
  }

  return translations[normalizedCode] || translations[LANGUAGES.EN];
};

/**
 * Get nested translation value by key path
 * @param {Object} translations - Translation object
 * @param {string} keyPath - Dot-separated key path (e.g., 'common.search')
 * @param {string} fallbackLanguage - Fallback language code
 * @returns {string} Translation value or fallback
 */
export const getTranslationByKey = (translations, keyPath, fallbackLanguage = LANGUAGES.EN) => {
  if (!keyPath) {
    return '';
  }
  
  // Convert non-string keyPath to string
  if (typeof keyPath !== 'string') {
    return String(keyPath);
  }

  const keys = keyPath.split('.');
  let value = translations;

  // Navigate through nested object
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      value = undefined;
      break;
    }
  }

  // If translation found and is string, return it
  if (typeof value === 'string') {
    return value;
  }

  // Fallback to English if current language failed
  if (fallbackLanguage !== LANGUAGES.EN) {
    const fallbackTranslations = getTranslations(fallbackLanguage);
    const fallbackValue = getTranslationByKey(fallbackTranslations, keyPath, LANGUAGES.EN);
    if (fallbackValue !== keyPath) {
      console.warn(`Translation missing for key: ${keyPath}, using fallback`);
      return fallbackValue;
    }
  }

  // Final fallback: return the key path itself
  console.warn(`Translation missing for key: ${keyPath}, returning key as fallback`);
  return keyPath;
};

/**
 * Check if a language code is supported
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if supported
 */
export const isLanguageSupported = (languageCode) => {
  if (!languageCode || typeof languageCode !== 'string') {
    return false;
  }
  return Object.values(LANGUAGES).includes(languageCode.toLowerCase());
};

/**
 * Get default language
 * @returns {string} Default language code
 */
export const getDefaultLanguage = () => LANGUAGES.EN;

/**
 * Get all supported languages as array
 * @returns {Array} Array of language objects with code, label, and flag
 */
export const getSupportedLanguages = () => {
  return Object.values(LANGUAGES).map(code => ({
    code,
    label: LANGUAGE_LABELS[code],
    flag: LANGUAGE_FLAGS[code]
  }));
};

/**
 * Check if translation is loaded and available
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if available
 */
export const isTranslationLoaded = (languageCode) => {
  if (!languageCode || typeof languageCode !== 'string') {
    return false;
  }
  return Object.values(LANGUAGES).includes(languageCode.toLowerCase());
};

// Re-export preloadTranslations from lazyLoader
export { preloadTranslations };

// Language detection utilities are available directly from:
// import { detectBrowserLanguage, getInitialLanguage } from '../utils/languageDetection.js';