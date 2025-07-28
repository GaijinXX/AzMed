import React, { useState, useActionState, useOptimistic, useTransition, Suspense, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import DrugTable from './components/DrugTable'
import Pagination from './components/Pagination'
import ResultsInfo from './components/ResultsInfo'
import ColumnSelector from './components/ColumnSelector'
import ErrorBoundary from './components/ErrorBoundary'
import { 
  SearchBarSkeleton, 
  ResultsInfoSkeleton, 
  TableSkeleton, 
  PaginationSkeleton,
  ErrorState,
  EmptyState,
  InlineLoader
} from './components/LoadingSkeletons/LoadingSkeletons'
import { searchDrugs, getErrorMessage, ApiError } from './services/supabase'
import errorLogger from './services/errorLogger'
import { useOptimizedUpdates, useOptimizedFetch, useCompilerOptimizations, useMemoryOptimization } from './hooks/useReact19Optimizations'
import performanceMonitor from './utils/performance'
import { logPerformanceReport } from './utils/performanceAnalysis'
import './App.css'

function App() {
  // React 19 optimizations hooks
  const { batchUpdate, immediateUpdate, isPending: isUpdatePending } = useOptimizedUpdates()
  const { trackRender, isCompilerActive } = useCompilerOptimizations()
  const { cleanup, trackMemoryUsage } = useMemoryOptimization()

  // Track component render for performance monitoring
  trackRender('App')

  // Core state management using useState with automatic batching
  const [drugs, setDrugs] = useState([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Column visibility state with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('azerbaijan-drug-db-columns')
      return saved ? JSON.parse(saved) : {
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
      }
    } catch {
      return {
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
      }
    }
  })

  // useTransition for smooth page and search transitions
  const [isPending, startTransition] = useTransition()

  // useActionState for search form handling
  const [searchState, searchAction, isSearchPending] = useActionState(
    async (prevState, formData) => {
      const newSearchText = formData?.get?.('search')?.toString() || ''
      
      // Start transition for smooth UI updates
      startTransition(() => {
        setSearchText(newSearchText)
        setCurrentPage(1) // Reset to first page on new search
      })

      // Perform the actual search
      await performSearch(newSearchText, 1, pageSize)
      
      return {
        ...prevState,
        searchText: newSearchText,
        lastSearched: Date.now()
      }
    },
    { 
      searchText: '', 
      lastSearched: null 
    }
  )

  // useOptimistic for immediate UI feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    { 
      drugs, 
      searchText, 
      currentPage, 
      pageSize, 
      totalCount, 
      totalPages,
      visibleColumns,
      loading: loading || isPending || isSearchPending
    },
    (state, action) => {
      switch (action.type) {
        case 'SEARCH_START':
          return {
            ...state,
            searchText: action.searchText,
            loading: true,
            currentPage: 1
          }
        case 'PAGE_CHANGE':
          return {
            ...state,
            currentPage: action.page,
            loading: true
          }
        case 'PAGE_SIZE_CHANGE':
          return {
            ...state,
            pageSize: action.pageSize,
            currentPage: 1,
            loading: true
          }
        default:
          return state
      }
    }
  )

  // Optimized fetch function using React 19 features
  const { fetch: optimizedSearchDrugs } = useOptimizedFetch(searchDrugs, [])

  // Core function to perform search with enhanced error handling and performance monitoring
  const performSearch = async (searchTerm, page, size) => {
    const measureId = `search-${searchTerm}-${page}-${size}`
    performanceMonitor.startMeasure(measureId, { searchTerm, page, size })

    try {
      // Use immediate update for loading state (urgent)
      immediateUpdate(() => {
        setLoading(true)
        setError(null)
      })

      const response = await optimizedSearchDrugs(searchTerm, page, size)
      
      // Use batch update for all result state changes (React 19 automatic batching)
      batchUpdate(() => {
        setDrugs(response.data)
        setTotalCount(response.total_count)
        setTotalPages(response.total_pages)
        setCurrentPage(response.page_number)
        setPageSize(response.page_size)
      }, 'search-results-update')
      
      performanceMonitor.endMeasure(measureId, { 
        success: true, 
        resultCount: response.data.length,
        totalCount: response.total_count 
      })
      
    } catch (err) {
      // Enhanced error logging with context
      const errorId = errorLogger.logApiError(err, {
        endpoint: 'database-search',
        method: 'POST',
        parameters: { searchTerm, page, size },
        operation: 'performSearch'
      })

      console.error(`Search error [${errorId}]:`, err)
      
      const userFriendlyMessage = getErrorMessage(err)
      
      // Use batch update for error state
      batchUpdate(() => {
        setError(userFriendlyMessage)
        setDrugs([])
        setTotalCount(0)
        setTotalPages(0)
      }, 'search-error-update')

      performanceMonitor.endMeasure(measureId, { 
        success: false, 
        error: err.message 
      })
    } finally {
      // Use immediate update for loading state
      immediateUpdate(() => {
        setLoading(false)
      })
    }
  }



  // Handle search with optimized React 19 updates
  const handleSearch = (newSearchText) => {
    performanceMonitor.measureConcurrentFeature('search-interaction', () => {
      // Perform actual search in transition with optimistic update
      startTransition(() => {
        // Update the actual searchText state to ensure pagination uses correct term
        setSearchText(newSearchText)
        setCurrentPage(1) // Reset to first page on new search
        
        // Add optimistic update for immediate feedback inside transition
        addOptimisticUpdate({
          type: 'SEARCH_START',
          searchText: newSearchText
        })
        
        performSearch(newSearchText, 1, pageSize)
      })
    })
  }

  // Handle page change with optimized React 19 updates
  const handlePageChange = (newPage) => {
    performanceMonitor.measureConcurrentFeature('pagination-interaction', () => {
      // Perform actual page change in transition with optimistic update
      startTransition(() => {
        // Add optimistic update for immediate feedback inside transition
        addOptimisticUpdate({
          type: 'PAGE_CHANGE',
          page: newPage
        })
        
        performSearch(searchText, newPage, pageSize)
      })
    })
  }

  // Handle page size change with optimized React 19 updates
  const handlePageSizeChange = (newPageSize) => {
    performanceMonitor.measureConcurrentFeature('page-size-interaction', () => {
      // Perform actual page size change in transition with optimistic update
      startTransition(() => {
        // Add optimistic update for immediate feedback inside transition
        addOptimisticUpdate({
          type: 'PAGE_SIZE_CHANGE',
          pageSize: newPageSize
        })
        
        performSearch(searchText, 1, newPageSize)
      })
    })
  }

  // Enhanced retry functionality for failed API calls
  const handleRetry = () => {
    setError(null)
    
    // Log retry attempt
    errorLogger.logError(new Error('User initiated retry'), {
      type: 'USER_RETRY',
      operation: 'handleRetry',
      searchTerm: searchText,
      currentPage,
      pageSize
    })
    
    startTransition(() => {
      performSearch(searchText, currentPage, pageSize)
    })
  }

  // Handle column visibility toggle with localStorage persistence
  const handleColumnToggle = (columnKey) => {
    performanceMonitor.measureConcurrentFeature('column-toggle', () => {
      startTransition(() => {
        setVisibleColumns(prev => {
          const newVisibleColumns = {
            ...prev,
            [columnKey]: !prev[columnKey]
          }
          
          // Persist to localStorage
          try {
            localStorage.setItem('azerbaijan-drug-db-columns', JSON.stringify(newVisibleColumns))
          } catch (err) {
            console.warn('Failed to save column preferences:', err)
          }
          
          return newVisibleColumns
        })
      })
    })
  }

  // Initial data loading on application startup with performance monitoring
  useEffect(() => {
    performanceMonitor.measureConcurrentFeature('initial-load', () => {
      // Set the initial search text to match what we're searching for
      setSearchText('%')
      // Load all drugs using SQL wildcard (%)
      performSearch('%', 1, 10)
    })

    // Track memory usage in development
    if (process.env.NODE_ENV === 'development') {
      trackMemoryUsage()
      
      // Generate performance report after initial load
      setTimeout(() => {
        logPerformanceReport()
      }, 3000)
    }

    // Cleanup function for component unmount
    return cleanup
  }, [cleanup, trackMemoryUsage])

  // Determine current loading state with React 19 optimizations
  const isLoading = optimisticState.loading || isUpdatePending

  return (
    <ErrorBoundary
      fallback={({ onRetry }) => (
        <div className="App">
          <header className="App-header" role="banner">
            <h1>Azerbaijan Drug Database</h1>
            <p>Search and browse all officially registered drugs in Azerbaijan</p>
          </header>
          <main id="main-content" className="App-main" role="main" tabIndex="-1">
            <ErrorState
              message="The application encountered an unexpected error and couldn't continue."
              onRetry={onRetry}
              retryText="Try Again"
              showRefresh={true}
            />
          </main>
        </div>
      )}
    >
      <div className="App">
        <header className="App-header" role="banner">
          <h1>Azerbaijan Drug Database</h1>
          <p>Search and browse all officially registered drugs in Azerbaijan</p>
        </header>

        <main id="main-content" className="App-main" role="main" tabIndex="-1">
          {/* Live region for screen reader announcements */}
          <div 
            id="search-status" 
            className="visually-hidden" 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
          >
            {isLoading ? 'Searching for drugs...' : 
             error ? `Error: ${error}` :
             optimisticState.totalCount > 0 ? `Found ${optimisticState.totalCount} drugs` :
             'No drugs found'}
          </div>

          <section aria-labelledby="search-heading">
            <h2 id="search-heading" className="visually-hidden">Search Drugs</h2>
            <Suspense fallback={<SearchBarSkeleton />}>
              <SearchBar 
                onSearch={handleSearch}
                initialValue={optimisticState.searchText}
                placeholder="Search for drugs by name or active ingredient..."
                disabled={isLoading}
                aria-describedby="search-status"
              />
            </Suspense>
          </section>

          {error && (
            <ErrorState
              message={error}
              onRetry={handleRetry}
              retryText="Try Again"
              showRefresh={true}
            />
          )}

          {!error && (
            <>
              <section aria-labelledby="results-heading">
                <h2 id="results-heading" className="visually-hidden">Search Results</h2>
                <div className="results-header">
                  <Suspense fallback={<ResultsInfoSkeleton />}>
                    <ResultsInfo
                      totalCount={optimisticState.totalCount}
                      currentPage={optimisticState.currentPage}
                      pageSize={optimisticState.pageSize}
                      searchText={optimisticState.searchText}
                      loading={isLoading}
                    />
                  </Suspense>
                  {/* Column Selector moved from table to results header */}
                  {(optimisticState.drugs.length > 0 || isLoading) && (
                    <ColumnSelector
                      columns={[
                        { key: 'number', label: 'Registration #', required: true },
                        { key: 'product_name', label: 'Product Name', required: true },
                        { key: 'active_ingredients', label: 'Active Ingredients', required: false },
                        { key: 'dosage_amount', label: 'Dosage Amount', required: false },
                        { key: 'dosage_form', label: 'Dosage Form', required: false },
                        { key: 'packaging_form', label: 'Packaging Form', required: false },
                        { key: 'amount', label: 'Package Amount', required: false },
                        { key: 'manufacturer', label: 'Manufacturer', required: false },
                        { key: 'wholesale_price', label: 'Wholesale Price', required: false },
                        { key: 'retail_price', label: 'Retail Price', required: false },
                        { key: 'date', label: 'Registration Date', required: false }
                      ]}
                      visibleColumns={optimisticState.visibleColumns}
                      onColumnToggle={handleColumnToggle}
                      disabled={isLoading}
                    />
                  )}
                </div>
              </section>

              {/* Show empty state when no results */}
              {!isLoading && optimisticState.drugs.length === 0 && optimisticState.totalCount === 0 && (
                <EmptyState
                  message={
                    optimisticState.searchText && optimisticState.searchText !== '%' 
                      ? "No drugs found" 
                      : "No drugs available"
                  }
                  description={
                    optimisticState.searchText && optimisticState.searchText !== '%'
                      ? `No results found for "${optimisticState.searchText}". Try a different search term or browse all drugs.`
                      : "The database appears to be empty or there was an issue loading the drugs. Try refreshing or contact support."
                  }
                  action={
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleSearch('%')}
                        className="retry-button"
                      >
                        Show All Drugs
                      </button>
                    </div>
                  }
                />
              )}

              {/* Show table when we have data or are loading */}
              {(optimisticState.drugs.length > 0 || isLoading) && (
                <section aria-labelledby="drugs-table-heading">
                  <h2 id="drugs-table-heading" className="visually-hidden">
                    Drug Information Table
                  </h2>
                  <Suspense fallback={<TableSkeleton rows={optimisticState.pageSize} />}>
                    <DrugTable
                      drugs={optimisticState.drugs}
                      loading={isLoading}
                      isPending={isPending || isSearchPending}
                      visibleColumns={optimisticState.visibleColumns}
                      onColumnToggle={handleColumnToggle}
                      aria-describedby="search-status"
                    />
                  </Suspense>
                </section>
              )}

              {/* Show pagination when we have multiple pages */}
              {optimisticState.totalPages > 1 && (
                <nav aria-labelledby="pagination-heading" role="navigation">
                  <h2 id="pagination-heading" className="visually-hidden">
                    Page Navigation
                  </h2>
                  <Suspense fallback={<PaginationSkeleton />}>
                    <Pagination
                      currentPage={optimisticState.currentPage}
                      totalPages={optimisticState.totalPages}
                      pageSize={optimisticState.pageSize}
                      totalCount={optimisticState.totalCount}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      disabled={isLoading}
                      aria-describedby="search-status"
                    />
                  </Suspense>
                </nav>
              )}

              {/* Show loading indicator for pending operations */}
              {(isPending || isSearchPending) && !isLoading && (
                <div className="pending-indicator">
                  <InlineLoader text="Updating..." />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App