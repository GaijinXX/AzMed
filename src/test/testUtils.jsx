import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '../contexts/LanguageContext'

// Test wrapper with all necessary providers
export const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
)

// Enhanced render function with providers
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options })
}

// Standard mock drug data that matches expected structure
export const createMockDrugData = (count = 2) => {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    product_name: `Drug ${i + 1}`,
    active_ingredients: `Ingredient ${i + 1}`,
    dosage_amount: '10mg',
    dosage_form: 'tablet',
    packaging_form: 'blister',
    amount: '30',
    manufacturer: `Manufacturer ${i + 1}`,
    wholesale_price: 1000 + i * 100,
    retail_price: 1200 + i * 100,
    date: '2024-01-01'
  }))
}

// Standard mock response structure
export const createMockResponse = (data = null, totalCount = null, pageNumber = 1, pageSize = 10) => {
  const drugs = data || createMockDrugData(2)
  const total = totalCount !== null ? totalCount : drugs.length
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    data: drugs,
    total_count: total,
    page_number: pageNumber,
    page_size: pageSize,
    total_pages: totalPages
  }
}

// Mock Supabase service with consistent responses
export const createMockSupabaseService = () => {
  const mockSearchDrugs = vi.fn()
  const mockGetErrorMessage = vi.fn()
  
  // Default successful response
  mockSearchDrugs.mockResolvedValue(createMockResponse())
  mockGetErrorMessage.mockReturnValue('Test error message')
  
  return {
    searchDrugs: mockSearchDrugs,
    getErrorMessage: mockGetErrorMessage,
    ApiError: class ApiError extends Error {
      constructor(message, type) {
        super(message)
        this.type = type
        this.name = 'ApiError'
      }
    },
    API_ERRORS: {
      NETWORK_ERROR: 'NETWORK_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      SERVER_ERROR: 'SERVER_ERROR',
      INVALID_RESPONSE: 'INVALID_RESPONSE',
      FUNCTION_ERROR: 'FUNCTION_ERROR'
    }
  }
}

// Mock error logger
export const createMockErrorLogger = () => ({
  logApiError: vi.fn(() => 'mock-error-id'),
  logError: vi.fn(() => 'mock-error-id')
})

// Mock translation function with common translations
export const createMockTranslation = () => {
  const translations = {
    'header.title': 'Azerbaijan Drug Database',
    'header.subtitle': 'Search and browse all officially registered drugs in Azerbaijan',
    'search.placeholder': 'Search by drug name...',
    'search.ariaLabel': 'Search Drugs',
    'search.noResults': 'No drugs found matching your search criteria',
    'search.resultsFound': 'Found',
    'search.showAllDrugs': 'Show All Drugs',
    'results.noResultsFound': 'No results found for',
    'table.noData': 'No data available',
    'table.noResults': 'No drugs found. Try adjusting your search criteria.',
    'table.headers.product_name': 'Drug Information Table',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Try Again',
    'errors.loadingFailed': 'The database appears to be empty or there was an issue loading the drugs',
    'pagination.page': 'Page Navigation',
    'columns.settings': 'Column Settings',
    'columns.of': 'of',
    'columns.visible': 'visible',
    'columns.columns': 'Columns',
    'columns.showHideColumns': 'Show/Hide Columns',
    'share.ariaLabel': 'Share current search',
    'share.tooltip': 'Share this search',
    'share.button': 'Share',
    'language.selector': 'Language',
    'language.english': 'English'
  }
  
  return vi.fn((key, fallback) => {
    return translations[key] || fallback || key
  })
}

// Mock language context
export const createMockLanguageContext = () => ({
  setLanguage: vi.fn(),
  currentLanguage: 'en'
})

// Mock React 19 optimization hooks
export const createMockReact19Hooks = () => ({
  useOptimizedUpdates: vi.fn(() => ({
    batchUpdate: vi.fn((fn) => fn()),
    immediateUpdate: vi.fn((fn) => fn()),
    isPending: false
  })),
  useOptimizedFetch: vi.fn((fn) => ({ fetch: fn })),
  useCompilerOptimizations: vi.fn(() => ({
    trackRender: vi.fn(),
    isCompilerActive: false
  })),
  useMemoryOptimization: vi.fn(() => ({
    cleanup: vi.fn(),
    trackMemoryUsage: vi.fn()
  }))
})

// Mock performance monitor
export const createMockPerformanceMonitor = () => ({
  startMeasure: vi.fn(),
  endMeasure: vi.fn(),
  measureConcurrentFeature: vi.fn((name, fn) => fn())
})

// Mock components for testing App state management
export const createMockComponents = () => ({
  SearchBar: ({ initialValue, disabled, onSearch, placeholder }) => (
    <div data-testid="search-bar" role="search">
      <input
        data-testid="search-input"
        role="searchbox"
        defaultValue={initialValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onSearch && onSearch(e.target.value)}
      />
    </div>
  ),
  
  DrugTable: ({ drugs, loading, isPending, sortColumn, sortDirection, onSort }) => (
    <div data-testid="drug-table">
      {loading && <div data-testid="table-loading">Loading...</div>}
      {isPending && <div data-testid="table-pending">Pending...</div>}
      <div data-testid="drug-count">{drugs.length}</div>
      <div data-testid="sort-column">{sortColumn || 'none'}</div>
      <div data-testid="sort-direction">{sortDirection}</div>
    </div>
  ),
  
  Pagination: ({ currentPage, totalPages, pageSize, totalCount, disabled, onPageChange, onPageSizeChange }) => (
    <div data-testid="pagination">
      <div data-testid="current-page">{currentPage}</div>
      <div data-testid="total-pages">{totalPages}</div>
      <div data-testid="page-size">{pageSize}</div>
      <div data-testid="total-count">{totalCount}</div>
      <button 
        data-testid="next-page" 
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange && onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  ),
  
  ResultsInfo: ({ totalCount, currentPage, pageSize, searchText, loading }) => (
    <div data-testid="results-info">
      {loading && <div data-testid="results-loading">Loading...</div>}
      <div data-testid="results-total">{totalCount}</div>
      <div data-testid="results-search">{searchText}</div>
      <div data-testid="results-page">{currentPage}</div>
      <div data-testid="results-page-size">{pageSize}</div>
    </div>
  ),
  
  ColumnSelector: ({ visibleColumns, onColumnToggle, disabled }) => (
    <div data-testid="column-selector">
      <button data-testid="column-toggle" disabled={disabled}>
        Columns ({Object.values(visibleColumns || {}).filter(Boolean).length})
      </button>
    </div>
  ),
  
  ShareButton: ({ disabled }) => (
    <button data-testid="share-button" disabled={disabled}>
      Share
    </button>
  ),
  
  LanguageSelector: () => (
    <div data-testid="language-selector">
      <button>English</button>
    </div>
  ),
  
  ThemeSelector: () => (
    <div data-testid="theme-selector">
      <button>Auto</button>
    </div>
  ),
  
  ErrorBoundary: ({ children, fallback }) => {
    try {
      return <div data-testid="error-boundary">{children}</div>
    } catch (error) {
      return fallback ? fallback({ error, onRetry: vi.fn() }) : <div data-testid="error-fallback">Error occurred</div>
    }
  }
})

// Setup all mocks for App component testing
export const setupAppMocks = () => {
  const supabaseMocks = createMockSupabaseService()
  const errorLoggerMocks = createMockErrorLogger()
  const translationMock = createMockTranslation()
  const languageContextMock = createMockLanguageContext()
  const react19Mocks = createMockReact19Hooks()
  const performanceMock = createMockPerformanceMonitor()
  const componentMocks = createMockComponents()
  
  // Mock all the modules
  vi.mock('../services/supabase', () => supabaseMocks)
  vi.mock('../services/errorLogger', () => ({ default: errorLoggerMocks }))
  vi.mock('../hooks/useTranslation', () => ({
    useTranslation: vi.fn(() => ({
      t: translationMock,
      currentLanguage: 'en'
    }))
  }))
  vi.mock('../contexts/LanguageContext', () => ({
    default: {},
    LanguageProvider: ({ children }) => children,
    useLanguageContext: vi.fn(() => languageContextMock)
  }))
  vi.mock('../hooks/useReact19Optimizations', () => react19Mocks)
  vi.mock('../utils/performance', () => ({ default: performanceMock }))
  vi.mock('../utils/performanceAnalysis', () => ({
    logPerformanceReport: vi.fn()
  }))
  vi.mock('../utils/monitoring', () => ({
    initializeMonitoring: vi.fn(),
    trackPageView: vi.fn()
  }))
  
  // Mock components
  vi.mock('../components/SearchBar', () => ({ default: componentMocks.SearchBar }))
  vi.mock('../components/DrugTable', () => ({ default: componentMocks.DrugTable }))
  vi.mock('../components/Pagination', () => ({ default: componentMocks.Pagination }))
  vi.mock('../components/ResultsInfo', () => ({ default: componentMocks.ResultsInfo }))
  vi.mock('../components/ColumnSelector', () => ({ default: componentMocks.ColumnSelector }))
  vi.mock('../components/ShareButton/ShareButton', () => ({ default: componentMocks.ShareButton }))
  vi.mock('../components/LanguageSelector', () => ({ default: componentMocks.LanguageSelector }))
  vi.mock('../components/ThemeSelector/ThemeSelector', () => ({ default: componentMocks.ThemeSelector }))
  vi.mock('../components/ErrorBoundary', () => ({ default: componentMocks.ErrorBoundary }))
  vi.mock('../components/LoadingSkeletons/LoadingSkeletons', () => ({
    SearchBarSkeleton: () => <div data-testid="search-skeleton">Loading search...</div>,
    ResultsInfoSkeleton: () => <div data-testid="results-skeleton">Loading results...</div>,
    TableSkeleton: () => <div data-testid="table-skeleton">Loading table...</div>,
    PaginationSkeleton: () => <div data-testid="pagination-skeleton">Loading pagination...</div>,
    ErrorState: ({ message, onRetry, retryText, showRefresh }) => (
      <div data-testid="error-state">
        <p>{message}</p>
        <button onClick={onRetry}>{retryText}</button>
        {showRefresh && <button onClick={() => window.location.reload()}>Refresh Page</button>}
      </div>
    ),
    EmptyState: ({ message, description, action }) => (
      <div data-testid="empty-state">
        <p>{message}</p>
        {description && <p>{description}</p>}
        {action}
      </div>
    ),
    InlineLoader: ({ text }) => <div data-testid="inline-loader">{text}</div>
  }))
  
  return {
    supabaseMocks,
    errorLoggerMocks,
    translationMock,
    languageContextMock,
    react19Mocks,
    performanceMock,
    componentMocks
  }
}

// Cleanup function for tests
export const cleanupMocks = () => {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

// Language test utilities
export const createLanguageTestUtils = (user) => ({
  async switchLanguage(language) {
    const languageButton = screen.getByRole('button', { name: /language/i });
    await user.click(languageButton);
    
    const languageOption = screen.getAllByRole('option').find(option => 
      option.getAttribute('data-language') === language
    );
    
    if (languageOption) {
      await user.click(languageOption);
    }
  },
  
  async expectLanguageText(language, expectedTexts) {
    for (const text of expectedTexts) {
      await waitFor(() => {
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    }
  }
});

export * from '@testing-library/react'