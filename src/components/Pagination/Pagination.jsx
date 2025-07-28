import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styles from './Pagination.module.css';

/**
 * Pagination component with React 19 features and server-side integration
 * Provides page navigation, page size selection, and optimistic updates
 */
function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  'aria-describedby': ariaDescribedBy
}) {
  const [isPending, setIsPending] = useState(false);

  // Use local state for optimistic updates
  const [optimisticPage, setOptimisticPage] = useState(currentPage);
  const [optimisticPageSize, setOptimisticPageSize] = useState(pageSize);

  // Update optimistic values when props change
  useEffect(() => {
    setOptimisticPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setOptimisticPageSize(pageSize);
  }, [pageSize]);

  // Calculate page range for display
  const pageRange = useMemo(() => {
    const rangeWithDots = [];

    // For small number of pages, show all pages
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        rangeWithDots.push(i);
      }
      return rangeWithDots;
    }

    const delta = 2; // Number of pages to show on each side of current page

    // Calculate start and end of the range
    const start = Math.max(1, optimisticPage - delta);
    const end = Math.min(totalPages, optimisticPage + delta);

    // Add first page and ellipsis if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the main range
    for (let i = start; i <= end; i++) {
      rangeWithDots.push(i);
    }

    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [optimisticPage, totalPages]);

  // Handle page change with optimistic updates
  const handlePageChange = useCallback((newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    
    setOptimisticPage(newPage);
    setIsPending(true);
    
    if (onPageChange) {
      onPageChange(newPage);
      // Reset pending state after a short delay
      setTimeout(() => {
        setIsPending(false);
      }, 100);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Handle page size change with optimistic updates
  const handlePageSizeChange = useCallback((newSize) => {
    if (newSize === pageSize) return;
    
    setOptimisticPageSize(newSize);
    setIsPending(true);
    
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
      // Reset pending state after a short delay
      setTimeout(() => {
        setIsPending(false);
      }, 100);
    }
  }, [pageSize, onPageSizeChange]);

  const isLoading = isPending;
  const showPagination = totalPages > 1 && totalCount > 0;

  // Don't render if there's only one page or no results
  if (!showPagination) {
    return null;
  }

  // Calculate current range display
  const startItem = (optimisticPage - 1) * optimisticPageSize + 1;
  const endItem = Math.min(optimisticPage * optimisticPageSize, totalCount);

  return (
    <div 
      className={styles.paginationContainer}
      role="navigation"
      aria-label="Pagination navigation"
      aria-describedby={ariaDescribedBy}
    >
      {/* Page size selector */}
      <div className={styles.pageSizeSection} role="group" aria-labelledby="page-size-label">
        <label id="page-size-label" htmlFor="pageSize" className={styles.pageSizeLabel}>
          Items per page:
        </label>
        <div className={styles.pageSizeForm}>
          <select
            id="pageSize"
            name="pageSize"
            value={optimisticPageSize}
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10);
              handlePageSizeChange(newSize);
            }}
            disabled={disabled || isLoading}
            className={styles.pageSizeSelect}
            aria-label={`Select page size, currently showing ${optimisticPageSize} items per page`}
            aria-describedby="page-info"
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>
      </div>

      {/* Page info */}
      <div 
        id="page-info"
        className={styles.pageInfo} 
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {startItem}-{endItem} of {totalCount} items (Page {optimisticPage} of {totalPages})
      </div>

      {/* Page navigation */}
      <div 
        className={styles.pageNavigation}
        role="group"
        aria-label="Page navigation controls"
      >
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(optimisticPage - 1)}
          disabled={disabled || isLoading || optimisticPage <= 1}
          className={`${styles.navButton} ${styles.prevButton}`}
          aria-label={`Go to previous page, page ${optimisticPage - 1} of ${totalPages}`}
          title="Previous page"
        >
          <span aria-hidden="true">‹</span> Previous
        </button>

        {/* Page numbers */}
        <div className={styles.pageNumbers} role="group" aria-label="Page numbers">
          {pageRange.map((page, index) => {
            if (page === '...') {
              return (
                <span 
                  key={`ellipsis-${index}`} 
                  className={styles.ellipsis}
                  aria-hidden="true"
                  role="presentation"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === optimisticPage;
            
            return (
              <div key={page} className={styles.pageForm}>
                <button
                  type="button"
                  onClick={() => handlePageChange(page)}
                  disabled={disabled || isLoading || isCurrentPage}
                  className={`${styles.pageButton} ${isCurrentPage ? styles.currentPage : ''}`}
                  aria-label={isCurrentPage ? `Current page, page ${page} of ${totalPages}` : `Go to page ${page} of ${totalPages}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  title={isCurrentPage ? `Current page ${page}` : `Go to page ${page}`}
                >
                  {page}
                </button>
              </div>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageChange(optimisticPage + 1)}
          disabled={disabled || isLoading || optimisticPage >= totalPages}
          className={`${styles.navButton} ${styles.nextButton}`}
          aria-label={`Go to next page, page ${optimisticPage + 1} of ${totalPages}`}
          title="Next page"
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div 
          className={styles.loadingIndicator} 
          role="status"
          aria-live="polite"
          aria-label="Loading new page"
        >
          <span className={styles.spinner} aria-hidden="true">⟳</span>
          Loading page {optimisticPage}...
        </div>
      )}
    </div>
  );
}

export default Pagination;