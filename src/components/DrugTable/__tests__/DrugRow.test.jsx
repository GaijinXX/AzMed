import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import DrugRow from '../DrugRow';

// Mock the formatters module
vi.mock('../../../utils/formatters', () => ({
  formatPrice: vi.fn((price) => `₼${(price / 100).toFixed(2)}`),
  truncateIngredients: vi.fn((text, maxLength) => text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text),
  truncateText: vi.fn((text, maxLength) => text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text)
}));

const mockDrug = {
  number: 12345,
  product_name: 'Test Drug Name',
  active_ingredients: 'Ingredient A, Ingredient B, Ingredient C',
  dosage_amount: '500mg',
  dosage_form: 'Tablet',
  packaging_form: 'Blister pack',
  amount: '30 tablets',
  manufacturer: 'Test Pharma Inc, USA',
  wholesale_price: 1500,
  retail_price: 2000,
  date: '2024-01-15'
};

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

const renderWithProvider = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

describe('DrugRow', () => {
  it('renders all drug data correctly', () => {
    renderWithProvider(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('Test Drug Name')).toBeInTheDocument();
    expect(screen.getByText('Ingredient A, Ingredient B, Ingredient C')).toBeInTheDocument();
    expect(screen.getByText('500mg')).toBeInTheDocument();
    expect(screen.getByText('Tablet')).toBeInTheDocument();
    expect(screen.getByText('Blister pack')).toBeInTheDocument();
    expect(screen.getByText('30 tablets')).toBeInTheDocument();
    expect(screen.getByText('Test Pharma Inc, USA')).toBeInTheDocument();
  });

  it('formats prices correctly', () => {
    renderWithProvider(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    // Price is split across elements: ₼ symbol and numeric value
    expect(screen.getByText('15.00')).toBeInTheDocument(); // wholesale_price
    expect(screen.getByText('20.00')).toBeInTheDocument(); // retail_price
    expect(screen.getAllByText('₼')).toHaveLength(2); // Both price symbols
  });

  it('handles zero prices correctly', () => {
    const drugWithZeroPrices = {
      ...mockDrug,
      wholesale_price: 0,
      retail_price: 0
    };
    
    renderWithProvider(
      <table>
        <tbody>
          <DrugRow drug={drugWithZeroPrices} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    const zeroPrices = screen.getAllByText('0.00');
    expect(zeroPrices).toHaveLength(2); // Both wholesale and retail prices should be 0.00
  });

  it('respects column visibility settings', () => {
    const partiallyVisibleColumns = {
      number: true,
      product_name: true,
      active_ingredients: false,
      dosage_amount: false,
      dosage_form: false,
      packaging_form: false,
      amount: false,
      manufacturer: true,
      wholesale_price: true,
      retail_price: false,
      date: false
    };

    renderWithProvider(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={partiallyVisibleColumns} />
        </tbody>
      </table>
    );

    // Check that visible columns are rendered
    expect(screen.getByText('12345')).toBeInTheDocument(); // number
    expect(screen.getByText('Test Drug Name')).toBeInTheDocument(); // product_name
    expect(screen.getByText('Test Pharma Inc, USA')).toBeInTheDocument(); // manufacturer
    expect(screen.getByText('15.00')).toBeInTheDocument(); // wholesale_price

    // Check that hidden columns are not rendered
    expect(screen.queryByText('Ingredient A, Ingredient B, Ingredient C')).not.toBeInTheDocument(); // active_ingredients
    expect(screen.queryByText('500mg')).not.toBeInTheDocument(); // dosage_amount
    expect(screen.queryByText('20.00')).not.toBeInTheDocument(); // retail_price
  });
});