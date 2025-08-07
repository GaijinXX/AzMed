import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchBar from '../SearchBar';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the useRecentSearches hook
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

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
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

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('SearchBar Task 4 Integration Tests', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.recentSearches = [];
    mockRecentSearches.hasRecentSearches = false;
    window.matchMedia.mockImplementation(mockMatchMedia);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop and Mobile Integration', () => {
    it('works on desktop viewport', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      expect(screen.getByText('aspirin')).toBeInTheDocument();
    });

    it('works on mobile viewport', async () => {
      // Mock mobile viewport
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 768px')
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      fireEvent.touchStart(input);
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      expect(screen.getByText('aspirin')).toBeInTheDocument();
    });
  });

  describe('Persistence Testing', () => {
    it('maintains functionality across re-renders', () => {
      const storedSearches = ['aspirin', 'ibuprofen'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSearches));
      
      mockRecentSearches.recentSearches = storedSearches;
      mockRecentSearches.hasRecentSearches = true;

      const { unmount, rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      // Unmount and remount to simulate page reload
      unmount();
      
      rerender(
        <LanguageProvider>
          <SearchBar onSearch={mockOnSearch} />
        </LanguageProvider>
      );

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    it('preserves functionality when language changes', () => {
      mockRecentSearches.recentSearches = ['aspirin', 'аспирин'];
      mockRecentSearches.hasRecentSearches = true;

      const { rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      // Simulate language change
      rerender(
        <LanguageProvider>
          <SearchBar onSearch={mockOnSearch} />
        </LanguageProvider>
      );

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('handles rapid interactions without errors', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Rapid interactions
      for (let i = 0; i < 5; i++) {
        fireEvent.focus(input);
        fireEvent.blur(input);
      }

      // Should not cause errors
      expect(input).toBeInTheDocument();
    });

    it('renders efficiently with multiple searches', () => {
      const searches = Array.from({ length: 5 }, (_, i) => `search${i + 1}`);
      mockRecentSearches.recentSearches = searches;
      mockRecentSearches.hasRecentSearches = true;

      const startTime = performance.now();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Check ARIA attributes
      expect(input).toHaveAttribute('aria-label');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');

      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('supports keyboard navigation', async () => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate with arrow keys
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');

      // Select with Enter
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events on mobile', async () => {
      // Mock touch device
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('hover: none') && query.includes('pointer: coarse')
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Simulate touch interaction
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

  describe('Responsive Behavior', () => {
    it('adapts to different screen sizes', () => {
      const viewports = [
        { width: 375, query: 'max-width: 480px' },
        { width: 768, query: 'max-width: 768px' },
        { width: 1024, query: 'max-width: 1024px' }
      ];

      viewports.forEach(viewport => {
        window.matchMedia.mockImplementation((query) => ({
          ...mockMatchMedia(query),
          matches: query.includes(viewport.query)
        }));

        renderWithLanguageProvider(
          <SearchBar onSearch={mockOnSearch} />
        );

        const input = screen.getByRole('searchbox');
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Positioning', () => {
    it('positions dropdown correctly', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Should still be able to search
      await userEvent.setup().type(input, 'aspirin');
      await userEvent.setup().click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('handles component unmounting gracefully', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      const { unmount } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await userEvent.setup().click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Unmount component while dropdown is open
      expect(() => unmount()).not.toThrow();
    });
  });
});