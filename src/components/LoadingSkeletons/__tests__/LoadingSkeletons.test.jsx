import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import {
  Skeleton,
  SearchBarSkeleton,
  ResultsInfoSkeleton,
  TableSkeleton,
  PaginationSkeleton,
  LoadingSpinner,
  InlineLoader,
  LoadingOverlay,
  ErrorState,
  EmptyState
} from '../LoadingSkeletons'

describe('LoadingSkeletons', () => {
  describe('Skeleton', () => {
    it('should render with default props', () => {
      render(<Skeleton />)
      
      const skeleton = screen.getByLabelText('Loading...')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('skeleton')
    })

    it('should apply custom width and height', () => {
      render(<Skeleton width="200px" height="50px" />)
      
      const skeleton = screen.getByLabelText('Loading...')
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' })
    })

    it('should apply custom className', () => {
      render(<Skeleton className="custom-skeleton" />)
      
      const skeleton = screen.getByLabelText('Loading...')
      expect(skeleton).toHaveClass('skeleton', 'custom-skeleton')
    })
  })

  describe('SearchBarSkeleton', () => {
    it('should render search bar skeleton', () => {
      render(<SearchBarSkeleton />)
      
      expect(screen.getByLabelText('Loading search bar')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('ResultsInfoSkeleton', () => {
    it('should render results info skeleton', () => {
      render(<ResultsInfoSkeleton />)
      
      expect(screen.getByLabelText('Loading results information')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('TableSkeleton', () => {
    it('should render table skeleton with default rows', () => {
      render(<TableSkeleton />)
      
      expect(screen.getByLabelText('Loading table data')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render table skeleton with custom row count', () => {
      render(<TableSkeleton rows={5} />)
      
      const skeleton = screen.getByLabelText('Loading table data')
      expect(skeleton).toBeInTheDocument()
      
      // Should have 5 row skeletons
      const rowSkeletons = skeleton.querySelectorAll('.table-row-skeleton')
      expect(rowSkeletons).toHaveLength(5)
    })
  })

  describe('PaginationSkeleton', () => {
    it('should render pagination skeleton', () => {
      render(<PaginationSkeleton />)
      
      expect(screen.getByLabelText('Loading pagination controls')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('LoadingSpinner', () => {
    it('should render with default size', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('loading-spinner', 'spinner-medium')
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render with custom size', () => {
      render(<LoadingSpinner size="large" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('loading-spinner', 'spinner-large')
    })

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-spinner" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('loading-spinner', 'spinner-medium', 'custom-spinner')
    })
  })

  describe('InlineLoader', () => {
    it('should render with default text', () => {
      render(<InlineLoader />)
      
      // InlineLoader has role="status", LoadingSpinner inside doesn't when standalone=false
      expect(screen.getByRole('status')).toBeInTheDocument()
      // Check for the visible loading text (not the sr-only one)
      expect(screen.getByText('Loading...', { selector: '.loading-text' })).toBeInTheDocument()
    })

    it('should render with custom text', () => {
      render(<InlineLoader text="Searching..." />)
      
      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<InlineLoader className="custom-inline" />)
      
      const loader = screen.getByRole('status')
      expect(loader).toHaveClass('inline-loader', 'custom-inline')
    })
  })

  describe('LoadingOverlay', () => {
    it('should render with default message', () => {
      render(<LoadingOverlay />)
      
      // LoadingOverlay has role="status", LoadingSpinner inside doesn't when standalone=false
      expect(screen.getByRole('status')).toBeInTheDocument()
      // Check for the visible loading message (not the sr-only one)
      expect(screen.getByText('Loading...', { selector: '.loading-message' })).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<LoadingOverlay message="Processing..." />)
      
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('should apply transparent class when specified', () => {
      render(<LoadingOverlay transparent={true} />)
      
      const overlay = screen.getByRole('status')
      expect(overlay).toHaveClass('loading-overlay', 'transparent')
    })
  })

  describe('ErrorState', () => {
    it('should render error message', () => {
      render(<ErrorState message="Something went wrong" />)
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should render retry button when onRetry is provided', () => {
      const mockRetry = vi.fn()
      render(<ErrorState message="Error" onRetry={mockRetry} />)
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledOnce()
    })

    it('should render custom retry text', () => {
      const mockRetry = vi.fn()
      render(<ErrorState message="Error" onRetry={mockRetry} retryText="Retry Now" />)
      
      expect(screen.getByRole('button', { name: 'Retry Now' })).toBeInTheDocument()
    })

    it('should render refresh button when showRefresh is true', () => {
      // Mock window.location.reload
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(<ErrorState message="Error" showRefresh={true} />)
      
      const refreshButton = screen.getByRole('button', { name: 'Refresh Page' })
      expect(refreshButton).toBeInTheDocument()
      
      fireEvent.click(refreshButton)
      expect(mockReload).toHaveBeenCalledOnce()
    })

    it('should apply custom className', () => {
      render(<ErrorState message="Error" className="custom-error" />)
      
      const errorState = screen.getByRole('alert')
      expect(errorState).toHaveClass('error-state', 'custom-error')
    })
  })

  describe('EmptyState', () => {
    it('should render with default message', () => {
      render(<EmptyState />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<EmptyState message="No data available" />)
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(<EmptyState message="Empty" description="Try a different search" />)
      
      expect(screen.getByText('Try a different search')).toBeInTheDocument()
    })

    it('should render action when provided', () => {
      const action = <button>Clear Search</button>
      render(<EmptyState message="Empty" action={action} />)
      
      expect(screen.getByRole('button', { name: 'Clear Search' })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<EmptyState className="custom-empty" />)
      
      const emptyState = screen.getByRole('status')
      expect(emptyState).toHaveClass('empty-state', 'custom-empty')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for screen readers', () => {
      render(
        <div>
          <SearchBarSkeleton />
          <ResultsInfoSkeleton />
          <TableSkeleton />
          <PaginationSkeleton />
          <LoadingSpinner />
          <InlineLoader />
          <LoadingOverlay />
          <ErrorState message="Error" />
          <EmptyState />
        </div>
      )

      // All loading components should have role="status"
      const statusElements = screen.getAllByRole('status')
      expect(statusElements.length).toBeGreaterThan(0)

      // Error state should have role="alert"
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Check for proper aria-labels
      expect(screen.getByLabelText('Loading search bar')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading results information')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading table data')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading pagination controls')).toBeInTheDocument()
    })

    it('should have screen reader only text for spinners', () => {
      render(<LoadingSpinner />)
      
      const srText = screen.getByText('Loading...')
      expect(srText).toHaveClass('sr-only')
    })
  })
})