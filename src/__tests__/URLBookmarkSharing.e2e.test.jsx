/**
 * End-to-End Tests for URL Bookmark and Sharing Functionality
 * Tests the complete bookmark/sharing workflow and direct URL access
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../App';

// Mock all external dependencies
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(),
  getErrorMessage: vi.fn((error) => error.message || 'An error occurred'),
  ApiError: class ApiError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ApiError';
    }
  }
}));

vi.mock('../services/errorLogger', () => ({
  default: {
    logApiError: vi.fn(),
    logError: vi.fn()
  }
}));

vi.mock('../utils/performance', () => ({
  default: {
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureConcurrentFeature: vi.fn((name, fn) => fn())
  },
  usePerformanceMonitor: vi.fn(() => ({
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureRender: vi.fn((name, fn) => fn()),
    measureApiCall: vi.fn((name, fn) => fn()),
    measureConcurrentFeature: vi.fn((name, fn) => fn()),
    measureBatchingPerformance: vi.fn((fn) => fn())
  }))
}));

vi.mock('../utils/performanceAnalysis', () => ({
  logPerformanceReport: vi.fn()
}));

vi.mock('../hooks/useReact19Optimizations', () => ({
  useOptimizedUpdates: vi.fn(() => ({
    batchUpdate: vi.fn((fn) => fn()),
    immediateUpdate: vi.fn((fn) => fn()),
    isPending: false
  })),
  useOptimizedFetch: vi.fn((fn) => ({ fetch: fn })),
  useCompilerOptimizations: vi.fn(() => ({
    trackRender: vi.fn(),
    isCompilerActive: false
  })),
  useMemoryOptimization: vi.fn(() => ({
    cleanup: vi.fn(),
    trackMemoryUsage: vi.fn()
  })),
  useOptimizedList: vi.fn((items) => items)
}));

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key, fallback) => fallback || key || 'Test Text')
  }))
}));

describe('URL Bookmark and Sharing E2E Tests', () => {
  let mockSearchDrugs;
  
  const mockDrugData = [
    {
      number: '001',
      product_name: 'Aspirin 100mg',
      active_ingredients: 'Acetylsalicylic acid',
      dosage_amount: '100mg',
      dosage_form: 'Tablet',
      packaging_form: 'Bottle',
      amount: '30 tablets',
      manufacturer: 'PharmaCorp',
      wholesale_price: '5.00',
      retail_price: '10.00',
      date: '2023-01-01'
    },
    {
      number: '002',
      product_name: 'Ibuprofen 200mg',
      active_ingredients: 'Ibuprofen',
      dosage_amount: '200mg',
      dosage_form: 'Tablet',
      packaging_form: 'Blister',
      amount: '20 tablets',
      manufacturer: 'MediLabs',
      wholesale_price: '8.00',
      retail_price: '15.00',
      date: '2023-01-02'
    }
  ];

  beforeEach(async () => {
    // Get the mocked function
    const supabaseModule = await import('../services/supabase');
    mockSearchDrugs = supabaseModule.searchDrugs;
    
    // Reset URL to clean state
    window.history.replaceState({}, '', '/');
    
    // Mock successful API response
    mockSearchDrugs.mockResolvedValue({
      data: mockDrugData,
      total_count: mockDrugData.length,
      total_pages: 1,
      page_number: 1,
      page_size: 10
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct URL Access (Bookmarks)', () => {
    it('should restore complete search state from bookmarked URL', async () => {
      // Simulate user navigating to a bookmarked URL with all parameters
      const bookmarkedURL = '/?q=aspirin&page=2&size=25&sort=product_name&dir=desc&cols=number,product_name,retail_price';
      window.history.replaceState({}, '', bookmarkedURL);

      render(<App />);

      // Wait for component to initialize and API call to be made with URL parameters
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('aspirin', 2, 25, 'product_name', 'desc');
      });

      // Verify URL parameters are preserved
      expect(window.location.search).toContain('q=aspirin');
      expect(window.location.search).toContain('page=2');
      expect(window.location.search).toContain('size=25');
      expect(window.location.search).toContain('sort=product_name');
      expect(window.location.search).toContain('dir=desc');
      expect(window.location.search).toContain('cols=number,product_name,retail_price');
    });

    it('should handle bookmarked URL with search term containing special characters', async () => {
      const specialSearchTerm = 'aspirin & ibuprofen (pain relief)';
      const encodedSearchTerm = encodeURIComponent(specialSearchTerm);
      const bookmarkedURL = `/?q=${encodedSearchTerm}`;
      
      window.history.replaceState({}, '', bookmarkedURL);

      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith(specialSearchTerm, 1, 10, null, 'asc');
      });

      // Verify the search term is properly decoded and preserved
      const urlParams = new URLSearchParams(window.location.search);
      expect(decodeURIComponent(urlParams.get('q'))).toBe(specialSearchTerm);
    });

    it('should handle bookmarked URL with partial parameters', async () => {
      // URL with only search and page parameters
      const partialURL = '/?q=medicine&page=3';
      window.history.replaceState({}, '', partialURL);

      render(<App />);

      await waitFor(() => {
        // Should use defaults for missing parameters
        expect(mockSearchDrugs).toHaveBeenCalledWith('medicine', 3, 10, null, 'asc');
      });

      // Verify URL contains provided parameters and omits defaults
      expect(window.location.search).toContain('q=medicine');
      expect(window.location.search).toContain('page=3');
      expect(window.location.search).not.toContain('size=10'); // Default omitted
      expect(window.location.search).not.toContain('dir=asc'); // Default omitted
    });

    it('should gracefully handle malformed bookmarked URLs', async () => {
      // URL with invalid parameters
      const malformedURL = '/?q=test&page=invalid&size=999&sort=nonexistent&dir=wrong&cols=invalid,columns';
      window.history.replaceState({}, '', malformedURL);

      render(<App />);

      await waitFor(() => {
        // Should use valid search term and fallback to defaults for invalid parameters
        expect(mockSearchDrugs).toHaveBeenCalledWith('test', 1, 10, null, 'asc');
      });

      // Verify URL is cleaned up to remove invalid parameters
      await waitFor(() => {
        const search = window.location.search;
        expect(search).toContain('q=test');
        expect(search).not.toContain('page=invalid');
        expect(search).not.toContain('size=999');
        expect(search).not.toContain('sort=nonexistent');
        expect(search).not.toContain('dir=wrong');
      }, { timeout: 2000 });
    });
  });

  describe('URL Sharing Scenarios', () => {
    it('should generate shareable URLs that preserve complete search state', async () => {
      render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Simulate user performing a complex search
      const searchInput = screen.getByRole('searchbox');
      const searchForm = searchInput.closest('form');

      // Perform search
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'pain relief' } });
        fireEvent.submit(searchForm);
      });

      // Wait for URL to update
      await waitFor(() => {
        expect(window.location.search).toContain('q=pain%20relief');
      });

      // Simulate changing page size
      const pageSizeSelect = screen.getByLabelText(/items per page/i);
      await act(async () => {
        fireEvent.change(pageSizeSelect, { target: { value: '25' } });
      });

      await waitFor(() => {
        expect(window.location.search).toContain('size=25');
      });

      // The current URL should be shareable and contain all state
      const shareableURL = window.location.href;
      expect(shareableURL).toContain('q=pain%20relief');
      expect(shareableURL).toContain('size=25');

      // Verify API was called with the correct parameters
      expect(mockSearchDrugs).toHaveBeenCalledWith('pain relief', 1, 25, null, 'asc');
    });

    it('should create clean shareable URLs by omitting default values', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Perform a simple search (other parameters remain default)
      const searchInput = screen.getByRole('searchbox');
      const searchForm = searchInput.closest('form');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'simple search' } });
        fireEvent.submit(searchForm);
      });

      await waitFor(() => {
        const search = window.location.search;
        expect(search).toContain('q=simple%20search');
        // Default values should be omitted for cleaner URLs
        expect(search).not.toContain('page=1');
        expect(search).not.toContain('size=10');
        expect(search).not.toContain('dir=asc');
      });
    });

    it('should handle URL sharing with column visibility settings', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Simulate changing column visibility
      const columnButton = screen.getByRole('button', { name: /columns/i });
      await act(async () => {
        fireEvent.click(columnButton);
      });

      // Toggle some columns
      const manufacturerCheckbox = screen.getByRole('menuitemcheckbox', { name: /manufacturer/i });
      await act(async () => {
        fireEvent.click(manufacturerCheckbox);
      });

      // Wait for URL to update with column settings
      await waitFor(() => {
        expect(window.location.search).toContain('cols=');
      });

      // The URL should be shareable with column settings preserved
      const shareableURL = window.location.href;
      expect(shareableURL).toContain('cols=');
    });
  });

  describe('Cross-Session URL Persistence', () => {
    it('should maintain search state across browser sessions', async () => {
      // Simulate first session - user performs search and gets URL
      const firstSessionURL = '/?q=medication&page=2&size=50&sort=retail_price&dir=desc';
      window.history.replaceState({}, '', firstSessionURL);

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('medication', 2, 50, 'retail_price', 'desc');
      });

      // Unmount component (simulate closing browser/tab)
      unmount();

      // Clear mocks to simulate fresh session
      vi.clearAllMocks();

      // Simulate second session - user opens the same URL
      window.history.replaceState({}, '', firstSessionURL);
      render(<App />);

      // Should restore the exact same state
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('medication', 2, 50, 'retail_price', 'desc');
      });

      // URL should be preserved
      expect(window.location.search).toBe('?q=medication&page=2&size=50&sort=retail_price&dir=desc');
    });

    it('should handle URL state restoration after browser refresh', async () => {
      // Set up a complex URL state
      const complexURL = '/?q=complex%20search&page=3&size=25&sort=product_name&dir=asc&cols=number,product_name,manufacturer,retail_price';
      window.history.replaceState({}, '', complexURL);

      render(<App />);

      // Should restore all parameters correctly
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('complex search', 3, 25, 'product_name', 'asc');
      });

      // All URL parameters should be preserved
      const urlParams = new URLSearchParams(window.location.search);
      expect(urlParams.get('q')).toBe('complex search');
      expect(urlParams.get('page')).toBe('3');
      expect(urlParams.get('size')).toBe('25');
      expect(urlParams.get('sort')).toBe('product_name');
      expect(urlParams.get('dir')).toBe('asc');
      expect(urlParams.get('cols')).toBe('number,product_name,manufacturer,retail_price');
    });
  });

  describe('URL Length and Performance', () => {
    it('should handle very long search terms in URLs', async () => {
      const longSearchTerm = 'a'.repeat(200); // Maximum allowed length
      const longURL = `/?q=${encodeURIComponent(longSearchTerm)}`;
      
      window.history.replaceState({}, '', longURL);

      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith(longSearchTerm, 1, 10, null, 'asc');
      });

      // URL should handle the long search term
      const urlParams = new URLSearchParams(window.location.search);
      expect(decodeURIComponent(urlParams.get('q'))).toBe(longSearchTerm);
    });

    it('should truncate excessively long search terms to prevent URL issues', async () => {
      const excessivelyLongSearchTerm = 'a'.repeat(500); // Exceeds maximum
      const longURL = `/?q=${encodeURIComponent(excessivelyLongSearchTerm)}`;
      
      window.history.replaceState({}, '', longURL);

      render(<App />);

      await waitFor(() => {
        // Should be called with truncated search term
        const callArgs = mockSearchDrugs.mock.calls[0];
        expect(callArgs[0].length).toBeLessThanOrEqual(200);
      });

      // URL should contain truncated search term
      const urlParams = new URLSearchParams(window.location.search);
      const actualSearchTerm = decodeURIComponent(urlParams.get('q'));
      expect(actualSearchTerm.length).toBeLessThanOrEqual(200);
    });

    it('should handle URLs with maximum parameter combinations efficiently', async () => {
      // URL with all possible parameters
      const maxURL = '/?q=comprehensive%20search&page=100&size=100&sort=product_name&dir=desc&cols=number,product_name,active_ingredients,dosage_amount,dosage_form,packaging_form,amount,manufacturer,wholesale_price,retail_price,date';
      
      window.history.replaceState({}, '', maxURL);

      const startTime = performance.now();
      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle complex URLs efficiently (under 1 second)
      expect(renderTime).toBeLessThan(1000);

      // All parameters should be processed correctly
      expect(mockSearchDrugs).toHaveBeenCalledWith('comprehensive search', 100, 100, 'product_name', 'desc');
    });
  });

  describe('Browser Navigation Integration', () => {
    it('should support browser back/forward with bookmarked URLs', async () => {
      // Start with a bookmarked URL
      const initialURL = '/?q=initial&page=1';
      window.history.replaceState({}, '', initialURL);

      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('initial', 1, 10, null, 'asc');
      });

      // Simulate navigation to a new state
      const newURL = '/?q=updated&page=2';
      window.history.pushState({}, '', newURL);
      
      // Trigger popstate event (browser back button)
      fireEvent(window, new PopStateEvent('popstate', { 
        state: { 
          urlState: {
            searchText: 'initial',
            currentPage: 1,
            pageSize: 10,
            sortColumn: null,
            sortDirection: 'asc',
            visibleColumns: {}
          }
        }
      }));

      // Should restore the previous state
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('initial', 1, 10, null, 'asc');
      });
    });

    it('should maintain URL integrity during navigation', async () => {
      const bookmarkedURL = '/?q=navigation%20test&page=5&size=25';
      window.history.replaceState({}, '', bookmarkedURL);

      render(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('navigation test', 5, 25, null, 'asc');
      });

      // Perform additional search
      const searchInput = screen.getByRole('searchbox');
      const searchForm = searchInput.closest('form');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'new search' } });
        fireEvent.submit(searchForm);
      });

      // URL should update while maintaining integrity
      await waitFor(() => {
        expect(window.location.search).toContain('q=new%20search');
        expect(window.location.search).toContain('page=1'); // Should reset to page 1
        expect(window.location.search).toContain('size=25'); // Should preserve page size
      });
    });
  });

  describe('Error Recovery in URL Sharing', () => {
    it('should provide fallback when shared URL contains corrupted parameters', async () => {
      // Simulate corrupted URL parameters
      const corruptedURL = '/?q=test&page=NaN&size=undefined&sort=null&dir=&cols=';
      window.history.replaceState({}, '', corruptedURL);

      render(<App />);

      // Should recover gracefully and use valid defaults
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('test', 1, 10, null, 'asc');
      });

      // URL should be cleaned up
      await waitFor(() => {
        const search = window.location.search;
        expect(search).toContain('q=test');
        expect(search).not.toContain('NaN');
        expect(search).not.toContain('undefined');
        expect(search).not.toContain('null');
      }, { timeout: 2000 });
    });

    it('should handle network errors gracefully while preserving URL state', async () => {
      const validURL = '/?q=network%20test&page=2';
      window.history.replaceState({}, '', validURL);

      // Mock API to throw network error
      mockSearchDrugs.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      // Should attempt API call with URL parameters despite error
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('network test', 2, 10, null, 'asc');
      });

      // URL state should be preserved even when API fails
      expect(window.location.search).toContain('q=network%20test');
      expect(window.location.search).toContain('page=2');
    });
  });
});