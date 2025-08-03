/**
 * Tests for URL State Management Utilities
 */

import { vi } from 'vitest';
import {
  encodeStateToURL,
  decodeURLToState,
  validateState,
  isDefaultState,
  cleanURLParams,
  safeParseURLParams,
  validateURLLength,
  applyErrorRecovery,
  ERROR_RECOVERY_STRATEGIES,
  DEFAULT_VISIBLE_COLUMNS,
  VALID_PAGE_SIZES
} from '../urlStateUtils.js';

describe('urlStateUtils', () => {
  const mockState = {
    searchText: 'aspirin',
    currentPage: 2,
    pageSize: 25,
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
      manufacturer: false,
      wholesale_price: false,
      retail_price: true,
      date: false
    }
  };

  const defaultState = {
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  };

  describe('encodeStateToURL', () => {
    it('should encode non-default state values to URL parameters', () => {
      const params = encodeStateToURL(mockState);
      
      expect(params.get('q')).toBe('aspirin');
      expect(params.get('page')).toBe('2');
      expect(params.get('size')).toBe('25');
      expect(params.get('sort')).toBe('product_name');
      expect(params.get('dir')).toBe('desc');
      expect(params.get('cols')).toBe('amount,dosage_amount,number,product_name,retail_price');
    });

    it('should omit default values from URL parameters', () => {
      const params = encodeStateToURL(defaultState);
      
      expect(params.get('q')).toBeNull();
      expect(params.get('page')).toBeNull();
      expect(params.get('size')).toBeNull();
      expect(params.get('sort')).toBeNull();
      expect(params.get('dir')).toBeNull();
      expect(params.get('cols')).toBeNull();
    });

    it('should handle empty search text', () => {
      const state = { ...mockState, searchText: '' };
      const params = encodeStateToURL(state);
      
      expect(params.get('q')).toBeNull();
    });

    it('should handle page 1', () => {
      const state = { ...mockState, currentPage: 1 };
      const params = encodeStateToURL(state);
      
      expect(params.get('page')).toBeNull();
    });

    it('should handle asc sort direction', () => {
      const state = { ...mockState, sortDirection: 'asc' };
      const params = encodeStateToURL(state);
      
      expect(params.get('dir')).toBeNull();
    });
  });

  describe('decodeURLToState', () => {
    it('should decode URL parameters to state', () => {
      const params = new URLSearchParams({
        q: 'aspirin',
        page: '2',
        size: '25',
        sort: 'product_name',
        dir: 'desc',
        cols: 'number,product_name,retail_price'
      });
      
      const state = decodeURLToState(params);
      
      expect(state.searchText).toBe('aspirin');
      expect(state.currentPage).toBe(2);
      expect(state.pageSize).toBe(25);
      expect(state.sortColumn).toBe('product_name');
      expect(state.sortDirection).toBe('desc');
      expect(state.visibleColumns.number).toBe(true);
      expect(state.visibleColumns.product_name).toBe(true);
      expect(state.visibleColumns.retail_price).toBe(true);
      expect(state.visibleColumns.active_ingredients).toBe(false);
    });

    it('should handle missing parameters with defaults', () => {
      const params = new URLSearchParams();
      const state = decodeURLToState(params);
      
      expect(state.searchText).toBe('');
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(10);
      expect(state.sortColumn).toBeNull();
      expect(state.sortDirection).toBe('asc');
      expect(state.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should handle invalid parameters gracefully', () => {
      const params = new URLSearchParams({
        q: 'test',
        page: 'invalid',
        size: '999',
        sort: 'invalid_column',
        dir: 'invalid_direction',
        cols: 'invalid,columns'
      });
      
      const state = decodeURLToState(params);
      
      expect(state.searchText).toBe('test');
      expect(state.currentPage).toBe(1); // Invalid page defaults to 1
      expect(state.pageSize).toBe(10); // Invalid size defaults to 10
      expect(state.sortColumn).toBeNull(); // Invalid column defaults to null
      expect(state.sortDirection).toBe('asc'); // Invalid direction defaults to asc
      // Invalid columns should result in all columns being false (since none of the invalid columns exist)
      expect(state.visibleColumns.number).toBe(false);
      expect(state.visibleColumns.product_name).toBe(false);
    });

    it('should handle URL encoded search text', () => {
      const params = new URLSearchParams({
        q: encodeURIComponent('test with spaces & symbols')
      });
      
      const state = decodeURLToState(params);
      expect(state.searchText).toBe('test with spaces & symbols');
    });
  });

  describe('validateState', () => {
    it('should validate and sanitize state values', () => {
      const invalidState = {
        searchText: 123, // Invalid type
        currentPage: -1, // Invalid value
        pageSize: 999, // Invalid value
        sortColumn: 'invalid_column', // Invalid column
        sortDirection: 'invalid', // Invalid direction
        visibleColumns: 'invalid' // Invalid type
      };
      
      const validatedState = validateState(invalidState);
      
      expect(validatedState.searchText).toBe('');
      expect(validatedState.currentPage).toBe(1);
      expect(validatedState.pageSize).toBe(10);
      expect(validatedState.sortColumn).toBeNull();
      expect(validatedState.sortDirection).toBe('asc');
      expect(validatedState.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should preserve valid state values', () => {
      const validatedState = validateState(mockState);
      
      expect(validatedState.searchText).toBe('aspirin');
      expect(validatedState.currentPage).toBe(2);
      expect(validatedState.pageSize).toBe(25);
      expect(validatedState.sortColumn).toBe('product_name');
      expect(validatedState.sortDirection).toBe('desc');
    });

    it('should limit search text length', () => {
      const longSearchText = 'a'.repeat(300);
      const state = { searchText: longSearchText };
      const validatedState = validateState(state);
      
      expect(validatedState.searchText.length).toBe(200);
    });

    it('should limit page number to reasonable maximum', () => {
      const state = { currentPage: 99999 };
      const validatedState = validateState(state);
      
      expect(validatedState.currentPage).toBe(10000);
    });
  });

  describe('isDefaultState', () => {
    it('should return true for default state', () => {
      expect(isDefaultState(defaultState)).toBe(true);
    });

    it('should return false for non-default state', () => {
      expect(isDefaultState(mockState)).toBe(false);
    });

    it('should handle partial state objects', () => {
      const partialState = { searchText: 'test' };
      expect(isDefaultState(partialState)).toBe(false);
    });
  });

  describe('cleanURLParams', () => {
    it('should remove invalid parameters', () => {
      const params = new URLSearchParams({
        q: 'test',
        page: 'invalid',
        size: '999',
        sort: 'invalid_column'
      });
      
      const cleanParams = cleanURLParams(params);
      
      expect(cleanParams.get('q')).toBe('test');
      expect(cleanParams.get('page')).toBeNull(); // Invalid page removed
      expect(cleanParams.get('size')).toBeNull(); // Invalid size removed
      expect(cleanParams.get('sort')).toBeNull(); // Invalid sort removed
    });

    it('should preserve valid parameters', () => {
      const params = new URLSearchParams({
        q: 'test',
        page: '2',
        size: '25',
        sort: 'product_name',
        dir: 'desc'
      });
      
      const cleanParams = cleanURLParams(params);
      
      expect(cleanParams.get('q')).toBe('test');
      expect(cleanParams.get('page')).toBe('2');
      expect(cleanParams.get('size')).toBe('25');
      expect(cleanParams.get('sort')).toBe('product_name');
      expect(cleanParams.get('dir')).toBe('desc');
    });
  });

  describe('safeParseURLParams', () => {
    it('should parse valid URL search string', () => {
      const search = '?q=test&page=2';
      const params = safeParseURLParams(search);
      
      expect(params.get('q')).toBe('test');
      expect(params.get('page')).toBe('2');
    });

    it('should handle empty search string', () => {
      const params = safeParseURLParams('');
      expect(params.toString()).toBe('');
    });

    it('should handle malformed search string gracefully', () => {
      // This shouldn't actually throw in modern browsers, but test the fallback
      const params = safeParseURLParams('invalid-url-params');
      expect(params).toBeInstanceOf(URLSearchParams);
    });
  });

  describe('validateURLLength', () => {
    it('should validate normal length URLs', () => {
      const normalURL = 'https://example.com/?q=test&page=2';
      const result = validateURLLength(normalURL);
      
      expect(result.isValid).toBe(true);
      expect(result.suggestedAction).toBeUndefined();
    });

    it('should detect overly long URLs', () => {
      const longURL = 'https://example.com/?' + 'a'.repeat(3000);
      const result = validateURLLength(longURL);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestedAction).toBe('truncate-search-term');
    });
  });

  describe('applyErrorRecovery', () => {
    it('should handle INVALID_PAGE recovery', () => {
      const state = { ...mockState, currentPage: 999 };
      const recovered = applyErrorRecovery(state, ERROR_RECOVERY_STRATEGIES.INVALID_PAGE);
      
      expect(recovered.currentPage).toBe(1);
    });

    it('should handle INVALID_SORT recovery', () => {
      const state = { ...mockState, sortColumn: 'invalid', sortDirection: 'invalid' };
      const recovered = applyErrorRecovery(state, ERROR_RECOVERY_STRATEGIES.INVALID_SORT);
      
      expect(recovered.sortColumn).toBeNull();
      expect(recovered.sortDirection).toBe('asc');
    });

    it('should handle INVALID_COLUMNS recovery', () => {
      const state = { ...mockState, visibleColumns: { invalid: true } };
      const recovered = applyErrorRecovery(state, ERROR_RECOVERY_STRATEGIES.INVALID_COLUMNS);
      
      expect(recovered.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should handle URL_TOO_LONG recovery', () => {
      const longSearchText = 'a'.repeat(300);
      const state = { ...mockState, searchText: longSearchText };
      const recovered = applyErrorRecovery(state, ERROR_RECOVERY_STRATEGIES.URL_TOO_LONG);
      
      expect(recovered.searchText.length).toBe(50);
    });

    it('should handle ENCODING_ERROR recovery', () => {
      const state = { invalid: 'data' };
      const recovered = applyErrorRecovery(state, ERROR_RECOVERY_STRATEGIES.ENCODING_ERROR);
      
      // Should return validated default state
      expect(recovered.searchText).toBe('');
      expect(recovered.currentPage).toBe(1);
      expect(recovered.pageSize).toBe(10);
    });

    it('should handle unknown recovery strategy', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const state = { ...mockState };
      const recovered = applyErrorRecovery(state, 'UNKNOWN_STRATEGY');
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown error recovery strategy:', 'UNKNOWN_STRATEGY');
      expect(recovered).toEqual(validateState(state));
      
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined state values', () => {
      const state = {
        searchText: null,
        currentPage: undefined,
        pageSize: null,
        sortColumn: undefined,
        sortDirection: null,
        visibleColumns: undefined
      };
      
      const validatedState = validateState(state);
      
      expect(validatedState.searchText).toBe('');
      expect(validatedState.currentPage).toBe(1);
      expect(validatedState.pageSize).toBe(10);
      expect(validatedState.sortColumn).toBeNull();
      expect(validatedState.sortDirection).toBe('asc');
      expect(validatedState.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should handle special characters in search text', () => {
      const specialChars = 'test@#$%^&*()[]{}|\\:";\'<>?,./';
      const params = new URLSearchParams({
        q: encodeURIComponent(specialChars)
      });
      
      const state = decodeURLToState(params);
      expect(state.searchText).toBe(specialChars);
    });

    it('should handle empty columns parameter', () => {
      const params = new URLSearchParams({ cols: '' });
      const state = decodeURLToState(params);
      
      expect(state.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should handle columns parameter with only commas', () => {
      const params = new URLSearchParams({ cols: ',,,' });
      const state = decodeURLToState(params);
      
      // Empty strings after splitting should result in all columns being false
      expect(Object.values(state.visibleColumns).every(visible => visible === false)).toBe(true);
    });
  });
});