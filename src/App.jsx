import React, { useState, useActionState, useOptimistic, useTransition, Suspense, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import DrugTable from './components/DrugTable'
import Pagination from './components/Pagination'
import ResultsInfo from './components/ResultsInfo'
import ColumnSelector from './components/ColumnSelector'
import ShareButton from './components/ShareButton/ShareButton'
import ThemeSelector from './components/ThemeSelector/ThemeSelector'
import LanguageSelector from './components/LanguageSelector'
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
import { searchDrugs, getErrorMessage } from './services/supabase'
import { initializeMonitoring, trackPageView } from './utils/monitoring'
import { getColumnLabel, getSortAnnouncement, validateSortColumn } from './components/DrugTable/sortConfig.js'
import errorLogger from './services/errorLogger'
import { useOptimizedUpdates, useOptimizedFetch, useCompilerOptimizations, useMemoryOptimization } from './hooks/useReact19Optimizations'
import { useTranslation } from './hooks/useTranslation'
import { useLanguageContext } from './contexts/LanguageContext'
import { useURLState } from './hooks/useURLState'
import { DEFAULT_VISIBLE_COLUMNS } from './utils/urlStateUtils.js'
import performanceMonitor from './utils/performance'
import { logPerformanceReport } from './utils/performanceAnalysis'


import './App.css'

function App() {
  // Translation hook
  const { t, currentLanguage } = useTranslation()
  const { setLanguage } = useLanguageContext()

  // React 19 optimizations hooks
  const { batchUpdate, immediateUpdate, isPending: isUpdatePending } = useOptimizedUpdates()
  const { trackRender } = useCompilerOptimizations()
  const { cleanup, trackMemoryUsage } = useMemoryOptimization()

  // Track component render for performance monitoring
  trackRender('App')

  // URL state management - replaces individual state variables
  const {
    urlState,
    updateURL,
    isURLLoading
  } = useURLState({
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  }, {
    enableHistory: true, // Explicitly enable history
    onError: (error, context) => {
      console.error('🚨 URL State Error:', error, context);
      errorLogger.logError(error, {
        type: 'URL_STATE_ERROR',
        operation: context.operation,
        ...context
      });
    }
  })

  // Extract URL state values for easier access
  const {
    searchText,
    currentPage,
    pageSize,
    sortColumn,
    sortDirection,
    visibleColumns
  } = urlState

  // Core data state management (not URL-managed)
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Temporary local page state for testing
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage)
  
  // Local page size state for immediate UI updates
  const [localPageSize, setLocalPageSize] = useState(pageSize)
  
  // Local search text state for immediate UI updates
  const [currentSearchText, setCurrentSearchText] = useState(searchText)
  
  // Local visible columns state for immediate UI updates
  const [currentVisibleColumns, setCurrentVisibleColumns] = useState(visibleColumns)
  
  // Local sort state for immediate UI updates
  const [currentSortColumn, setCurrentSortColumn] = useState(sortColumn)
  const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection)
  
  // useTransition for smooth page and search transitions
  const [isPending, startTransition] = useTransition()

  // useActionState for search form handling
  const [, , isSearchPending] = useActionState(
    async (prevState, formData) => {
      const newSearchText = formData?.get?.('search')?.toString() || ''

      // Start transition for smooth UI updates
      startTransition(() => {
        // Update URL state instead of non-existent functions
        updateURL({
          searchText: newSearchText,
          currentPage: 1 // Reset to first page on new search
        }, { immediate: true })
      })

      // Perform the actual search
      await performSearch(newSearchText, 1, pageSize, currentSortColumn, currentSortDirection)

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

  // useOptimistic for immediate UI feedback (simplified - no pagination state)
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    {
      drugs,
      searchText: currentSearchText,
      totalCount,
      totalPages,
      visibleColumns: currentVisibleColumns,
      sortColumn: currentSortColumn,
      sortDirection: currentSortDirection,
      loading: loading || isPending || isSearchPending || isURLLoading
    },
    (state, action) => {
      switch (action.type) {
        case 'SEARCH_START':
          return {
            ...state,
            searchText: action.searchText,
            loading: true
          }
        case 'SORT_CHANGE':
          return {
            ...state,
            sortColumn: action.column,
            sortDirection: action.direction,
            loading: true
          }
        default:
          return state
      }
    }
  )

  // Keep local states in sync with URL state changes (for browser navigation)
  useEffect(() => {
    setCurrentSearchText(searchText)
  }, [searchText])
  
  useEffect(() => {
    setCurrentVisibleColumns(visibleColumns)
  }, [visibleColumns])
  
  useEffect(() => {
    setCurrentSortColumn(sortColumn)
    setCurrentSortDirection(sortDirection)
  }, [sortColumn, sortDirection])
  
  useEffect(() => {
    setLocalCurrentPage(currentPage)
  }, [currentPage])
  
  useEffect(() => {
    setLocalPageSize(pageSize)
  }, [pageSize])
  
  // Handle language from URL parameter (separate from main URL state)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && ['en', 'az', 'ru'].includes(langParam) && langParam !== currentLanguage) {
      setLanguage(langParam);
    }
  }, [currentLanguage, setLanguage]); // Include dependencies
  
  // Update URL when language changes (without interfering with main URL state)
  useEffect(() => {
    // Only update URL if currentLanguage is properly initialized and not undefined
    if (!currentLanguage || currentLanguage === 'undefined') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentLangParam = urlParams.get('lang');
    
    if (currentLanguage !== 'en') {
      // Add language parameter if not English
      if (currentLangParam !== currentLanguage) {
        urlParams.set('lang', currentLanguage);
        const newURL = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newURL);
      }
    } else {
      // Remove language parameter if English (default)
      if (currentLangParam) {
        urlParams.delete('lang');
        const newURL = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newURL);
      }
    }
  }, [currentLanguage]);

  // Note: Removed the problematic useEffect that was syncing optimistic state with URL state
  // This was causing conflicts between URL state and optimistic state updates

  // Optimized fetch function using React 19 features
  const { fetch: optimizedSearchDrugs } = useOptimizedFetch(searchDrugs, [])

  // Core function to perform search with enhanced error handling and performance monitoring
  const performSearch = async (searchTerm, page, size, orderBy = null, orderDir = 'asc') => {
    const measureId = `search-${searchTerm}-${page}-${size}-${orderBy || 'none'}-${orderDir}`
    performanceMonitor.startMeasure(measureId, { searchTerm, page, size, orderBy, orderDir })

    try {
      // Use immediate update for loading state (urgent)
      immediateUpdate(() => {
        setLoading(true)
        setError(null)
      })

      const response = await optimizedSearchDrugs(searchTerm, page, size, orderBy, orderDir)

      // Use batch update for all result state changes (React 19 automatic batching)
      batchUpdate(() => {
        setDrugs(response.data)
        setTotalCount(response.total_count)
        setTotalPages(response.total_pages)
        // Note: currentPage and pageSize are now managed by URL state, not local state
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
        parameters: { searchTerm, page, size, orderBy, orderDir },
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
    console.log('🔍 handleSearch called with:', newSearchText)
    performanceMonitor.measureConcurrentFeature('search-interaction', () => {
      // Update local search text immediately for UI display
      setCurrentSearchText(newSearchText)
      
      // Update local page state immediately to page 1 for new search
      setLocalCurrentPage(1)
      
      // Add optimistic update for immediate feedback
      addOptimisticUpdate({
        type: 'SEARCH_START',
        searchText: newSearchText
      })

      // Update URL state hook - this will handle the browser URL update properly
      updateURL({
        searchText: newSearchText,
        currentPage: 1 // Reset to first page on new search
      }, { immediate: true })

      // Perform search with new parameters - explicitly use page 1
      performSearch(newSearchText, 1, pageSize, currentSortColumn, currentSortDirection)
    })
  }

  // Handle page change with optimized React 19 updates
  const handlePageChange = (newPage) => {
    performanceMonitor.measureConcurrentFeature('pagination-interaction', () => {
      // Update local page state immediately for UI
      setLocalCurrentPage(newPage)
      
      // Update URL state hook - this will handle the browser URL update properly
      updateURL({ currentPage: newPage }, { immediate: true })

      // Perform search with new page - use currentSearchText (local state) instead of searchText (URL state)
      // to ensure we use the most recent search text, even if URL state hasn't been updated yet
      performSearch(currentSearchText, newPage, pageSize, currentSortColumn, currentSortDirection)
    })
  }

  // Handle page size change with optimized React 19 updates
  const handlePageSizeChange = (newPageSize) => {
    performanceMonitor.measureConcurrentFeature('page-size-interaction', () => {
      // Update local states immediately for UI
      setLocalCurrentPage(1) // Reset to first page when changing page size
      setLocalPageSize(newPageSize) // Update local page size for immediate UI feedback
      
      // Update URL state hook with the new page size - this is crucial for proper state management
      try {
        updateURL({
          pageSize: newPageSize,
          currentPage: 1 // Reset to first page when changing page size
        }, { immediate: true }) // Don't skip URL update - we need the page size in URL state
      } catch (error) {
        console.error('❌ Error updating state for page size:', error)
      }

      // Perform search with new page size - use currentSearchText (local state) for consistency
      performSearch(currentSearchText, 1, newPageSize, currentSortColumn, currentSortDirection)
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
      pageSize,
      sortColumn,
      sortDirection
    })

    startTransition(() => {
      performSearch(currentSearchText, currentPage, pageSize, currentSortColumn, currentSortDirection)
    })
  }

  // Handle column sorting with optimized React 19 updates
  const handleSort = useCallback((columnKey) => {
    try {
      // Validate column is sortable
      if (!validateSortColumn(columnKey)) {
        const errorMessage = `Column ${columnKey} is not sortable`
        console.warn(errorMessage)
        
        // Log error for debugging
        errorLogger.logError(new Error(errorMessage), {
          type: 'SORT_VALIDATION_ERROR',
          operation: 'handleSort',
          columnKey,
          availableColumns: Object.keys(currentVisibleColumns)
        })
        return
      }

      performanceMonitor.measureConcurrentFeature('column-sort', () => {
        // Determine new sort direction using local state
        const newDirection = (currentSortColumn === columnKey && currentSortDirection === 'asc') 
          ? 'desc' 
          : 'asc'
        
        // Update local sort state immediately for UI display
        setCurrentSortColumn(columnKey)
        setCurrentSortDirection(newDirection)
        
        // Update URL state immediately for sorting
        updateURL({
          sortColumn: columnKey,
          sortDirection: newDirection,
          currentPage: 1 // Reset to first page when sorting
        }, { immediate: true })
        
        // Add optimistic update for immediate feedback
        addOptimisticUpdate({
          type: 'SORT_CHANGE',
          column: columnKey,
          direction: newDirection
        })

        // Perform search with new sort parameters - use currentSearchText (local state) for consistency
        performSearch(currentSearchText, 1, pageSize, columnKey, newDirection)
      })
    } catch (error) {
      // Handle sort errors gracefully
      errorLogger.logError(error, {
        type: 'SORT_ERROR',
        operation: 'handleSort',
        columnKey,
        currentSort: { sortColumn: currentSortColumn, sortDirection: currentSortDirection }
      })
      
      console.error('Sort operation failed:', error)
      
      // Show user-friendly error message
      setError('Unable to sort by this column. Please try again.')
    }
  }, [validateSortColumn, performanceMonitor, currentSortColumn, currentSortDirection, updateURL, currentVisibleColumns, addOptimisticUpdate, currentSearchText, pageSize, performSearch])

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey) => {
    performanceMonitor.measureConcurrentFeature('column-toggle', () => {
      const newVisibleColumns = {
        ...currentVisibleColumns,
        [columnKey]: !currentVisibleColumns[columnKey]
      }

      // Update local state immediately for UI display
      setCurrentVisibleColumns(newVisibleColumns)

      // If hiding the currently sorted column, reset sort
      let updatedState = { visibleColumns: newVisibleColumns }
      if (!newVisibleColumns[columnKey] && sortColumn === columnKey) {
        updatedState.sortColumn = null
        updatedState.sortDirection = 'asc'
      }

      // Update URL state hook (but don't update address bar)
      updateURL(updatedState, { immediate: true })
    })
  }

  // Handle bulk column operations
  const handleShowAllColumns = () => {
    performanceMonitor.measureConcurrentFeature('show-all-columns', () => {
      // Get all available columns from the column definitions
      const allColumns = [
        'number', 'product_name', 'active_ingredients', 'dosage_amount', 
        'dosage_form', 'packaging_form', 'amount', 'manufacturer', 
        'wholesale_price', 'retail_price', 'date'
      ]
      
      // Create new visible columns object with all columns visible
      const newVisibleColumns = {}
      allColumns.forEach(key => {
        newVisibleColumns[key] = true
      })

      // Update local state immediately for UI display
      setCurrentVisibleColumns(newVisibleColumns)

      // Update URL state hook (but don't update address bar)
      updateURL({ visibleColumns: newVisibleColumns }, { immediate: true })
    })
  }

  const handleHideOptionalColumns = () => {
    performanceMonitor.measureConcurrentFeature('hide-optional-columns', () => {
      // Only keep required columns visible (number and product_name)
      const newVisibleColumns = {
        number: true,
        product_name: true,
        active_ingredients: false,
        dosage_amount: false,
        dosage_form: false,
        packaging_form: false,
        amount: false,
        manufacturer: false,
        wholesale_price: false,
        retail_price: false,
        date: false
      }

      // Update local state immediately for UI display
      setCurrentVisibleColumns(newVisibleColumns)

      // If hiding the currently sorted column, reset sort
      let updatedState = { visibleColumns: newVisibleColumns }
      if (!newVisibleColumns[sortColumn] && sortColumn) {
        updatedState.sortColumn = null
        updatedState.sortDirection = 'asc'
      }

      // Update URL state hook (but don't update address bar)
      updateURL(updatedState, { immediate: true })
    })
  }

  // Initial data loading on application startup with performance monitoring
  useEffect(() => {
    // Initialize monitoring services
    initializeMonitoring()
    
    // Track initial page view
    trackPageView(window.location.pathname)
    
    performanceMonitor.measureConcurrentFeature('initial-load', () => {
      // Always load data with current URL state (including empty search to show all items)
      performSearch(searchText, currentPage, pageSize, currentSortColumn, currentSortDirection)
    })

    // Track memory usage in development
    if (import.meta.env.DEV) {
      trackMemoryUsage()

      // Generate performance report after initial load
      setTimeout(() => {
        logPerformanceReport()
      }, 3000)
    }

    // Cleanup function for component unmount
    return cleanup
  }, []) // Only run once on mount

  // Determine current loading state with React 19 optimizations
  const isLoading = optimisticState.loading || isUpdatePending || isURLLoading

  return (
    <ErrorBoundary
      fallback={({ onRetry }) => (
        <div className="App">
          <header className="App-header" role="banner">
            <h1>{t('header.title')}</h1>
            <p>{t('header.subtitle')}</p>
          </header>
          <main id="main-content" className="App-main" role="main" tabIndex="-1">
            <ErrorState
              message={t('errors.loadingFailed')}
              onRetry={onRetry}
              retryText={t('common.retry')}
              showRefresh={true}
            />
          </main>
        </div>
      )}
    >
      <div className="App">
        <div className="mobile-theme-selector">
          <LanguageSelector />
          <ThemeSelector />
        </div>
        <header className="App-header" role="banner">
          <div className="header-content">
            <div className="header-text">
              <h1>{t('header.title')}</h1>
              <p>{t('header.subtitle')}</p>
            </div>
            <div className="header-controls">
              <LanguageSelector />
              <ThemeSelector />
            </div>
          </div>
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
            {isLoading ? t('common.loading') :
              error ? `${t('common.error')}: ${error}` :
                optimisticState.totalCount > 0 ? `${t('search.resultsFound', 'Found')} ${optimisticState.totalCount} ${t('search.resultsFound', 'drugs')}` :
                  t('search.noResults')}
          </div>

          {/* Live region for sort announcements */}
          <div
            id="sort-status"
            className="visually-hidden"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {optimisticState.sortColumn && (
              getSortAnnouncement(
                getColumnLabel(optimisticState.sortColumn, t), 
                optimisticState.sortDirection,
                t
              )
            )}
          </div>

          <section aria-labelledby="search-heading">
            <h2 id="search-heading" className="visually-hidden">{t('search.ariaLabel', 'Search Drugs')}</h2>
            <Suspense fallback={<SearchBarSkeleton />}>
              <SearchBar
                onSearch={handleSearch}
                initialValue={currentSearchText}
                placeholder={t('search.placeholder')}
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
                <h2 id="results-heading" className="visually-hidden">{t('search.resultsFound', 'Search Results')}</h2>
                {(optimisticState.drugs.length > 0 || isLoading) && (
                  <div className="results-header">
                    <div className="results-info-container">
                      <Suspense fallback={<ResultsInfoSkeleton />}>
                        <ResultsInfo
                          totalCount={totalCount}
                          currentPage={localCurrentPage}
                          pageSize={localPageSize}
                          searchText={currentSearchText}
                          loading={isLoading}
                        />
                      </Suspense>
                      {/* Share Button next to results info */}
                      <ShareButton
                        searchText={currentSearchText}
                        currentPage={localCurrentPage}
                        pageSize={pageSize}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        visibleColumns={currentVisibleColumns}
                        currentLanguage={currentLanguage}
                        disabled={isLoading}
                      />
                    </div>
                    {/* Column Selector on the right */}
                    <ColumnSelector
                      columns={[
                        { key: 'number', label: t('table.headers.number'), required: true },
                        { key: 'product_name', label: t('table.headers.product_name'), required: true },
                        { key: 'active_ingredients', label: t('table.headers.active_ingredients'), required: false },
                        { key: 'dosage_amount', label: t('table.headers.dosage_amount'), required: false },
                        { key: 'dosage_form', label: t('table.headers.dosage_form'), required: false },
                        { key: 'packaging_form', label: t('table.headers.packaging_form'), required: false },
                        { key: 'amount', label: t('table.headers.amount'), required: false },
                        { key: 'manufacturer', label: t('table.headers.manufacturer'), required: false },
                        { key: 'wholesale_price', label: t('table.headers.wholesale_price'), required: false },
                        { key: 'retail_price', label: t('table.headers.retail_price'), required: false },
                        { key: 'date', label: t('table.headers.registration_date'), required: false }
                      ]}
                      visibleColumns={currentVisibleColumns}
                      onColumnToggle={handleColumnToggle}
                      onShowAll={handleShowAllColumns}
                      onHideOptional={handleHideOptionalColumns}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </section>

              {/* Show empty state when no results */}
              {!isLoading && optimisticState.drugs.length === 0 && optimisticState.totalCount === 0 && (
                <EmptyState
                  message={
                    currentSearchText && currentSearchText !== ''
                      ? `${t('results.noResultsFound')} "${currentSearchText}"`
                      : t('table.noData')
                  }
                  description={
                    currentSearchText && currentSearchText !== ''
                      ? t('table.noResults')
                      : t('errors.loadingFailed')
                  }
                  action={
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleSearch('')}
                        className="retry-button"
                      >
                        {t('search.showAllDrugs')}
                      </button>
                    </div>
                  }
                />
              )}

              {/* Show table when we have data or are loading */}
              {(optimisticState.drugs.length > 0 || isLoading) && (
                <section aria-labelledby="drugs-table-heading">
                  <h2 id="drugs-table-heading" className="visually-hidden">
                    {t('table.headers.product_name', 'Drug Information Table')}
                  </h2>
                  <Suspense fallback={<TableSkeleton rows={localPageSize} />}>
                    <DrugTable
                      drugs={optimisticState.drugs}
                      loading={isLoading}
                      isPending={isPending || isSearchPending}
                      visibleColumns={currentVisibleColumns}
                      onColumnToggle={handleColumnToggle}
                      sortColumn={optimisticState.sortColumn}
                      sortDirection={optimisticState.sortDirection}
                      onSort={handleSort}
                      aria-describedby="search-status"
                    />
                  </Suspense>
                </section>
              )}

              {/* Show pagination when we have multiple pages */}
              {totalPages > 1 && (
                <nav aria-labelledby="pagination-heading" role="navigation">
                  <h2 id="pagination-heading" className="visually-hidden">
                    {t('pagination.page', 'Page Navigation')}
                  </h2>
                  <Suspense fallback={<PaginationSkeleton />}>
                    <Pagination
                      currentPage={localCurrentPage}
                      totalPages={totalPages}
                      pageSize={localPageSize}
                      totalCount={totalCount}
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
                  <InlineLoader text={t('common.loading')} />
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