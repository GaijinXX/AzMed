import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  searchDrugs, 
  getAllDrugs, 
  getErrorMessage, 
  ApiError, 
  API_ERRORS,
  supabase 
} from '../supabase.js'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke: vi.fn()
    }
  }))
}))

describe('Supabase Service', () => {
  let mockInvoke

  beforeEach(() => {
    mockInvoke = vi.fn()
    supabase.functions.invoke = mockInvoke
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchDrugs', () => {
    const mockValidResponse = {
      data: [
        {
          number: 123,
          product_name: 'Test Drug',
          active_ingredients: 'Test Ingredient',
          dosage_amount: '10mg',
          dosage_form: 'tablet',
          packaging_form: 'blister',
          amount: '30',
          manufacturer: 'Test Manufacturer',
          wholesale_price: 1000,
          retail_price: 1200,
          date: '2024-01-01'
        }
      ],
      total_count: 1,
      page_number: 1,
      page_size: 10,
      total_pages: 1
    }

    it('should successfully search drugs with default parameters', async () => {
      mockInvoke.mockResolvedValue({ data: mockValidResponse, error: null })

      const result = await searchDrugs()

      expect(mockInvoke).toHaveBeenCalledWith('database-search', {
        body: JSON.stringify({
          p_search_term: '',
          p_page_number: 1,
          p_page_size: 10
        })
      })
      expect(result).toEqual(mockValidResponse)
    })

    it('should successfully search drugs with custom parameters', async () => {
      mockInvoke.mockResolvedValue({ data: mockValidResponse, error: null })

      const result = await searchDrugs('aspirin', 2, 25)

      expect(mockInvoke).toHaveBeenCalledWith('database-search', {
        body: JSON.stringify({
          p_search_term: 'aspirin',
          p_page_number: 2,
          p_page_size: 25
        })
      })
      expect(result).toEqual(mockValidResponse)
    })

    it('should trim search term whitespace', async () => {
      mockInvoke.mockResolvedValue({ data: mockValidResponse, error: null })

      await searchDrugs('  aspirin  ')

      expect(mockInvoke).toHaveBeenCalledWith('database-search', {
        body: JSON.stringify({
          p_search_term: 'aspirin',
          p_page_number: 1,
          p_page_size: 10
        })
      })
    })

    it('should validate input parameters', async () => {
      // Invalid search term
      await expect(searchDrugs(123)).rejects.toThrow(ApiError)
      await expect(searchDrugs(123)).rejects.toThrow('Search term must be a string')

      // Invalid page number
      await expect(searchDrugs('test', 0)).rejects.toThrow(ApiError)
      await expect(searchDrugs('test', -1)).rejects.toThrow(ApiError)
      await expect(searchDrugs('test', 'invalid')).rejects.toThrow(ApiError)

      // Invalid page size
      await expect(searchDrugs('test', 1, 0)).rejects.toThrow(ApiError)
      await expect(searchDrugs('test', 1, 101)).rejects.toThrow(ApiError)
      await expect(searchDrugs('test', 1, 'invalid')).rejects.toThrow(ApiError)
    })

    it('should handle Supabase function errors', async () => {
      const mockError = new Error('Function execution failed')
      mockInvoke.mockResolvedValue({ data: null, error: mockError })

      await expect(searchDrugs()).rejects.toThrow(ApiError)
      await expect(searchDrugs()).rejects.toThrow('Server error occurred')
    })

    it('should handle network errors', async () => {
      const networkError = new TypeError('fetch failed')
      mockInvoke.mockRejectedValue(networkError)

      await expect(searchDrugs()).rejects.toThrow(ApiError)
      const error = await searchDrugs().catch(e => e)
      expect(error.type).toBe(API_ERRORS.NETWORK_ERROR)
    })

    it('should handle timeout errors', async () => {
      vi.useFakeTimers()
      
      // Mock a slow response that never resolves within timeout
      mockInvoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockValidResponse, error: null }), 35000))
      )

      const searchPromise = searchDrugs()
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(31000)
      
      await expect(searchPromise).rejects.toThrow(ApiError)
      const error = await searchPromise.catch(e => e)
      expect(error.type).toBe(API_ERRORS.TIMEOUT_ERROR)
      
      vi.useRealTimers()
    })

    it('should handle response with just data array', async () => {
      // Response with just data array (no pagination metadata)
      const responseWithJustData = { data: [] }
      mockInvoke.mockResolvedValue({ data: responseWithJustData, error: null })

      const result = await searchDrugs()
      expect(result).toEqual({
        data: [],
        total_count: 0,
        page_number: 1,
        page_size: 10,
        total_pages: 0
      })
    })

    it('should validate data array in response', async () => {
      const invalidResponse = {
        ...mockValidResponse,
        data: 'not an array'
      }
      mockInvoke.mockResolvedValue({ data: invalidResponse, error: null })

      await expect(searchDrugs()).rejects.toThrow(ApiError)
      await expect(searchDrugs()).rejects.toThrow('Response data is not an array')
    })

    it('should handle response with edge case pagination values gracefully', async () => {
      // Response with negative total_count (should be handled gracefully)
      let responseWithNegativeCount = { ...mockValidResponse, total_count: -1 }
      mockInvoke.mockResolvedValue({ data: responseWithNegativeCount, error: null })
      
      const result1 = await searchDrugs()
      // The current implementation handles negative total_count gracefully
      expect(result1.total_count).toBe(0) // Handled gracefully by the parser
      expect(result1.total_pages).toBe(1) // Minimum of 1 page or calculated differently

      // Response with zero page_number (should be handled gracefully)
      let responseWithZeroPage = { ...mockValidResponse, page_number: 0 }
      mockInvoke.mockResolvedValue({ data: responseWithZeroPage, error: null })
      
      const result2 = await searchDrugs()
      expect(result2.page_number).toBe(1) // Uses default value when page_number is 0

      // Response with zero page_size (should be handled gracefully)
      let responseWithZeroPageSize = { ...mockValidResponse, page_size: 0 }
      mockInvoke.mockResolvedValue({ data: responseWithZeroPageSize, error: null })
      
      const result3 = await searchDrugs()
      expect(result3.page_size).toBe(10) // Uses default value when page_size is 0
    })

    it('should handle empty response', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: null })

      await expect(searchDrugs()).rejects.toThrow(ApiError)
      await expect(searchDrugs()).rejects.toThrow('Empty response received')
    })
  })

  describe('getAllDrugs', () => {
    it('should call searchDrugs with empty search term', async () => {
      const mockValidResponse = {
        data: [],
        total_count: 0,
        page_number: 1,
        page_size: 10,
        total_pages: 0
      }
      mockInvoke.mockResolvedValue({ data: mockValidResponse, error: null })

      const result = await getAllDrugs(2, 25)

      expect(mockInvoke).toHaveBeenCalledWith('database-search', {
        body: JSON.stringify({
          p_search_term: '',
          p_page_number: 2,
          p_page_size: 25
        })
      })
      expect(result).toEqual(mockValidResponse)
    })

    it('should use default parameters', async () => {
      const mockValidResponse = {
        data: [],
        total_count: 0,
        page_number: 1,
        page_size: 10,
        total_pages: 0
      }
      mockInvoke.mockResolvedValue({ data: mockValidResponse, error: null })

      await getAllDrugs()

      expect(mockInvoke).toHaveBeenCalledWith('database-search', {
        body: JSON.stringify({
          p_search_term: '',
          p_page_number: 1,
          p_page_size: 10
        })
      })
    })
  })

  describe('getErrorMessage', () => {
    it('should return appropriate message for network errors', () => {
      const error = new ApiError('Network failed', API_ERRORS.NETWORK_ERROR)
      const message = getErrorMessage(error)
      expect(message).toBe('Unable to connect to the database. Please check your internet connection and try again.')
    })

    it('should return appropriate message for timeout errors', () => {
      const error = new ApiError('Timeout', API_ERRORS.TIMEOUT_ERROR)
      const message = getErrorMessage(error)
      expect(message).toBe('The request is taking longer than expected. Please try again.')
    })

    it('should return appropriate message for server errors', () => {
      const error = new ApiError('Server error', API_ERRORS.SERVER_ERROR)
      const message = getErrorMessage(error)
      expect(message).toBe('An error occurred while searching. Please try again.')
    })

    it('should return appropriate message for function errors', () => {
      const error = new ApiError('Function error', API_ERRORS.FUNCTION_ERROR)
      const message = getErrorMessage(error)
      expect(message).toBe('An error occurred while searching. Please try again.')
    })

    it('should return appropriate message for invalid response errors', () => {
      const error = new ApiError('Invalid response', API_ERRORS.INVALID_RESPONSE)
      const message = getErrorMessage(error)
      expect(message).toBe('Unable to display results. Please refresh the page and try again.')
    })

    it('should return generic message for non-ApiError instances', () => {
      const error = new Error('Regular error')
      const message = getErrorMessage(error)
      expect(message).toBe('An unexpected error occurred. Please try again.')
    })

    it('should return generic message for unknown error types', () => {
      const error = new ApiError('Unknown error', 'UNKNOWN_TYPE')
      const message = getErrorMessage(error)
      expect(message).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const originalError = new Error('Original')
      const apiError = new ApiError('Test message', API_ERRORS.NETWORK_ERROR, originalError)

      expect(apiError.message).toBe('Test message')
      expect(apiError.name).toBe('ApiError')
      expect(apiError.type).toBe(API_ERRORS.NETWORK_ERROR)
      expect(apiError.originalError).toBe(originalError)
    })

    it('should create ApiError without original error', () => {
      const apiError = new ApiError('Test message', API_ERRORS.SERVER_ERROR)

      expect(apiError.message).toBe('Test message')
      expect(apiError.name).toBe('ApiError')
      expect(apiError.type).toBe(API_ERRORS.SERVER_ERROR)
      expect(apiError.originalError).toBe(null)
    })
  })
})