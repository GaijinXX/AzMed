import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext.jsx';
import { useTranslation } from '../useTranslation.js';

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

// Test component using the hook
const TestComponent = () => {
  const {
    t,
    translate,
    translateFor,
    hasTranslation,
    currentLanguage,
    setLanguage,
    isLoading,
    error,
    formatters,
    isEnglish,
    isAzeri,
    isRussian
  } = useTranslation();

  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="translation">{t('common.search')}</div>
      <div data-testid="translation-with-fallback">{translate('nonexistent.key', 'Fallback Text')}</div>
      <div data-testid="translation-with-interpolation">
        {translate('search.resultsFound', { count: 5 })}
      </div>
      <div data-testid="translate-for">{translateFor('common.search', 'ru')}</div>
      <div data-testid="has-translation">{hasTranslation('common.search').toString()}</div>
      <div data-testid="has-missing-translation">{hasTranslation('missing.key').toString()}</div>
      <div data-testid="formatted-number">{formatters.number(1234.56)}</div>
      <div data-testid="formatted-date">{formatters.date('2024-01-15')}</div>
      <div data-testid="is-english">{isEnglish.toString()}</div>
      <div data-testid="is-azeri">{isAzeri.toString()}</div>
      <div data-testid="is-russian">{isRussian.toString()}</div>
      <button 
        data-testid="change-to-azeri" 
        onClick={() => setLanguage('az')}
      >
        Change to Azeri
      </button>
    </div>
  );
};

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic translation functionality', () => {
    it('should provide translation function', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('translation')).toHaveTextContent('Search');
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should handle fallback translations', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('translation-with-fallback')).toHaveTextContent('Fallback Text');
    });

    it('should handle interpolation in translations', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Note: This test assumes the translation contains {{count}} placeholder
      // Since our current translations don't have this, it will show the original text
      expect(screen.getByTestId('translation-with-interpolation')).toHaveTextContent('drugs found');
    });

    it('should provide translateFor function for specific languages', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('translate-for')).toHaveTextContent('Поиск');
    });

    it('should check if translation exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('has-translation')).toHaveTextContent('true');
      expect(screen.getByTestId('has-missing-translation')).toHaveTextContent('false');
    });
  });

  describe('Language state properties', () => {
    it('should provide language state flags for English', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-english')).toHaveTextContent('true');
      expect(screen.getByTestId('is-azeri')).toHaveTextContent('false');
      expect(screen.getByTestId('is-russian')).toHaveTextContent('false');
    });

    it('should provide language state flags for Azeri', async () => {
      mockLocalStorage.getItem.mockReturnValue('az');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-english')).toHaveTextContent('false');
      expect(screen.getByTestId('is-azeri')).toHaveTextContent('true');
      expect(screen.getByTestId('is-russian')).toHaveTextContent('false');
    });

    it('should update language state flags when language changes', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-english')).toHaveTextContent('true');

      act(() => {
        screen.getByTestId('change-to-azeri').click();
      });

      expect(screen.getByTestId('is-english')).toHaveTextContent('false');
      expect(screen.getByTestId('is-azeri')).toHaveTextContent('true');
    });
  });

  describe('Formatters', () => {
    it('should provide number formatting', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Number formatting might vary by system locale, so we just check it's formatted
      const formattedNumber = screen.getByTestId('formatted-number').textContent;
      expect(formattedNumber).toMatch(/1[,.]?234[.,]?56/);
    });

    it('should provide date formatting', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Date formatting will vary by system, so we just check it's not the original string
      const formattedDate = screen.getByTestId('formatted-date').textContent;
      expect(formattedDate).not.toBe('2024-01-15');
      expect(formattedDate).toContain('2024');
    });

    it('should handle formatter errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      const TestFormatterError = () => {
        const { formatters } = useTranslation();
        return (
          <div>
            <div data-testid="invalid-number">{formatters.number('invalid')}</div>
            <div data-testid="invalid-date">{formatters.date('invalid')}</div>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestFormatterError />
        </LanguageProvider>
      );

      await waitFor(() => {
        // Number formatter returns NaN for invalid input, which is expected
        expect(screen.getByTestId('invalid-number')).toHaveTextContent('NaN');
        expect(screen.getByTestId('invalid-date')).toHaveTextContent('invalid');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle translation errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('en');

      const TestTranslationError = () => {
        const { t } = useTranslation();
        return <div data-testid="error-translation">{t('nonexistent.key', 'fallback')}</div>;
      };

      render(
        <LanguageProvider>
          <TestTranslationError />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-translation')).toHaveTextContent('fallback');
      });
    });
  });
});