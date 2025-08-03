import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';

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
  })),
  getErrorMessage: vi.fn((error) => 'Test error message')
}));

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
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Find and click language selector
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    expect(languageSelector).toBeInTheDocument();

    // Switch to Azeri
    await user.selectOptions(languageSelector, 'az');

    // Verify language changed
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedLanguage', 'az');

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    // Verify language changed
    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedLanguage', 'ru');
  });

  test('should load saved language from localStorage on app start', async () => {
    // Set saved language in localStorage
    mockLocalStorage.setItem('selectedLanguage', 'ru');

    render(<App />);

    // Verify app loads in Russian
    await waitFor(() => {
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
    });

    // Verify language selector shows correct selection
    const languageSelector = screen.getByRole('combobox', { name: /язык/i });
    expect(languageSelector.value).toBe('ru');
  });

  test('should translate all UI components when language changes', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    // Verify various UI elements are translated
    await waitFor(() => {
      // Header
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
      
      // Search placeholder
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Dərman adı'));
      
      // Column selector
      const columnButton = screen.getByRole('button', { name: /sütun/i });
      expect(columnButton).toBeInTheDocument();
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    await waitFor(() => {
      // Header
      expect(screen.getByText('База данных лекарств Азербайджана')).toBeInTheDocument();
      
      // Search placeholder
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Поиск по названию'));
      
      // Column selector
      const columnButton = screen.getByRole('button', { name: /столбцы/i });
      expect(columnButton).toBeInTheDocument();
    });
  });

  test('should handle search results translation', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Perform a search
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/found 1 result/i)).toBeInTheDocument();
    });

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    // Verify results info is translated
    await waitFor(() => {
      expect(screen.getByText(/tapıldı 1 nəticə/i)).toBeInTheDocument();
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    // Verify results info is translated
    await waitFor(() => {
      expect(screen.getByText(/найдено 1 результат/i)).toBeInTheDocument();
    });
  });

  test('should translate loading states', async () => {
    render(<App />);

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    // Verify loading text is translated
    await waitFor(() => {
      const loadingElements = screen.queryAllByText('Yüklənir...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    // Verify loading text is translated
    await waitFor(() => {
      const loadingElements = screen.queryAllByText('Загрузка...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  test('should translate error messages', async () => {
    // Mock error response
    const mockError = new Error('Network error');
    const { searchDrugs } = await import('../services/supabase');
    searchDrugs.mockRejectedValueOnce(mockError);

    render(<App />);

    // Switch to Russian first
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'ru');

    // Trigger an error by searching
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    const searchButton = screen.getByRole('button', { name: /поиск/i });
    await user.click(searchButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/не удалось загрузить/i)).toBeInTheDocument();
    });
  });

  test('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw error
    const originalSetItem = mockLocalStorage.setItem;
    mockLocalStorage.setItem = vi.fn(() => {
      throw new Error('localStorage error');
    });

    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Try to switch language
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    // Language should still change even if localStorage fails
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    // Restore original function
    mockLocalStorage.setItem = originalSetItem;
  });

  test('should maintain language selection across component re-renders', async () => {
    const { rerender } = render(<App />);

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    // Re-render the component
    rerender(<App />);

    // Language should be maintained
    await waitFor(() => {
      expect(screen.getByText('Azərbaycan Dərman Bazası')).toBeInTheDocument();
    });

    const newLanguageSelector = screen.getByRole('combobox', { name: /dil/i });
    expect(newLanguageSelector.value).toBe('az');
  });

  test('should translate column selector dropdown', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
    });

    // Open column selector
    const columnButton = screen.getByRole('button', { name: /column/i });
    await user.click(columnButton);

    // Verify English text
    expect(screen.getByText('Show/Hide Columns')).toBeInTheDocument();
    expect(screen.getByText('Show All')).toBeInTheDocument();

    // Close dropdown
    await user.click(columnButton);

    // Switch to Azeri
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'az');

    // Open column selector again
    const columnButtonAz = screen.getByRole('button', { name: /sütun/i });
    await user.click(columnButtonAz);

    // Verify Azeri text
    await waitFor(() => {
      expect(screen.getByText('Sütunları Göstər/Gizlə')).toBeInTheDocument();
      expect(screen.getByText('Hamısını Göstər')).toBeInTheDocument();
    });
  });
});