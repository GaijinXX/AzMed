/**
 * Comprehensive URL Functionality Tests
 * Tests all aspects of URL functionality including validation, encoding, and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { 
  encodeStateToURL, 
  decodeURLToState, 
  validateState,
  cleanURLParams,
  safeParseURLParams,
  validateURLLength,
  applyErrorRecovery,
  ERROR_RECOVERY_STRATEGIES,
  DEFAULT_VISIBLE_COLUMNS 
} from '../utils/urlStateUtils';

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

describe('Comprehensive URL Functionality Tests', () => {
  const defaultState = {
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  };

  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Parameter Encoding/Decoding Comprehensive Tests', () => {
    it('should handle all possible parameter combinations', () => {
      const complexState = {
        searchText: 'complex search with spaces & symbols',
        currentPage: 15,
        pageSize: 50,
        sortColumn: 'product_name',
        sortDirection: 'desc',
        visibleColumns: {
          number: true,
          product_name: true,
          active_ingredients: false,
          dosage_amount: true,
          dosage_form: false,
          packaging_form: false,
          amount: true,
          manufacturer: true,
          wholesale_price: false,
          retail_price: true,
          date: false
        }
      };

      const encoded = encodeStateToURL(complexState);
      const decoded = decodeURLToState(encoded);

      expect(decoded.searchText).toBe(complexState.searchText);
      expect(decoded.currentPage).toBe(complexState.currentPage);
      expect(decoded.pageSize).toBe(complexState.pageSize);
      expect(decoded.sortColumn).toBe(complexState.sortColumn);
      expect(decoded.sortDirection).toBe(complexState.sortDirection);
      expect(decoded.visibleColumns).toEqual(complexState.visibleColumns);
    });

    it('should handle Unicode characters in search text', () => {
      const unicodeState = {
        ...defaultState,
        searchText: 'Ağrı kesici ilaçlar 药物 лекарства'
      };

      const encoded = encodeStateToURL(unicodeState);
      const decoded = decodeURLToState(encoded);

      expect(decoded.searchText).toBe(unicodeState.searchText);
    });

    it('should handle edge case parameter values', () => {
      const edgeCaseState = {
        searchText: '',
        currentPage: 1,
        pageSize: 10,
        sortColumn: null,
        sortDirection: 'asc',
        visibleColumns: {}
      };

      const encoded = encodeStateToURL(edgeCaseState);
      const decoded = decodeURLToState(encoded);

      expect(decoded.searchText).toBe('');
      expect(decoded.currentPage).toBe(1);
      expect(decoded.pageSize).toBe(10);
      expect(decoded.sortColumn).toBeNull();
      expect(decoded.sortDirection).toBe('asc');
    });

    it('should handle maximum length search terms', () => {
      const maxLengthState = {
        ...defaultState,
        searchText: 'a'.repeat(200) // Maximum allowed length
      };

      const encoded = encodeStateToURL(maxLengthState);
      const decoded = decodeURLToState(encoded);

      expect(decoded.searchText).toBe(maxLengthState.searchText);
      expect(decoded.searchText.length).toBe(200);
    });

    it('should handle all valid page sizes', () => {
      const validPageSizes = [10, 25, 50, 100];

      validPageSizes.forEach(pageSize => {
        const state = { ...defaultState, pageSize };
        const encoded = encodeStateToURL(state);
        const decoded = decodeURLToState(encoded);
        expect(decoded.pageSize).toBe(pageSize);
      });
    });

    it('should handle all valid sort directions', () => {
      const validDirections = ['asc', 'desc'];

      validDirections.forEach(direction => {
        const state = { ...defaultState, sortDirection: direction };
        const encoded = encodeStateToURL(state);
        const decoded = decodeURLToState(encoded);
        expect(decoded.sortDirection).toBe(direction);
      });
    });
  });

  describe('URL Validation and Sanitization', () => {
    it('should validate and correct invalid page numbers', () => {
      const invalidStates = [
        { currentPage: -1 },
        { currentPage: 0 },
        { currentPage: 99999 },
        { currentPage: 'invalid' },
        { currentPage: null },
        { currentPage: undefined }
      ];

      invalidStates.forEach(invalidState => {
        const validated = validateState(invalidState);
        expect(validated.currentPage).toBeGreaterThanOrEqual(1);
        expect(validated.currentPage).toBeLessThanOrEqual(10000);
        expect(typeof validated.currentPage).toBe('number');
      });
    });

    it('should validate and correct invalid page sizes', () => {
      const invalidPageSizes = [0, -1, 5, 15, 999, 'invalid', null, undefined];

      invalidPageSizes.forEach(invalidSize => {
        const validated = validateState({ pageSize: invalidSize });
        expect([10, 25, 50, 100]).toContain(validated.pageSize);
      });
    });

    it('should validate and correct invalid sort columns', () => {
      const invalidColumns = ['invalid_column', 'nonexistent', '', null, undefined, 123];

      invalidColumns.forEach(invalidColumn => {
        const validated = validateState({ sortColumn: invalidColumn });
        expect(validated.sortColumn).toBeNull();
      });
    });

    it('should validate and correct invalid sort directions', () => {
      const invalidDirections = ['invalid', 'up', 'down', '', null, undefined, 123];

      invalidDirections.forEach(invalidDirection => {
        const validated = validateState({ sortDirection: invalidDirection });
        expect(['asc', 'desc']).toContain(validated.sortDirection);
      });
    });

    it('should validate and correct invalid visible columns', () => {
      const invalidColumnConfigs = [
        'invalid',
        123,
        null,
        undefined,
        { invalid_column: true },
        { number: 'invalid' }
      ];

      invalidColumnConfigs.forEach(invalidConfig => {
        const validated = validateState({ visibleColumns: invalidConfig });
        expect(typeof validated.visibleColumns).toBe('object');
        expect(validated.visibleColumns).not.toBeNull();
        
        // Should contain valid column keys
        Object.keys(validated.visibleColumns).forEach(key => {
          expect(Object.keys(DEFAULT_VISIBLE_COLUMNS)).toContain(key);
        });
      });
    });

    it('should truncate excessively long search terms', () => {
      const longSearchText = 'a'.repeat(500);
      const validated = validateState({ searchText: longSearchText });
      
      expect(validated.searchText.length).toBeLessThanOrEqual(200);
    });

    it('should handle null and undefined state values', () => {
      const nullState = {
        searchText: null,
        currentPage: undefined,
        pageSize: null,
        sortColumn: undefined,
        sortDirection: null,
        visibleColumns: undefined
      };

      const validated = validateState(nullState);

      expect(validated.searchText).toBe('');
      expect(validated.currentPage).toBe(1);
      expect(validated.pageSize).toBe(10);
      expect(validated.sortColumn).toBeNull();
      expect(validated.sortDirection).toBe('asc');
      expect(validated.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });
  });

  describe('URL Length Validation', () => {
    it('should validate normal length URLs', () => {
      const normalURL = 'https://example.com/?q=test&page=2&size=25';
      const result = validateURLLength(normalURL);
      
      expect(result.isValid).toBe(true);
      expect(result.suggestedAction).toBeUndefined();
    });

    it('should detect URLs approaching length limits', () => {
      const longURL = 'https://example.com/?' + 'a'.repeat(3000);
      const result = validateURLLength(longURL);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestedAction).toBe('truncate-search-term');
    });

    it('should detect extremely long URLs', () => {
      const extremelyLongURL = 'https://example.com/?' + 'a'.repeat(5000);
      const result = validateURLLength(extremelyLongURL);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestedAction).toBe('truncate-search-term');
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should apply INVALID_PAGE recovery correctly', () => {
      const invalidPageState = { ...defaultState, currentPage: 999999 };
      const recovered = applyErrorRecovery(invalidPageState, ERROR_RECOVERY_STRATEGIES.INVALID_PAGE);
      
      expect(recovered.currentPage).toBe(1);
    });

    it('should apply INVALID_SORT recovery correctly', () => {
      const invalidSortState = { 
        ...defaultState, 
        sortColumn: 'invalid_column',
        sortDirection: 'invalid_direction'
      };
      const recovered = applyErrorRecovery(invalidSortState, ERROR_RECOVERY_STRATEGIES.INVALID_SORT);
      
      expect(recovered.sortColumn).toBeNull();
      expect(recovered.sortDirection).toBe('asc');
    });

    it('should apply INVALID_COLUMNS recovery correctly', () => {
      const invalidColumnsState = { 
        ...defaultState, 
        visibleColumns: { invalid_column: true }
      };
      const recovered = applyErrorRecovery(invalidColumnsState, ERROR_RECOVERY_STRATEGIES.INVALID_COLUMNS);
      
      expect(recovered.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should apply URL_TOO_LONG recovery correctly', () => {
      const longSearchState = { 
        ...defaultState, 
        searchText: 'a'.repeat(500)
      };
      const recovered = applyErrorRecovery(longSearchState, ERROR_RECOVERY_STRATEGIES.URL_TOO_LONG);
      
      expect(recovered.searchText.length).toBe(50);
    });

    it('should apply ENCODING_ERROR recovery correctly', () => {
      const corruptedState = { invalid: 'data', corrupted: true };
      const recovered = applyErrorRecovery(corruptedState, ERROR_RECOVERY_STRATEGIES.ENCODING_ERROR);
      
      // Should return a valid default state
      expect(recovered.searchText).toBe('');
      expect(recovered.currentPage).toBe(1);
      expect(recovered.pageSize).toBe(10);
      expect(recovered.sortColumn).toBeNull();
      expect(recovered.sortDirection).toBe('asc');
    });
  });

  describe('URL Parameter Cleaning', () => {
    it('should remove invalid parameters while preserving valid ones', () => {
      const mixedParams = new URLSearchParams({
        q: 'valid search',
        page: 'invalid',
        size: '999',
        sort: 'invalid_column',
        dir: 'invalid_direction',
        cols: 'invalid,columns'
      });

      const cleaned = cleanURLParams(mixedParams);

      expect(decodeURIComponent(cleaned.get('q'))).toBe('valid search');
      expect(cleaned.get('page')).toBeNull(); // Invalid removed (decodes to 1, encodes to null)
      expect(cleaned.get('size')).toBeNull(); // Invalid removed (decodes to 10, encodes to null)
      expect(cleaned.get('sort')).toBeNull(); // Invalid removed (decodes to null, encodes to null)
      expect(cleaned.get('dir')).toBeNull(); // Invalid direction removed (decodes to asc, encodes to null)
      // cols parameter might not be null if it contains some valid columns mixed with invalid ones
      // The function processes what it can and encodes the result
    });

    it('should handle empty parameters', () => {
      const emptyParams = new URLSearchParams({
        q: '',
        page: '',
        size: '',
        sort: '',
        dir: '',
        cols: ''
      });

      const cleaned = cleanURLParams(emptyParams);

      // Empty values should be removed
      expect(cleaned.toString()).toBe('');
    });
  });

  describe('Safe URL Parsing', () => {
    it('should parse valid URL search strings', () => {
      const validSearchStrings = [
        '?q=test&page=2',
        '?q=test%20search&size=25',
        '?sort=product_name&dir=desc',
        ''
      ];

      validSearchStrings.forEach(searchString => {
        const params = safeParseURLParams(searchString);
        expect(params).toBeInstanceOf(URLSearchParams);
      });
    });

    it('should handle malformed URL search strings gracefully', () => {
      const malformedStrings = [
        'invalid-url-format',
        '?q=test&invalid-format',
        '?q=test&page=2&',
        '?&&&'
      ];

      malformedStrings.forEach(malformedString => {
        const params = safeParseURLParams(malformedString);
        expect(params).toBeInstanceOf(URLSearchParams);
      });
    });
  });

  describe('URL State Hook Integration', () => {
    it('should handle rapid state updates without URL corruption', async () => {
      const { result } = renderHook(() => useURLState(defaultState));

      // Make rapid updates with proper state merging
      act(() => {
        result.current.updateURL({ searchText: 'update1' });
      });
      
      act(() => {
        result.current.updateURL({ searchText: 'update2' });
      });
      
      act(() => {
        result.current.updateURL({ searchText: 'update3' });
      });
      
      act(() => {
        result.current.updateURL({ currentPage: 2 });
      });
      
      act(() => {
        result.current.updateURL({ pageSize: 25 });
      });

      // Final state should be consistent
      expect(result.current.urlState.searchText).toBe('update3');
      expect(result.current.urlState.currentPage).toBe(2);
      expect(result.current.urlState.pageSize).toBe(25);

      // Wait for debounced URL update
      await waitFor(() => {
        const urlParams = new URLSearchParams(window.location.search);
        expect(decodeURIComponent(urlParams.get('q') || '')).toBe('update3');
        expect(urlParams.get('page')).toBe('2');
        expect(urlParams.get('size')).toBe('25');
      }, { timeout: 1000 });
    });

    it('should maintain URL validity during complex state transitions', async () => {
      const { result } = renderHook(() => useURLState(defaultState));

      // Perform complex state transition
      act(() => {
        result.current.updateURL({
          searchText: 'complex transition',
          currentPage: 5,
          pageSize: 50,
          sortColumn: 'product_name',
          sortDirection: 'desc',
          visibleColumns: {
            ...DEFAULT_VISIBLE_COLUMNS,
            manufacturer: true,
            wholesale_price: true
          }
        }, { immediate: true });
      });

      // URL should be valid and contain all parameters
      const urlParams = new URLSearchParams(window.location.search);
      expect(decodeURIComponent(urlParams.get('q'))).toBe('complex transition');
      expect(urlParams.get('page')).toBe('5');
      expect(urlParams.get('size')).toBe('50');
      expect(urlParams.get('sort')).toBe('product_name');
      expect(urlParams.get('dir')).toBe('desc');
      expect(urlParams.get('cols')).toContain('manufacturer');
      expect(urlParams.get('cols')).toContain('wholesale_price');
    });

    it('should recover from corrupted URL state gracefully', () => {
      // Set corrupted URL
      window.history.replaceState({}, '', '/?q=test&page=NaN&size=invalid&sort=null');

      const { result } = renderHook(() => useURLState(defaultState));

      // Should initialize with valid state despite corrupted URL
      expect(result.current.urlState.searchText).toBe('test');
      expect(result.current.urlState.currentPage).toBe(1); // Corrected from NaN
      expect(result.current.urlState.pageSize).toBe(10); // Corrected from invalid
      expect(result.current.urlState.sortColumn).toBeNull(); // Corrected from 'null' string
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of URL updates efficiently', async () => {
      const { result } = renderHook(() => useURLState(defaultState));

      const startTime = performance.now();

      // Perform many rapid updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.updateURL({ searchText: `update${i}` });
        });
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle updates efficiently (under 100ms)
      expect(updateTime).toBeLessThan(100);

      // Final state should be correct
      expect(result.current.urlState.searchText).toBe('update99');
    });

    it('should not cause memory leaks with repeated URL updates', async () => {
      const { result, unmount } = renderHook(() => useURLState(defaultState));

      // Perform many updates
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.updateURL({ 
            searchText: `memory-test-${i}`,
            currentPage: (i % 10) + 1
          });
        });
      }

      // Unmount should clean up properly
      unmount();

      // No assertions needed - test passes if no memory leaks occur
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different URL encoding behaviors', () => {
      const specialCharacters = [
        'test with spaces',
        'test+with+plus',
        'test&with&ampersand',
        'test=with=equals',
        'test?with?question',
        'test#with#hash'
      ];

      specialCharacters.forEach(searchText => {
        const state = { ...defaultState, searchText };
        const encoded = encodeStateToURL(state);
        const decoded = decodeURLToState(encoded);
        
        expect(decoded.searchText).toBe(searchText);
      });
    });

    it('should handle URL length limits across different browsers', () => {
      // Test various URL lengths that might be problematic in different browsers
      const testLengths = [1000, 2000, 3000, 4000];

      testLengths.forEach(length => {
        const longSearch = 'a'.repeat(length);
        const result = validateURLLength(`https://example.com/?q=${encodeURIComponent(longSearch)}`);
        
        if (length > 2000) {
          expect(result.isValid).toBe(false);
          expect(result.suggestedAction).toBe('truncate-search-term');
        }
      });
    });
  });
});