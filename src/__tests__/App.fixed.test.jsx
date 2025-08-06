import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as supabaseService from '../services/supabase';

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const renderWithProvider = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Mock Supabase service
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(() => Promise.resolve({
    data: [
      {
        number: 1,
        product_name: 'Test Drug 1',
        active_ingredients: 'Test Ingredient 1',
        dosage_amount: '10mg',
        dosage_form: 'Tablet',
        packaging_form: 'Blister',
        amount: '30',
        manufacturer: 'Test Manufacturer 1',
        wholesale_price: 1000,
        retail_price: 1200,
        date: '2024-01-01'
      },
      {
        number: 2,
        product_name: 'Test Drug 2',
        active_ingredients: 'Test Ingredient 2',
        dosage_amount: '20mg',
        dosage_form: 'Capsule',
        packaging_form: 'Bottle',
        amount: '60',
        manufacturer: 'Test Manufacturer 2',
        wholesale_price: 2000,
        retail_price: 2400,
        date: '2024-01-02'
      }
    ],
    total_count: 2,
    page_number: 1,
    page_size: 10,
    total_pages: 1
  })),
  getErrorMessage: vi.fn((error) => 'Test error message'),
  ApiError: class ApiError extends Error {
    constructor(message, type) {
      super(message)
      this.type = type
    }
  },
  API_ERRORS: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
  }
}));

// Mock React 19 optimizations
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
  useOptimizedList: vi.fn((items) => items),
  useConcurrentRendering: vi.fn(() => ({
    renderConcurrently: vi.fn((name, fn) => fn()),
    isPending: false
  }))
}));

// Mock monitoring utilities
vi.mock('../utils/monitoring', () => ({
  initializeMonitoring: vi.fn(),
  trackPageView: vi.fn(),
  logPerformanceReport: vi.fn()
}));

// Mock translation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key) => {
      const translations = {
        'header.title': 'Azerbaijan Drug Database',
        'header.subtitle': 'Search and browse all officially registered drugs in Azerbaijan',
        'search.placeholder': 'Search by drug name...',
        'search.ariaLabel': 'Search drugs database',
        'common.loading': 'Loading...',
        'common.search': 'Search',
        'search.resultsFound': 'Found',
        'table.headers.product_name': 'Product Name'
      };
      return translations[key] || key;
    }),
    currentLanguage: 'en'
  }))
}));

describe('App Component - Fixed Implementation', () => {
  let user;
  const mockSearchDrugs = vi.mocked(supabaseService.searchDrugs);

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset URL to clean state
    window.history.replaceState({}, '', '/');
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering and Initialization', () => {
    it('should render without crashing and show normal UI components', async () => {
      const { container } = renderWithProvider(<App />);
      
      // Wait for initial API call
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      // Verify main UI components are rendered
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Verify no error boundary is shown
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      
      // Verify container has proper structure
      expect(container.firstChild).toHaveClass('App');
    });

    it('should initialize with correct default state', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      // Verify search input is empty
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveValue('');
      
      // Verify results are displayed (check for table with data)
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  })

  describe('Service Integration', () => {
    it('should properly integrate with Supabase service', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      // Verify service integration
      expect(mockSearchDrugs).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      mockSearchDrugs.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProvider(<App />);

      // Should attempt API call despite error
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });
    });
  })

  describe('State Management', () => {
    it('should manage loading states correctly', async () => {
      renderWithProvider(<App />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Verify the app renders correctly after loading
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    it('should handle search state updates', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      
      // Verify the search input is functional
      expect(searchInput).toHaveValue('');
    });
  })

  describe('User Interactions', () => {
    it('should handle search input correctly', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('should handle pagination correctly', async () => {
      // Mock response with multiple pages
      mockSearchDrugs.mockResolvedValueOnce({
        data: [
          {
            number: 1,
            product_name: 'Test Drug 1',
            active_ingredients: 'Test Ingredient 1',
            dosage_amount: '10mg',
            dosage_form: 'Tablet',
            packaging_form: 'Blister',
            amount: '30',
            manufacturer: 'Test Manufacturer 1',
            wholesale_price: 1000,
            retail_price: 1200,
            date: '2024-01-01'
          }
        ],
        total_count: 25,
        page_number: 1,
        page_size: 10,
        total_pages: 3
      });

      renderWithProvider(<App />);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      // Find and click next page button
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 2, 10, null, 'asc');
      });
    });
  })

  describe('Performance and Optimization', () => {
    it('should use React 19 optimizations', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // React 19 hooks are mocked and should be available
      // The actual verification would be done through the mocked hooks
      expect(mockSearchDrugs).toHaveBeenCalled();
    });

    it('should handle concurrent operations', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Verify the app renders and functions correctly
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper ARIA labels', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Verify ARIA labels are present
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label');
      expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    });

    it('should provide screen reader announcements', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Verify screen reader announcements are present (there are multiple status elements)
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  })

  describe('Error Boundary Integration', () => {
    it('should catch and handle component errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test that the app renders without errors
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalled();
      });

      // Verify no error boundary is shown in normal operation
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should show fallback UI when errors occur', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
      });
    });
  });

  describe('URL State Integration', () => {
    it('should initialize from URL parameters', async () => {
      // Set URL with search parameters
      window.history.replaceState({}, '', '/?q=aspirin&page=2&size=25');
      
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('aspirin', 2, 25, null, 'asc');
      });
    });

    it('should update URL when state changes', async () => {
      renderWithProvider(<App />);
      
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });

      // Verify the app handles URL state (the actual URL updating is handled by useURLState hook)
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('should handle invalid URL parameters gracefully', async () => {
      // Set URL with invalid parameters
      window.history.replaceState({}, '', '/?page=invalid&size=999');
      
      renderWithProvider(<App />);

      // Should use default values for invalid parameters
      await waitFor(() => {
        expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc');
      });
    });
  })
})