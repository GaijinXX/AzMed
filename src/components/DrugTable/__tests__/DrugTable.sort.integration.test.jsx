import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DrugTable from '../DrugTable';

// Mock the React 19 optimization hooks
vi.mock('../../../hooks/useReact19Optimizations', () => ({
  useOptimizedList: vi.fn(() => []),
  useCompilerOptimizations: vi.fn(() => ({
    trackRender: vi.fn()
  }))
}));

// Mock the translation hook
vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'table.noResults': 'No drugs found. Try adjusting your search criteria.',
        'table.tableLabel': 'Drug information table',
        'pagination.with': 'with',
        'pagination.entries': 'entries',
        'table.tableSummary': 'Table showing',
        'pagination.entry': 'entry',
        'table.tableSorted': 'Table sorted by',
        'table.inOrder': 'in',
        'table.ascending': 'ascending',
        'table.descending': 'descending',
        'table.tableBody': 'Table body showing',
        'pagination.of': 'of',
        'table.headers.number': 'Registration #',
        'table.headers.product_name': 'Product Name',
        'table.headers.active_ingredients': 'Active Ingredients',
        'table.headers.dosage_amount': 'Dosage',
        'table.headers.dosage_form': 'Formulation',
        'table.headers.packaging_form': 'Packaging Form',
        'table.headers.amount': 'Amount',
        'table.headers.manufacturer': 'Manufacturer',
        'table.headers.wholesale_price': 'Wholesale Price',
        'table.headers.retail_price': 'Retail Price',
        'table.headers.registration_date': 'Registration Date',
        'common.currency': 'in Azerbaijan Manat'
      };
      return translations[key] || key;
    }
  })
}));

const mockDrugs = [
  {
    number: 123,
    product_name: 'Aspirin',
    active_ingredients: 'Acetylsalicylic acid',
    dosage_amount: '500mg',
    dosage_form: 'Tablet',
    packaging_form: 'Blister',
    amount: '20 tablets',
    manufacturer: 'Pharma Corp',
    wholesale_price: 1500,
    retail_price: 2000,
    date: '2023-01-15'
  },
  {
    number: 456,
    product_name: 'Ibuprofen',
    active_ingredients: 'Ibuprofen',
    dosage_amount: '400mg',
    dosage_form: 'Tablet',
    packaging_form: 'Bottle',
    amount: '30 tablets',
    manufacturer: 'Med Solutions',
    wholesale_price: 1200,
    retail_price: 1800,
    date: '2023-02-20'
  }
];

const defaultVisibleColumns = {
  number: true,
  product_name: true,
  active_ingredients: true,
  dosage_amount: true,
  dosage_form: true,
  packaging_form: false,
  amount: true,
  manufacturer: false,
  wholesale_price: false,
  retail_price: true,
  date: false
};

const mockOnSort = jest.fn();
const mockOnColumnToggle = jest.fn();

describe('DrugTable Sort Integration', () => {
  beforeEach(() => {
    mockOnSort.mockClear();
    mockOnColumnToggle.mockClear();
  });

  describe('Sort functionality', () => {
    it('renders sortable column headers', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      // Check that sortable headers are rendered
      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      expect(productNameHeader).toBeInTheDocument();
      expect(productNameHeader).toHaveAttribute('aria-sort', 'none');
      expect(productNameHeader).toHaveAttribute('tabindex', '0');
    });

    it('calls onSort when sortable header is clicked', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      fireEvent.click(productNameHeader);

      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });

    it('displays correct sort indicators for sorted column', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn="product_name"
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      expect(productNameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Check for ascending sort indicator
      const sortIndicator = screen.getByText('↑');
      expect(sortIndicator).toBeInTheDocument();
    });

    it('displays descending sort indicator correctly', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn="product_name"
          sortDirection="desc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      expect(productNameHeader).toHaveAttribute('aria-sort', 'descending');
      
      // Check for descending sort indicator
      const sortIndicator = screen.getByText('↓');
      expect(sortIndicator).toBeInTheDocument();
    });

    it('disables sort functionality when loading', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={true}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      // Should render skeleton instead of interactive table
      expect(screen.queryByRole('columnheader')).toBeInTheDocument();
      
      // Headers should be disabled
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        if (header.hasAttribute('tabindex')) {
          expect(header).toHaveAttribute('tabindex', '-1');
        }
      });
    });

    it('disables sort functionality when pending', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={true}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      fireEvent.click(productNameHeader);

      // Should not call onSort when disabled
      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    it('supports Enter key for sorting', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      fireEvent.keyDown(productNameHeader, { key: 'Enter' });

      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });

    it('supports Space key for sorting', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      fireEvent.keyDown(productNameHeader, { key: ' ' });

      expect(mockOnSort).toHaveBeenCalledWith('product_name');
    });

    it('ignores other keys', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      fireEvent.keyDown(productNameHeader, { key: 'Tab' });

      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('includes sort information in screen reader summary', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn="product_name"
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      // Check for screen reader summary with sort information
      const summary = screen.getByText(/sorted by product_name in ascending order/i);
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveClass('visually-hidden');
    });

    it('has proper ARIA labels for sort actions', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      expect(productNameHeader).toHaveAttribute('aria-label');
      
      const ariaLabel = productNameHeader.getAttribute('aria-label');
      expect(ariaLabel).toContain('not sorted');
      expect(ariaLabel).toContain('click to sort ascending');
    });

    it('updates ARIA labels for sorted columns', () => {
      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={defaultVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn="product_name"
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const productNameHeader = screen.getByRole('columnheader', { name: /product name/i });
      const ariaLabel = productNameHeader.getAttribute('aria-label');
      expect(ariaLabel).toContain('sorted ascending');
      expect(ariaLabel).toContain('click to sort descending');
    });
  });

  describe('Column visibility integration', () => {
    it('only renders headers for visible columns', () => {
      const limitedVisibleColumns = {
        ...defaultVisibleColumns,
        active_ingredients: false,
        dosage_amount: false
      };

      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={limitedVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      // Should render visible headers
      expect(screen.getByRole('columnheader', { name: /product name/i })).toBeInTheDocument();
      
      // Should not render hidden headers
      expect(screen.queryByRole('columnheader', { name: /active ingredients/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /dosage/i })).not.toBeInTheDocument();
    });

    it('handles non-sortable columns correctly', () => {
      const visibleColumnsWithNonSortable = {
        ...defaultVisibleColumns,
        packaging_form: true
      };

      render(
        <DrugTable
          drugs={mockDrugs}
          loading={false}
          isPending={false}
          visibleColumns={visibleColumnsWithNonSortable}
          onColumnToggle={mockOnColumnToggle}
          sortColumn={null}
          sortDirection="asc"
          onSort={mockOnSort}
        />
      );

      const packagingHeader = screen.getByRole('columnheader', { name: /packaging form/i });
      expect(packagingHeader).toBeInTheDocument();
      expect(packagingHeader).not.toHaveAttribute('tabindex');
      
      // Clicking non-sortable header should not call onSort
      fireEvent.click(packagingHeader);
      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });
});