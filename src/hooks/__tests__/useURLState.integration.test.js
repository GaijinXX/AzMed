/**
 * Integration Tests for URL State Management System
 * Tests the complete URL state management workflow
 */

import { vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useURLState } from '../useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../../utils/urlStateUtils.js';

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

describe('URL State Management Integration', () => {
  const initialState = {
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  };

  beforeEach(() => {
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/',
        origin: 'https://example.com',
        pathname: '/',
        search: ''
      },
      writable: true
    });

    // Mock history API
    window.history.pushState = vi.fn();
    window.history.replaceState = vi.fn();
  });

  describe('Complete Search Workflow', () => {
    it('should handle a complete search workflow with URL synchronization', async () => {
      const { result } = renderHook(() => useURLState(initialState));

      // Step 1: User enters search text
      act(() => {
        result.current.updateURL({ searchText: 'aspirin' });
      });

      expect(result.current.urlState.searchText).toBe('aspirin');
      expect(result.current.urlState.currentPage).toBe(1); // Should reset to page 1

      // Step 2: User changes page size
      act(() => {
        result.current.updateURL({ pageSize: 25 });
      });

      expect(result.current.urlState.pageSize).toBe(25);
      expect(result.current.urlState.currentPage).toBe(1); // Should stay on page 1

      // Step 3: User navigates to page 2
      act(() => {
        result.current.updateURL({ currentPage: 2 });
      });

      expect(result.current.urlState.currentPage).toBe(2);

      // Step 4: User sorts by product name
      act(() => {
        result.current.updateURL({ 
          sortColumn: 'product_name',
          sortDirection: 'asc'
        });
      });

      expect(result.current.urlState.sortColumn).toBe('product_name');
      expect(result.current.urlState.sortDirection).toBe('asc');

      // Step 5: User changes sort direction
      act(() => {
        result.current.updateURL({ sortDirection: 'desc' });
      });

      expect(result.current.urlState.sortDirection).toBe('desc');

      // Step 6: User modifies visible columns
      act(() => {
        result.current.updateURL({
          visibleColumns: {
            ...DEFAULT_VISIBLE_COLUMNS,
            manufacturer: true,
            wholesale_price: true
          }
        });
      });

      expect(result.current.urlState.visibleColumns.manufacturer).toBe(true);
      expect(result.current.urlState.visibleColumns.wholesale_price).toBe(true);

      // Verify final state
      expect(result.current.urlState).toEqual({
        searchText: 'aspirin',
        currentPage: 2,
        pageSize: 25,
        sortColumn: 'product_name',
        sortDirection: 'desc',
        visibleColumns: {
          ...DEFAULT_VISIBLE_COLUMNS,
          manufacturer: true,
          wholesale_price: true
        }
      });
    });

    it('should handle URL-driven state changes (bookmarks/sharing)', () => {
      // Simulate user navigating to a bookmarked URL
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/?q=ibuprofen&page=3&size=50&sort=retail_price&dir=desc&cols=number,product_name,retail_price',
          origin: 'https://example.com',
          pathname: '/',
          search: '?q=ibuprofen&page=3&size=50&sort=retail_price&dir=desc&cols=number,product_name,retail_price'
        },
        writable: true
      });

      const { result } = renderHook(() => useURLState(initialState));

      // State should be initialized from URL
      expect(result.current.urlState.searchText).toBe('ibuprofen');
      expect(result.current.urlState.currentPage).toBe(3);
      expect(result.current.urlState.pageSize).toBe(50);
      expect(result.current.urlState.sortColumn).toBe('retail_price');
      expect(result.current.urlState.sortDirection).toBe('desc');
      expect(result.current.urlState.visibleColumns.number).toBe(true);
      expect(result.current.urlState.visibleColumns.product_name).toBe(true);
      expect(result.current.urlState.visibleColumns.retail_price).toBe(true);
      expect(result.current.urlState.visibleColumns.active_ingredients).toBe(false);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle malformed URL parameters gracefully', () => {
      // Simulate malformed URL
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/?q=test&page=invalid&size=999&sort=invalid_column&dir=invalid&cols=invalid,columns',
          origin: 'https://example.com',
          pathname: '/',
          search: '?q=test&page=invalid&size=999&sort=invalid_column&dir=invalid&cols=invalid,columns'
        },
        writable: true
      });

      const { result } = renderHook(() => useURLState(initialState));

      // Should gracefully handle invalid parameters
      expect(result.current.urlState.searchText).toBe('test'); // Valid parameter preserved
      expect(result.current.urlState.currentPage).toBe(1); // Invalid page corrected
      expect(result.current.urlState.pageSize).toBe(10); // Invalid size corrected
      expect(result.current.urlState.sortColumn).toBeNull(); // Invalid sort corrected
      expect(result.current.urlState.sortDirection).toBe('asc'); // Invalid direction corrected
      // Invalid columns should result in all false
      expect(Object.values(result.current.urlState.visibleColumns).every(v => v === false)).toBe(true);
    });

    it('should handle URL length validation', () => {
      const { result } = renderHook(() => useURLState(initialState));

      // Try to set a very long search text
      const longSearchText = 'a'.repeat(3000);
      
      act(() => {
        result.current.updateURL({ searchText: longSearchText });
      });

      // Should truncate the search text to prevent URL length issues
      expect(result.current.urlState.searchText.length).toBeLessThan(longSearchText.length);
      expect(result.current.isValidURL).toBe(true);
    });

    it('should handle browser navigation errors gracefully', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => 
        useURLState(initialState, { onError })
      );

      // Mock history API to throw error
      window.history.pushState = vi.fn(() => {
        throw new Error('History API error');
      });

      act(() => {
        result.current.updateURL({ searchText: 'test' }, { immediate: true });
      });

      // State should still be updated even if URL update fails
      expect(result.current.urlState.searchText).toBe('test');
      
      // Error callback should be called
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          operation: 'updateBrowserURL'
        })
      );
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce rapid URL updates', async () => {
      const { result } = renderHook(() => 
        useURLState(initialState, { debounceDelay: 100 })
      );

      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      // Make rapid updates
      act(() => {
        result.current.updateURL({ searchText: 'a' });
        result.current.updateURL({ searchText: 'as' });
        result.current.updateURL({ searchText: 'asp' });
        result.current.updateURL({ searchText: 'aspi' });
        result.current.updateURL({ searchText: 'aspirin' });
      });

      // State should reflect the last update immediately
      expect(result.current.urlState.searchText).toBe('aspirin');

      // URL should not be updated immediately
      expect(pushStateSpy).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(() => {
        expect(pushStateSpy).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });

      // Should update with the final value
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          urlState: expect.objectContaining({
            searchText: 'aspirin'
          })
        }),
        '',
        '/?q=aspirin'
      );
    });

    it('should handle immediate updates without debouncing', () => {
      const { result } = renderHook(() => 
        useURLState(initialState, { debounceDelay: 100 })
      );

      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      act(() => {
        result.current.updateURL(
          { searchText: 'immediate' },
          { immediate: true }
        );
      });

      // Should update URL immediately
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          urlState: expect.objectContaining({
            searchText: 'immediate'
          })
        }),
        '',
        '/?q=immediate'
      );
    });

    it('should prevent unnecessary re-renders with memoization', () => {
      let renderCount = 0;
      
      const { result, rerender } = renderHook(() => {
        renderCount++;
        return useURLState(initialState);
      });

      const initialRenderCount = renderCount;

      // Rerender with same props should not cause additional renders
      rerender();
      
      expect(renderCount).toBe(initialRenderCount + 1);

      // The returned object should be stable
      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Functions should be stable (memoized)
      expect(firstResult.updateURL).toBe(secondResult.updateURL);
      expect(firstResult.replaceURL).toBe(secondResult.replaceURL);
    });
  });

  describe('Browser History Integration', () => {
    it('should handle browser back/forward navigation', () => {
      let popstateHandler;
      
      // Mock addEventListener to capture the popstate handler
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'popstate') {
          popstateHandler = handler;
        }
        return originalAddEventListener.call(window, event, handler);
      });

      const { result } = renderHook(() => useURLState(initialState));

      // Simulate popstate event with state
      const mockEvent = {
        state: {
          urlState: {
            ...initialState,
            searchText: 'from-history',
            currentPage: 2
          }
        }
      };

      act(() => {
        if (popstateHandler) {
          popstateHandler(mockEvent);
        }
      });

      // State should be updated from history
      expect(result.current.urlState.searchText).toBe('from-history');
      expect(result.current.urlState.currentPage).toBe(2);

      // Restore original addEventListener
      window.addEventListener = originalAddEventListener;
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useURLState(initialState));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    });
  });

  describe('State Validation and Sanitization', () => {
    it('should validate and sanitize all state updates', () => {
      const { result } = renderHook(() => useURLState(initialState));

      // Try to set invalid values
      act(() => {
        result.current.updateURL({
          searchText: 123, // Invalid type
          currentPage: -5, // Invalid value
          pageSize: 999, // Invalid value
          sortColumn: 'invalid_column', // Invalid column
          sortDirection: 'invalid_direction', // Invalid direction
          visibleColumns: 'invalid' // Invalid type
        });
      });

      // All values should be validated and corrected
      expect(result.current.urlState.searchText).toBe('');
      expect(result.current.urlState.currentPage).toBe(1);
      expect(result.current.urlState.pageSize).toBe(10);
      expect(result.current.urlState.sortColumn).toBeNull();
      expect(result.current.urlState.sortDirection).toBe('asc');
      expect(result.current.urlState.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS);
    });

    it('should preserve valid values during validation', () => {
      const { result } = renderHook(() => useURLState(initialState));

      const validState = {
        searchText: 'valid search',
        currentPage: 5,
        pageSize: 25,
        sortColumn: 'product_name',
        sortDirection: 'desc',
        visibleColumns: {
          ...DEFAULT_VISIBLE_COLUMNS,
          manufacturer: true
        }
      };

      act(() => {
        result.current.updateURL(validState);
      });

      // All valid values should be preserved
      expect(result.current.urlState).toEqual(validState);
    });
  });

  describe('Utility Functions', () => {
    it('should provide accurate default state detection', () => {
      const { result } = renderHook(() => useURLState(initialState));

      // Initially should be default state
      expect(result.current.isDefaultState()).toBe(true);

      // After updating, should not be default state
      act(() => {
        result.current.updateURL({ searchText: 'test' });
      });

      expect(result.current.isDefaultState()).toBe(false);

      // After resetting, should be default state again
      act(() => {
        result.current.resetURL();
      });

      expect(result.current.isDefaultState()).toBe(true);
    });

    it('should provide state history for debugging', () => {
      const { result } = renderHook(() => useURLState(initialState));

      // Initially should have empty history
      expect(result.current.getStateHistory()).toEqual([]);

      // After updates, should track history
      act(() => {
        result.current.updateURL({ searchText: 'test1' }, { immediate: true });
      });

      act(() => {
        result.current.updateURL({ searchText: 'test2' }, { immediate: true });
      });

      const history = result.current.getStateHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].state.searchText).toBe('test2');
    });
  });
});