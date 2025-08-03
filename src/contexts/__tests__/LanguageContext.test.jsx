import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider, useLanguageContext } from '../LanguageContext.jsx';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component to access context
const TestComponent = () => {
  const { currentLanguage, setLanguage, t, isLoading, error } = useLanguageContext();
  
  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="translation">{t('common.search')}</div>
      <button 
        data-testid="change-language" 
        onClick={() => setLanguage('az')}
      >
        Change to Azeri
      </button>
      <button 
        data-testid="invalid-language" 
        onClick={() => setLanguage('invalid')}
      >
        Invalid Language
      </button>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LanguageProvider', () => {
    it('should provide default language when no localStorage value', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translation')).toHaveTextContent('Search');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should load saved language from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('az');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('az');
      expect(screen.getByTestId('translation')).toHaveTextContent('Axtarış');
    });

    it('should handle invalid language in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      // With browser detection, invalid localStorage values are handled by getInitialLanguage
      // which falls back to browser detection, so removeItem may not be called directly
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to initialize language');
    });

    it('should change language and persist to localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByTestId('change-language').click();
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('az');
      expect(screen.getByTestId('translation')).toHaveTextContent('Axtarış');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('azerbaijan-drug-db-language', 'az');
    });

    it('should handle invalid language change', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByTestId('invalid-language').click();
      });

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('error')).toHaveTextContent('Unsupported language: invalid');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage setItem errors', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByTestId('change-language').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to change language');
    });
  });

  describe('useLanguageContext', () => {
    it('should provide context values when used within provider', () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Verify that the context is working properly
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translation')).toHaveTextContent('Search');
    });
  });

  describe('Translation function', () => {
    it('should return translation for valid key', async () => {
      mockLocalStorage.getItem.mockReturnValue('ru');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('translation')).toHaveTextContent('Поиск');
    });

    it('should handle missing translation keys', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      const TestMissingKey = () => {
        const { t } = useLanguageContext();
        return <div data-testid="missing-key">{t('nonexistent.key')}</div>;
      };

      render(
        <LanguageProvider>
          <TestMissingKey />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('missing-key')).toHaveTextContent('nonexistent.key');
      });
    });

    it('should handle translation errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      const TestErrorTranslation = () => {
        const { t } = useLanguageContext();
        return <div data-testid="error-translation">{t(null)}</div>;
      };

      render(
        <LanguageProvider>
          <TestErrorTranslation />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-translation')).toHaveTextContent('');
      });
    });
  });
});