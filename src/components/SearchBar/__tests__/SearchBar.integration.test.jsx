import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchBar from '../SearchBar';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the useRecentSearches hook with realistic behavior
const mockRecentSearches = {
  recentSearches: [],
  addRecentSearch: vi.fn(),
  removeRecentSearch: vi.fn(),
  clearAllRecentSearches: vi.fn(),
  hasRecentSearches: false
};

vi.mock('../../../hooks/useRecentSearches', () => ({
  useRecentSearches: () => mockRecentSearches
}));

// Mock the translation hook to handle interpolation
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, params) => {
      if (params && typeof defaultValue === 'string') {
        return defaultValue.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
          return params[paramName] || match;
        });
      }
      // Return default translations for common keys
      const translations = {
        'search.ariaLabel': 'Search drugs database',
        'search.placeholder': 'Search by drug name, active ingredient, or registration number...',
        'common.search': 'Search',
        'common.loading': 'Loading',
        'recentSearches.title': 'Recent Searches',
        'recentSearches.dropdown.label': 'Recent searches',
        'recentSearches.clearAll.text': 'Clear All',
        'recentSearches.clearAll.label': 'Clear all recent searches'
      };
      return translations[key] || defaultValue || key;
    },
    language: 'en',
    setLanguage: vi.fn()
  })
}));

// Mock the useReact19Optimizations hook
vi.mock('../../../hooks/useReact19Optimizations', () => ({
  useCompilerOptimizations: () => ({
    trackRender: vi.fn(),
    isCompilerActive: false
  }),
  useOptimizedUpdates: () => ({
    batchUpdate: vi.fn(),
    immediateUpdate: vi.fn(),
    isPending: false
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('SearchBar Integration with RecentSearchesDropdown', () => {
  const mockOnSearch = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.recentSearches = [];
    mockRecentSearches.hasRecentSearches = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dropdown Visibility', () => {
    it('does not show dropdown when there are no recent searches', async () => {
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows dropdown when input is focused and there are recent searches', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('hides dropdown when clicking outside', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Click outside
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('hides dropdown when pressing Escape', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Search Selection', () => {
    it('populates input and triggers search when recent search is selected', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const recentSearchItem = screen.getByText('aspirin');
      await user.click(recentSearchItem);

      expect(input.value).toBe('aspirin');
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
      
      // Verify that the selection was handled correctly
      expect(input.value).toBe('aspirin');
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('navigates recent searches with keyboard and selects with Enter', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate down to first item
      await user.keyboard('{ArrowDown}');
      
      // Select with Enter
      await user.keyboard('{Enter}');

      expect(input.value).toBe('aspirin');
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });
  });

  describe('Recent Search Management', () => {
    it('adds search term to recent searches when form is submitted', async () => {
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(input, 'new search term');
      await user.click(searchButton);

      expect(mockRecentSearches.addRecentSearch).toHaveBeenCalledWith('new search term');
      expect(mockOnSearch).toHaveBeenCalledWith('new search term');
    });

    it('does not add empty search terms to recent searches', async () => {
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(input, '   ');
      await user.click(searchButton);

      expect(mockRecentSearches.addRecentSearch).not.toHaveBeenCalled();
    });

    it('removes recent search when delete button is clicked', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Hover over the item to show the delete button
      const aspirinItem = screen.getByText('aspirin').closest('li');
      await user.hover(aspirinItem);

      const deleteButton = screen.getByLabelText('Remove "aspirin" from recent searches');
      await user.click(deleteButton);

      expect(mockRecentSearches.removeRecentSearch).toHaveBeenCalledWith('aspirin');
    });

    it('clears all recent searches when clear all button is clicked', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByRole('button', { name: 'Clear all recent searches' });
      await user.click(clearAllButton);

      expect(mockRecentSearches.clearAllRecentSearches).toHaveBeenCalled();
      
      // Verify that clear all was called
      expect(mockRecentSearches.clearAllRecentSearches).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for dropdown interaction', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Initially collapsed
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');

      await user.click(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute('aria-owns', 'recent-searches-dropdown');
      });
    });

    it('maintains focus management between input and dropdown', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Select a recent search
      const recentSearchItem = screen.getByText('aspirin');
      await user.click(recentSearchItem);

      // Focus should return to input
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Mobile and Touch Support', () => {
    it('handles touch events for dropdown interaction', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Simulate touch start
      fireEvent.touchStart(input);
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Touch outside to close
      fireEvent.touchStart(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multi-language Support', () => {
    it('displays dropdown with proper translations', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });
    });

    it('preserves original language of search terms', async () => {
      mockRecentSearches.recentSearches = ['аспирин', 'ибупрофен']; // Cyrillic
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('аспирин')).toBeInTheDocument();
        expect(screen.getByText('ибупрофен')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid focus/blur events gracefully', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Rapid focus/blur
      await user.click(input);
      fireEvent.blur(input);
      await user.click(input);
      fireEvent.blur(input);

      // Wait for any pending state updates
      await waitFor(() => {
        // Should not cause errors and input should be accessible
        expect(input).toBeInTheDocument();
      });
    });

    it('handles dropdown state when recent searches change dynamically', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      const { rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Simulate recent searches being cleared
      mockRecentSearches.recentSearches = [];
      mockRecentSearches.hasRecentSearches = false;

      rerender(
        <LanguageProvider>
          <SearchBar onSearch={mockOnSearch} />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });
});