import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import SortableColumnHeader from '../SortableColumnHeader';
import { SORT_DIRECTIONS } from '../sortConfig';

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

const renderWithProvider = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

const mockColumn = {
  key: 'product_name',
  labelKey: 'table.headers.product_name',
  type: 'text',
  sortable: true,
  required: false
};

const mockNonSortableColumn = {
  key: 'packaging_form',
  labelKey: 'table.headers.packaging_form',
  type: 'text',
  sortable: false,
  required: false
};

const mockOnSort = vi.fn();

describe('SortableColumnHeader', () => {
  beforeEach(() => {
    mockOnSort.mockClear();
  });

  describe('Rendering', () => {
    it('renders nothing when column is not visible', () => {
      const { container } = renderWithProvider(
        <SortableColumnHeader
          column={mockColumn}
          isVisible={false}
          isSorted={false}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders sortable column header correctly', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Product Name');
      expect(header).toHaveAttribute('aria-sort', 'none');
    });

    it('renders non-sortable column header correctly', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockNonSortableColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Packaging Form');
      expect(header).not.toHaveAttribute('tabindex');
    });

    it('renders sorted column with correct aria-sort', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={true}
                sortDirection={SORT_DIRECTIONS.ASC}
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  describe('Interactions', () => {
    it('calls onSort when sortable header is clicked', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });

    it('does not call onSort when non-sortable header is clicked', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockNonSortableColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      fireEvent.click(header);
      
      expect(mockOnSort).not.toHaveBeenCalled();
    });

    it('calls onSort when Enter key is pressed on sortable header', () => {
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      fireEvent.keyDown(header, { key: 'Enter' });
      
      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });
  });

  describe('Special columns', () => {
    it('renders registration number column with abbreviation', () => {
      const numberColumn = { ...mockColumn, key: 'number', labelKey: 'table.headers.number' };
      
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={numberColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const abbr = screen.getByTitle('Registration #');
      expect(abbr).toBeInTheDocument();
      expect(abbr).toHaveTextContent('#');
    });

    it('renders price columns with abbreviations', () => {
      const priceColumn = { ...mockColumn, key: 'wholesale_price', labelKey: 'table.headers.wholesale_price' };
      
      renderWithProvider(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={priceColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const abbr = screen.getByTitle('Wholesale Price in Azerbaijan Manat');
      expect(abbr).toBeInTheDocument();
      expect(abbr).toHaveTextContent('Wholesale Price (₼)');
    });
  });
});