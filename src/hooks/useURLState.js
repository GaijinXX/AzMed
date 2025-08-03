/**
 * useURLState Hook
 * Manages URL-based state synchronization with React 19 optimizations
 * Provides debounced URL updates and browser history integration
 */

import { useState, useEffect, useCallback, useRef, useTransition, useMemo } from 'react';
import {
  encodeStateToURL,
  decodeURLToState,
  validateState,
  isDefaultState,
  cleanURLParams,
  safeParseURLParams,
  validateURLLength,
  applyErrorRecovery,
  ERROR_RECOVERY_STRATEGIES
} from '../utils/urlStateUtils.js';

// Debounce delay for URL updates (in milliseconds)
const URL_UPDATE_DEBOUNCE_DELAY = 300;

/**
 * Custom hook for URL-based state management
 * @param {Object} initialState - Initial state configuration
 * @param {Object} options - Configuration options
 * @returns {Object} - URL state management interface
 */
export function useURLState(initialState, options = {}) {
  const {
    debounceDelay = URL_UPDATE_DEBOUNCE_DELAY,
    enableHistory = true,
    onStateChange = null,
    onError = null
  } = options;

  // React 19 transition for smooth URL updates
  const [isPending, startTransition] = useTransition();
  
  // Internal state management
  const [urlState, setURLState] = useState(() => {
    // Initialize from URL if available, otherwise use provided initial state
    const currentParams = safeParseURLParams(window.location.search);
    const urlDecodedState = decodeURLToState(currentParams);
    const mergedState = { ...initialState, ...urlDecodedState };
    return validateState(mergedState);
  });

  // Refs for managing debounced updates and preventing memory leaks
  const debounceTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastURLRef = useRef(window.location.href);
  const stateHistoryRef = useRef([]);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Memoized URL validation to prevent unnecessary recalculations
  const urlValidation = useMemo(() => {
    const params = encodeStateToURL(urlState);
    const testURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    return validateURLLength(testURL);
  }, [urlState]);

  /**
   * Updates the browser URL with current state
   * @param {Object} newState - State to encode in URL
   * @param {boolean} replace - Whether to replace current history entry
   */
  const updateBrowserURL = useCallback((newState, replace = false) => {
    if (!isMountedRef.current) {
      return;
    }

    try {
      const params = encodeStateToURL(newState);
      const cleanParams = cleanURLParams(params);
      
      // Construct URL manually to avoid double encoding from URLSearchParams.toString()
      const paramPairs = [];
      for (const [key, value] of cleanParams.entries()) {
        paramPairs.push(`${key}=${value}`);
      }
      const queryString = paramPairs.join('&');
      
      const newURL = queryString 
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      // Validate URL length
      const fullURL = `${window.location.origin}${newURL}`;
      const validation = validateURLLength(fullURL);
      
      if (!validation.isValid) {
        console.warn('URL too long, applying recovery strategy');
        const recoveredState = applyErrorRecovery(newState, ERROR_RECOVERY_STRATEGIES.URL_TOO_LONG);
        updateBrowserURL(recoveredState, replace);
        return;
      }

      // Only update if URL actually changed
      if (fullURL !== lastURLRef.current) {
        if (enableHistory) {
          if (replace) {
            window.history.replaceState(
              { urlState: newState, timestamp: Date.now() },
              '',
              newURL
            );
          } else {
            window.history.pushState(
              { urlState: newState, timestamp: Date.now() },
              '',
              newURL
            );
          }
        }
        
        lastURLRef.current = fullURL;
      }
      
      // Maintain state history for debugging (limit to last 10 entries)
      stateHistoryRef.current = [
        ...stateHistoryRef.current.slice(-9),
        { state: newState, url: newURL, timestamp: Date.now() }
      ];
    } catch (error) {
      console.error('Failed to update browser URL:', error);
      if (onError) {
        onError(error, { operation: 'updateBrowserURL', state: newState });
      }
    }
  }, [enableHistory, onError]);

  /**
   * Debounced URL update function
   * @param {Object} newState - State to update URL with
   * @param {boolean} immediate - Whether to update immediately
   * @param {boolean} replace - Whether to replace current history entry
   */
  const debouncedURLUpdate = useCallback((newState, immediate = false, replace = false) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (immediate || debounceDelay === 0) {
      updateBrowserURL(newState, replace);
    } else {
      debounceTimeoutRef.current = setTimeout(() => {
        updateBrowserURL(newState, replace);
      }, debounceDelay);
    }
  }, [updateBrowserURL, debounceDelay]);

  /**
   * Updates URL state with validation and error handling
   * @param {Object} partialState - Partial state to merge with current state
   * @param {Object} options - Update options
   */
  const updateURLState = useCallback((partialState, updateOptions = {}) => {
    const {
      immediate = false,
      replace = false,
      skipURLUpdate = false
    } = updateOptions;

    if (!isMountedRef.current) {
      return;
    }

    // For immediate updates, don't use transition to avoid delays
    const updateFunction = immediate ? (fn) => fn() : (fn) => startTransition(fn);
    
    updateFunction(() => {
      try {
        const newState = validateState({ ...urlState, ...partialState });
        
        setURLState(newState);
        
        // Call state change callback if provided
        if (onStateChange) {
          onStateChange(newState, urlState);
        }
        
        // Update URL unless explicitly skipped
        if (!skipURLUpdate) {
          debouncedURLUpdate(newState, immediate, replace);
        }
      } catch (error) {
        console.error('Failed to update URL state:', error);
        if (onError) {
          onError(error, { operation: 'updateURLState', partialState });
        }
      }
    });
  }, [urlState, onStateChange, onError, debouncedURLUpdate, startTransition]);

  /**
   * Replaces entire URL state
   * @param {Object} newState - Complete new state
   * @param {Object} options - Update options
   */
  const replaceURLState = useCallback((newState, updateOptions = {}) => {
    const {
      immediate = false,
      skipURLUpdate = false
    } = updateOptions;

    if (!isMountedRef.current) return;

    startTransition(() => {
      try {
        const validatedState = validateState(newState);
        
        setURLState(validatedState);
        
        // Call state change callback if provided
        if (onStateChange) {
          onStateChange(validatedState, urlState);
        }
        
        // Update URL unless explicitly skipped
        if (!skipURLUpdate) {
          debouncedURLUpdate(validatedState, immediate, true);
        }
      } catch (error) {
        console.error('Failed to replace URL state:', error);
        if (onError) {
          onError(error, { operation: 'replaceURLState', newState });
        }
      }
    });
  }, [urlState, onStateChange, onError, debouncedURLUpdate, startTransition]);

  /**
   * Resets state to defaults
   */
  const resetURLState = useCallback(() => {
    const defaultState = validateState({});
    replaceURLState(defaultState, { immediate: true });
  }, [replaceURLState]);

  /**
   * Handles browser navigation events (back/forward buttons)
   */
  const handlePopState = useCallback((event) => {
    if (!isMountedRef.current) return;

    try {
      let newState;
      
      if (event.state && event.state.urlState) {
        // Use state from history if available
        newState = validateState(event.state.urlState);
      } else {
        // Parse from current URL
        const currentParams = safeParseURLParams(window.location.search);
        const urlDecodedState = decodeURLToState(currentParams);
        newState = validateState(urlDecodedState);
      }
      
      // Update state without triggering URL update (since URL is already correct)
      setURLState(newState);
      
      // Call state change callback if provided
      if (onStateChange) {
        onStateChange(newState, urlState);
      }
      
      lastURLRef.current = window.location.href;
    } catch (error) {
      console.error('Failed to handle browser navigation:', error);
      if (onError) {
        onError(error, { operation: 'handlePopState', event });
      }
      
      // Fallback to parsing URL
      try {
        const currentParams = safeParseURLParams(window.location.search);
        const urlDecodedState = decodeURLToState(currentParams);
        const fallbackState = validateState(urlDecodedState);
        setURLState(fallbackState);
      } catch (fallbackError) {
        console.error('Fallback URL parsing also failed:', fallbackError);
        resetURLState();
      }
    }
  }, [urlState, onStateChange, onError, resetURLState]);

  // Set up browser navigation listener
  useEffect(() => {
    if (!enableHistory) return;

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState, enableHistory]);

  // Initialize URL on first load
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      
      // Update URL with initial state if it's not default
      if (!isDefaultState(urlState)) {
        debouncedURLUpdate(urlState, true, true);
      }
    }
  }, [urlState, debouncedURLUpdate]);

  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Current state
    urlState,
    
    // State update functions
    updateURL: updateURLState,
    replaceURL: replaceURLState,
    resetURL: resetURLState,
    
    // Status indicators
    isURLLoading: isPending,
    isValidURL: urlValidation.isValid,
    
    // Utility functions
    isDefaultState: () => isDefaultState(urlState),
    getStateHistory: () => [...stateHistoryRef.current],
    
    // Debug information (only in development)
    ...(import.meta.env.DEV && {
      _debug: {
        lastURL: lastURLRef.current,
        stateHistory: stateHistoryRef.current,
        urlValidation
      }
    })
  }), [
    urlState,
    updateURLState,
    replaceURLState,
    resetURLState,
    isPending,
    urlValidation.isValid,
    urlValidation
  ]);
}

export default useURLState;