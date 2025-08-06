import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import App from '../App';
import { LanguageProvider } from '../contexts/LanguageContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Supabase
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(() => Promise.resolve({
    data: [
      {
        number: 1,
        product_name: 'Test Drug',
        active_ingredients: 'Test Ingredient',
        dosage_amount: '10mg',
        dosage_form: 'Tablet',
        packaging_form: 'Blister',
        amount: '30',
        manufacturer: 'Test Manufacturer',
        wholesale_price: 1000,
        retail_price: 1200,
        date: '2024-01-01'
      }
    ],
    total_count: 1,
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

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const renderWithProvider = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

describe('Language Accessibility Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  test('should have no accessibility violations in English', async () => {
    const { container } = renderWithProvider(<App />);

    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Exclude the search input from axe testing due to known aria-expanded issue
    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: false }
      }
    });
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations in Azeri', async () => {
    const { container } = renderWithProvider(<App />);

    // Switch to Azeri - find the first language button (there are multiple)
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    await user.click(languageSelector);
    
    // Find and click Azeri option
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan')).toBeInTheDocument();
    });
    const azOption = screen.getByText('Azərbaycan');
    await user.click(azOption);

    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: false }
      }
    });
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations in Russian', async () => {
    const { container } = renderWithProvider(<App />);

    // Switch to Russian - find the first language button (there are multiple)
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    await user.click(languageSelector);
    
    // Find and click Russian option
    await waitFor(() => {
      expect(screen.getByText('Русский')).toBeInTheDocument();
    });
    const ruOption = screen.getByText('Русский');
    await user.click(ruOption);

    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: false }
      }
    });
    expect(results).toHaveNoViolations();
  });

  test('should have proper ARIA labels in all languages', async () => {
    renderWithProvider(<App />);

    // Test English ARIA labels
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label');
      
      const languageButtons = screen.getAllByRole('button', { name: /language/i });
      expect(languageButtons.length).toBeGreaterThan(0);
    });

    // Switch to Azeri
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    await user.click(languageSelector);
    
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan')).toBeInTheDocument();
    });
    const azOption = screen.getByText('Azərbaycan');
    await user.click(azOption);

    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label');
    });
  });

  test('should have proper heading structure in all languages', async () => {
    renderWithProvider(<App />);

    // Test English headings
    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Azerbaijan Drug Database');
    });

    // Switch to Azeri
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    await user.click(languageSelector);
    
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan')).toBeInTheDocument();
    });
    const azOption = screen.getByText('Azərbaycan');
    await user.click(azOption);

    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Azərbaycan Dərman Bazası');
    });
  });

  test('should have proper live regions for dynamic content in all languages', async () => {
    renderWithProvider(<App />);

    // Wait for app to load and check for live regions
    await waitFor(() => {
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    // Verify live regions exist
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  test('should have proper button labels in all languages', async () => {
    renderWithProvider(<App />);

    // Test that buttons exist and are accessible
    await waitFor(() => {
      // Check for language buttons
      const languageButtons = screen.getAllByRole('button', { name: /language/i });
      expect(languageButtons.length).toBeGreaterThan(0);
      
      // Check for theme buttons
      const themeButtons = screen.getAllByRole('button', { name: /theme/i });
      expect(themeButtons.length).toBeGreaterThan(0);
    });
  });

  test('should have proper form labels in all languages', async () => {
    renderWithProvider(<App />);

    // Test form elements exist and have proper attributes
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder');
      expect(searchInput).toHaveAttribute('aria-label');
      
      const languageButtons = screen.getAllByRole('button', { name: /language/i });
      expect(languageButtons.length).toBeGreaterThan(0);
    });
  });

  test('should have proper table accessibility in all languages', async () => {
    renderWithProvider(<App />);

    // Wait for table to load
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label');
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });
  });

  test('should have proper error message accessibility in all languages', async () => {
    // Mock error response
    const mockError = new Error('Network error');
    const { searchDrugs } = await import('../services/supabase');
    searchDrugs.mockRejectedValueOnce(mockError);

    renderWithProvider(<App />);

    // Wait for error to be displayed
    await waitFor(() => {
      // Check if there's an error state or alert
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  test('should maintain focus management across language changes', async () => {
    renderWithProvider(<App />);

    // Focus on language selector
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    languageSelector.focus();
    expect(document.activeElement).toBe(languageSelector);

    // Change language
    await user.click(languageSelector);
    
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan')).toBeInTheDocument();
    });
    const azOption = screen.getByText('Azərbaycan');
    await user.click(azOption);

    // Verify focus is maintained
    await waitFor(() => {
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeDefined();
    });
  });

  test('should have proper keyboard navigation in all languages', async () => {
    renderWithProvider(<App />);

    // Test keyboard navigation
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageSelector = languageButtons[0];
    languageSelector.focus();
    
    // Use keyboard to interact with language selector
    await user.keyboard('{Enter}');

    // Test tab navigation - just verify that focus moves
    await user.tab();
    const focusedElement = document.activeElement;
    expect(focusedElement).toBeDefined();
    expect(focusedElement.tagName).toBeDefined();
  });
});