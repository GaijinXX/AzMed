import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 5;
const MAX_SEARCH_LENGTH = 100;
const DEBOUNCE_DELAY = 300; // Debounce localStorage writes

/**
 * Custom hook for managing recent searches with localStorage persistence
 * Provides functionality to add, remove, and clear recent search terms
 * 
 * @returns {Object} Recent searches utilities
 */
export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceTimeoutRef = useRef(null);

  /**
   * Safely parse JSON from localStorage
   * @param {string} value - JSON string to parse
   * @returns {Array} Parsed array or empty array on error
   */
  const safeParseJSON = useCallback((value) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Safely write to localStorage with error handling and debouncing
   * @param {Array} searches - Array of search terms to store
   * @returns {boolean} Success status
   */
  const safeWriteToStorage = useCallback((searches) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
      return true;
    } catch (error) {
      // Handle quota exceeded or access denied
      if (error.name === 'QuotaExceededError') {
        // Try to clear some space by removing oldest searches
        try {
          const reducedSearches = searches.slice(0, Math.max(1, Math.floor(MAX_RECENT_SEARCHES / 2)));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedSearches));
          setError('Storage quota exceeded. Some recent searches were removed.');
          return true;
        } catch {
          setError('Storage quota exceeded. Unable to save recent searches.');
          return false;
        }
      } else {
        setError('Unable to access browser storage. Recent searches will not persist.');
        return false;
      }
    }
  }, []);

  /**
   * Debounced write to localStorage for better performance
   * @param {Array} searches - Array of search terms to store
   */
  const debouncedWriteToStorage = useCallback((searches) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      safeWriteToStorage(searches);
    }, DEBOUNCE_DELAY);
  }, [safeWriteToStorage]);

  /**
   * Load recent searches from localStorage
   */
  const loadRecentSearches = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const searches = safeParseJSON(stored);
        // Filter out invalid entries and ensure uniqueness
        const validSearches = searches
          .filter(search => typeof search === 'string' && search.trim().length > 0)
          .slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(validSearches);
      } else {
        setRecentSearches([]);
      }
    } catch (error) {
      setError('Unable to load recent searches from storage.');
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [safeParseJSON]);

  /**
   * Add a new search term to recent searches
   * @param {string} searchTerm - Search term to add
   */
  const addRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return;
    }

    const trimmedTerm = searchTerm.trim();
    
    // Ignore empty or whitespace-only searches
    if (trimmedTerm.length === 0) {
      return;
    }

    // Truncate if too long
    const finalTerm = trimmedTerm.length > MAX_SEARCH_LENGTH 
      ? trimmedTerm.substring(0, MAX_SEARCH_LENGTH)
      : trimmedTerm;

    setRecentSearches(prevSearches => {
      // Remove existing occurrence (deduplication)
      const filteredSearches = prevSearches.filter(search => search !== finalTerm);
      
      // Add to beginning and limit to MAX_RECENT_SEARCHES
      const newSearches = [finalTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage with debouncing
      debouncedWriteToStorage(newSearches);
      
      return newSearches;
    });
  }, [safeWriteToStorage]);

  /**
   * Remove a specific search term from recent searches
   * @param {string} searchTerm - Search term to remove
   */
  const removeRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return;
    }

    setRecentSearches(prevSearches => {
      const newSearches = prevSearches.filter(search => search !== searchTerm);
      debouncedWriteToStorage(newSearches);
      return newSearches;
    });
  }, [safeWriteToStorage]);

  /**
   * Clear all recent searches
   */
  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setError('Unable to clear recent searches from storage.');
    }
  }, []);

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  const checkStorageAvailability = useCallback(() => {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }, []);

  const [isStorageAvailable] = useState(() => checkStorageAvailability());

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    recentSearches,
    isLoading,
    error,
    
    // Actions
    addRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
    
    // Utilities
    isStorageAvailable,
    hasRecentSearches: recentSearches.length > 0,
    
    // Constants (useful for testing)
    maxRecentSearches: MAX_RECENT_SEARCHES,
    storageKey: STORAGE_KEY
  };
};

export default useRecentSearches;