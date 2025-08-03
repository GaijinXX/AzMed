import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SortableColumnHeader from '../SortableColumnHeader';
import { SORT_DIRECTIONS } from '../sortConfig';

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'table.headers.product_name': 'Product Name',
        'table.headers.packaging_form': 'Packaging Form',
        'table.sortingDisabled': 'Sorting disabled',
        'common.currency': 'in Azerbaijan Manat'
      };
      return translations[key] || key;
    }
  })
}));

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
      const { container } = render(
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
      render(
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
      render(
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
      render(
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

    it('renders descending sorted column with correct aria-sort', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={true}
                sortDirection={SORT_DIRECTIONS.DESC}
                onSort={mockOnSort}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('aria-sort', 'descending');
    });
  });

  describe('Interactions', () => {
    it('calls onSort when sortable header is clicked', () => {
      render(
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
      render(
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
      render(
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

    it('calls onSort when Space key is pressed on sortable header', () => {
      render(
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
      fireEvent.keyDown(header, { key: ' ' });
      
      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });

    it('does not call onSort for other keys', () => {
      render(
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
      fireEvent.keyDown(header, { key: 'Tab' });
      
      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('does not call onSort when disabled and clicked', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
                disabled={true}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      fireEvent.click(header);
      
      expect(mockOnSort).not.toHaveBeenCalled();
    });

    it('has correct tabindex when disabled', () => {
      render(
        <table>
          <thead>
            <tr>
              <SortableColumnHeader
                column={mockColumn}
                isVisible={true}
                isSorted={false}
                sortDirection="asc"
                onSort={mockOnSort}
                disabled={true}
              />
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Special columns', () => {
    it('renders registration number column with abbreviation', () => {
      const numberColumn = { ...mockColumn, key: 'number', label: 'Registration #' };
      
      render(
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
      
      const abbr = screen.getByTitle('Registration Number');
      expect(abbr).toBeInTheDocument();
      expect(abbr).toHaveTextContent('#');
    });

    it('renders price columns with abbreviations', () => {
      const priceColumn = { ...mockColumn, key: 'wholesale_price', label: 'Wholesale Price' };
      
      render(
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