import React, { memo, useCallback } from 'react';
import SortIndicator from './SortIndicator';
import { getSortAriaLabel, SORT_DIRECTIONS } from './sortConfig';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './SortableColumnHeader.module.css';

/**
 * SortableColumnHeader component for interactive table headers
 * Handles click and keyboard events for sorting functionality
 * React Compiler will automatically optimize this component
 */
const SortableColumnHeader = memo(function SortableColumnHeader({ 
  column, 
  isVisible, 
  isSorted, 
  sortDirection, 
  onSort,
  disabled = false,
  className = ''
}) {
  if (!isVisible) return null;

  // Get translations
  const { t } = useTranslation();

  const handleClick = useCallback(() => {
    if (disabled || !column.sortable) return;
    onSort(column.key);
  }, [disabled, column.sortable, column.key, onSort]);

  const handleKeyDown = useCallback((e) => {
    if (disabled || !column.sortable) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(column.key);
    }
  }, [disabled, column.sortable, column.key, onSort]);

  // Get translated column label
  const columnLabel = t(column.labelKey);
  
  // Generate ARIA label for accessibility
  const ariaLabel = getSortAriaLabel(columnLabel, isSorted, sortDirection, t);
  
  // Determine ARIA sort state
  const ariaSortValue = isSorted 
    ? (sortDirection === SORT_DIRECTIONS.ASC ? 'ascending' : 'descending')
    : 'none';

  // Build CSS classes
  const headerClasses = [
    styles.headerCell,
    column.sortable ? styles.sortableHeader : styles.nonSortableHeader,
    isSorted ? styles.sorted : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  // For non-sortable columns, render as regular header
  if (!column.sortable) {
    return (
      <th 
        scope="col" 
        className={headerClasses}
        role="columnheader"
      >
        <div className={styles.headerContent}>
          <span className={styles.headerText}>
            {column.key === 'number' ? (
              <abbr title={t('table.headers.number')}>#</abbr>
            ) : column.key === 'wholesale_price' ? (
              <abbr title={`${t('table.headers.wholesale_price')} ${t('common.currency')}`}>{t('table.headers.wholesale_price')} (₼)</abbr>
            ) : column.key === 'retail_price' ? (
              <abbr title={`${t('table.headers.retail_price')} ${t('common.currency')}`}>{t('table.headers.retail_price')} (₼)</abbr>
            ) : (
              columnLabel
            )}
          </span>
        </div>
      </th>
    );
  }

  // For sortable columns, render with interactive functionality
  return (
    <th 
      scope="col" 
      className={headerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="columnheader"
      aria-sort={ariaSortValue}
      aria-label={ariaLabel}
      title={disabled ? t('table.sortingDisabled') : ariaLabel}
    >
      <div className={styles.headerContent}>
        <span className={styles.headerText}>
          {column.key === 'number' ? (
            <abbr title={t('table.headers.number')}>#</abbr>
          ) : column.key === 'wholesale_price' ? (
            <abbr title={`${t('table.headers.wholesale_price')} ${t('common.currency')}`}>{t('table.headers.wholesale_price')} (₼)</abbr>
          ) : column.key === 'retail_price' ? (
            <abbr title={`${t('table.headers.retail_price')} ${t('common.currency')}`}>{t('table.headers.retail_price')} (₼)</abbr>
          ) : (
            columnLabel
          )}
        </span>
        <SortIndicator 
          isSorted={isSorted} 
          direction={sortDirection}
          className={disabled ? styles.disabledIndicator : ''}
        />
      </div>
    </th>
  );
});

export default SortableColumnHeader;