import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render default error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const CustomFallback = ({ error, onRetry, onRefresh }) => (
      <div>
        <h1>Custom Error</h1>
        <p>{error.message}</p>
        <button onClick={onRetry}>Custom Retry</button>
        <button onClick={onRefresh}>Custom Refresh</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} errorMessage="Custom error message" />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom Refresh' })).toBeInTheDocument()
  })

  it('should handle retry functionality', () => {
    let shouldThrow = true
    
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Click retry button and change the error condition
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    // Rerender with the same component (which now won't throw)
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    // Should show normal content after retry
    expect(screen.getByText('No error')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should handle refresh functionality', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Refresh Page' }))

    expect(mockReload).toHaveBeenCalledOnce()
  })

  it('should log error details to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error for logging" />
      </ErrorBoundary>
    )

    // Check that console.error was called (React also calls it, so we check for our specific call)
    const errorCalls = console.error.mock.calls
    const ourCall = errorCalls.find(call => 
      call[0] === 'Error Boundary caught an error:' && 
      typeof call[1] === 'object' && 
      call[1].message === 'Test error for logging'
    )
    
    expect(ourCall).toBeDefined()
    expect(ourCall[1]).toMatchObject({
      message: 'Test error for logging',
      errorId: expect.any(String),
      timestamp: expect.any(String),
      userAgent: expect.any(String)
    })
  })

  it('should generate unique error IDs', () => {
    const errorIds = []
    
    // Capture error IDs from multiple renders
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={`Error ${i}`} />
        </ErrorBoundary>
      )
      
      // Extract error ID from console.error call
      const lastCall = console.error.mock.calls[console.error.mock.calls.length - 1]
      const errorDetails = lastCall[1]
      errorIds.push(errorDetails.errorId)
      
      unmount()
    }

    // All error IDs should be unique
    const uniqueIds = new Set(errorIds)
    expect(uniqueIds.size).toBe(3)
  })

  it('should show error details in development mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Development error" />
      </ErrorBoundary>
    )

    // Should show error details
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv
  })

  it('should hide error details in production mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Production error" />
      </ErrorBoundary>
    )

    // Should not show error details
    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv
  })

  it('should have proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should have role="alert" for screen readers
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    // Buttons should be properly labeled
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument()
  })
})