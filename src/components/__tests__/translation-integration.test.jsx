import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import SearchBar from '../SearchBar/SearchBar';
import DrugTable from '../DrugTable/DrugTable';
import Pagination from '../Pagination/Pagination';

// Mock data for testing
const mockDrugs = [
  {
    number: 12345,
    product_name: 'Test Drug 1',
    active_ingredients: 'Ingredient A',
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

describe('Translation Integration Tests', () => {
  it('displays English translations by default', () => {
    render(
      <LanguageProvider>
        <SearchBar onSearch={() => {}} />
        <DrugTable drugs={mockDrugs} visibleColumns={allColumnsVisible} />
        <Pagination 
          currentPage={1} 
          totalPages={5} 
          pageSize={10} 
          totalCount={50} 
          onPageChange={() => {}} 
          onPageSizeChange={() => {}} 
        />
      </LanguageProvider>
    );

    // Check SearchBar translations
    expect(screen.getByPlaceholderText(/Search by drug name, active ingredient, or registration number/)).toBeInTheDocument();
    
    // Check DrugTable translations
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Active Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    
    // Check Pagination translations
    expect(screen.getByText('Items per page:')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles empty drug table with translated message', () => {
    render(
      <LanguageProvider>
        <DrugTable drugs={[]} visibleColumns={allColumnsVisible} />
      </LanguageProvider>
    );

    expect(screen.getByText('No drugs found. Try adjusting your search criteria.')).toBeInTheDocument();
  });

  it('displays translated loading states', () => {
    render(
      <LanguageProvider>
        <SearchBar onSearch={() => {}} />
      </LanguageProvider>
    );

    // The SearchBar should have translated aria-labels
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search drugs database');
  });

  it('displays translated table headers correctly', () => {
    render(
      <LanguageProvider>
        <DrugTable drugs={mockDrugs} visibleColumns={allColumnsVisible} />
      </LanguageProvider>
    );

    // Check for all translated headers
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

  it('displays translated pagination controls', () => {
    render(
      <LanguageProvider>
        <Pagination 
          currentPage={2} 
          totalPages={5} 
          pageSize={10} 
          totalCount={50} 
          onPageChange={() => {}} 
          onPageSizeChange={() => {}} 
        />
      </LanguageProvider>
    );

    // Check pagination translations
    expect(screen.getByText('Items per page:')).toBeInTheDocument();
    expect(screen.getByText(/Showing 11-20 of 50 items/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    
    // Check page size options
    expect(screen.getByText('10 items')).toBeInTheDocument();
    expect(screen.getByText('25 items')).toBeInTheDocument();
    expect(screen.getByText('50 items')).toBeInTheDocument();
    expect(screen.getByText('100 items')).toBeInTheDocument();
  });
});