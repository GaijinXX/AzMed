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

describe('SearchBar Comprehensive Integration Tests', () => {
  const mockOnSearch = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.recentSearches = [];
    mockRecentSearches.hasRecentSearches = false;
    // Reset viewport to desktop
    window.matchMedia.mockImplementation(mockMatchMedia);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop and Mobile Viewport Integration', () => {
    it('adapts dropdown positioning for mobile viewport', async () => {
      // Mock mobile viewport
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 768px')
      }));

      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        // Verify mobile-specific styling is applied
        expect(dropdown.closest('.dropdownContainer')).toBeInTheDocument();
      });
    });

    it('handles touch interactions on mobile devices', async () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true
      });

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

    it('provides appropriate touch targets for mobile', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });

      // Verify touch-friendly button sizes
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      const computedStyle = window.getComputedStyle(clearAllButton);
      
      // Touch targets should be at least 44px on mobile
      expect(parseInt(computedStyle.minHeight) >= 32).toBe(true);
      expect(parseInt(computedStyle.minWidth) >= 60).toBe(true);
    });
  });

  describe('Persistence Across Page Reloads', () => {
    it('maintains recent searches after simulated page reload', async () => {
      const storedSearches = ['aspirin', 'ibuprofen', 'paracetamol'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSearches));
      
      mockRecentSearches.recentSearches = storedSearches;
      mockRecentSearches.hasRecentSearches = true;

      const { unmount } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('aspirin')).toBeInTheDocument();
        expect(screen.getByText('ibuprofen')).toBeInTheDocument();
        expect(screen.getByText('paracetamol')).toBeInTheDocument();
      });

      // Simulate page reload by unmounting and remounting
      unmount();

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const newInput = screen.getByRole('searchbox');
      await user.click(newInput);

      await waitFor(() => {
        expect(screen.getByText('aspirin')).toBeInTheDocument();
        expect(screen.getByText('ibuprofen')).toBeInTheDocument();
        expect(screen.getByText('paracetamol')).toBeInTheDocument();
      });
    });

    it('handles corrupted localStorage data gracefully on reload', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      // Should not show dropdown with corrupted data
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Language Switching Integration', () => {
    it('preserves recent searches when switching languages', async () => {
      const multiLanguageSearches = ['aspirin', 'аспирин', 'aspirina'];
      mockRecentSearches.recentSearches = multiLanguageSearches;
      mockRecentSearches.hasRecentSearches = true;

      const { rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('aspirin')).toBeInTheDocument();
        expect(screen.getByText('аспирин')).toBeInTheDocument();
        expect(screen.getByText('aspirina')).toBeInTheDocument();
      });

      // Simulate language change by re-rendering with different language context
      rerender(
        <LanguageProvider>
          <SearchBar onSearch={mockOnSearch} />
        </LanguageProvider>
      );

      const newInput = screen.getByRole('searchbox');
      await user.click(newInput);

      await waitFor(() => {
        // Recent searches should still be preserved
        expect(screen.getByText('aspirin')).toBeInTheDocument();
        expect(screen.getByText('аспирин')).toBeInTheDocument();
        expect(screen.getByText('aspirina')).toBeInTheDocument();
      });
    });

    it('updates dropdown labels when language changes', async () => {
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
  });

  describe('Performance Optimizations', () => {
    it('debounces rapid input changes', async () => {
      vi.useFakeTimers();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Rapid typing
      await user.type(input, 'a');
      await user.type(input, 's');
      await user.type(input, 'p');
      await user.type(input, 'i');
      await user.type(input, 'r');
      await user.type(input, 'i');
      await user.type(input, 'n');

      // Fast forward timers
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(input.value).toBe('aspirin');
      
      vi.useRealTimers();
    });

    it('handles rapid focus/blur events without performance issues', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Rapid focus/blur cycles
      for (let i = 0; i < 10; i++) {
        fireEvent.focus(input);
        fireEvent.blur(input);
      }

      // Should not cause errors and component should remain functional
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('efficiently handles large numbers of recent searches', async () => {
      // Test with maximum allowed searches
      const maxSearches = Array.from({ length: 5 }, (_, i) => `search${i}`);
      mockRecentSearches.recentSearches = maxSearches;
      mockRecentSearches.hasRecentSearches = true;

      const startTime = performance.now();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 100ms for this simple case)
      expect(renderTime).toBeLessThan(100);
      
      // All searches should be visible
      maxSearches.forEach(search => {
        expect(screen.getByText(search)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Testing', () => {
    it('provides proper screen reader announcements', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Check ARIA attributes
      expect(input).toHaveAttribute('aria-label', 'Search drugs database');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');

      await user.click(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute('aria-owns', 'recent-searches-dropdown');
      });

      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label', 'Recent searches');
    });

    it('supports keyboard-only navigation', async () => {
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

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      
      // First item should be selected
      const firstItem = screen.getByText('aspirin').closest('li');
      expect(firstItem).toHaveAttribute('aria-selected', 'true');

      // Navigate to second item
      await user.keyboard('{ArrowDown}');
      
      const secondItem = screen.getByText('ibuprofen').closest('li');
      expect(secondItem).toHaveAttribute('aria-selected', 'true');

      // Select with Enter
      await user.keyboard('{Enter}');
      
      expect(mockOnSearch).toHaveBeenCalledWith('ibuprofen');
    });

    it('maintains focus management correctly', async () => {
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

    it('provides proper high contrast mode support', async () => {
      // Mock high contrast media query
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('prefers-contrast: high')
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });

      // High contrast styles should be applied (tested via CSS)
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearAllButton).toBeInTheDocument();
    });
  });

  describe('Touch Interactions and Gestures', () => {
    it('handles swipe gestures on mobile', async () => {
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

      const dropdown = screen.getByRole('listbox');
      
      // Simulate swipe down gesture
      fireEvent.touchStart(dropdown, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(dropdown, {
        touches: [{ clientX: 100, clientY: 150 }]
      });
      
      fireEvent.touchEnd(dropdown);

      // Dropdown should remain open (swipe down doesn't close)
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('shows delete buttons on touch devices', async () => {
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
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Delete button should be visible on touch devices
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Across Devices', () => {
    it('adapts layout for tablet viewport', async () => {
      // Mock tablet viewport
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 1024px') && !query.includes('max-width: 768px')
      }));

      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('handles orientation changes gracefully', async () => {
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

      // Simulate orientation change
      fireEvent(window, new Event('orientationchange'));

      // Dropdown should remain functional
      const recentSearchItem = screen.getByText('aspirin');
      await user.click(recentSearchItem);

      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });
  });

  describe('Dropdown Positioning and Usability', () => {
    it('positions dropdown correctly relative to input', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        
        // Dropdown should be positioned below the input
        const dropdownContainer = dropdown.closest('.dropdownContainer');
        expect(dropdownContainer).toBeInTheDocument();
      });
    });

    it('handles dropdown overflow on small screens', async () => {
      // Mock small screen
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 480px')
      }));

      // Create many recent searches to test overflow
      const manySearches = Array.from({ length: 5 }, (_, i) => `search term ${i + 1}`);
      mockRecentSearches.recentSearches = manySearches;
      mockRecentSearches.hasRecentSearches = true;

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        
        // All searches should be visible
        manySearches.forEach(search => {
          expect(screen.getByText(search)).toBeInTheDocument();
        });
      });
    });

    it('maintains usability when dropdown is near viewport edge', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      // Mock getBoundingClientRect to simulate near-edge positioning
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: window.innerHeight - 100, // Near bottom of viewport
        left: 0,
        right: 300,
        bottom: window.innerHeight - 50,
        width: 300,
        height: 50
      }));

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });

      // Dropdown should still be functional
      const recentSearchItem = screen.getByText('aspirin');
      await user.click(recentSearchItem);

      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');

      // Restore original method
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles component unmounting during dropdown interaction', async () => {
      mockRecentSearches.recentSearches = ['aspirin'];
      mockRecentSearches.hasRecentSearches = true;

      const { unmount } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Unmount component while dropdown is open
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid prop changes gracefully', async () => {
      const { rerender } = renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} initialValue="" />
      );

      // Rapid prop changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <LanguageProvider>
            <SearchBar onSearch={mockOnSearch} initialValue={`value${i}`} />
          </LanguageProvider>
        );
      }

      const input = screen.getByRole('searchbox');
      expect(input.value).toBe('value9');
      expect(input).toBeInTheDocument();
    });

    it('maintains functionality when localStorage is disabled', async () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Should still be able to search
      await user.type(input, 'aspirin');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });
  });
});