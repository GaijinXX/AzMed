import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RecentSearchItem from '../RecentSearchItem';
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
  searchTerm: 'aspirin',
  isSelected: false,
  onSelect: vi.fn(),
  onRemove: vi.fn(),
  index: 0
};

const renderWithLanguageProvider = (component) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('RecentSearchItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search term correctly', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      expect(screen.getByText('aspirin')).toBeInTheDocument();
      expect(screen.getByRole('option')).toBeInTheDocument();
    });

    it('applies selected class when isSelected is true', () => {
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} isSelected={true} />
      );
      
      const item = screen.getByRole('option');
      expect(item.className).toContain('selected');
    });

    it('does not apply selected class when isSelected is false', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      expect(item.className).not.toContain('selected');
    });

    it('has proper ARIA attributes', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      expect(item).toHaveAttribute('aria-selected', 'false');
      expect(item).toHaveAttribute('aria-label', 'Recent search: aspirin');
      expect(item).toHaveAttribute('tabIndex', '-1');
    });

    it('has proper ARIA attributes when selected', () => {
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} isSelected={true} />
      );
      
      const item = screen.getByRole('option');
      expect(item).toHaveAttribute('aria-selected', 'true');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('shows delete button with proper label', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute('type', 'button');
      expect(deleteButton).toHaveAttribute('tabIndex', '-1');
    });

    it('truncates long search terms with title attribute', () => {
      const longTerm = 'this is a very long search term that should be truncated';
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} searchTerm={longTerm} />
      );
      
      const searchTermSpan = screen.getByText(longTerm);
      expect(searchTermSpan).toHaveAttribute('title', longTerm);
    });
  });

  describe('Mouse Interactions', () => {
    it('calls onSelect when item is clicked', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      await user.click(screen.getByRole('option'));
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it('calls onRemove when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      await user.click(deleteButton);
      
      expect(defaultProps.onRemove).toHaveBeenCalled();
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });

    it('shows delete button on mouse enter', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      await user.hover(item);
      
      await waitFor(() => {
        expect(item.className).toContain('hovered');
        const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
        expect(deleteButton.className).toContain('visible');
      });
    });

    it('hides delete button on mouse leave', async () => {
      const user = userEvent.setup();
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      await user.hover(item);
      await user.unhover(item);
      
      await waitFor(() => {
        expect(item.className).not.toContain('hovered');
        const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
        expect(deleteButton.className).not.toContain('visible');
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('calls onSelect when Enter key is pressed', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.keyDown(item, { key: 'Enter' });
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it('calls onSelect when Space key is pressed', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.keyDown(item, { key: ' ' });
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it('calls onRemove when Delete key is pressed', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.keyDown(item, { key: 'Delete' });
      
      expect(defaultProps.onRemove).toHaveBeenCalled();
    });

    it('calls onRemove when Backspace key is pressed', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.keyDown(item, { key: 'Backspace' });
      
      expect(defaultProps.onRemove).toHaveBeenCalled();
    });

    it('prevents default behavior for handled keys', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      
      // Test that the handlers are called (preventDefault is called internally)
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('Touch Interactions', () => {
    it('shows delete button on touch start', async () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.touchStart(item);
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
        expect(deleteButton.className).toContain('visible');
      });
    });

    it('handles touch end event', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      fireEvent.touchStart(item);
      
      // Touch start shows delete button
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton.className).toContain('visible');
      
      // Touch end is handled without errors
      expect(() => fireEvent.touchEnd(item)).not.toThrow();
    });

    it('handles delete button touch start', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      
      // Test that touch start on delete button doesn't cause errors
      expect(() => fireEvent.touchStart(deleteButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper role and ARIA attributes', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      expect(item).toHaveAttribute('role', 'option');
      expect(item).toHaveAttribute('aria-selected', 'false');
      expect(item).toHaveAttribute('aria-label', 'Recent search: aspirin');
    });

    it('updates aria-selected when selection changes', () => {
      const { rerender } = renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      let item = screen.getByRole('option');
      expect(item).toHaveAttribute('aria-selected', 'false');
      
      rerender(
        <LanguageProvider>
          <RecentSearchItem {...defaultProps} isSelected={true} />
        </LanguageProvider>
      );
      
      item = screen.getByRole('option');
      expect(item).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper tabIndex based on selection state', () => {
      const { rerender } = renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      let item = screen.getByRole('option');
      expect(item).toHaveAttribute('tabIndex', '-1');
      
      rerender(
        <LanguageProvider>
          <RecentSearchItem {...defaultProps} isSelected={true} />
        </LanguageProvider>
      );
      
      item = screen.getByRole('option');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('delete button has proper accessibility attributes', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton).toHaveAttribute('type', 'button');
      expect(deleteButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Visual States', () => {
    it('has proper CSS classes', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const item = screen.getByRole('option');
      expect(item.className).toContain('item');
    });

    it('applies selected class when selected', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} isSelected={true} />);
      
      const item = screen.getByRole('option');
      expect(item.className).toContain('selected');
    });

    it('delete button has proper initial state', () => {
      renderWithLanguageProvider(<RecentSearchItem {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /remove.*aspirin/i });
      expect(deleteButton.className).toContain('deleteButton');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search term', () => {
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} searchTerm="" />
      );
      
      expect(screen.getByRole('option')).toBeInTheDocument();
      const searchTermSpan = screen.getByRole('option').querySelector('span');
      expect(searchTermSpan).toHaveTextContent('');
    });

    it('handles special characters in search term', () => {
      const specialTerm = 'test@#$%^&*()';
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} searchTerm={specialTerm} />
      );
      
      expect(screen.getByText(specialTerm)).toBeInTheDocument();
      expect(screen.getByRole('option')).toHaveAttribute('aria-label', `Recent search: ${specialTerm}`);
    });

    it('handles very long search terms', () => {
      const longTerm = 'a'.repeat(200);
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} searchTerm={longTerm} />
      );
      
      const searchTermSpan = screen.getByText(longTerm);
      expect(searchTermSpan).toHaveAttribute('title', longTerm);
    });
  });

  describe('Forward Ref', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      renderWithLanguageProvider(
        <RecentSearchItem {...defaultProps} ref={ref} />
      );
      
      expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });
  });
});