import React from 'react';
import styles from './ResultsInfo.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const ResultsInfo = ({ 
  totalCount = 0, 
  currentPage = 1, 
  pageSize = 10, 
  searchText = '',
  loading = false 
}) => {
  const { t } = useTranslation();
  
  // Calculate current page range
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Determine display mode
  const isSearchMode = searchText.trim().length > 0;
  
  // Handle loading state
  if (loading) {
    return (
      <div className={styles.resultsInfo} role="status" aria-live="polite">
        <span className={styles.loadingText} aria-label={t('results.loadingAriaLabel')}>
          {t('common.loading')}
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
            ? `${t('results.noResultsForSearch')} ${searchText}`
            : t('results.noItemsAvailable')
        }>
          {isSearchMode 
            ? `${t('results.noResultsFound')} "${searchText}"`
            : t('results.noItems')
          }
        </span>
      </div>
    );
  }

  // Create accessible description
  const drugText = totalCount === 1 ? t('results.drug') : t('results.drugs');
  const accessibleDescription = isSearchMode 
    ? `${t('results.searchResults')}: ${t('results.found')} ${totalCount} ${drugText} ${t('results.matching')} "${searchText}"`
    : `${t('results.databaseContents')}: ${totalCount} ${drugText} ${t('results.available')}`;

  const pageRangeDescription = totalCount > pageSize 
    ? `. ${t('results.currentlyShowing')} ${startItem} ${t('results.to')} ${endItem}.`
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
            ? `${t('results.found')} 1 ${t('results.result')} ${t('results.for')} "${searchText}"`
            : `${t('results.found')} ${totalCount.toLocaleString()} ${t('results.results')} ${t('results.for')} "${searchText}"`
        ) : (
          // Browse mode: "Found X items"
          totalCount === 1 
            ? `${t('results.found')} 1 ${t('results.item')}`
            : `${t('results.found')} ${totalCount.toLocaleString()} ${t('results.items')}`
        )}
      </span>
      
      {/* Show page range if there's pagination */}
      {totalCount > pageSize && (
        <span 
          className={styles.pageRange}
          aria-label={`${t('results.pageRange')}: ${t('results.showing')} ${t('results.items')} ${startItem} ${t('results.to')} ${endItem} ${t('results.of')} ${totalCount} ${t('results.total')}`}
        >
          ({startItem.toLocaleString()}-{endItem.toLocaleString()} {t('results.of')} {totalCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default ResultsInfo;