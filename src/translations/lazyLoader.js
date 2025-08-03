/**
 * Lazy loading utility for translation files with React 19 optimizations
 * Implements dynamic imports, caching, and bundle optimization
 */

// Translation cache for loaded files
const translationCache = new Map();
const loadingPromises = new Map();

// Supported languages configuration
export const LANGUAGES = {
  EN: 'en',
  AZ: 'az',
  RU: 'ru'
};

/**
 * Lazy load translation file with caching
 * @param {string} languageCode - Language code to load
 * @returns {Promise<Object>} Translation object
 */
export const loadTranslation = async (languageCode) => {
  // Return cached translation if available
  if (translationCache.has(languageCode)) {
    return translationCache.get(languageCode);
  }

  // Return existing loading promise if in progress
  if (loadingPromises.has(languageCode)) {
    return loadingPromises.get(languageCode);
  }

  // Create loading promise
  const loadingPromise = (async () => {
    try {
      let translationModule;
      
      // Dynamic import based on language code
      switch (languageCode) {
        case LANGUAGES.EN:
          translationModule = await import('./en.js');
          break;
        case LANGUAGES.AZ:
          translationModule = await import('./az.js');
          break;
        case LANGUAGES.RU:
          translationModule = await import('./ru.js');
          break;
        default:
          console.warn(`Unsupported language: ${languageCode}, falling back to English`);
          translationModule = await import('./en.js');
      }

      const translation = translationModule.default;
      
      // Cache the loaded translation
      translationCache.set(languageCode, translation);
      
      // Clean up loading promise
      loadingPromises.delete(languageCode);
      
      return translation;
    } catch (error) {
      console.error(`Failed to load translation for ${languageCode}:`, error);
      
      // Clean up loading promise
      loadingPromises.delete(languageCode);
      
      // Fallback to English if not already trying to load English
      if (languageCode !== LANGUAGES.EN) {
        return loadTranslation(LANGUAGES.EN);
      }
      
      // Return empty object as last resort
      return {};
    }
  })();

  // Store loading promise
  loadingPromises.set(languageCode, loadingPromise);
  
  return loadingPromise;
};

/**
 * Preload translation files for better performance
 * @param {string[]} languageCodes - Array of language codes to preload
 * @returns {Promise<void>}
 */
export const preloadTranslations = async (languageCodes = Object.values(LANGUAGES)) => {
  const preloadPromises = languageCodes.map(code => {
    // Only preload if not already cached or loading
    if (!translationCache.has(code) && !loadingPromises.has(code)) {
      return loadTranslation(code);
    }
    return Promise.resolve();
  });

  try {
    await Promise.all(preloadPromises);
    console.log('Translation preloading completed');
  } catch (error) {
    console.warn('Some translations failed to preload:', error);
  }
};

/**
 * Get cached translation or load if needed
 * @param {string} languageCode - Language code
 * @returns {Object|Promise<Object>} Translation object or promise
 */
export const getTranslation = (languageCode) => {
  if (translationCache.has(languageCode)) {
    return translationCache.get(languageCode);
  }
  
  // Return loading promise
  return loadTranslation(languageCode);
};

/**
 * Check if translation is cached
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if cached
 */
export const isTranslationCached = (languageCode) => {
  return translationCache.has(languageCode);
};

/**
 * Clear translation cache (useful for development/testing)
 * @param {string} [languageCode] - Specific language to clear, or all if not provided
 */
export const clearTranslationCache = (languageCode) => {
  if (languageCode) {
    translationCache.delete(languageCode);
    loadingPromises.delete(languageCode);
  } else {
    translationCache.clear();
    loadingPromises.clear();
  }
};

/**
 * Get cache statistics for monitoring
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
    cachedLanguages: Array.from(translationCache.keys()),
    loadingLanguages: Array.from(loadingPromises.keys()),
    cacheSize: translationCache.size,
    loadingCount: loadingPromises.size
  };
};

/**
 * Bundle size optimization - get only required translation keys
 * @param {Object} translation - Full translation object
 * @param {string[]} requiredKeys - Array of required key paths
 * @returns {Object} Optimized translation object
 */
export const optimizeTranslationBundle = (translation, requiredKeys = []) => {
  if (!requiredKeys.length) {
    return translation;
  }

  const optimized = {};
  
  requiredKeys.forEach(keyPath => {
    const keys = keyPath.split('.');
    let source = translation;
    let target = optimized;
    
    // Navigate and build optimized structure
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      if (i === keys.length - 1) {
        // Last key, copy value
        if (source && typeof source === 'object' && key in source) {
          target[key] = source[key];
        }
      } else {
        // Intermediate key, ensure structure exists
        if (!target[key]) {
          target[key] = {};
        }
        if (source && typeof source === 'object' && key in source) {
          source = source[key];
          target = target[key];
        } else {
          break;
        }
      }
    }
  });
  
  return optimized;
};

/**
 * Memory optimization - cleanup unused translations
 * @param {string[]} activeLanguages - Currently active languages to keep
 */
export const cleanupUnusedTranslations = (activeLanguages = []) => {
  const allLanguages = Array.from(translationCache.keys());
  
  allLanguages.forEach(lang => {
    if (!activeLanguages.includes(lang)) {
      translationCache.delete(lang);
      console.log(`Cleaned up unused translation: ${lang}`);
    }
  });
};