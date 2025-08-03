import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector/LanguageSelector';

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

// Test component that uses language context
const TestComponent = () => {
  return (
    <LanguageProvider>
      <div>
        <LanguageSelector />
        <div data-testid="test-content">Test Content</div>
      </div>
    </LanguageProvider>
  );
};

describe('Language Persistence Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  test('should save language selection to localStorage', async () => {
    render(<TestComponent />);

    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    
    // Switch to Azeri
    await user.selectOptions(languageSelector, 'az');

    // Verify localStorage was called
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedLanguage', 'az');

    // Switch to Russian
    await user.selectOptions(languageSelector, 'ru');

    // Verify localStorage was called again
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedLanguage', 'ru');
  });

  test('should load saved language from localStorage on initialization', async () => {
    // Pre-populate localStorage
    mockLocalStorage.getItem.mockReturnValue('ru');

    render(<TestComponent />);

    // Verify getItem was called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selectedLanguage');

    // Verify language selector shows correct value
    const languageSelector = screen.getByRole('combobox', { name: /язык/i });
    expect(languageSelector.value).toBe('ru');
  });

  test('should default to English when no saved language exists', async () => {
    // Ensure localStorage returns null
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<TestComponent />);

    // Verify getItem was called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selectedLanguage');

    // Verify language selector defaults to English
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    expect(languageSelector.value).toBe('en');
  });

  test('should handle localStorage setItem errors gracefully', async () => {
    // Mock localStorage.setItem to throw error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage is full');
    });

    // Mock console.error to verify error handling
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    
    // Switch language - should not crash
    await user.selectOptions(languageSelector, 'az');

    // Language should still change despite localStorage error
    await waitFor(() => {
      const azeriSelector = screen.getByRole('combobox', { name: /dil/i });
      expect(azeriSelector.value).toBe('az');
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save language preference:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should handle localStorage getItem errors gracefully', async () => {
    // Mock localStorage.getItem to throw error
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage access denied');
    });

    // Mock console.error to verify error handling
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    // Should default to English despite localStorage error
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    expect(languageSelector.value).toBe('en');

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load language preference:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should handle invalid language codes in localStorage', async () => {
    // Set invalid language code in localStorage
    mockLocalStorage.getItem.mockReturnValue('invalid-lang');

    render(<TestComponent />);

    // Should default to English for invalid language codes
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    expect(languageSelector.value).toBe('en');
  });

  test('should handle empty string in localStorage', async () => {
    // Set empty string in localStorage
    mockLocalStorage.getItem.mockReturnValue('');

    render(<TestComponent />);

    // Should default to English for empty string
    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    expect(languageSelector.value).toBe('en');
  });

  test('should persist language across multiple component mounts', async () => {
    // First mount
    const { unmount } = render(<TestComponent />);

    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    await user.selectOptions(languageSelector, 'ru');

    // Verify localStorage was called
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedLanguage', 'ru');

    // Unmount component
    unmount();

    // Mock localStorage to return the saved value
    mockLocalStorage.getItem.mockReturnValue('ru');

    // Mount component again
    render(<TestComponent />);

    // Verify language is restored
    const newLanguageSelector = screen.getByRole('combobox', { name: /язык/i });
    expect(newLanguageSelector.value).toBe('ru');
  });

  test('should handle concurrent language changes', async () => {
    render(<TestComponent />);

    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    
    // Rapidly change languages
    await user.selectOptions(languageSelector, 'az');
    await user.selectOptions(languageSelector, 'ru');
    await user.selectOptions(languageSelector, 'en');

    // Verify final state
    expect(languageSelector.value).toBe('en');
    
    // Verify localStorage was called for each change
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith('selectedLanguage', 'en');
  });

  test('should handle localStorage quota exceeded error', async () => {
    // Mock localStorage.setItem to throw quota exceeded error
    mockLocalStorage.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    const languageSelector = screen.getByRole('combobox', { name: /language/i });
    
    // Switch language
    await user.selectOptions(languageSelector, 'az');

    // Language should still change
    await waitFor(() => {
      const azeriSelector = screen.getByRole('combobox', { name: /dil/i });
      expect(azeriSelector.value).toBe('az');
    });

    // Verify specific error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save language preference:',
      expect.objectContaining({ name: 'QuotaExceededError' })
    );

    consoleSpy.mockRestore();
  });
});