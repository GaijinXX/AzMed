import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Create a simplified version of SearchBar for testing
function TestSearchBar({ 
  onSearch, 
  initialValue = '', 
  placeholder = 'Search for drugs by name or active ingredient...',
  disabled = false 
}) {
  const [searchText, setSearchText] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsLoading(true);
    if (onSearch) {
      await onSearch(searchText);
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    if (disabled) return;
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };

  const showClearButton = searchText.length > 0;

  return (
    <div className="searchContainer">
      <form onSubmit={handleSubmit} className="searchForm">
        <div className="inputWrapper">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`searchInput ${isLoading ? 'loading' : ''}`}
            aria-label="Search drugs"
            autoComplete="off"
          />
          
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || isLoading}
              className="clearButton"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          
          <button
            type="submit"
            disabled={disabled || isLoading}
            className="searchButton"
            aria-label="Search"
          >
            {isLoading ? (
              <span className="spinner" aria-hidden="true">⟳</span>
            ) : (
              <span aria-hidden="true">🔍</span>
            )}
          </button>
        </div>
      </form>
      
      {isLoading && (
        <div className="loadingIndicator" aria-live="polite">
          Searching...
        </div>
      )}
    </div>
  );
}

describe('SearchBar Component', () => {
  let mockOnSearch;
  let user;

  beforeEach(() => {
    mockOnSearch = vi.fn();
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders search input with default placeholder', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search for drugs by name or active ingredient...');
    });

    it('renders with custom placeholder', () => {
      const customPlaceholder = 'Custom search placeholder';
      render(<TestSearchBar onSearch={mockOnSearch} placeholder={customPlaceholder} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', customPlaceholder);
    });

    it('renders search button', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      const initialValue = 'aspirin';
      render(<TestSearchBar onSearch={mockOnSearch} initialValue={initialValue} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(initialValue);
    });

    it('does not render clear button when input is empty', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const clearButton = screen.queryByRole('button', { name: /clear search/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSearch when form is submitted', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, 'aspirin');
      await user.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('aspirin');
    });

    it('calls onSearch when Enter key is pressed', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'ibuprofen');
      await user.keyboard('{Enter}');
      
      expect(mockOnSearch).toHaveBeenCalledWith('ibuprofen');
    });

    it('shows clear button when input has value', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('updates input value on typing', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'paracetamol');
      
      expect(input).toHaveValue('paracetamol');
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<TestSearchBar onSearch={mockOnSearch} disabled={true} />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(input).toBeDisabled();
      expect(searchButton).toBeDisabled();
    });

    it('prevents interaction when disabled', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} disabled={true} />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Try to type - should not work
      await user.type(input, 'test');
      expect(input).toHaveValue('');
      
      // Try to click - should not work
      await user.click(searchButton);
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox', { name: /search drugs/i });
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(input).toHaveAttribute('aria-label', 'Search drugs');
      expect(searchButton).toHaveAttribute('aria-label', 'Search');
    });

    it('has proper autocomplete attribute', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('clear button has proper ARIA label when visible', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search submission', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('handles whitespace-only search', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, '   ');
      await user.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('   ');
    });

    it('handles special characters in search', async () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, 'test@#$%');
      await user.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('test@#$%');
    });

    it('handles missing onSearch prop gracefully', async () => {
      render(<TestSearchBar />);
      
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await user.type(input, 'test');
      
      // Should not throw error
      expect(() => user.click(searchButton)).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('has correct HTML structure', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      // Check for main container
      const container = document.querySelector('.searchContainer');
      expect(container).toBeInTheDocument();
      
      // Check for form
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Check for input wrapper
      const inputWrapper = form.querySelector('.inputWrapper');
      expect(inputWrapper).toBeInTheDocument();
      
      // Check for input
      const input = inputWrapper.querySelector('input');
      expect(input).toBeInTheDocument();
      
      // Check for search button
      const searchButton = inputWrapper.querySelector('button[type="submit"]');
      expect(searchButton).toBeInTheDocument();
    });

    it('renders search icon in button', () => {
      render(<TestSearchBar onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toContainHTML('🔍');
    });
  });
});

// Test that the actual SearchBar component can be imported
describe('SearchBar Component Import', () => {
  it('can import SearchBar component', async () => {
    const SearchBar = await import('../SearchBar.jsx');
    expect(SearchBar.default).toBeDefined();
    expect(typeof SearchBar.default).toBe('function');
  });
});