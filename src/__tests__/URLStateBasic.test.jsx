/**
 * Basic URL State Integration Test
 * Tests the core URL state functionality without complex UI interactions
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock all dependencies to isolate URL state testing
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn().mockResolvedValue({
    data: [],
    total_count: 0,
    total_pages: 0,
    page_number: 1,
    page_size: 10
  }),
  getErrorMessage: vi.fn((error) => error.message || 'An error occurred'),
  ApiError: class ApiError extends Error {
    constructor(message) {
      super(message)
      this.name = 'ApiError'
    }
  }
}))

vi.mock('../services/errorLogger', () => ({
  default: {
    logApiError: vi.fn(),
    logError: vi.fn()
  }
}))

vi.mock('../utils/performance', () => ({
  default: {
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureConcurrentFeature: vi.fn((name, fn) => fn())
  },
  usePerformanceMonitor: vi.fn(() => ({
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    measureRender: vi.fn((name, fn) => fn()),
    measureApiCall: vi.fn((name, fn) => fn()),
    measureConcurrentFeature: vi.fn((name, fn) => fn()),
    measureBatchingPerformance: vi.fn((fn) => fn())
  }))
}))

vi.mock('../utils/performanceAnalysis', () => ({
  logPerformanceReport: vi.fn()
}))

vi.mock('../hooks/useReact19Optimizations', () => ({
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
  })),
  useOptimizedList: vi.fn((items) => items)
}))

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key, fallback) => fallback || key)
  }))
}))

// Simple test component that uses URL state
function TestURLStateComponent() {
  const { useURLState } = require('../hooks/useURLState')
  
  const { urlState, updateURL } = useURLState({
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: {}
  })

  return (
    <div data-testid="url-state-component">
      <div data-testid="search-text">{urlState.searchText}</div>
      <div data-testid="current-page">{urlState.currentPage}</div>
      <div data-testid="page-size">{urlState.pageSize}</div>
      <div data-testid="sort-column">{urlState.sortColumn || 'none'}</div>
      <div data-testid="sort-direction">{urlState.sortDirection}</div>
      <button 
        data-testid="update-search"
        onClick={() => updateURL({ searchText: 'test search' })}
      >
        Update Search
      </button>
      <button 
        data-testid="update-page"
        onClick={() => updateURL({ currentPage: 2 })}
      >
        Update Page
      </button>
    </div>
  )
}

describe('URL State Basic Integration', () => {
  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', async () => {
    const { getByTestId } = render(<TestURLStateComponent />)
    
    await waitFor(() => {
      expect(getByTestId('search-text')).toHaveTextContent('')
      expect(getByTestId('current-page')).toHaveTextContent('1')
      expect(getByTestId('page-size')).toHaveTextContent('10')
      expect(getByTestId('sort-column')).toHaveTextContent('none')
      expect(getByTestId('sort-direction')).toHaveTextContent('asc')
    })
  })

  it('should initialize from URL parameters', async () => {
    // Set URL with parameters
    window.history.replaceState({}, '', '/?q=medicine&page=3&size=25&sort=name&dir=desc')
    
    const { getByTestId } = render(<TestURLStateComponent />)
    
    await waitFor(() => {
      expect(getByTestId('search-text')).toHaveTextContent('medicine')
      expect(getByTestId('current-page')).toHaveTextContent('3')
      expect(getByTestId('page-size')).toHaveTextContent('25')
      expect(getByTestId('sort-column')).toHaveTextContent('name')
      expect(getByTestId('sort-direction')).toHaveTextContent('desc')
    })
  })

  it('should update URL when state changes', async () => {
    const { getByTestId } = render(<TestURLStateComponent />)
    
    // Click button to update search
    getByTestId('update-search').click()
    
    // Wait for URL to update
    await waitFor(() => {
      expect(window.location.search).toContain('q=test%20search')
    })
    
    // Verify component state updated
    expect(getByTestId('search-text')).toHaveTextContent('test search')
  })

  it('should handle multiple state updates', async () => {
    const { getByTestId } = render(<TestURLStateComponent />)
    
    // Update search
    getByTestId('update-search').click()
    
    // Update page
    getByTestId('update-page').click()
    
    // Wait for URL to update with both parameters
    await waitFor(() => {
      expect(window.location.search).toContain('q=test%20search')
      expect(window.location.search).toContain('page=2')
    })
    
    // Verify component state
    expect(getByTestId('search-text')).toHaveTextContent('test search')
    expect(getByTestId('current-page')).toHaveTextContent('2')
  })

  it('should handle invalid URL parameters gracefully', async () => {
    // Set URL with invalid parameters
    window.history.replaceState({}, '', '/?page=invalid&size=999')
    
    const { getByTestId } = render(<TestURLStateComponent />)
    
    await waitFor(() => {
      // Should fall back to valid defaults
      expect(getByTestId('current-page')).toHaveTextContent('1')
      expect(getByTestId('page-size')).toHaveTextContent('10')
    })
  })
})