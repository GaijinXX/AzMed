import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DrugTable from '../DrugTable';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the formatters module
vi.mock('../../../utils/formatters', () => ({
  formatPrice: vi.fn((price) => `₼${(price / 100).toFixed(2)}`),
  truncateIngredients: vi.fn((text) => text),
  truncateText: vi.fn((text) => text)
}));

const mockDrugs = [
  {
    number: 12345,
    product_name: 'Test Drug 1',
    active_ingredients: 'Ingredient A, Ingredient B',
    dosage_amount: '500mg',
    dosage_form: 'Tablet',
    packaging_form: 'Blister pack',
    amount: '30 tablets',
    manufacturer: 'Test Pharma Inc, USA',
    wholesale_price: 1500,
    retail_price: 2000,
    date: '2024-01-15'
  },
  {
    number: 67890,
    product_name: 'Test Drug 2',
    active_ingredients: 'Ingredient C',
    dosage_amount: '250mg',
    dosage_form: 'Capsule',
    packaging_form: 'Bottle',
    amount: '60 capsules',
    manufacturer: 'Another Pharma Ltd, Germany',
    wholesale_price: 3000,
    retail_price: 4000,
    date: '2024-02-20'
  }
];

// All columns visible for testing
const allColumnsVisible = {
  number: true,
  product_name: true,
  active_ingredients: true,
  dosage_amount: true,
  dosage_form: true,
  packaging_form: true,
  amount: true,
  manufacturer: true,
  wholesale_price: true,
  retail_price: true,
  date: true
};

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
);

describe('DrugTable', () => {
  it('renders table with drug data', () => {
    render(<DrugTable drugs={mockDrugs} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    // Check table headers (using title attribute for abbreviated headers)
    expect(screen.getByTitle('Registration #')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Active Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Dosage')).toBeInTheDocument();
    expect(screen.getByText('Formulation')).toBeInTheDocument();
    expect(screen.getByText('Packaging Form')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByTitle('Wholesale Price in Azerbaijan Manat')).toBeInTheDocument();
    expect(screen.getByTitle('Retail Price in Azerbaijan Manat')).toBeInTheDocument();
    expect(screen.getByText('Registration Date')).toBeInTheDocument();
    
    // Check drug data
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('Test Drug 1')).toBeInTheDocument();
    expect(screen.getByText('67890')).toBeInTheDocument();
    expect(screen.getByText('Test Drug 2')).toBeInTheDocument();
  });

  it('renders empty state when no drugs provided', () => {
    render(<DrugTable drugs={[]} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('No drugs found. Try adjusting your search criteria.')).toBeInTheDocument();
  });

  it('renders empty state when drugs is null or undefined', () => {
    render(<DrugTable drugs={null} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    expect(screen.getByText('No drugs found. Try adjusting your search criteria.')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading is true', () => {
    render(<DrugTable drugs={mockDrugs} loading={true} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    // Should show table headers (using title attribute for abbreviated headers)
    expect(screen.getByTitle('Registration #')).toBeInTheDocument();
    
    // Should show skeleton rows (check for skeleton class using CSS modules pattern)
    const skeletonRows = document.querySelectorAll('tr[class*="skeletonRow"]');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('applies pending class when isPending is true', () => {
    render(<DrugTable drugs={mockDrugs} isPending={true} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    const tableBody = document.querySelector('tbody');
    expect(tableBody.className).toMatch(/pending/);
  });

  it('has proper table structure and accessibility', () => {
    render(<DrugTable drugs={mockDrugs} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check for proper column headers with scope
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(11);
    
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });

  it('renders correct number of rows for given drugs', () => {
    render(<DrugTable drugs={mockDrugs} />, { wrapper: TestWrapper });
    
    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('handles empty drugs array gracefully', () => {
    render(<DrugTable drugs={[]} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No drugs found. Try adjusting your search criteria.')).toBeInTheDocument();
  });
});

describe('TableHeader', () => {
  it('renders all required column headers', () => {
    render(<DrugTable drugs={mockDrugs} visibleColumns={allColumnsVisible} />, { wrapper: TestWrapper });
    
    // Check for headers using appropriate selectors
    expect(screen.getByTitle('Registration #')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Active Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Dosage')).toBeInTheDocument();
    expect(screen.getByText('Formulation')).toBeInTheDocument();
    expect(screen.getByText('Packaging Form')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByTitle('Wholesale Price in Azerbaijan Manat')).toBeInTheDocument();
    expect(screen.getByTitle('Retail Price in Azerbaijan Manat')).toBeInTheDocument();
    expect(screen.getByText('Registration Date')).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('renders skeleton with correct structure', () => {
    render(<DrugTable drugs={[]} loading={true} />, { wrapper: TestWrapper });
    
    // Should have table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Should have skeleton rows using CSS modules pattern
    const skeletonRows = document.querySelectorAll('tr[class*="skeletonRow"]');
    expect(skeletonRows.length).toBe(10); // Default skeleton rows
    
    // Each skeleton row should have 11 cells (matching column count)
    skeletonRows.forEach(row => {
      const cells = row.querySelectorAll('td[class*="skeletonCell"]');
      expect(cells).toHaveLength(11);
    });
  });
});