/**
 * Test that mimics real-world URL update scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

// Mock console.log to capture debug output
const originalConsoleLog = console.log;
let consoleLogs = [];

beforeEach(() => {
  consoleLogs = [];
  console.log = (...args) => {
    consoleLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Real World URL Test', () => {
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
    consoleLogs = [];
  });

  it('should show debug output when updating URL', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    console.log('=== Starting URL update test ===');
    console.log('Initial URL:', window.location.href);

    // Update search text
    act(() => {
      console.log('=== Calling updateURL ===');
      result.current.updateURL({
        searchText: 'test search'
      }, { immediate: true });
    });

    console.log('=== After updateURL call ===');
    console.log('Final URL:', window.location.href);
    console.log('Final search:', window.location.search);
    console.log('URL State:', result.current.urlState);

    // Print all console logs
    console.log('=== All console logs ===');
    consoleLogs.forEach((log, index) => {
      console.log(`${index}: ${log}`);
    });

    // Check if URL was updated
    expect(window.location.search).toContain('q=test%20search');
  });

  it('should test the exact scenario from the app', async () => {
    const { result } = renderHook(() => useURLState(initialState, {
      onError: (error, context) => {
        console.log('❌ URL State Error:', error.message, context);
      }
    }));

    console.log('=== Testing app scenario ===');

    // Step 1: Search for something
    act(() => {
      console.log('🔍 Simulating handleSearch call');
      result.current.updateURL({
        searchText: 'medicine',
        currentPage: 1
      }, { immediate: true });
    });

    console.log('After search - URL:', window.location.search);
    console.log('After search - State:', result.current.urlState);

    // Step 2: Change page
    act(() => {
      console.log('📄 Simulating handlePageChange call');
      result.current.updateURL({
        currentPage: 2
      }, { immediate: true });
    });

    console.log('After page change - URL:', window.location.search);
    console.log('After page change - State:', result.current.urlState);

    // Verify final state
    expect(result.current.urlState.searchText).toBe('medicine');
    expect(result.current.urlState.currentPage).toBe(2);
    expect(window.location.search).toContain('q=medicine');
    expect(window.location.search).toContain('page=2');
  });
});