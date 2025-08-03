import { describe, it, expect, vi } from 'vitest';
import {
  SORTABLE_COLUMNS,
  SORT_DIRECTIONS,
  getSortableColumn,
  isColumnSortable,
  getColumnLabel,
  validateSortColumn,
  validateSortDirection,
  getSortAriaLabel,
  getSortAnnouncement
} from '../sortConfig';

// Mock translation function
const mockT = vi.fn((key) => {
  const translations = {
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
    'table.notSorted': 'not sorted',
    'table.sorted': 'sorted',
    'table.ascending': 'ascending',
    'table.descending': 'descending',
    'table.clickToSortAsc': 'click to sort ascending',
    'table.clickToSort': 'click to sort',
    'table.tableSorted': 'Table sorted by',
    'table.inOrder': 'in'
  };
  return translations[key] || key;
});

describe('sortConfig', () => {
  describe('Constants', () => {
    it('has correct SORT_DIRECTIONS', () => {
      expect(SORT_DIRECTIONS.ASC).toBe('asc');
      expect(SORT_DIRECTIONS.DESC).toBe('desc');
    });

    it('has SORTABLE_COLUMNS with required properties', () => {
      expect(Array.isArray(SORTABLE_COLUMNS)).toBe(true);
      expect(SORTABLE_COLUMNS.length).toBeGreaterThan(0);
      
      SORTABLE_COLUMNS.forEach(column => {
        expect(column).toHaveProperty('key');
        expect(column).toHaveProperty('labelKey');
        expect(column).toHaveProperty('type');
        expect(column).toHaveProperty('sortable');
        expect(column).toHaveProperty('required');
        expect(typeof column.key).toBe('string');
        expect(typeof column.labelKey).toBe('string');
        expect(typeof column.sortable).toBe('boolean');
        expect(typeof column.required).toBe('boolean');
      });
    });

    it('has expected columns', () => {
      const columnKeys = SORTABLE_COLUMNS.map(col => col.key);
      expect(columnKeys).toContain('number');
      expect(columnKeys).toContain('product_name');
      expect(columnKeys).toContain('active_ingredients');
      expect(columnKeys).toContain('wholesale_price');
      expect(columnKeys).toContain('retail_price');
    });
  });

  describe('getSortableColumn', () => {
    it('returns column for valid key', () => {
      const column = getSortableColumn('product_name');
      expect(column).toBeDefined();
      expect(column.key).toBe('product_name');
      expect(column.labelKey).toBe('table.headers.product_name');
    });

    it('returns undefined for invalid key', () => {
      const column = getSortableColumn('invalid_column');
      expect(column).toBeUndefined();
    });

    it('returns undefined for null/undefined key', () => {
      expect(getSortableColumn(null)).toBeUndefined();
      expect(getSortableColumn(undefined)).toBeUndefined();
    });
  });

  describe('isColumnSortable', () => {
    it('returns true for sortable columns', () => {
      expect(isColumnSortable('product_name')).toBe(true);
      expect(isColumnSortable('number')).toBe(true);
    });

    it('returns false for non-sortable columns', () => {
      // All columns in our config are sortable, so test with invalid column
      expect(isColumnSortable('invalid_column')).toBe(false);
    });

    it('returns false for invalid columns', () => {
      expect(isColumnSortable('invalid_column')).toBe(false);
      expect(isColumnSortable(null)).toBe(false);
      expect(isColumnSortable(undefined)).toBe(false);
    });
  });

  describe('getColumnLabel', () => {
    it('returns correct label for valid column', () => {
      expect(getColumnLabel('product_name', mockT)).toBe('Product Name');
      expect(getColumnLabel('number', mockT)).toBe('Registration #');
    });

    it('returns column key for invalid column', () => {
      expect(getColumnLabel('invalid_column', mockT)).toBe('invalid_column');
    });

    it('handles null/undefined gracefully', () => {
      expect(getColumnLabel(null, mockT)).toBe(null);
      expect(getColumnLabel(undefined, mockT)).toBe(undefined);
    });
  });

  describe('validateSortColumn', () => {
    it('returns true for valid sortable columns', () => {
      expect(validateSortColumn('product_name')).toBe(true);
      expect(validateSortColumn('number')).toBe(true);
    });

    it('returns false for non-sortable columns', () => {
      // All columns in our config are sortable, so test with invalid column
      expect(validateSortColumn('invalid_column')).toBe(false);
    });

    it('returns false for invalid columns', () => {
      expect(validateSortColumn('invalid_column')).toBe(false);
      expect(validateSortColumn(null)).toBe(false);
      expect(validateSortColumn(undefined)).toBe(false);
      expect(validateSortColumn('')).toBe(false);
    });
  });

  describe('validateSortDirection', () => {
    it('returns true for valid directions', () => {
      expect(validateSortDirection('asc')).toBe(true);
      expect(validateSortDirection('desc')).toBe(true);
      expect(validateSortDirection(SORT_DIRECTIONS.ASC)).toBe(true);
      expect(validateSortDirection(SORT_DIRECTIONS.DESC)).toBe(true);
    });

    it('returns false for invalid directions', () => {
      expect(validateSortDirection('invalid')).toBe(false);
      expect(validateSortDirection('ASC')).toBe(false);
      expect(validateSortDirection('DESC')).toBe(false);
      expect(validateSortDirection(null)).toBe(false);
      expect(validateSortDirection(undefined)).toBe(false);
      expect(validateSortDirection('')).toBe(false);
    });
  });

  describe('getSortAriaLabel', () => {
    it('generates correct label for unsorted column', () => {
      const label = getSortAriaLabel('Product Name', false, 'asc', mockT);
      expect(label).toBe('Product Name, not sorted, click to sort ascending');
    });

    it('generates correct label for ascending sorted column', () => {
      const label = getSortAriaLabel('Product Name', true, 'asc', mockT);
      expect(label).toBe('Product Name, sorted ascending, click to sort descending');
    });

    it('generates correct label for descending sorted column', () => {
      const label = getSortAriaLabel('Product Name', true, 'desc', mockT);
      expect(label).toBe('Product Name, sorted descending, click to sort ascending');
    });

    it('handles edge cases gracefully', () => {
      expect(getSortAriaLabel('', false, 'asc', mockT)).toContain('not sorted');
      expect(getSortAriaLabel('Test', true, 'invalid', mockT)).toContain('sorted descending');
    });
  });

  describe('getSortAnnouncement', () => {
    it('generates correct announcement for ascending sort', () => {
      const announcement = getSortAnnouncement('Product Name', 'asc', mockT);
      expect(announcement).toBe('Table sorted by Product Name in ascending');
    });

    it('generates correct announcement for descending sort', () => {
      const announcement = getSortAnnouncement('Product Name', 'desc', mockT);
      expect(announcement).toBe('Table sorted by Product Name in descending');
    });

    it('handles edge cases gracefully', () => {
      expect(getSortAnnouncement('', 'asc', mockT)).toContain('ascending');
      expect(getSortAnnouncement('Test', 'invalid', mockT)).toContain('descending');
    });
  });

  describe('Column configuration integrity', () => {
    it('has consistent required columns', () => {
      const requiredColumns = SORTABLE_COLUMNS.filter(col => col.required);
      expect(requiredColumns.length).toBeGreaterThan(0);
      
      // Check that required columns are typically sortable
      const requiredSortableColumns = requiredColumns.filter(col => col.sortable);
      expect(requiredSortableColumns.length).toBeGreaterThan(0);
    });

    it('has proper data types for different column types', () => {
      const numericColumns = SORTABLE_COLUMNS.filter(col => col.type === 'numeric');
      const textColumns = SORTABLE_COLUMNS.filter(col => col.type === 'text');
      const dateColumns = SORTABLE_COLUMNS.filter(col => col.type === 'date');
      
      expect(numericColumns.length).toBeGreaterThan(0);
      expect(textColumns.length).toBeGreaterThan(0);
      expect(dateColumns.length).toBeGreaterThan(0);
    });

    it('has unique column keys', () => {
      const keys = SORTABLE_COLUMNS.map(col => col.key);
      const uniqueKeys = [...new Set(keys)];
      expect(keys.length).toBe(uniqueKeys.length);
    });
  });
});