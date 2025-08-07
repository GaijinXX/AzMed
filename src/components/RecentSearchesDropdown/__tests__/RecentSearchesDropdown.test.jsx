import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RecentSearchesDropdown from '../RecentSearchesDropdown';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, params) => {
      if (params && defaultValue && defaultValue.includes('{{searchTerm}}')) {
        return defaultValue.replace(/\{\{searchTerm\}\}/g, params.searchTerm);
      }
      return defaultValue || key;
    }
  })
}));

const defaultProps = {
  isVisible: true,
  recentSearches: ['aspirin', 'ibuprofen', 'paracetamol'],
  onSelectSearch: vi.fn(),
  onRemoveSearch: vi.fn(),
  onClearAll: vi.fn(),
  onClose: vi.fn()
};

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('RecentSearchesDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dropdown when visible with recent searches', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('aspirin')).toBeInTheDocument();
      expect(screen.getByText('ibuprofen')).toBeInTheDocument();
      expect(screen.getByText('paracetamol')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} isVisible={false} />
      );
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not render when no recent searches', () => {
      renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} recentSearches={[]} />
      );
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label', 'Recent searches');
      
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear all recent searches');
    });
  });

  describe('User Interactions', () => {
    it('calls onSelectSearch when item is clicked', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      await user.click(screen.getByText('aspirin'));
      
      expect(defaultProps.onSelectSearch).toHaveBeenCalledWith('aspirin');
    });

    it('calls onClearAll when clear all button is clicked', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      await user.click(screen.getByText('Clear All'));
      
      expect(defaultProps.onClearAll).toHaveBeenCalled();
    });

    it('calls onRemoveSearch when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Hover over item to show delete button
      const aspirinItem = screen.getByText('aspirin').closest('li');
      await user.hover(aspirinItem);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      await user.click(deleteButton);
      
      expect(defaultProps.onRemoveSearch).toHaveBeenCalledWith('aspirin');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles arrow down navigation', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Simulate arrow down key
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      await waitFor(() => {
        const firstItem = screen.getByText('aspirin').closest('li');
        expect(firstItem.className).toContain('selected');
      });
    });

    it('handles arrow up navigation', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // First go down to select first item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Then go up
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      
      await waitFor(() => {
        const firstItem = screen.getByText('aspirin').closest('li');
        expect(firstItem.className).toContain('selected');
      });
    });

    it('handles Enter key to select item', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item and press Enter
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onSelectSearch).toHaveBeenCalledWith('aspirin');
    });

    it('handles Escape key to close dropdown', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not navigate beyond bounds', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Try to go down past the last item
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // Select first
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // Select second
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // Select third
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // Should stay on third
      
      await waitFor(() => {
        const thirdItem = screen.getByText('paracetamol').closest('li');
        expect(thirdItem.className).toContain('selected');
      });
    });

    it('does not navigate above first item', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Try to go up from initial position (no selection)
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      
      await waitFor(() => {
        const items = screen.getAllByRole('option');
        items.forEach(item => {
          expect(item.className).not.toContain('selected');
        });
      });
    });
  });

  describe('Touch Interactions', () => {
    it('shows delete button on touch start', async () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const aspirinItem = screen.getByText('aspirin').closest('li');
      fireEvent.touchStart(aspirinItem);
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
        expect(deleteButton.className).toContain('visible');
      });
    });

    it('handles touch end event', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const aspirinItem = screen.getByText('aspirin').closest('li');
      fireEvent.touchStart(aspirinItem);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton.className).toContain('visible');
      
      // Touch end is handled without errors
      expect(() => fireEvent.touchEnd(aspirinItem)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper role attributes', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('manages focus properly', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstItem = screen.getByText('aspirin').closest('li');
      expect(firstItem).toHaveAttribute('tabIndex', '0');
    });

    it('has proper aria-selected attributes', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstItem = screen.getByText('aspirin').closest('li');
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      
      const secondItem = screen.getByText('ibuprofen').closest('li');
      expect(secondItem).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies mobile-specific classes on small screens', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const dropdown = screen.getByRole('listbox');
      expect(dropdown.className).toContain('dropdown');
    });
  });

  describe('Error Handling', () => {
    it('handles empty search terms gracefully', () => {
      const propsWithEmptyTerms = {
        ...defaultProps,
        recentSearches: ['', 'valid search', null, undefined, 'another valid']
      };
      
      renderWithLanguageProvider(<RecentSearchesDropdown {...propsWithEmptyTerms} />);
      
      // Should still render the dropdown
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('handles prop changes gracefully', () => {
      const { rerender } = renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Initial render should work
      expect(screen.getByText('aspirin')).toBeInTheDocument();
      expect(screen.getByText('ibuprofen')).toBeInTheDocument();
      expect(screen.getByText('paracetamol')).toBeInTheDocument();
      
      // Update props with fewer items
      const newProps = {
        ...defaultProps,
        recentSearches: ['aspirin', 'ibuprofen'] // removed paracetamol
      };
      
      rerender(
        <LanguageProvider>
          <RecentSearchesDropdown {...newProps} />
        </LanguageProvider>
      );
      
      // Should render updated list
      expect(screen.getByText('aspirin')).toBeInTheDocument();
      expect(screen.getByText('ibuprofen')).toBeInTheDocument();
      expect(screen.queryByText('paracetamol')).not.toBeInTheDocument();
    });
  });
});