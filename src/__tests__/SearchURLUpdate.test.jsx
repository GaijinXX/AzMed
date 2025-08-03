/**
 * Test to verify search updates URL immediately
 */

import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from '../App'

// Mock all dependencies
const mockSearchDrugs = vi.fn()

vi.mock('../services/supabase', () => ({
  searchDrugs: mockSearchDrugs,
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

describe('Search URL Update Test', () => {
  let mockSearchDrugsRef

  beforeEach(async () => {
    // Get the mocked function
    const supabaseModule = await import('../services/supabase')
    mockSearchDrugsRef = supabaseModule.searchDrugs
    
    // Reset URL to clean state
    window.history.replaceState({}, '', '/')
    
    // Mock successful API response
    mockSearchDrugsRef.mockResolvedValue({
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

  it('should update URL when search form is submitted', async () => {
    render(<App />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockSearchDrugsRef).toHaveBeenCalledWith('', 1, 10, null, 'asc')
    })
    
    // Find the search input and form
    const searchInput = screen.getByRole('searchbox')
    expect(searchInput).toBeTruthy()
    
    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'aspirin' } })
    
    // Submit the form
    const form = searchInput.closest('form')
    fireEvent.submit(form)
    
    // Wait for URL to update (should be immediate with our changes)
    await waitFor(() => {
      expect(window.location.search).toContain('q=aspirin')
    }, { timeout: 200 }) // Short timeout since it should be immediate
    
    // Verify API was called with new search term
    await waitFor(() => {
      expect(mockSearchDrugsRef).toHaveBeenCalledWith('aspirin', 1, 10, null, 'asc')
    })
  })

  it('should update URL when search input changes and form is submitted multiple times', async () => {
    render(<App />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockSearchDrugsRef).toHaveBeenCalled()
    })
    
    const searchInput = screen.getByRole('searchbox')
    const form = searchInput.closest('form')
    
    // First search
    fireEvent.change(searchInput, { target: { value: 'medicine' } })
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(window.location.search).toContain('q=medicine')
    }, { timeout: 200 })
    
    // Second search
    fireEvent.change(searchInput, { target: { value: 'tablet' } })
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(window.location.search).toContain('q=tablet')
      expect(window.location.search).not.toContain('medicine')
    }, { timeout: 200 })
    
    // Verify API was called with both search terms
    expect(mockSearchDrugsRef).toHaveBeenCalledWith('medicine', 1, 10, null, 'asc')
    expect(mockSearchDrugsRef).toHaveBeenCalledWith('tablet', 1, 10, null, 'asc')
  })

  it('should clear URL parameter when searching for empty string', async () => {
    // Start with a search term in URL
    window.history.replaceState({}, '', '/?q=existing-search')
    
    render(<App />)
    
    // Wait for initial load with existing search
    await waitFor(() => {
      expect(mockSearchDrugsRef).toHaveBeenCalledWith('existing-search', 1, 10, null, 'asc')
    })
    
    const searchInput = screen.getByRole('searchbox')
    const form = searchInput.closest('form')
    
    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } })
    fireEvent.submit(form)
    
    // Wait for URL to be cleared
    await waitFor(() => {
      expect(window.location.search).not.toContain('q=')
    }, { timeout: 200 })
    
    // Verify API was called with empty search
    expect(mockSearchDrugsRef).toHaveBeenCalledWith('', 1, 10, null, 'asc')
  })
})