/**
 * Browser language detection utility
 * Detects user's preferred language from browser settings
 */

// Define language constants locally to avoid circular imports
const LANGUAGES = {
  EN: 'en',
  AZ: 'az',
  RU: 'ru'
};

/**
 * Check if a language code is supported
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if supported
 */
const isLanguageSupported = (languageCode) => {
  if (!languageCode || typeof languageCode !== 'string') {
    return false;
  }
  return Object.values(LANGUAGES).includes(languageCode.toLowerCase());
};

/**
 * Language mapping for special cases
 * Maps browser language codes to our supported languages
 */
const LANGUAGE_MAPPING = {
  // Turkish -> Azeri (as requested)
  'tr': LANGUAGES.AZ,
  'tr-TR': LANGUAGES.AZ,
  
  // Russian variants
  'ru': LANGUAGES.RU,
  'ru-RU': LANGUAGES.RU,
  
  // English variants
  'en': LANGUAGES.EN,
  'en-US': LANGUAGES.EN,
  'en-GB': LANGUAGES.EN,
  'en-CA': LANGUAGES.EN,
  'en-AU': LANGUAGES.EN,
  
  // Azeri variants
  'az': LANGUAGES.AZ,
  'az-AZ': LANGUAGES.AZ,
  'az-Latn': LANGUAGES.AZ,
  'az-Latn-AZ': LANGUAGES.AZ
};

/**
 * Get user's preferred language from browser
 * @returns {string} Detected language code or default language
 */
export const detectBrowserLanguage = () => {
  try {
    // Check if we're in a browser environment
    if (typeof navigator === 'undefined') {
      return LANGUAGES.EN;
    }

    // Get browser languages in order of preference
    const browserLanguages = navigator.languages || [navigator.language];
    
    // Try each browser language in order
    for (const browserLang of browserLanguages) {
      if (!browserLang) continue;
      
      const normalizedLang = browserLang.toLowerCase();
      
      // Check exact match in mapping
      if (LANGUAGE_MAPPING[normalizedLang]) {
        return LANGUAGE_MAPPING[normalizedLang];
      }
      
      // Check language code without region (e.g., 'en' from 'en-US')
      const langCode = normalizedLang.split('-')[0];
      if (LANGUAGE_MAPPING[langCode]) {
        return LANGUAGE_MAPPING[langCode];
      }
      
      // Check if it's directly supported
      if (isLanguageSupported(langCode)) {
        return langCode;
      }
    }
    
    // Fallback to English if no match found
    return LANGUAGES.EN;
    
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
    return LANGUAGES.EN;
  }
};

/**
 * Get initial language preference
 * Checks localStorage first, then browser detection, then default
 * @param {string} storageKey - localStorage key for saved preference
 * @returns {string} Initial language code
 */
export const getInitialLanguage = (storageKey) => {
  try {
    // First check if user has a saved preference
    if (typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem(storageKey);
      if (savedLanguage && isLanguageSupported(savedLanguage)) {
        return savedLanguage;
      }
    }
    
    // If no saved preference, detect from browser
    const detectedLanguage = detectBrowserLanguage();
    
    console.log(`Detected browser language: ${detectedLanguage}`);
    
    return detectedLanguage;
    
  } catch (error) {
    console.warn('Failed to get initial language:', error);
    return LANGUAGES.EN;
  }
};

/**
 * Get browser language info for debugging
 * @returns {Object} Browser language information
 */
export const getBrowserLanguageInfo = () => {
  try {
    if (typeof navigator === 'undefined') {
      return { available: false, reason: 'Not in browser environment' };
    }
    
    return {
      available: true,
      language: navigator.language,
      languages: navigator.languages || [],
      detected: detectBrowserLanguage(),
      mapping: LANGUAGE_MAPPING
    };
    
  } catch (error) {
    return { 
      available: false, 
      reason: error.message,
      detected: LANGUAGES.EN 
    };
  }
};

/**
 * Check if browser language detection is supported
 * @returns {boolean} True if detection is supported
 */
export const isBrowserLanguageDetectionSupported = () => {
  try {
    return typeof navigator !== 'undefined' && 
           (navigator.language || navigator.languages);
  } catch (error) {
    return false;
  }
};