import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DrugTable from '../DrugTable';

// Mock the React 19 optimizations hooks
vi.mock('../../../hooks/useReact19Optimizations', () => ({
  useOptimizedList: vi.fn(() => ({
    visibleItems: [],
    totalItems: 0,
    isDeferred: false
  })),
  useCompilerOptimizations: vi.fn(() => ({
    trackRender: vi.fn()
  }))
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

describe('DrugTable Column Visibility Integration', () => {
  it('renders table with default visible columns', () => {
    render(
      <DrugTable
        drugs={mockDrugs}
        visibleColumns={defaultVisibleColumns}
      />
    );

    // Initially, packaging_form, manufacturer, and wholesale_price columns should not be visible
    expect(screen.queryByText('Blister pack')).not.toBeInTheDocument();
    expect(screen.queryByText('Packaging Form')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Pharma Inc, USA')).not.toBeInTheDocument();
    expect(screen.queryByText('₼15.00')).not.toBeInTheDocument();

    // But other columns should be visible
    expect(screen.getByText('Test Drug 1')).toBeInTheDocument();
    expect(screen.getByText('Ingredient A, Ingredient B')).toBeInTheDocument();
    expect(screen.getByText('30 tablets')).toBeInTheDocument(); // amount is now visible
    expect(screen.getByText('₼20.00')).toBeInTheDocument(); // retail_price is still visible
  });

  it('renders loading skeleton without column selector', () => {
    render(
      <DrugTable
        drugs={mockDrugs}
        loading={true}
        visibleColumns={defaultVisibleColumns}
      />
    );

    // Should not have column selector in loading state (it's now in App component)
    expect(screen.queryByRole('button', { name: /column visibility settings/i })).not.toBeInTheDocument();
  });

  it('renders table with only visible columns', () => {
    const partiallyVisibleColumns = {
      number: true,
      product_name: true,
      active_ingredients: false,
      dosage_amount: false,
      dosage_form: false,
      packaging_form: false,
      amount: false,
      manufacturer: false,
      wholesale_price: true,
      retail_price: false,
      date: false
    };

    render(
      <DrugTable
        drugs={mockDrugs}
        visibleColumns={partiallyVisibleColumns}
        onColumnToggle={vi.fn()}
      />
    );

    // Should only show headers for visible columns
    expect(screen.getByTitle('Registration Number')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByTitle('Wholesale Price in Azerbaijan Manat')).toBeInTheDocument();

    // Should not show headers for hidden columns
    expect(screen.queryByText('Active Ingredients')).not.toBeInTheDocument();
    expect(screen.queryByText('Dosage Amount')).not.toBeInTheDocument();
    expect(screen.queryByText('Manufacturer')).not.toBeInTheDocument();

    // Should only show data for visible columns
    expect(screen.getByText('12345')).toBeInTheDocument(); // number
    expect(screen.getByText('Test Drug 1')).toBeInTheDocument(); // product_name
    expect(screen.getByText('₼15.00')).toBeInTheDocument(); // wholesale_price

    // Should not show data for hidden columns
    expect(screen.queryByText('Ingredient A, Ingredient B')).not.toBeInTheDocument(); // active_ingredients
    expect(screen.queryByText('500mg')).not.toBeInTheDocument(); // dosage_amount
    expect(screen.queryByText('Test Pharma Inc, USA')).not.toBeInTheDocument(); // manufacturer
  });
});