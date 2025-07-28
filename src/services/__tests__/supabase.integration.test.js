import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchDrugs, getAllDrugs, getErrorMessage, supabase } from '../supabase.js'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke: vi.fn()
    }
  }))
}))

// Integration tests for Supabase service
// These tests verify the service works with realistic data scenarios

describe('Supabase Service Integration', () => {
  let mockInvoke

  beforeEach(() => {
    mockInvoke = vi.fn()
    supabase.functions.invoke = mockInvoke
    vi.clearAllMocks()
  })

  describe('Real-world data scenarios', () => {
    it('should handle typical drug search response', async () => {
      const mockResponse = {
        data: [
          {
            number: 12345,
            product_name: 'Aspirin 100mg',
            active_ingredients: 'Acetylsalicylic acid',
            dosage_amount: '100mg',
            dosage_form: 'tablet',
            packaging_form: 'blister pack',
            amount: '30 tablets',
            manufacturer: 'Bayer AG, Germany',
            wholesale_price: 589, // 5.89 AZN
            retail_price: 699,    // 6.99 AZN
            date: '2024-01-15'
          }
        ],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1
      }

      mockInvoke.mockResolvedValue({ data: mockResponse, error: null })

      const result = await searchDrugs('aspirin')

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].product_name).toBe('Aspirin 100mg')
      expect(result.total_count).toBe(1)
      expect(result.page_number).toBe(1)
    })

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: [],
        total_count: 0,
        page_number: 1,
        page_size: 10,
        total_pages: 0
      }

      mockInvoke.mockResolvedValue({ data: mockResponse, error: null })

      const result = await searchDrugs('nonexistentdrug')

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(0)
      expect(result.total_count).toBe(0)
    })

    it('should handle large dataset pagination', async () => {
      const mockResponse = {
        data: Array.from({ length: 50 }, (_, i) => ({
          number: 10000 + i,
          product_name: `Drug ${i + 1}`,
          active_ingredients: `Ingredient ${i + 1}`,
          dosage_amount: '10mg',
          dosage_form: 'tablet',
          packaging_form: 'blister',
          amount: '30',
          manufacturer: 'Test Manufacturer',
          wholesale_price: 1000 + i,
          retail_price: 1200 + i,
          date: '2024-01-01'
        })),
        total_count: 1500,
        page_number: 2,
        page_size: 50,
        total_pages: 30
      }

      mockInvoke.mockResolvedValue({ data: mockResponse, error: null })

      const result = await getAllDrugs(2, 50)

      expect(result.data).toHaveLength(50)
      expect(result.total_count).toBe(1500)
      expect(result.page_number).toBe(2)
      expect(result.total_pages).toBe(30)
    })
  })

  describe('Error handling integration', () => {
    it('should provide user-friendly error messages for common scenarios', () => {
      const networkError = new Error('Network connection failed')
      networkError.name = 'TypeError'
      networkError.message = 'fetch failed'

      const message = getErrorMessage(networkError)
      expect(message).toBe('An unexpected error occurred. Please try again.')
    })

    it('should handle API response validation in real scenarios', async () => {
      // Simulate malformed response from API
      const malformedResponse = {
        drugs: [], // Wrong field name
        count: 0   // Wrong field name
      }

      mockInvoke.mockResolvedValue({ data: malformedResponse, error: null })

      await expect(searchDrugs('test')).rejects.toThrow('Invalid response format')
    })
  })
})