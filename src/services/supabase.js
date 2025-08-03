import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uxmvulvmvtismnokxsry.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXZ1bHZtdnRpc21ub2t4c3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDA2NTksImV4cCI6MjA2ODc3NjY1OX0.PadYJ9W2Abp4TV5QLZvn1TidYz7Hdec8fwNwrehH6Q4'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Debug function for testing Supabase function directly (available in browser console)
window.testSupabaseFunction = async (
  searchTerm = '%', 
  pageNumber = 1, 
  pageSize = 10, 
  orderBy = null, 
  orderDirection = 'asc'
) => {
  console.log('🧪 Testing Supabase function directly...')

  try {
    const requestBody = {
      p_search_term: searchTerm.trim(),
      p_page_number: pageNumber,
      p_page_size: pageSize
    }

    // Add sort parameters if provided
    if (orderBy) {
      requestBody.p_order_by = orderBy
      requestBody.p_order_dir = orderDirection
    }

    console.log('📤 Request:', requestBody)

    const { data, error } = await supabase.functions.invoke('database-search', {
      body: JSON.stringify(requestBody)
    })

    console.log('📥 Response:', { data, error })

    if (error) {
      console.error('❌ Function Error:', error)
      return { success: false, error }
    }

    console.log('✅ Function Success:', data)
    return { success: true, data }

  } catch (err) {
    console.error('❌ Caught Error:', err)
    return { success: false, error: err }
  }
}

// Error types for better error handling
export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  FUNCTION_ERROR: 'FUNCTION_ERROR'
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, type, originalError = null) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.originalError = originalError
  }
}

// Timeout wrapper for API calls
const withTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new ApiError('Request timeout', API_ERRORS.TIMEOUT_ERROR)), timeoutMs)
    )
  ])
}

// Validate and parse API response with flexible format handling
const parseApiResponse = (response, searchTerm = '', pageNumber = 1, pageSize = 10) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔧 Response Parser`)
    console.log('📥 Input Response:', response)
    console.log('📊 Response Type:', typeof response)
    console.log('🔍 Search Term:', searchTerm)
    console.log('📄 Page:', pageNumber, 'Size:', pageSize)
  }

  if (!response) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Empty response received')
      console.groupEnd()
    }
    throw new ApiError('Empty response received', API_ERRORS.INVALID_RESPONSE)
  }

  // Handle different response formats
  let data, totalCount, currentPage, currentPageSize, totalPages

  // Case 1: Clean server format - response has {total_count: number, data: array}
  if (response && typeof response.total_count === 'number' && Array.isArray(response.data)) {
    data = response.data
    totalCount = response.total_count
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 2: Nested format (fallback) - response.data has {total_count: number, data: array}
  else if (response && response.data && typeof response.data.total_count === 'number' && Array.isArray(response.data.data)) {
    data = response.data.data
    totalCount = response.data.total_count
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 2: Legacy format - response.data is array of objects with {data: drugData, total_count: number}
  else if (response.data && Array.isArray(response.data) && response.data.length > 0 && 
      response.data[0].data && typeof response.data[0].total_count === 'number') {
    // Extract the drug data from each response object
    data = response.data.map(item => item.data)
    // Get total count from the first item (all items should have the same total_count)
    totalCount = response.data[0].total_count
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 3: Direct array format - array of objects with {data: drugData, total_count: number}
  else if (Array.isArray(response) && response.length > 0 && response[0].data && typeof response[0].total_count === 'number') {
    // Extract the drug data from each response object
    data = response.map(item => item.data)
    // Get total count from the first item (all items should have the same total_count)
    totalCount = response[0].total_count
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 4: Response has data field with pagination metadata
  else if (response.data && typeof response.total_count === 'number') {
    data = response.data
    totalCount = response.total_count
    currentPage = response.page_number || pageNumber
    currentPageSize = response.page_size || pageSize
    totalPages = response.total_pages || Math.ceil(totalCount / currentPageSize)
  }
  // Case 5: Response is just an array of data (no pagination metadata)
  else if (Array.isArray(response)) {
    data = response
    totalCount = response.length
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 6: Response has data field but no pagination metadata
  else if (response.data && Array.isArray(response.data)) {
    data = response.data
    totalCount = response.data.length
    currentPage = pageNumber
    currentPageSize = pageSize
    totalPages = Math.ceil(totalCount / currentPageSize)
  }
  // Case 7: Response is an object with unknown structure
  else {
    console.warn('Unexpected response format:', response)
    throw new ApiError('Invalid response format: unable to parse data', API_ERRORS.INVALID_RESPONSE)
  }

  // Validate data array
  if (!Array.isArray(data)) {
    throw new ApiError('Response data is not an array', API_ERRORS.INVALID_RESPONSE)
  }

  // Validate the normalized values
  if (typeof totalCount !== 'number' || totalCount < 0) {
    totalCount = Math.max(0, totalCount || 0) // Ensure non-negative
  }
  if (typeof currentPage !== 'number' || currentPage < 1) {
    currentPage = Math.max(1, currentPage || 1) // Ensure positive
  }
  if (typeof currentPageSize !== 'number' || currentPageSize < 1) {
    currentPageSize = Math.max(1, currentPageSize || 10) // Ensure positive
  }
  if (typeof totalPages !== 'number' || totalPages < 0) {
    totalPages = Math.max(0, Math.ceil(totalCount / currentPageSize)) // Recalculate if needed
  }

  // Return normalized response format
  const normalizedResponse = {
    data,
    total_count: totalCount,
    page_number: currentPage,
    page_size: currentPageSize,
    total_pages: totalPages
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Normalized Response:', normalizedResponse)
    console.groupEnd()
  }

  return normalizedResponse
}

// Main API function for searching drugs with server-side pagination and sorting
export const searchDrugs = async (
  searchTerm = '', 
  pageNumber = 1, 
  pageSize = 10,
  orderBy = null,
  orderDirection = 'asc'
) => {
  try {
    // Validate input parameters
    if (typeof searchTerm !== 'string') {
      throw new ApiError('Search term must be a string', API_ERRORS.INVALID_RESPONSE)
    }
    if (typeof pageNumber !== 'number' || pageNumber < 1) {
      throw new ApiError('Page number must be a positive number', API_ERRORS.INVALID_RESPONSE)
    }
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
      throw new ApiError('Page size must be between 1 and 100', API_ERRORS.INVALID_RESPONSE)
    }
    if (orderBy && typeof orderBy !== 'string') {
      throw new ApiError('Order by column must be a string', API_ERRORS.INVALID_RESPONSE)
    }
    if (orderDirection && !['asc', 'desc'].includes(orderDirection.toLowerCase())) {
      throw new ApiError('Order direction must be "asc" or "desc"', API_ERRORS.INVALID_RESPONSE)
    }

    // Prepare request body - ensure search term is not empty
    const processedSearchTerm = searchTerm.trim() || '%'
    const requestBody = {
      p_search_term: processedSearchTerm,
      p_page_number: pageNumber,
      p_page_size: pageSize
    }

    // Add sort parameters if provided
    if (orderBy) {
      requestBody.p_order_by = orderBy
      requestBody.p_order_dir = orderDirection.toLowerCase()
    }

    // Make API call with timeout
    const apiCall = supabase.functions.invoke('database-search', {
      body: JSON.stringify(requestBody)
    })

    const { data, error } = await withTimeout(apiCall)

    // Enhanced debug logging to understand response format
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Supabase Function Call: database-search`)
      console.log('📤 Request:', requestBody)
      console.log('📥 Raw Response:', { data, error })
      console.log('📊 Data Type:', typeof data)
      console.log('📊 Data Structure:', data ? Object.keys(data) : 'null')
      if (data && typeof data === 'object') {
        console.log('📊 Data Contents:', JSON.stringify(data, null, 2))
      }
      if (error) {
        console.error('❌ Error Details:', error)
      }
      console.groupEnd()
    }

    // Handle Supabase function errors
    if (error) {
      console.error('Supabase function error:', error)

      // Check for specific error types
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new ApiError('Network connection failed', API_ERRORS.NETWORK_ERROR, error)
      }

      throw new ApiError('Server error occurred', API_ERRORS.FUNCTION_ERROR, error)
    }

    // Parse and validate response
    const parsedResponse = parseApiResponse(data, searchTerm, pageNumber, pageSize)

    return parsedResponse

  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error
    }

    // Handle network/connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Network connection failed', API_ERRORS.NETWORK_ERROR, error)
    }

    // Handle timeout errors
    if (error.message === 'Request timeout') {
      throw new ApiError('Request timeout', API_ERRORS.TIMEOUT_ERROR, error)
    }

    // Handle unknown errors
    console.error('Unexpected error in searchDrugs:', error)
    throw new ApiError('An unexpected error occurred', API_ERRORS.SERVER_ERROR, error)
  }
}

// Convenience function to get all drugs (empty search)
export const getAllDrugs = async (pageNumber = 1, pageSize = 10, orderBy = null, orderDirection = 'asc') => {
  return searchDrugs('', pageNumber, pageSize, orderBy, orderDirection)
}

// Function to get user-friendly error messages
export const getErrorMessage = (error) => {
  if (!(error instanceof ApiError)) {
    return 'An unexpected error occurred. Please try again.'
  }

  switch (error.type) {
    case API_ERRORS.NETWORK_ERROR:
      return 'Unable to connect to the database. Please check your internet connection and try again.'
    case API_ERRORS.TIMEOUT_ERROR:
      return 'The request is taking longer than expected. Please try again.'
    case API_ERRORS.SERVER_ERROR:
    case API_ERRORS.FUNCTION_ERROR:
      return 'An error occurred while searching. Please try again.'
    case API_ERRORS.INVALID_RESPONSE:
      return 'Unable to display results. Please refresh the page and try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}