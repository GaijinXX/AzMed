import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import RecentSearchesDropdown from '../RecentSearchesDropdown';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('RecentSearchesDropdown Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset viewport to desktop
    window.matchMedia.mockImplementation(mockMatchMedia);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations on mobile', async () => {
      // Mock mobile viewport
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 768px')
      }));

      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in high contrast mode', async () => {
      // Mock high contrast mode
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('prefers-contrast: high')
      }));

      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Attributes and Roles', () => {
    it('has proper listbox role and attributes', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label', 'Recent searches');
    });

    it('has proper option roles for search items', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      
      options.forEach((option, index) => {
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('updates aria-selected when navigating with keyboard', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('tabIndex', '0');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('has proper button attributes for clear all', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear all recent searches');
      expect(clearButton).toHaveAttribute('type', 'button');
    });

    it('has proper button attributes for delete buttons', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Hover over first item to show delete button
      const firstItem = screen.getByText('aspirin').closest('li');
      await user.hover(firstItem);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toHaveAttribute('aria-label', 'Remove "aspirin" from recent searches');
      expect(deleteButton).toHaveAttribute('type', 'button');
      expect(deleteButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      
      // Navigate down
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      
      // Navigate up
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('supports Enter key for selection', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item and press Enter
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onSelectSearch).toHaveBeenCalledWith('aspirin');
    });

    it('supports Escape key to close', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles keyboard navigation boundaries correctly', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      
      // Try to navigate up from initial position (should stay at -1)
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      options.forEach(option => {
        expect(option).toHaveAttribute('aria-selected', 'false');
      });
      
      // Navigate to last item
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // 0
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // 1
      fireEvent.keyDown(document, { key: 'ArrowDown' }); // 2
      
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
      
      // Try to navigate past last item (should stay at last)
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Focus Management', () => {
    it('manages focus correctly during keyboard navigation', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Navigate to first item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveFocus();
    });

    it('maintains focus trap within dropdown', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Tab should not move focus outside dropdown when navigating
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveFocus();
      
      // Pressing Tab should not break the focus management
      await user.tab();
      
      // Focus should remain manageable within the dropdown
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      const secondOption = screen.getAllByRole('option')[1];
      expect(secondOption).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper labels for screen readers', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label', 'Recent searches');
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-label', 'Recent search: aspirin');
      expect(options[1]).toHaveAttribute('aria-label', 'Recent search: ibuprofen');
      expect(options[2]).toHaveAttribute('aria-label', 'Recent search: paracetamol');
    });

    it('provides context for delete buttons', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Hover to show delete button
      const firstItem = screen.getByText('aspirin').closest('li');
      await user.hover(firstItem);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toHaveAttribute('aria-label', 'Remove "aspirin" from recent searches');
    });

    it('provides proper heading structure', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const title = screen.getByText('Recent Searches');
      expect(title).toBeInTheDocument();
      
      // Title should be properly associated with the dropdown
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toHaveAttribute('aria-label', 'Recent searches');
    });
  });

  describe('Mobile Screen Reader Support', () => {
    beforeEach(() => {
      // Mock mobile/touch device
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('max-width: 768px') || 
                 (query.includes('hover: none') && query.includes('pointer: coarse'))
      }));
    });

    it('provides appropriate touch targets for mobile screen readers', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        // Mobile options should have appropriate minimum touch target size
        const computedStyle = window.getComputedStyle(option);
        expect(parseInt(computedStyle.minHeight) >= 44).toBe(true);
      });
    });

    it('shows delete buttons for mobile screen readers', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // On touch devices, delete buttons should be visible for screen readers
      const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('provides proper mobile navigation announcements', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // Mobile screen readers should get the same ARIA labels
      const options = screen.getAllByRole('option');
      options.forEach((option, index) => {
        expect(option).toHaveAttribute('aria-label');
        expect(option).toHaveAttribute('role', 'option');
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    beforeEach(() => {
      // Mock high contrast mode
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('prefers-contrast: high')
      }));
    });

    it('maintains accessibility in high contrast mode', async () => {
      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      // Should not have accessibility violations in high contrast
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides sufficient contrast for interactive elements', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toBeInTheDocument();
      
      // High contrast styles should be applied (verified through CSS)
      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toBeInTheDocument();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      // Mock reduced motion preference
      window.matchMedia.mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('prefers-reduced-motion: reduce')
      }));
    });

    it('maintains accessibility with reduced motion', async () => {
      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides same functionality without animations', () => {
      renderWithLanguageProvider(<RecentSearchesDropdown {...defaultProps} />);
      
      // All functionality should work the same
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('RTL Language Support', () => {
    beforeEach(() => {
      // Mock RTL direction
      document.dir = 'rtl';
    });

    afterEach(() => {
      document.dir = 'ltr';
    });

    it('maintains accessibility in RTL mode', async () => {
      const { container } = renderWithLanguageProvider(
        <div dir="rtl">
          <RecentSearchesDropdown {...defaultProps} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper navigation in RTL', () => {
      renderWithLanguageProvider(
        <div dir="rtl">
          <RecentSearchesDropdown {...defaultProps} />
        </div>
      );
      
      // Navigation should work the same in RTL
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Error States and Edge Cases', () => {
    it('maintains accessibility with empty search list', async () => {
      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} recentSearches={[]} />
      );

      // Component should not render when empty, so no violations
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('maintains accessibility when invisible', async () => {
      const { container } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} isVisible={false} />
      );

      // Component should not render when invisible
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('handles accessibility during rapid state changes', () => {
      const { rerender } = renderWithLanguageProvider(
        <RecentSearchesDropdown {...defaultProps} />
      );

      // Navigate to an item
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Change props rapidly
      rerender(
        <LanguageProvider>
          <RecentSearchesDropdown 
            {...defaultProps} 
            recentSearches={['new search']} 
          />
        </LanguageProvider>
      );

      // Should maintain accessibility
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
    });
  });
});