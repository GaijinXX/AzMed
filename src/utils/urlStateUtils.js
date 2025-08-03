/**
 * URL State Management Utilities
 * Handles encoding, decoding, and validation of URL parameters for the Azerbaijan Drug Database
 */

import { SORTABLE_COLUMNS } from '../components/DrugTable/sortConfig.js';

// Default visible columns configuration
export const DEFAULT_VISIBLE_COLUMNS = {
  number: true,
  product_name: true,
  active_ingredients: true,
  dosage_amount: true,
  dosage_form: true,
  packaging_form: false,
  amount: true,
  manufacturer: false,
  wholesale_price: false,
  retail_price: true,
  date: false
};

// Valid page sizes
export const VALID_PAGE_SIZES = [10, 25, 50, 100];

// URL parameter schema with encoding/decoding logic
export const URL_PARAM_SCHEMA = {
  searchText: {
    param: 'q',
    default: '',
    encode: (value) => {
      if (!value || value.trim() === '') return null;
      return encodeURIComponent(value.trim());
    },
    decode: (value) => {
      if (!value) return '';
      try {
        return decodeURIComponent(value).trim();
      } catch (error) {
        console.warn('Failed to decode search parameter:', error);
        return '';
      }
    },
    validate: (value) => {
      if (typeof value !== 'string') return '';
      // Limit search text length to prevent URL length issues
      return value.slice(0, 200).trim();
    }
  },

  currentPage: {
    param: 'page',
    default: 1,
    encode: (value) => {
      const numValue = parseInt(value, 10);
      return numValue > 1 ? numValue.toString() : null;
    },
    decode: (value) => {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    },
    validate: (value) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) return 1;
      // Reasonable upper limit to prevent abuse
      return Math.min(numValue, 10000);
    }
  },

  pageSize: {
    param: 'size',
    default: 10,
    encode: (value) => {
      const numValue = parseInt(value, 10);
      return VALID_PAGE_SIZES.includes(numValue) && numValue !== 10 
        ? numValue.toString() 
        : null;
    },
    decode: (value) => {
      const parsed = parseInt(value, 10);
      return VALID_PAGE_SIZES.includes(parsed) ? parsed : 10;
    },
    validate: (value) => {
      const numValue = parseInt(value, 10);
      return VALID_PAGE_SIZES.includes(numValue) ? numValue : 10;
    }
  },

  sortColumn: {
    param: 'sort',
    default: null,
    encode: (value) => {
      if (!value) return null;
      const column = SORTABLE_COLUMNS.find(col => col.key === value);
      return column ? value : null;
    },
    decode: (value) => {
      if (!value) return null;
      const column = SORTABLE_COLUMNS.find(col => col.key === value);
      return column ? value : null;
    },
    validate: (value) => {
      if (!value) return null;
      const column = SORTABLE_COLUMNS.find(col => col.key === value);
      return column ? value : null;
    }
  },

  sortDirection: {
    param: 'dir',
    default: 'asc',
    encode: (value) => {
      return value === 'desc' ? 'desc' : null;
    },
    decode: (value) => {
      return ['asc', 'desc'].includes(value) ? value : 'asc';
    },
    validate: (value) => {
      return ['asc', 'desc'].includes(value) ? value : 'asc';
    }
  },

  visibleColumns: {
    param: 'cols',
    default: DEFAULT_VISIBLE_COLUMNS,
    encode: (value) => {
      if (!value || typeof value !== 'object') return null;
      
      const visibleKeys = Object.entries(value)
        .filter(([_, isVisible]) => isVisible)
        .map(([key]) => key)
        .sort(); // Sort for consistent URLs
      
      const defaultVisibleKeys = Object.entries(DEFAULT_VISIBLE_COLUMNS)
        .filter(([_, isVisible]) => isVisible)
        .map(([key]) => key)
        .sort();
      
      // Only include in URL if different from default
      if (JSON.stringify(visibleKeys) === JSON.stringify(defaultVisibleKeys)) {
        return null;
      }
      
      return visibleKeys.join(',');
    },
    decode: (value) => {
      if (!value) return DEFAULT_VISIBLE_COLUMNS;
      
      try {
        const visibleKeys = value.split(',').filter(key => key.trim());
        const allColumnKeys = Object.keys(DEFAULT_VISIBLE_COLUMNS);
        
        return allColumnKeys.reduce((acc, key) => ({
          ...acc,
          [key]: visibleKeys.includes(key)
        }), {});
      } catch (error) {
        console.warn('Failed to decode columns parameter:', error);
        return DEFAULT_VISIBLE_COLUMNS;
      }
    },
    validate: (value) => {
      if (!value || typeof value !== 'object') return DEFAULT_VISIBLE_COLUMNS;
      
      const validKeys = Object.keys(DEFAULT_VISIBLE_COLUMNS);
      const validated = {};
      
      // Ensure all valid keys are present with boolean values
      validKeys.forEach(key => {
        validated[key] = typeof value[key] === 'boolean' 
          ? value[key] 
          : DEFAULT_VISIBLE_COLUMNS[key];
      });
      
      return validated;
    }
  }
};

/**
 * Encodes application state into URL search parameters
 * @param {Object} state - Application state object
 * @returns {URLSearchParams} - Encoded URL search parameters
 */
export function encodeStateToURL(state) {
  const params = new URLSearchParams();
  
  Object.entries(URL_PARAM_SCHEMA).forEach(([stateKey, config]) => {
    const value = state[stateKey];
    const encodedValue = config.encode(value);
    
    if (encodedValue !== null && encodedValue !== undefined) {
      params.set(config.param, encodedValue);
    }
  });
  
  return params;
}

/**
 * Decodes URL search parameters into application state
 * @param {URLSearchParams} params - URL search parameters
 * @returns {Object} - Decoded application state
 */
export function decodeURLToState(params) {
  const state = {};
  
  Object.entries(URL_PARAM_SCHEMA).forEach(([stateKey, config]) => {
    const paramValue = params.get(config.param);
    state[stateKey] = config.decode(paramValue);
  });
  
  return state;
}

/**
 * Validates and sanitizes application state
 * @param {Object} state - Application state to validate
 * @returns {Object} - Validated and sanitized state
 */
export function validateState(state) {
  const validatedState = {};
  
  Object.entries(URL_PARAM_SCHEMA).forEach(([stateKey, config]) => {
    const value = state[stateKey];
    validatedState[stateKey] = config.validate(value !== undefined ? value : config.default);
  });
  
  return validatedState;
}

/**
 * Checks if the current state matches default values
 * @param {Object} state - Application state to check
 * @returns {boolean} - True if state matches defaults
 */
export function isDefaultState(state) {
  return Object.entries(URL_PARAM_SCHEMA).every(([stateKey, config]) => {
    const value = state[stateKey];
    const defaultValue = config.default;
    
    // Special handling for objects (like visibleColumns)
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      return JSON.stringify(value) === JSON.stringify(defaultValue);
    }
    
    return value === defaultValue;
  });
}

/**
 * Creates a clean URL by removing default parameters
 * @param {URLSearchParams} params - URL parameters to clean
 * @returns {URLSearchParams} - Cleaned URL parameters
 */
export function cleanURLParams(params) {
  const cleanParams = new URLSearchParams();
  
  Object.entries(URL_PARAM_SCHEMA).forEach(([stateKey, config]) => {
    const paramValue = params.get(config.param);
    if (paramValue !== null) {
      const decodedValue = config.decode(paramValue);
      const encodedValue = config.encode(decodedValue);
      
      if (encodedValue !== null) {
        // Don't re-encode - the paramValue is already properly encoded
        // Just validate that it should be included (not a default value)
        cleanParams.set(config.param, paramValue);
      }
    }
  });
  
  return cleanParams;
}

/**
 * Safely parses URL search parameters with error handling
 * @param {string} search - URL search string
 * @returns {URLSearchParams} - Parsed URL parameters
 */
export function safeParseURLParams(search) {
  try {
    return new URLSearchParams(search);
  } catch (error) {
    console.warn('Failed to parse URL parameters:', error);
    return new URLSearchParams();
  }
}

/**
 * Checks if URL is too long and suggests truncation
 * @param {string} url - URL to check
 * @returns {Object} - { isValid: boolean, suggestedAction?: string }
 */
export function validateURLLength(url) {
  const MAX_URL_LENGTH = 2048; // Conservative limit for broad browser support
  
  if (url.length <= MAX_URL_LENGTH) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    suggestedAction: 'truncate-search-term'
  };
}

/**
 * Error recovery strategies for malformed URLs
 */
export const ERROR_RECOVERY_STRATEGIES = {
  INVALID_PAGE: 'redirect-to-page-1',
  INVALID_SORT: 'clear-sort-params',
  INVALID_COLUMNS: 'reset-to-default',
  URL_TOO_LONG: 'truncate-search-term',
  ENCODING_ERROR: 'clear-problematic-param'
};

/**
 * Applies error recovery strategy to state
 * @param {Object} state - Current state
 * @param {string} strategy - Recovery strategy to apply
 * @returns {Object} - Recovered state
 */
export function applyErrorRecovery(state, strategy) {
  const recoveredState = { ...state };
  
  switch (strategy) {
    case ERROR_RECOVERY_STRATEGIES.INVALID_PAGE:
      recoveredState.currentPage = 1;
      break;
      
    case ERROR_RECOVERY_STRATEGIES.INVALID_SORT:
      recoveredState.sortColumn = null;
      recoveredState.sortDirection = 'asc';
      break;
      
    case ERROR_RECOVERY_STRATEGIES.INVALID_COLUMNS:
      recoveredState.visibleColumns = DEFAULT_VISIBLE_COLUMNS;
      break;
      
    case ERROR_RECOVERY_STRATEGIES.URL_TOO_LONG:
      recoveredState.searchText = recoveredState.searchText.slice(0, 50);
      break;
      
    case ERROR_RECOVERY_STRATEGIES.ENCODING_ERROR:
      // Reset to defaults
      return validateState({});
      
    default:
      console.warn('Unknown error recovery strategy:', strategy);
  }
  
  return validateState(recoveredState);
}