/**
 * Test to verify immediate URL updates
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock all dependencies
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
    t: vi.fn((key, fallback) => fallback || key || 'Test Text')
  }))
}))

// Simple test component that uses URL state directly
function TestURLUpdateComponent() {
  const { useURLState } = require('../hooks/useURLState')
  
  const { urlState, updateURL } = useURLState({
    searchText: '',
    currentPage: 1,
    pageSize: 10
  })

  return (
    <div>
      <div data-testid="current-search">{urlState.searchText}</div>
      <button 
        data-testid="update-search-immediate"
        onClick={() => updateURL({ searchText: 'test search' }, { immediate: true })}
      >
        Update Search Immediate
      </button>
      <button 
        data-testid="update-search-debounced"
        onClick={() => updateURL({ searchText: 'test search debounced' })}
      >
        Update Search Debounced
      </button>
    </div>
  )
}

describe('URL Update Immediate Test', () => {
  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update URL immediately when immediate option is used', async () => {
    const { getByTestId } = render(<TestURLUpdateComponent />)
    
    // Click button to update search immediately
    fireEvent.click(getByTestId('update-search-immediate'))
    
    // URL should update immediately (within a few milliseconds)
    await waitFor(() => {
      expect(window.location.search).toContain('q=test%20search')
    }, { timeout: 100 }) // Very short timeout to test immediacy
    
    // Component state should also update
    expect(getByTestId('current-search')).toHaveTextContent('test search')
  })

  it('should update URL with debounce when immediate option is not used', async () => {
    const { getByTestId } = render(<TestURLUpdateComponent />)
    
    // Click button to update search with debounce
    fireEvent.click(getByTestId('update-search-debounced'))
    
    // URL should NOT update immediately
    expect(window.location.search).not.toContain('debounced')
    
    // But should update after debounce delay (300ms default)
    await waitFor(() => {
      expect(window.location.search).toContain('q=test%20search%20debounced')
    }, { timeout: 500 })
    
    // Component state should update immediately though
    expect(getByTestId('current-search')).toHaveTextContent('test search debounced')
  })
})