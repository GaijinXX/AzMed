/**
 * Test to verify the search text synchronization bug fix
 * This test ensures that when you search for something and then navigate to another page,
 * the pagination uses the correct search text.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

describe('Search Text Synchronization Bug Fix', () => {
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

  it('should maintain search text when navigating between pages after search', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Start with initial URL containing "ba"
    act(() => {
      result.current.updateURL({
        searchText: 'ba',
        currentPage: 1
      }, { immediate: true });
    });

    // Verify initial search text
    expect(result.current.urlState.searchText).toBe('ba');
    expect(result.current.urlState.currentPage).toBe(1);

    // Step 2: Search for "de" (simulating user typing in search box)
    act(() => {
      result.current.updateURL({
        searchText: 'de',
        currentPage: 1
      }, { immediate: true });
    });

    // Verify search text is updated
    expect(result.current.urlState.searchText).toBe('de');
    expect(result.current.urlState.currentPage).toBe(1);

    // Step 3: Navigate to page 2 (this should use "de", not "ba")
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Verify that search text is still "de" and page is 2
    expect(result.current.urlState.searchText).toBe('de');
    expect(result.current.urlState.currentPage).toBe(2);
  });

  it('should handle rapid search and pagination changes', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Initial search
    act(() => {
      result.current.updateURL({
        searchText: 'initial',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Rapid search change
    act(() => {
      result.current.updateURL({
        searchText: 'updated',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 3: Immediate page change
    act(() => {
      result.current.updateURL({
        currentPage: 3
      }, { immediate: true });
    });

    // Should maintain the latest search text
    expect(result.current.urlState.searchText).toBe('updated');
    expect(result.current.urlState.currentPage).toBe(3);
  });

  it('should handle search text with special characters', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    const specialSearchText = 'test & search + more';

    // Step 1: Search with special characters
    act(() => {
      result.current.updateURL({
        searchText: specialSearchText,
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Navigate to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Should maintain the special characters in search text
    expect(result.current.urlState.searchText).toBe(specialSearchText);
    expect(result.current.urlState.currentPage).toBe(2);
  });

  it('should handle empty search text correctly', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Start with a search
    act(() => {
      result.current.updateURL({
        searchText: 'something',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Clear search (empty string)
    act(() => {
      result.current.updateURL({
        searchText: '',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 3: Navigate to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Should maintain empty search text
    expect(result.current.urlState.searchText).toBe('');
    expect(result.current.urlState.currentPage).toBe(2);
  });

  it('should handle page size changes with current search text', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Search for something
    act(() => {
      result.current.updateURL({
        searchText: 'medicine',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Change page size (should reset to page 1 but keep search text)
    act(() => {
      result.current.updateURL({
        pageSize: 25,
        currentPage: 1
      }, { immediate: true });
    });

    // Step 3: Navigate to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Should maintain search text and new page size
    expect(result.current.urlState.searchText).toBe('medicine');
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(2);
  });

  it('should handle sorting with current search text', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Search for something
    act(() => {
      result.current.updateURL({
        searchText: 'drug',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Apply sorting (should reset to page 1 but keep search text)
    act(() => {
      result.current.updateURL({
        sortColumn: 'product_name',
        sortDirection: 'desc',
        currentPage: 1
      }, { immediate: true });
    });

    // Step 3: Navigate to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Should maintain search text and sorting
    expect(result.current.urlState.searchText).toBe('drug');
    expect(result.current.urlState.sortColumn).toBe('product_name');
    expect(result.current.urlState.sortDirection).toBe('desc');
    expect(result.current.urlState.currentPage).toBe(2);
  });
});