import React, { createContext, useContext, useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { 
  getTranslations, 
  getTranslationByKey, 
  isLanguageSupported, 
  getDefaultLanguage,
  LANGUAGES 
} from '../translations/index.js';
import { useOptimizedUpdates } from '../hooks/useReact19Optimizations.js';
import { getInitialLanguage, getBrowserLanguageInfo } from '../utils/languageDetection.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../constants/languages.js';

// Create the context
const LanguageContext = createContext({
  currentLanguage: getDefaultLanguage(),
  setLanguage: () => {},
  t: () => '',
  isLoading: false,
  error: null
});

/**
 * LanguageProvider component that manages language state and persistence
 * Optimized with React 19 concurrent features for smooth language switching
 */
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getDefaultLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const { batchUpdate } = useOptimizedUpdates();

  // Load language preference with browser detection on mount
  useEffect(() => {
    try {
      // Use the new detection utility that checks localStorage first, then browser
      const initialLanguage = getInitialLanguage(LANGUAGE_STORAGE_KEY);
      
      // Log browser language info for debugging
      const browserInfo = getBrowserLanguageInfo();
      if (browserInfo.available) {
        console.log('Browser language detection:', {
          detected: browserInfo.detected,
          browserLanguage: browserInfo.language,
          browserLanguages: browserInfo.languages,
          selectedLanguage: initialLanguage
        });
      }
      
      setCurrentLanguage(initialLanguage);
      
      // If this is a detected language (not from localStorage), save it
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (!savedLanguage && initialLanguage !== getDefaultLanguage()) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, initialLanguage);
        console.log(`Auto-detected and saved language: ${initialLanguage}`);
      }
      
    } catch (err) {
      console.error('Failed to initialize language:', err);
      setError('Failed to initialize language');
      setCurrentLanguage(getDefaultLanguage());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to change language with persistence and React 19 optimizations
  const setLanguage = useCallback((languageCode) => {
    try {
      // Validate language code
      if (!isLanguageSupported(languageCode)) {
        console.error(`Unsupported language: ${languageCode}`);
        setError(`Unsupported language: ${languageCode}`);
        return false;
      }

      // Use React 19 concurrent features for smooth language switching
      startTransition(() => {
        batchUpdate(() => {
          // Clear any previous errors
          setError(null);
          
          // Update state
          setCurrentLanguage(languageCode);
        }, 'language-change');
      });
      
      // Persist to localStorage (immediate, not in transition)
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      
      return true;
    } catch (err) {
      console.error('Failed to set language:', err);
      setError('Failed to change language');
      return false;
    }
  }, [batchUpdate]);

  // Memoized translation cache for performance
  const translationCache = useMemo(() => new Map(), []);

  // Optimized translation function with caching
  const t = useCallback((keyPath, fallbackValue = null) => {
    try {
      // Check cache first
      const cacheKey = `${currentLanguage}:${keyPath}`;
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
      }

      const translations = getTranslations(currentLanguage);
      const translation = getTranslationByKey(translations, keyPath, LANGUAGES.EN);
      
      // If we have a fallback value and translation equals the key (meaning not found)
      const result = (fallbackValue && translation === keyPath) ? fallbackValue : translation;
      
      // Cache the result
      translationCache.set(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error(`Translation error for key: ${keyPath}`, err);
      return fallbackValue || keyPath;
    }
  }, [currentLanguage, translationCache]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t,
    isLoading,
    error,
    isPending, // React 19 transition state
    // Additional utility functions
    isRTL: false, // Future RTL support
    supportedLanguages: Object.values(LANGUAGES),
    // Performance utilities
    clearTranslationCache: () => translationCache.clear()
  }), [currentLanguage, setLanguage, t, isLoading, error, isPending, translationCache]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use the LanguageContext
 * Must be used within a LanguageProvider
 */
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;