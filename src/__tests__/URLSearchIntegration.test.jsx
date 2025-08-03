/**
 * Integration test for URL search functionality
 * Tests the complete flow from search input to URL update
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useURLState } from '../hooks/useURLState';
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
    measureBatchingPerformance: vi.fn()
  })
}));

// Test component that uses useURLState hook
function TestSearchComponent() {
  const { urlState, updateURL } = useURLState({
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: {}
  });

  const handleSearch = (searchText) => {
    console.log('🔍 Test handleSearch called with:', searchText);
    updateURL({
      searchText,
      currentPage: 1
    }, { immediate: true });
  };

  return (
    <div>
      <input
        data-testid="search-input"
        type="text"
        value={urlState.searchText}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search drugs..."
      />
      <div data-testid="current-search">{urlState.searchText}</div>
      <div data-testid="current-page">{urlState.currentPage}</div>
    </div>
  );
}

describe('URL Search Integration', () => {
  beforeEach(() => {
    // Clear URL parameters before each test
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  test('should update URL when search text changes', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <LanguageProvider>
        <TestSearchComponent />
      </LanguageProvider>
    );

    const searchInput = screen.getByTestId('search-input');
    
    // Type in search input
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'aspirin' } });
    });

    // Wait for URL to update
    await waitFor(() => {
      const urlParams = new URLSearchParams(window.location.search);
      expect(urlParams.get('q')).toBe('aspirin');
    }, { timeout: 1000 });

    // Check that the component state is updated
    expect(screen.getByTestId('current-search')).toHaveTextContent('aspirin');
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');

    consoleSpy.mockRestore();
  });

  test('should handle empty search text', async () => {
    render(
      <LanguageProvider>
        <TestSearchComponent />
      </LanguageProvider>
    );

    const searchInput = screen.getByTestId('search-input');
    
    // First add some text
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    // Wait for URL to update
    await waitFor(() => {
      const urlParams = new URLSearchParams(window.location.search);
      expect(urlParams.get('q')).toBe('test');
    });

    // Then clear the text
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '' } });
    });

    // Wait for URL to be cleared
    await waitFor(() => {
      const urlParams = new URLSearchParams(window.location.search);
      expect(urlParams.get('q')).toBeNull(); // Empty search should not be in URL
    });
  });

  test('should handle special characters in search', async () => {
    render(
      <LanguageProvider>
        <TestSearchComponent />
      </LanguageProvider>
    );

    const searchInput = screen.getByTestId('search-input');
    const specialText = 'test & search + more';
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: specialText } });
    });

    await waitFor(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const decodedValue = decodeURIComponent(urlParams.get('q') || '');
      expect(decodedValue).toBe(specialText);
    });
  });

  test('should restore search from URL on page load', async () => {
    // Set initial URL with search parameter
    window.history.replaceState({}, '', '/?q=initial%20search');

    render(
      <LanguageProvider>
        <TestSearchComponent />
      </LanguageProvider>
    );

    // Component should initialize with search text from URL
    await waitFor(() => {
      expect(screen.getByTestId('current-search')).toHaveTextContent('initial search');
    });

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput.value).toBe('initial search');
  });
});