/**
 * Test to verify search URL functionality works correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import SearchBar from '../components/SearchBar/SearchBar';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the sortConfig import
vi.mock('../components/DrugTable/sortConfig.js', () => ({
  SORTABLE_COLUMNS: [
    { key: 'number', labelKey: 'table.headers.number', type: 'numeric', sortable: true },
    { key: 'product_name', labelKey: 'table.headers.product_name', type: 'text', sortable: true }
  ],
  validateSortColumn: vi.fn().mockReturnValue(true),
  getColumnLabel: vi.fn().mockReturnValue('Test Column'),
  getSortAnnouncement: vi.fn().mockReturnValue('Sorted by test column')
}));

// Mock performance monitor
vi.mock('../utils/performance', () => ({
  default: {
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureConcurrentFeature: vi.fn((name, fn) => fn())
  },
  usePerformanceMonitor: () => ({
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureConcurrentFeature: vi.fn((name, fn) => fn()),
    measureBatchingPerformance: vi.fn(),
    measureRender: vi.fn((name, fn) => fn())
  })
}));

describe('Search URL Functionality', () => {
  beforeEach(() => {
    // Clear URL parameters before each test
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  test('SearchBar calls onSearch handler when form is submitted', async () => {
    const mockOnSearch = vi.fn();
    
    render(
      <LanguageProvider>
        <SearchBar onSearch={mockOnSearch} placeholder="Search drugs..." />
      </LanguageProvider>
    );

    // Find the search input
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();

    // Type in search input
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'aspirin' } });
    });

    // Submit the form
    const form = searchInput.closest('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    // Wait for the onSearch handler to be called
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });
  });

  test('URL encoding utilities work correctly', async () => {
    const { encodeStateToURL, decodeURLToState } = await import('../utils/urlStateUtils.js');
    
    // Test encoding
    const state = {
      searchText: 'test search',
      currentPage: 2,
      pageSize: 25,
      sortColumn: 'product_name',
      sortDirection: 'desc',
      visibleColumns: { number: true, product_name: true }
    };
    
    const params = encodeStateToURL(state);
    expect(params.get('q')).toBe('test%20search');
    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('25');
    expect(params.get('sort')).toBe('product_name');
    expect(params.get('dir')).toBe('desc');
    
    // Test decoding
    const decodedState = decodeURLToState(params);
    expect(decodedState.searchText).toBe('test search');
    expect(decodedState.currentPage).toBe(2);
    expect(decodedState.pageSize).toBe(25);
    expect(decodedState.sortColumn).toBe('product_name');
    expect(decodedState.sortDirection).toBe('desc');
  });

  test('URL state hook updates URL correctly', async () => {
    const { useURLState } = require('../hooks/useURLState');
    
    // Test component that uses the hook
    function TestComponent() {
      const { urlState, updateURL } = useURLState({
        searchText: '',
        currentPage: 1,
        pageSize: 10,
        sortColumn: null,
        sortDirection: 'asc',
        visibleColumns: {}
      });

      return (
        <div>
          <button
            onClick={() => updateURL({ searchText: 'test' }, { immediate: true })}
            data-testid="update-search"
          >
            Update Search
          </button>
          <div data-testid="current-search">{urlState.searchText}</div>
        </div>
      );
    }

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const updateButton = screen.getByTestId('update-search');
    
    await act(async () => {
      fireEvent.click(updateButton);
    });

    // Wait for URL to update
    await waitFor(() => {
      const urlParams = new URLSearchParams(window.location.search);
      expect(urlParams.get('q')).toBe('test');
    });

    // Check component state
    expect(screen.getByTestId('current-search')).toHaveTextContent('test');
  });
});