import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import App from '../App';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Supabase
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(() => Promise.resolve({
    data: [
      {
        id: 1,
        number: 'AZ001',
        product_name: 'Test Drug',
        active_ingredients: 'Test Ingredient',
        manufacturer: 'Test Manufacturer',
        country: 'Test Country',
        atc_code: 'A01AA01',
        registration_date: '2023-01-01',
        expiry_date: '2025-01-01',
        dosage_amount: '10mg',
        dosage_form: 'Tablet',
        packaging_form: 'Blister',
        amount: '30',
        wholesale_price: '5.00',
        retail_price: '7.50'
      }
    ],
    count: 1,
    error: null
  })),
  getDrugs: vi.fn(() => Promise.resolve({
    data: [],
    count: 0,
    error: null
  }))
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
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations in Azeri', async () => {
    const { container } = render(<App />);

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations in Russian', async () => {
    const { container } = render(<App />);

    // Switch to Russian
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have proper ARIA labels in all languages', async () => {
    render(<App />);

    // Test English ARIA labels
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Search'));
      
      const languageSelector = screen.getByRole('combobox', { name: /language/i });
      expect(languageSelector).toHaveAttribute('aria-label', expect.stringContaining('Language'));
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('axtarış'));
      
      const azLanguageSelector = screen.getByRole('combobox', { name: /dil/i });
      expect(azLanguageSelector).toHaveAttribute('aria-label', expect.stringContaining('Dil'));
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('Поиск'));
      
      const ruLanguageSelector = screen.getByRole('combobox', { name: /язык/i });
      expect(ruLanguageSelector).toHaveAttribute('aria-label', expect.stringContaining('Язык'));
    });
  });

  test('should have proper heading structure in all languages', async () => {
    render(<App />);

    // Test English headings
    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Azerbaijan Drug Database');
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Azərbaycan Dərman Bazası');
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('База данных лекарств Азербайджана');
    });
  });

  test('should have proper live regions for dynamic content in all languages', async () => {
    render(<App />);

    // Perform search to trigger live region updates
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Check English live regions
    await waitFor(() => {
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      const liveRegion = statusElements.find(el => 
        el.textContent.includes('Found') || el.textContent.includes('result')
      );
      expect(liveRegion).toBeInTheDocument();
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      const statusElements = screen.getAllByRole('status');
      const liveRegion = statusElements.find(el => 
        el.textContent.includes('Tapıldı') || el.textContent.includes('nəticə')
      );
      expect(liveRegion).toBeInTheDocument();
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      const statusElements = screen.getAllByRole('status');
      const liveRegion = statusElements.find(el => 
        el.textContent.includes('Найдено') || el.textContent.includes('результат')
      );
      expect(liveRegion).toBeInTheDocument();
    });
  });

  test('should have proper button labels in all languages', async () => {
    render(<App />);

    // Test English button labels
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /column/i })).toBeInTheDocument();
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /axtarış/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sütun/i })).toBeInTheDocument();
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /поиск/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /столбцы/i })).toBeInTheDocument();
    });
  });

  test('should have proper form labels in all languages', async () => {
    render(<App />);

    // Test English form labels
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search by'));
      
      const languageSelector = screen.getByRole('combobox', { name: /language/i });
      expect(languageSelector).toBeInTheDocument();
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Dərman adı'));
      
      const azLanguageSelector = screen.getByRole('combobox', { name: /dil/i });
      expect(azLanguageSelector).toBeInTheDocument();
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Поиск по'));
      
      const ruLanguageSelector = screen.getByRole('combobox', { name: /язык/i });
      expect(ruLanguageSelector).toBeInTheDocument();
    });
  });

  test('should have proper table accessibility in all languages', async () => {
    render(<App />);

    // Perform search to show table
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Test English table accessibility
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('Drug'));
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('Dərman'));
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('лекарств'));
    });
  });

  test('should have proper error message accessibility in all languages', async () => {
    // Mock error response
    const mockError = new Error('Network error');
    const { searchDrugs } = await import('../services/supabase');
    searchDrugs.mockRejectedValueOnce(mockError);

    render(<App />);

    // Trigger error
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Test English error accessibility
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(expect.stringContaining('Failed'));
    });

    // Reset mock for next test
    const { searchDrugs: searchDrugs2 } = await import('../services/supabase');
    searchDrugs2.mockRejectedValueOnce(mockError);

    // Switch to Russian and test error
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'ru');

    // Clear and search again to trigger error
    await user.clear(searchInput);
    await user.type(searchInput, 'test2');
    
    const ruSearchButton = screen.getByRole('button', { name: /поиск/i });
    await user.click(ruSearchButton);

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(expect.stringContaining('Не удалось'));
    });
  });

  test('should maintain focus management across language changes', async () => {
    render(<App />);

    // Focus on language selector
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    languageSelector.focus();
    expect(document.activeElement).toBe(languageSelector);

    // Change language
    await user.selectOptions(languageSelector, 'az');

    // Focus should be maintained on the language selector
    await waitFor(() => {
      const azLanguageSelector = screen.getByRole('combobox', { name: /dil/i });
      expect(document.activeElement).toBe(azLanguageSelector);
    });
  });

  test('should have proper keyboard navigation in all languages', async () => {
    render(<App />);

    // Test keyboard navigation in English
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    languageSelector.focus();
    
    // Use keyboard to change language
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Verify language changed
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    // Test tab navigation
    await user.tab();
    const searchInput = screen.getByRole('searchbox');
    expect(document.activeElement).toBe(searchInput);

    await user.tab();
    const searchButton = screen.getByRole('button', { name: /axtarış/i });
    expect(document.activeElement).toBe(searchButton);
  });
});