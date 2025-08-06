import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import SearchBar from '../SearchBar/SearchBar';
import DrugTable from '../DrugTable/DrugTable';
import Pagination from '../Pagination/Pagination';

// Mock translation function that returns empty string for missing keys
const mockTranslationFunction = vi.fn((key) => {
  // Simulate missing translation keys by returning the key itself as fallback
  // This is what the real t function does when translations are missing
  return key;
});

const mockLanguageContext = {
  currentLanguage: 'en',
  setLanguage: vi.fn(),
  t: mockTranslationFunction,
  isLoading: false
};

// Mock the LanguageContext
vi.mock('../../contexts/LanguageContext', () => ({
  LanguageProvider: ({ children }) => children,
  useLanguage: () => mockLanguageContext
}));

// Mock the useTranslation hook
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslationFunction
  })
}));

const TestWrapper = ({ children }) => children;

describe('Translation Fallback Tests', () => {
  it('handles missing search placeholder gracefully', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={() => {}} />
      </TestWrapper>
    );

    // Should still render the component even with missing translations
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    
    // Should use the translation key as fallback
    expect(searchInput).toHaveAttribute('aria-label', 'search.ariaLabel');
  });

  it('handles missing table translations gracefully', () => {
    render(
      <TestWrapper>
        <DrugTable drugs={[]} visibleColumns={{ number: true, product_name: true }} />
      </TestWrapper>
    );

    // Should still render the empty state
    const emptyState = screen.getByRole('status');
    expect(emptyState).toBeInTheDocument();
    
    // Should use the translation key as fallback
    expect(screen.getByText('table.noResults')).toBeInTheDocument();
  });

  it('handles missing pagination translations gracefully', () => {
    render(
      <TestWrapper>
        <Pagination 
          currentPage={1} 
          totalPages={5} 
          pageSize={10} 
          totalCount={50} 
          onPageChange={() => {}} 
          onPageSizeChange={() => {}} 
        />
      </TestWrapper>
    );

    // Should still render pagination controls
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    
    // Should use translation keys as fallback
    expect(screen.getByText('pagination.itemsPerPage:')).toBeInTheDocument();
    expect(screen.getByText('pagination.previous')).toBeInTheDocument();
    expect(screen.getByText('pagination.next')).toBeInTheDocument();
  });

  it('verifies translation function is called with correct keys', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={() => {}} />
      </TestWrapper>
    );

    // Verify that the translation function was called with expected keys
    expect(mockTranslationFunction).toHaveBeenCalledWith('search.placeholder');
    expect(mockTranslationFunction).toHaveBeenCalledWith('search.ariaLabel');
    expect(mockTranslationFunction).toHaveBeenCalledWith('common.search');
  });
});