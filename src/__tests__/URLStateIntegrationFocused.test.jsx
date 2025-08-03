/**
 * Focused URL State Integration Test
 * Tests the URL state integration in the App component
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from '../App'

// Mock all external dependencies
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn(),
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

describe('URL State Integration Focused', () => {
  let mockSearchDrugs

  beforeEach(async () => {
    // Get the mocked function
    const supabaseModule = await import('../services/supabase')
    mockSearchDrugs = supabaseModule.searchDrugs
    
    // Reset URL to clean state
    window.history.replaceState({}, '', '/')
    
    // Mock successful API response
    mockSearchDrugs.mockResolvedValue({
      data: [
        {
          number: '001',
          product_name: 'Test Drug',
          active_ingredients: 'Test Ingredient',
          dosage_amount: '10mg',
          dosage_form: 'Tablet',
          packaging_form: 'Bottle',
          amount: '30 tablets',
          manufacturer: 'Test Pharma',
          wholesale_price: '5.00',
          retail_price: '10.00',
          date: '2023-01-01'
        }
      ],
      total_count: 1,
      total_pages: 1,
      page_number: 1,
      page_size: 10
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default URL state and call API', async () => {
    render(<App />)
    
    // Wait for the initial API call with default parameters
    await waitFor(() => {
      expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc')
    })
  })

  it('should initialize from URL parameters and call API with those parameters', async () => {
    // Set URL with search parameters
    window.history.replaceState({}, '', '/?q=aspirin&page=2&size=25&sort=product_name&dir=desc')
    
    render(<App />)
    
    // Wait for the API call with URL parameters
    await waitFor(() => {
      expect(mockSearchDrugs).toHaveBeenCalledWith('aspirin', 2, 25, 'product_name', 'desc')
    })
  })

  it('should handle invalid URL parameters by using defaults', async () => {
    // Set URL with invalid parameters
    window.history.replaceState({}, '', '/?page=invalid&size=999&sort=invalid_column')
    
    render(<App />)
    
    // Wait for the API call with default/validated parameters
    await waitFor(() => {
      expect(mockSearchDrugs).toHaveBeenCalledWith('', 1, 10, null, 'asc')
    })
  })

  it('should clean up URL by removing default parameters', async () => {
    // Start with URL containing default values
    window.history.replaceState({}, '', '/?page=1&size=10&dir=asc')
    
    render(<App />)
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(mockSearchDrugs).toHaveBeenCalled()
    })
    
    // The URL should eventually be cleaned up (removing default values)
    // Note: This might take some time due to debouncing
    await waitFor(() => {
      // The URL should either be empty or contain only non-default values
      const search = window.location.search
      expect(search === '' || (!search.includes('page=1') && !search.includes('size=10') && !search.includes('dir=asc'))).toBe(true)
    }, { timeout: 2000 })
  })

  it('should preserve non-default URL parameters', async () => {
    // Set URL with non-default values
    window.history.replaceState({}, '', '/?q=medicine&page=3&size=25')
    
    render(<App />)
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(mockSearchDrugs).toHaveBeenCalledWith('medicine', 3, 25, null, 'asc')
    })
    
    // Verify URL still contains the non-default parameters
    expect(window.location.search).toContain('q=medicine')
    expect(window.location.search).toContain('page=3')
    expect(window.location.search).toContain('size=25')
  })
})