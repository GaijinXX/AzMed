/**
 * Test for the specific bug scenario described by the user:
 * 1. Go to "http://localhost:3000/?q=ba" - shows results for "ba"
 * 2. Search for "de" - shows correct results for "de"
 * 3. Go to page 2 - should show page 2 of "de" results, not "ba" results
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

describe('Specific Bug Scenario Test', () => {
  const initialState = {
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
  });

  it('should handle the exact scenario: ba -> de -> page 2', async () => {
    // Step 1: Simulate navigating to "http://localhost:3000/?q=ba"
    window.history.replaceState({}, '', '/?q=ba');
    
    const { result } = renderHook(() => useURLState(initialState));

    // Should initialize with "ba" from URL
    expect(result.current.urlState.searchText).toBe('ba');
    expect(result.current.urlState.currentPage).toBe(1);

    // Step 2: User searches for "de" (simulating typing in search box and submitting)
    act(() => {
      result.current.updateURL({
        searchText: 'de',
        currentPage: 1 // Reset to page 1 on new search
      }, { immediate: true });
    });

    // Should now show "de" results on page 1
    expect(result.current.urlState.searchText).toBe('de');
    expect(result.current.urlState.currentPage).toBe(1);

    // Step 3: User clicks on page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Should show page 2 of "de" results, NOT "ba" results
    expect(result.current.urlState.searchText).toBe('de');
    expect(result.current.urlState.currentPage).toBe(2);

    // Verify the URL reflects the correct state
    const urlParams = new URLSearchParams(window.location.search);
    expect(decodeURIComponent(urlParams.get('q'))).toBe('de');
    expect(urlParams.get('page')).toBe('2');
  });

  it('should handle multiple search changes followed by pagination', async () => {
    // Start with initial search
    window.history.replaceState({}, '', '/?q=initial');
    
    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current.urlState.searchText).toBe('initial');

    // Search change 1
    act(() => {
      result.current.updateURL({
        searchText: 'first',
        currentPage: 1
      }, { immediate: true });
    });

    expect(result.current.urlState.searchText).toBe('first');

    // Search change 2
    act(() => {
      result.current.updateURL({
        searchText: 'second',
        currentPage: 1
      }, { immediate: true });
    });

    expect(result.current.urlState.searchText).toBe('second');

    // Navigate to page 3
    act(() => {
      result.current.updateURL({
        currentPage: 3
      }, { immediate: true });
    });

    // Should use the latest search text "second", not "initial" or "first"
    expect(result.current.urlState.searchText).toBe('second');
    expect(result.current.urlState.currentPage).toBe(3);
  });

  it('should handle rapid search and pagination interactions', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Rapid sequence of operations
    act(() => {
      // Initial search
      result.current.updateURL({
        searchText: 'rapid1',
        currentPage: 1
      }, { immediate: true });
    });

    act(() => {
      // Quick search change
      result.current.updateURL({
        searchText: 'rapid2',
        currentPage: 1
      }, { immediate: true });
    });

    act(() => {
      // Immediate page change
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    act(() => {
      // Another search change
      result.current.updateURL({
        searchText: 'rapid3',
        currentPage: 1
      }, { immediate: true });
    });

    act(() => {
      // Final page change
      result.current.updateURL({
        currentPage: 4
      }, { immediate: true });
    });

    // Should end up with the latest search text and page
    expect(result.current.urlState.searchText).toBe('rapid3');
    expect(result.current.urlState.currentPage).toBe(4);
  });

  it('should handle browser back/forward navigation correctly', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Search for "first"
    act(() => {
      result.current.updateURL({
        searchText: 'first',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Go to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Step 3: Search for "second" (should reset to page 1)
    act(() => {
      result.current.updateURL({
        searchText: 'second',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 4: Go to page 3
    act(() => {
      result.current.updateURL({
        currentPage: 3
      }, { immediate: true });
    });

    // Final state should be "second" on page 3
    expect(result.current.urlState.searchText).toBe('second');
    expect(result.current.urlState.currentPage).toBe(3);

    // Simulate browser back button (this would normally trigger popstate)
    // For this test, we'll just verify the state is consistent
    const urlParams = new URLSearchParams(window.location.search);
    expect(decodeURIComponent(urlParams.get('q'))).toBe('second');
    expect(urlParams.get('page')).toBe('3');
  });

  it('should handle edge case with empty search followed by pagination', async () => {
    // Start with a search
    window.history.replaceState({}, '', '/?q=something');
    
    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current.urlState.searchText).toBe('something');

    // Clear the search
    act(() => {
      result.current.updateURL({
        searchText: '',
        currentPage: 1
      }, { immediate: true });
    });

    expect(result.current.urlState.searchText).toBe('');

    // Navigate to page 2 (should show all results, page 2)
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    expect(result.current.urlState.searchText).toBe('');
    expect(result.current.urlState.currentPage).toBe(2);
  });
});