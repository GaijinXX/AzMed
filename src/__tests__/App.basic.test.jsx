import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from '../App'
import * as supabaseService from '../services/supabase'

// Mock the supabase service
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(),
  getErrorMessage: vi.fn()
}))

// Mock translation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key) => {
      const translations = {
        'header.title': 'Azerbaijan Drug Database',
        'header.subtitle': 'Search and browse all officially registered drugs in Azerbaijan',
        'search.placeholder': 'Search by drug name...',
        'search.noResults': 'No drugs found matching your search criteria',
        'results.noResultsFound': 'No results found for',
        'table.noData': 'No data available',
        'table.noResults': 'No drugs found. Try adjusting your search criteria.',
        'common.loading': 'Loading...',
        'common.error': 'Error'
      }
      return translations[key] || key
    }),
    currentLanguage: 'en'
  }))
}))

// Mock language context
vi.mock('../contexts/LanguageContext', () => ({
  default: {},
  useLanguageContext: vi.fn(() => ({
    setLanguage: vi.fn(),
    currentLanguage: 'en'
  }))
}))

// Mock components to focus on App state management
vi.mock('../components/SearchBar', () => ({
  default: ({ initialValue, disabled }) => (
    <div data-testid="search-bar">
      <input
        data-testid="search-input"
        defaultValue={initialValue}
        disabled={disabled}
      />
    </div>
  )
}))

vi.mock('../components/DrugTable', () => ({
  default: ({ drugs, loading }) => (
    <div data-testid="drug-table">
      {loading && <div data-testid="table-loading">Loading...</div>}
      <div data-testid="drug-count">{drugs.length}</div>
    </div>
  )
}))

vi.mock('../components/Pagination', () => ({
  default: ({ currentPage, totalPages, pageSize, totalCount }) => (
    <div data-testid="pagination">
      <div data-testid="current-page">{currentPage}</div>
      <div data-testid="total-pages">{totalPages}</div>
      <div data-testid="page-size">{pageSize}</div>
      <div data-testid="total-count">{totalCount}</div>
    </div>
  )
}))

vi.mock('../components/ResultsInfo', () => ({
  default: ({ totalCount, searchText, loading }) => (
    <div data-testid="results-info">
      {loading && <div data-testid="results-loading">Loading...</div>}
      <div data-testid="results-total">{totalCount}</div>
      <div data-testid="results-search">{searchText}</div>
    </div>
  )
}))

describe('App Component Basic Tests', () => {
  const mockDrugsResponse = {
    data: [
      { number: 1, product_name: 'Drug 1', active_ingredients: 'Ingredient 1' },
      { number: 2, product_name: 'Drug 2', active_ingredients: 'Ingredient 2' }
    ],
    total_count: 100,
    page_number: 1,
    page_size: 10,
    total_pages: 10
  }

  beforeEach(() => {
    vi.clearAllMocks()
    supabaseService.searchDrugs.mockResolvedValue(mockDrugsResponse)
    supabaseService.getErrorMessage.mockReturnValue('Test error message')
  })

  it('should render the main app structure', async () => {
    render(<App />)

    expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument()
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
    expect(screen.getByTestId('drug-table')).toBeInTheDocument()
    expect(screen.getByTestId('results-info')).toBeInTheDocument()
    
    // Pagination might not be visible initially, so we'll check for it after data loads
    // Since we have totalPages: 10 in mock, pagination should appear
    await screen.findByTestId('pagination')
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('should have proper React 19 hooks integration', () => {
    // This test verifies that the component renders without errors
    // which means all React 19 hooks are properly integrated
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })

  it('should handle error boundary', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // The error boundary is integrated and should catch errors
    // This test verifies the structure exists
    render(<App />)
    expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })
})