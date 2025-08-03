/**
 * Tests for useURLState Hook
 */

import { vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useURLState } from '../useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../../utils/urlStateUtils.js';

// Mock window.history and location
const mockPushState = vi.fn();
const mockReplaceState = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Store original implementations
const originalHistory = window.history;
const originalLocation = window.location;

beforeEach(() => {
  // Reset mocks
  mockPushState.mockClear();
  mockReplaceState.mockClear();
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();

  // Mock window.history
  Object.defineProperty(window, 'history', {
    value: {
      pushState: mockPushState,
      replaceState: mockReplaceState
    },
    writable: true
  });

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://example.com/',
      origin: 'https://example.com',
      pathname: '/',
      search: ''
    },
    writable: true
  });

  // Mock addEventListener/removeEventListener
  window.addEventListener = mockAddEventListener;
  window.removeEventListener = mockRemoveEventListener;
});

afterEach(() => {
  // Restore original implementations
  Object.defineProperty(window, 'history', {
    value: originalHistory,
    writable: true
  });
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true
  });
});

describe('useURLState', () => {
  const initialState = {
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  };

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current.urlState).toEqual(initialState);
    expect(result.current.isURLLoading).toBe(false);
    expect(result.current.isValidURL).toBe(true);
  });

  it('should initialize from URL parameters when available', () => {
    // Mock URL with parameters
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '?q=test&page=2&size=25'
      },
      writable: true
    });

    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current.urlState.searchText).toBe('test');
    expect(result.current.urlState.currentPage).toBe(2);
    expect(result.current.urlState.pageSize).toBe(25);
  });

  it('should update state and URL when updateURL is called', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    act(() => {
      result.current.updateURL({ searchText: 'aspirin', currentPage: 2 });
    });

    // State should be updated immediately
    expect(result.current.urlState.searchText).toBe('aspirin');
    expect(result.current.urlState.currentPage).toBe(2);

    // URL update should be debounced, so wait for it
    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        expect.objectContaining({
          urlState: expect.objectContaining({
            searchText: 'aspirin',
            currentPage: 2
          })
        }),
        '',
        '/?q=aspirin&page=2'
      );
    }, { timeout: 500 });
  });

  it('should replace state and URL when replaceURL is called', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    const newState = {
      ...initialState,
      searchText: 'test',
      currentPage: 3
    };

    act(() => {
      result.current.replaceURL(newState);
    });

    expect(result.current.urlState).toEqual(newState);

    await waitFor(() => {
      expect(mockReplaceState).toHaveBeenCalledWith(
        expect.objectContaining({
          urlState: newState
        }),
        '',
        '/?q=test&page=3'
      );
    }, { timeout: 500 });
  });

  it('should reset to default state when resetURL is called', () => {
    const nonDefaultState = {
      ...initialState,
      searchText: 'test',
      currentPage: 2
    };
    
    const { result } = renderHook(() => useURLState(nonDefaultState));

    act(() => {
      result.current.resetURL();
    });

    // State should be reset to defaults
    expect(result.current.urlState).toEqual(initialState);
  });

  it('should handle immediate updates without debouncing', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    act(() => {
      result.current.updateURL(
        { searchText: 'immediate' },
        { immediate: true }
      );
    });

    // Should update URL immediately without waiting for debounce
    expect(mockPushState).toHaveBeenCalledWith(
      expect.objectContaining({
        urlState: expect.objectContaining({
          searchText: 'immediate'
        })
      }),
      '',
      '/?q=immediate'
    );
  });

  it('should skip URL update when skipURLUpdate option is true', () => {
    const { result } = renderHook(() => useURLState(initialState));

    act(() => {
      result.current.updateURL(
        { searchText: 'no-url-update' },
        { skipURLUpdate: true }
      );
    });

    // State should be updated
    expect(result.current.urlState.searchText).toBe('no-url-update');

    // But URL should not be updated
    expect(mockPushState).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it('should validate state before updating', () => {
    const { result } = renderHook(() => useURLState(initialState));

    act(() => {
      result.current.updateURL({
        currentPage: -1, // Invalid page
        pageSize: 999, // Invalid page size
        sortColumn: 'invalid_column' // Invalid sort column
      });
    });

    // Invalid values should be corrected
    expect(result.current.urlState.currentPage).toBe(1);
    expect(result.current.urlState.pageSize).toBe(10);
    expect(result.current.urlState.sortColumn).toBeNull();
  });

  it('should handle browser navigation events', () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Verify popstate listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));

    // Get the popstate handler
    const popstateHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'popstate'
    )[1];

    // Mock a popstate event with state
    const mockEvent = {
      state: {
        urlState: {
          ...initialState,
          searchText: 'from-history',
          currentPage: 3
        }
      }
    };

    act(() => {
      popstateHandler(mockEvent);
    });

    expect(result.current.urlState.searchText).toBe('from-history');
    expect(result.current.urlState.currentPage).toBe(3);
  });

  it('should handle popstate events without state by parsing URL', () => {
    // Mock URL with parameters
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '?q=from-url&page=4',
        href: 'https://example.com/?q=from-url&page=4'
      },
      writable: true
    });

    const { result } = renderHook(() => useURLState(initialState));

    const popstateHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'popstate'
    )[1];

    // Mock a popstate event without state
    const mockEvent = { state: null };

    act(() => {
      popstateHandler(mockEvent);
    });

    expect(result.current.urlState.searchText).toBe('from-url');
    expect(result.current.urlState.currentPage).toBe(4);
  });

  it('should call onStateChange callback when state changes', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => 
      useURLState(initialState, { onStateChange })
    );

    act(() => {
      result.current.updateURL({ searchText: 'callback-test' });
    });

    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchText: 'callback-test' }),
      initialState
    );
  });

  it('should call onError callback when errors occur', () => {
    const onError = vi.fn();
    
    // Mock pushState to throw an error
    mockPushState.mockImplementation(() => {
      throw new Error('History API error');
    });

    const { result } = renderHook(() => 
      useURLState(initialState, { onError })
    );

    act(() => {
      result.current.updateURL({ searchText: 'error-test' }, { immediate: true });
    });

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'updateBrowserURL'
      })
    );
  });

  it('should disable history when enableHistory is false', async () => {
    const { result } = renderHook(() => 
      useURLState(initialState, { enableHistory: false })
    );

    act(() => {
      result.current.updateURL({ searchText: 'no-history' }, { immediate: true });
    });

    // State should be updated
    expect(result.current.urlState.searchText).toBe('no-history');

    // But history should not be updated
    expect(mockPushState).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();

    // And popstate listener should not be added
    expect(mockAddEventListener).not.toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should use custom debounce delay', async () => {
    const { result } = renderHook(() => 
      useURLState(initialState, { debounceDelay: 100 })
    );

    act(() => {
      result.current.updateURL({ searchText: 'debounced' });
    });

    // Should not update immediately
    expect(mockPushState).not.toHaveBeenCalled();

    // Should update after custom delay
    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should handle URL length validation', async () => {
    const { result } = renderHook(() => useURLState(initialState));

    // Create a very long search text that would make URL too long
    const longSearchText = 'a'.repeat(3000);

    act(() => {
      result.current.updateURL({ searchText: longSearchText }, { immediate: true });
    });

    // Should truncate the search text
    expect(result.current.urlState.searchText.length).toBeLessThan(longSearchText.length);
    expect(result.current.isValidURL).toBe(true);
  });

  it('should provide utility functions', () => {
    const { result } = renderHook(() => useURLState(initialState));

    expect(typeof result.current.isDefaultState).toBe('function');
    expect(typeof result.current.getStateHistory).toBe('function');
    expect(result.current.isDefaultState()).toBe(true);
    expect(Array.isArray(result.current.getStateHistory())).toBe(true);
  });

  it('should provide debug information in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current._debug).toBeDefined();
    expect(result.current._debug.lastURL).toBeDefined();
    expect(result.current._debug.stateHistory).toBeDefined();
    expect(result.current._debug.urlValidation).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not provide debug information in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => useURLState(initialState));

    expect(result.current._debug).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useURLState(initialState));

    unmount();

    // Should remove popstate listener
    expect(mockRemoveEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should handle multiple rapid updates with debouncing', async () => {
    const { result } = renderHook(() => 
      useURLState(initialState, { debounceDelay: 100 })
    );

    // Make multiple rapid updates
    act(() => {
      result.current.updateURL({ searchText: 'update1' });
      result.current.updateURL({ searchText: 'update2' });
      result.current.updateURL({ searchText: 'update3' });
    });

    // State should reflect the last update
    expect(result.current.urlState.searchText).toBe('update3');

    // Should only make one URL update after debounce
    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledTimes(1);
      expect(mockPushState).toHaveBeenCalledWith(
        expect.objectContaining({
          urlState: expect.objectContaining({
            searchText: 'update3'
          })
        }),
        '',
        '/?q=update3'
      );
    }, { timeout: 200 });
  });
});