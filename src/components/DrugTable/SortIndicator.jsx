import React, { memo } from 'react';
import { SORT_DIRECTIONS } from './sortConfig';
import styles from './SortIndicator.module.css';

/**
 * SortIndicator component displays visual indicators for column sort state
 * Shows ascending (↑), descending (↓), or neutral (⇅) arrows
 * React Compiler will automatically optimize this component
 */
const SortIndicator = memo(function SortIndicator({ isSorted, direction, className = '' }) {
  const indicatorClass = `${styles.sortIndicator} ${className}`;

  if (!isSorted) {
    return (
      <span className={indicatorClass} aria-hidden="true">
        <span className={styles.sortIconNeutral} title="Click to sort">
          ⇅
        </span>
      </span>
    );
  }

  return (
    <span className={indicatorClass} aria-hidden="true">
      {direction === SORT_DIRECTIONS.ASC ? (
        <span 
          className={styles.sortIconAsc} 
          title="Sorted ascending, click to sort descending"
        >
          ↑
        </span>
      ) : (
        <span 
          className={styles.sortIconDesc} 
          title="Sorted descending, click to sort ascending"
        >
          ↓
        </span>
      )}
    </span>
  );
});

export default SortIndicator;