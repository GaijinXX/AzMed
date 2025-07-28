import React from 'react'
import './LoadingSkeletons.module.css'

// Generic skeleton component
export const Skeleton = ({ width = '100%', height = '1rem', className = '', ...props }) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height }}
    aria-label="Loading..."
    {...props}
  />
)

// Search bar loading skeleton
export const SearchBarSkeleton = () => (
  <div className="search-skeleton" role="status" aria-label="Loading search bar">
    <div className="search-skeleton-container">
      <Skeleton height="3rem" className="search-input-skeleton" />
      <Skeleton width="80px" height="3rem" className="search-button-skeleton" />
    </div>
  </div>
)

// Results info loading skeleton
export const ResultsInfoSkeleton = () => (
  <div className="results-skeleton" role="status" aria-label="Loading results information">
    <Skeleton width="200px" height="1.5rem" />
  </div>
)

// Table loading skeleton
export const TableSkeleton = ({ rows = 10 }) => (
  <div className="table-skeleton" role="status" aria-label="Loading table data">
    <div className="table-skeleton-container">
      {/* Table header skeleton */}
      <div className="table-header-skeleton">
        <Skeleton width="60px" height="1.25rem" />
        <Skeleton width="150px" height="1.25rem" />
        <Skeleton width="200px" height="1.25rem" />
        <Skeleton width="80px" height="1.25rem" />
        <Skeleton width="100px" height="1.25rem" />
        <Skeleton width="120px" height="1.25rem" />
        <Skeleton width="80px" height="1.25rem" />
        <Skeleton width="150px" height="1.25rem" />
        <Skeleton width="80px" height="1.25rem" />
        <Skeleton width="80px" height="1.25rem" />
        <Skeleton width="100px" height="1.25rem" />
      </div>
      
      {/* Table rows skeleton */}
      <div className="table-body-skeleton">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="table-row-skeleton">
            <Skeleton width="60px" height="1rem" />
            <Skeleton width="140px" height="1rem" />
            <Skeleton width="180px" height="1rem" />
            <Skeleton width="70px" height="1rem" />
            <Skeleton width="90px" height="1rem" />
            <Skeleton width="110px" height="1rem" />
            <Skeleton width="70px" height="1rem" />
            <Skeleton width="140px" height="1rem" />
            <Skeleton width="70px" height="1rem" />
            <Skeleton width="70px" height="1rem" />
            <Skeleton width="90px" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Pagination loading skeleton
export const PaginationSkeleton = () => (
  <div className="pagination-skeleton" role="status" aria-label="Loading pagination controls">
    <div className="pagination-skeleton-container">
      <div className="pagination-left">
        <Skeleton width="120px" height="2.5rem" />
      </div>
      <div className="pagination-center">
        <Skeleton width="40px" height="2.5rem" />
        <Skeleton width="40px" height="2.5rem" />
        <Skeleton width="40px" height="2.5rem" />
        <Skeleton width="40px" height="2.5rem" />
        <Skeleton width="40px" height="2.5rem" />
      </div>
      <div className="pagination-right">
        <Skeleton width="100px" height="1.5rem" />
      </div>
    </div>
  </div>
)

// Loading spinner component
export const LoadingSpinner = ({ size = 'medium', className = '', standalone = true }) => {
  const sizeClass = `spinner-${size}`
  
  return (
    <div 
      className={`loading-spinner ${sizeClass} ${className}`} 
      role={standalone ? "status" : undefined}
      aria-label={standalone ? "Loading" : undefined}
    >
      <div className="spinner"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Inline loading indicator
export const InlineLoader = ({ text = 'Loading...', className = '' }) => (
  <div className={`inline-loader ${className}`} role="status">
    <LoadingSpinner size="small" standalone={false} />
    <span className="loading-text">{text}</span>
  </div>
)

// Full page loading overlay
export const LoadingOverlay = ({ message = 'Loading...', transparent = false }) => (
  <div className={`loading-overlay ${transparent ? 'transparent' : ''}`} role="status">
    <div className="loading-overlay-content">
      <LoadingSpinner size="large" standalone={false} />
      <p className="loading-message">{message}</p>
    </div>
  </div>
)

// Error state with retry
export const ErrorState = ({ 
  message, 
  onRetry, 
  retryText = 'Try Again',
  showRefresh = false,
  className = '' 
}) => (
  <div className={`error-state ${className}`} role="alert">
    <div className="error-state-content">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button"
            type="button"
          >
            {retryText}
          </button>
        )}
        {showRefresh && (
          <button 
            onClick={() => window.location.reload()}
            className="refresh-button"
            type="button"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  </div>
)

// Empty state component
export const EmptyState = ({ 
  message = 'No results found',
  description,
  action,
  className = '' 
}) => (
  <div className={`empty-state ${className}`} role="status">
    <div className="empty-state-content">
      <div className="empty-icon">📭</div>
      <h3 className="empty-title">{message}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  </div>
)