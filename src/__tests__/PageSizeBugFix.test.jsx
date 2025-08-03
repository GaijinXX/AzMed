/**
 * Test to verify the page size bug fix
 * This test ensures that when you change page size and then navigate to another page,
 * the correct page size is maintained.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

describe('Page Size Bug Fix', () => {
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

  it('should maintain page size when navigating between pages', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Change page size to 25
    act(() => {
      result.current.updateURL({
        pageSize: 25,
        currentPage: 1
      }, { immediate: true });
    });

    // Verify page size is updated in state
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(1);

    // Step 2: Navigate to page 2
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Verify that page size is still 25 (not reverted to 10)
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(2);

    // Step 3: Navigate to page 3
    act(() => {
      result.current.updateURL({
        currentPage: 3
      }, { immediate: true });
    });

    // Verify that page size is still 25
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(3);
  });

  it('should maintain page size when performing search after page size change', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Step 1: Change page size to 50
    act(() => {
      result.current.updateURL({
        pageSize: 50,
        currentPage: 1
      }, { immediate: true });
    });

    // Step 2: Perform a search (which should reset to page 1 but keep page size)
    act(() => {
      result.current.updateURL({
        searchText: 'aspirin',
        currentPage: 1
      }, { immediate: true });
    });

    // Verify that page size is still 50
    expect(result.current.urlState.pageSize).toBe(50);
    expect(result.current.urlState.currentPage).toBe(1);
    expect(result.current.urlState.searchText).toBe('aspirin');

    // Step 3: Navigate to page 2 after search
    act(() => {
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    // Verify that page size is still 50
    expect(result.current.urlState.pageSize).toBe(50);
    expect(result.current.urlState.currentPage).toBe(2);
    expect(result.current.urlState.searchText).toBe('aspirin');
  });

  it('should handle URL initialization with custom page size', () => {
    // Set URL with custom page size
    window.history.replaceState({}, '', '/?size=25&page=3');

    const { result } = renderHook(() => useURLState(initialState));

    // Should initialize with page size from URL
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(3);

    // Navigate to another page
    act(() => {
      result.current.updateURL({
        currentPage: 4
      }, { immediate: true });
    });

    // Page size should be maintained
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(4);
  });

  it('should handle invalid page sizes gracefully', () => {
    // Set URL with invalid page size
    window.history.replaceState({}, '', '/?size=999&page=2');

    const { result } = renderHook(() => useURLState(initialState));

    // Should fall back to default page size
    expect(result.current.urlState.pageSize).toBe(10);
    expect(result.current.urlState.currentPage).toBe(2);

    // Change to valid page size
    act(() => {
      result.current.updateURL({
        pageSize: 25
      }, { immediate: true });
    });

    // Should accept valid page size
    expect(result.current.urlState.pageSize).toBe(25);
    expect(result.current.urlState.currentPage).toBe(2);
  });
});