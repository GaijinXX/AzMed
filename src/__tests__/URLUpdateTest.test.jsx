/**
 * Simple test to check if URL updates are working
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

describe('URL Update Test', () => {
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

  it('should update URL when search text is changed', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    console.log('Initial URL:', window.location.href);
    console.log('Initial search:', window.location.search);

    // Update search text
    act(() => {
      result.current.updateURL({
        searchText: 'test'
      }, { immediate: true });
    });

    console.log('After update URL:', window.location.href);
    console.log('After update search:', window.location.search);
    console.log('State after update:', result.current.urlState);

    // Check if URL was updated
    expect(window.location.search).toContain('q=test');
  });

  it('should update URL when page is changed', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // First set a search term
    act(() => {
      result.current.updateURL({
        searchText: 'medicine'
      }, { immediate: true });
    });

    console.log('After search URL:', window.location.search);

    // Then change page
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    console.log('After page change URL:', window.location.search);
    console.log('State after page change:', result.current.urlState);

    // Check if URL contains both search and page
    expect(window.location.search).toContain('q=medicine');
    expect(window.location.search).toContain('page=2');
  });
});