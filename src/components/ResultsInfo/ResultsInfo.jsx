import React from 'react';
import styles from './ResultsInfo.module.css';

const ResultsInfo = ({ 
  totalCount = 0, 
  currentPage = 1, 
  pageSize = 10, 
  searchText = '',
  loading = false 
}) => {
  // Calculate current page range
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Determine display mode
  const isSearchMode = searchText.trim().length > 0;
  
  // Handle loading state
  if (loading) {
    return (
      <div className={styles.resultsInfo} role="status" aria-live="polite">
        <span className={styles.loadingText} aria-label="Loading search results">
          Loading...
        </span>
      </div>
    );
  }

  // Handle zero results
  if (totalCount === 0) {
    return (
      <div className={styles.resultsInfo} role="status" aria-live="polite">
        <span className={styles.noResults} aria-label={
          isSearchMode 
            ? `No results found for search term: ${searchText}`
            : 'No items available in the database'
        }>
          {isSearchMode 
            ? `No results found for "${searchText}"`
            : 'No items available'
          }
        </span>
      </div>
    );
  }

  // Create accessible description
  const accessibleDescription = isSearchMode 
    ? `Search results: Found ${totalCount} ${totalCount === 1 ? 'drug' : 'drugs'} matching "${searchText}"`
    : `Database contents: ${totalCount} ${totalCount === 1 ? 'drug' : 'drugs'} available`;

  const pageRangeDescription = totalCount > pageSize 
    ? `. Currently showing items ${startItem} to ${endItem}.`
    : '';

  // Display results info
  return (
    <div 
      className={styles.resultsInfo} 
      role="status" 
      aria-live="polite"
      aria-label={accessibleDescription + pageRangeDescription}
    >
      <span className={styles.countText}>
        {isSearchMode ? (
          // Search mode: "Found X results"
          totalCount === 1 
            ? `Found 1 result for "${searchText}"`
            : `Found ${totalCount.toLocaleString()} results for "${searchText}"`
        ) : (
          // Browse mode: "Found X items"
          totalCount === 1 
            ? 'Found 1 item'
            : `Found ${totalCount.toLocaleString()} items`
        )}
      </span>
      
      {/* Show page range if there's pagination */}
      {totalCount > pageSize && (
        <span 
          className={styles.pageRange}
          aria-label={`Page range: showing items ${startItem} to ${endItem} of ${totalCount} total`}
        >
          ({startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default ResultsInfo;