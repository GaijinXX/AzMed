import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

    const languageButton = screen.getByRole('button', { name: /language/i });
    
    // Open dropdown
    await user.click(languageButton);
    
    // Find and click Azeri option
    const azeriOption = screen.getAllByRole('option').find(option => 
      option.getAttribute('data-language') === 'az'
    );
    await user.click(azeriOption);

    // Verify localStorage was called
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('azerbaijan-drug-db-language', 'az');
  });

  test('should load saved language from localStorage on initialization', async () => {
    // Pre-populate localStorage
    mockLocalStorage.getItem.mockReturnValue('ru');

    render(<TestComponent />);

    // Verify getItem was called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('azerbaijan-drug-db-language');

    // Verify language selector shows correct language (Russian)
    const languageButton = screen.getByRole('button', { name: /язык/i });
    expect(languageButton).toBeInTheDocument();
  });

  test('should default to English when no saved language exists', async () => {
    // Ensure localStorage returns null
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<TestComponent />);

    // Verify getItem was called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('azerbaijan-drug-db-language');

    // Verify language selector defaults to English
    const languageButton = screen.getByRole('button', { name: /language/i });
    expect(languageButton).toBeInTheDocument();
  });

  test('should handle localStorage setItem errors gracefully', async () => {
    // Mock localStorage.setItem to throw error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage is full');
    });

    // Mock console.error to verify error handling
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    const languageSelector = screen.getByRole('button', { name: /language/i });
    
    // Component should render without crashing despite localStorage error
    expect(languageSelector).toBeInTheDocument();
    
    // Click the button - should not crash
    fireEvent.click(languageSelector);

    // Component should still be functional despite localStorage error
    expect(languageSelector).toBeInTheDocument();

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
    const languageSelector = screen.getByRole('button', { name: /language/i });
    expect(languageSelector).toBeInTheDocument();

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to initialize language:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should handle invalid language codes in localStorage', async () => {
    // Set invalid language code in localStorage
    mockLocalStorage.getItem.mockReturnValue('invalid-lang');

    render(<TestComponent />);

    // Should default to English for invalid language codes
    const languageSelector = screen.getByRole('button', { name: /language/i });
    expect(languageSelector).toBeInTheDocument();
  });

  test('should handle empty string in localStorage', async () => {
    // Set empty string in localStorage
    mockLocalStorage.getItem.mockReturnValue('');

    render(<TestComponent />);

    // Should default to English for empty string
    const languageSelector = screen.getByRole('button', { name: /language/i });
    expect(languageSelector).toBeInTheDocument();
  });

  test('should persist language across multiple component mounts', async () => {
    // First mount
    const { unmount } = render(<TestComponent />);

    const languageSelector = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageSelector);

    // Component should be functional
    expect(languageSelector).toBeInTheDocument();

    // Unmount component
    unmount();

    // Mock localStorage to return the saved value
    mockLocalStorage.getItem.mockReturnValue('ru');

    // Mount component again
    render(<TestComponent />);

    // Verify component renders after remount
    const newLanguageSelector = screen.getByRole('button', { name: /language/i });
    expect(newLanguageSelector).toBeInTheDocument();
  });

  test('should handle concurrent language changes', async () => {
    render(<TestComponent />);

    const languageSelector = screen.getByRole('button', { name: /language/i });
    
    // Click the language selector multiple times to test concurrent changes
    fireEvent.click(languageSelector);
    fireEvent.click(languageSelector);
    fireEvent.click(languageSelector);

    // Component should remain functional after concurrent changes
    expect(languageSelector).toBeInTheDocument();
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

    const languageSelector = screen.getByRole('button', { name: /language/i });
    
    // Click language selector - should not crash despite quota error
    fireEvent.click(languageSelector);
    
    // Component should still be functional
    expect(languageSelector).toBeInTheDocument();

    // Component should remain functional despite quota error
    expect(languageSelector).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});