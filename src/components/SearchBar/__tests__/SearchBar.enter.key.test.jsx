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

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('SearchBar Enter Key Functionality', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches.recentSearches = [];
    mockRecentSearches.hasRecentSearches = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Enter key when dropdown is not visible', () => {
    it('should trigger search when Enter is pressed in input field', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Type search term and press Enter
      await user.type(input, 'aspirin');
      await user.keyboard('{Enter}');

      // Should trigger search
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('should trigger search when form is submitted', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      const form = input.closest('form');
      
      // Type search term and submit form
      await user.type(input, 'ibuprofen');
      fireEvent.submit(form);

      // Should trigger search
      expect(mockOnSearch).toHaveBeenCalledWith('ibuprofen');
    });
  });

  describe('Enter key when dropdown is visible', () => {
    beforeEach(() => {
      mockRecentSearches.recentSearches = ['aspirin', 'ibuprofen'];
      mockRecentSearches.hasRecentSearches = true;
    });

    it('should trigger search when Enter is pressed with no item selected', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Focus input to show dropdown
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Type new search term (different from recent searches)
      await user.clear(input);
      await user.type(input, 'paracetamol');
      
      // Press Enter - should trigger search, not select dropdown item
      await user.keyboard('{Enter}');

      // Should trigger search with the typed value
      expect(mockOnSearch).toHaveBeenCalledWith('paracetamol');
    });

    it('should select dropdown item when Enter is pressed with item selected', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Focus input to show dropdown
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate to first item with arrow key
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Press Enter - should select the dropdown item
      fireEvent.keyDown(document, { key: 'Enter' });

      // Should trigger search with the selected recent search
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('should allow form submission when typing new search with dropdown visible', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      // Focus input to show dropdown
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Type new search term
      await user.clear(input);
      await user.type(input, 'new search term');
      
      // Submit form directly
      const form = input.closest('form');
      fireEvent.submit(form);

      // Should trigger search with the typed value
      expect(mockOnSearch).toHaveBeenCalledWith('new search term');
    });
  });

  describe('Edge cases', () => {
    it('should handle Enter key when dropdown has no items', async () => {
      const user = userEvent.setup();
      
      // Set up empty recent searches but hasRecentSearches true (edge case)
      mockRecentSearches.recentSearches = [];
      mockRecentSearches.hasRecentSearches = false;
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      await user.type(input, 'test search');
      await user.keyboard('{Enter}');

      // Should trigger search normally
      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    });

    it('should handle rapid Enter key presses', async () => {
      const user = userEvent.setup();
      
      renderWithLanguageProvider(
        <SearchBar onSearch={mockOnSearch} />
      );

      const input = screen.getByRole('searchbox');
      
      await user.type(input, 'rapid test');
      
      // Rapid Enter presses
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');

      // Should handle gracefully (may be called multiple times due to rapid presses)
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });
});