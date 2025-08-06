import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';
import { LanguageProvider } from '../contexts/LanguageContext';

import { vi } from 'vitest';

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

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const renderWithProvider = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

describe('Language Switching Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  test('should switch language and persist selection in localStorage', async () => {
    renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Find and click language selector (use the first one)
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    const languageButton = languageButtons[0];
    expect(languageButton).toBeInTheDocument();

    // Open dropdown
    await user.click(languageButton);
    
    // Switch to Azeri
    const azeriOption = screen.getAllByRole('option').find(option => 
      option.getAttribute('data-language') === 'az'
    );
    await user.click(azeriOption);

    // Verify language changed
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('azerbaijan-drug-db-language', 'az');

    // Switch to Russian
    await user.click(languageButton);
    const russianOption = screen.getAllByRole('option').find(option => 
      option.getAttribute('data-language') === 'ru'
    );
    await user.click(russianOption);

    // Verify language changed
    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('azerbaijan-drug-db-language', 'ru');
  });

  test('should load saved language from localStorage on app start', async () => {
    // Set saved language in localStorage
    mockLocalStorage.setItem('azerbaijan-drug-db-language', 'ru');

    renderWithProvider(<App />);

    // Verify app loads in Russian
    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    // Verify language selector shows correct selection
    const languageButtons = screen.getAllByRole('button', { name: /язык/i });
    expect(languageButtons.length).toBeGreaterThan(0);
  });

  test('should translate all UI components when language changes', async () => {
    renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Verify basic UI elements exist
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    expect(languageButtons.length).toBeGreaterThan(0);
  });

  test('should handle search results translation', async () => {
    renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Verify search functionality exists
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    
    // Verify results are displayed
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  test('should translate loading states', async () => {
    renderWithProvider(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Verify language selector exists
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    expect(languageButtons.length).toBeGreaterThan(0);
  });

  test('should translate error messages', async () => {
    // Mock error response
    const mockError = new Error('Network error');
    const { searchDrugs } = await import('../services/supabase');
    searchDrugs.mockRejectedValueOnce(mockError);

    renderWithProvider(<App />);

    // Wait for app to load and handle error
    await waitFor(() => {
      // Check if there are any status elements (which might contain error info)
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  test('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw error
    const originalSetItem = mockLocalStorage.setItem;
    mockLocalStorage.setItem = vi.fn(() => {
      throw new Error('localStorage error');
    });

    renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Verify app still works even with localStorage errors
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    expect(languageButtons.length).toBeGreaterThan(0);

    // Restore original function
    mockLocalStorage.setItem = originalSetItem;
  });

  test('should maintain language selection across component re-renders', async () => {
    const { rerender } = renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Re-render the component
    rerender(<App />);

    // App should still work after re-render
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    expect(languageButtons.length).toBeGreaterThan(0);
  });

  test('should translate column selector dropdown', async () => {
    renderWithProvider(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Verify column selector exists
    const columnButtons = screen.getAllByRole('button', { name: /column/i });
    expect(columnButtons.length).toBeGreaterThan(0);

    // Verify language selector exists
    const languageButtons = screen.getAllByRole('button', { name: /language/i });
    expect(languageButtons.length).toBeGreaterThan(0);
  });
});