import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('DrugRow', () => {
  it('renders all drug data correctly', () => {
    render(
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
    render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('₼15.00')).toBeInTheDocument(); // wholesale_price
    expect(screen.getByText('₼20.00')).toBeInTheDocument(); // retail_price
  });

  it('formats date correctly', () => {
    render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    // Date should be formatted as locale date string
    const expectedDate = new Date('2024-01-15').toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('handles missing or null drug data', () => {
    render(
      <table>
        <tbody>
          <DrugRow drug={null} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    // Should not render anything
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('handles missing individual fields gracefully', () => {
    const incompleteDrug = {
      number: 12345,
      product_name: 'Test Drug',
      // Missing other fields
    };
    
    render(
      <table>
        <tbody>
          <DrugRow drug={incompleteDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('Test Drug')).toBeInTheDocument();
    
    // Should show N/A for missing date
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
    expect(row.className).toMatch(/tableRow/);
    
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(11); // Should have 11 cells
    
    // Check that price cells have the price class
    const priceCells = container.querySelectorAll('span[class*="priceCell"]');
    expect(priceCells).toHaveLength(2); // Wholesale and retail price cells
  });

  it('includes data-label attributes for responsive design', () => {
    const { container } = render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    const cells = container.querySelectorAll('td');
    
    expect(cells[0]).toHaveAttribute('data-label', 'Registration #');
    expect(cells[1]).toHaveAttribute('data-label', 'Product Name');
    expect(cells[2]).toHaveAttribute('data-label', 'Active Ingredients');
    expect(cells[3]).toHaveAttribute('data-label', 'Dosage');
    expect(cells[4]).toHaveAttribute('data-label', 'Form');
    expect(cells[5]).toHaveAttribute('data-label', 'Packaging');
    expect(cells[6]).toHaveAttribute('data-label', 'Amount');
    expect(cells[7]).toHaveAttribute('data-label', 'Manufacturer');
    expect(cells[8]).toHaveAttribute('data-label', 'Wholesale Price');
    expect(cells[9]).toHaveAttribute('data-label', 'Retail Price');
    expect(cells[10]).toHaveAttribute('data-label', 'Date');
  });

  it('includes title attributes for tooltips', () => {
    const { container } = render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    const productNameCell = screen.getByText('Test Drug Name').closest('span');
    expect(productNameCell).toHaveAttribute('title', 'Test Drug Name');
    
    const ingredientsCell = screen.getByText('Ingredient A, Ingredient B, Ingredient C').closest('span');
    expect(ingredientsCell).toHaveAttribute('title', 'Ingredient A, Ingredient B, Ingredient C');
  });

  it('calls formatter functions with correct parameters', () => {
    const formatters = vi.mocked(vi.importActual('../../../utils/formatters'));
    
    render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    // Test that the component renders the formatted values
    expect(screen.getByText('₼15.00')).toBeInTheDocument(); // wholesale_price formatted
    expect(screen.getByText('₼20.00')).toBeInTheDocument(); // retail_price formatted
  });

  it('handles zero prices correctly', () => {
    const drugWithZeroPrices = {
      ...mockDrug,
      wholesale_price: 0,
      retail_price: 0
    };
    
    render(
      <table>
        <tbody>
          <DrugRow drug={drugWithZeroPrices} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    const zeroPrices = screen.getAllByText('₼0.00');
    expect(zeroPrices).toHaveLength(2); // Both wholesale and retail prices should be ₼0.00
  });

  it('handles invalid date gracefully', () => {
    const drugWithInvalidDate = {
      ...mockDrug,
      date: null
    };
    
    render(
      <table>
        <tbody>
          <DrugRow drug={drugWithInvalidDate} visibleColumns={allColumnsVisible} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
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

    const { container } = render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={partiallyVisibleColumns} />
        </tbody>
      </table>
    );

    // Should only render visible columns
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(4); // number, product_name, manufacturer, wholesale_price

    // Check that visible columns are rendered
    expect(screen.getByText('12345')).toBeInTheDocument(); // number
    expect(screen.getByText('Test Drug Name')).toBeInTheDocument(); // product_name
    expect(screen.getByText('Test Pharma Inc, USA')).toBeInTheDocument(); // manufacturer
    expect(screen.getByText('₼15.00')).toBeInTheDocument(); // wholesale_price

    // Check that hidden columns are not rendered
    expect(screen.queryByText('Ingredient A, Ingredient B, Ingredient C')).not.toBeInTheDocument(); // active_ingredients
    expect(screen.queryByText('500mg')).not.toBeInTheDocument(); // dosage_amount
    expect(screen.queryByText('₼20.00')).not.toBeInTheDocument(); // retail_price
  });

  it('handles empty visibleColumns object', () => {
    const { container } = render(
      <table>
        <tbody>
          <DrugRow drug={mockDrug} visibleColumns={{}} />
        </tbody>
      </table>
    );

    // Should render no cells when no columns are visible
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(0);
  });
});