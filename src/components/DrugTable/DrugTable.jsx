import React, { Suspense, memo, useCallback } from 'react';
import DrugRow from './DrugRow';
import SortableColumnHeader from './SortableColumnHeader';
import { SORTABLE_COLUMNS } from './sortConfig';
import { useOptimizedList, useCompilerOptimizations } from '../../hooks/useReact19Optimizations';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './DrugTable.module.css';


// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = {
  number: true,
  product_name: true,
  active_ingredients: true,
  dosage_amount: true,
  dosage_form: true,
  packaging_form: false,
  amount: true,
  manufacturer: false,
  wholesale_price: false,
  retail_price: true,
  date: false
};

/**
 * DrugTable component with React 19 optimizations
 * Displays drug data in a responsive table format with progressive loading
 * React Compiler will automatically optimize this component
 */
function DrugTable({ 
  drugs = [], 
  loading = false, 
  isPending = false,
  'aria-describedby': ariaDescribedBy,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  onColumnToggle,
  sortColumn = null,
  sortDirection = 'asc',
  onSort
}) {
  // Track component render performance
  const { trackRender } = useCompilerOptimizations();
  trackRender('DrugTable');

  // Get translations
  const { t } = useTranslation();

  // Use optimized list rendering for large datasets (only if we have drugs)
  const optimizedList = useOptimizedList(drugs || [], {
    itemHeight: 60, // Approximate row height
    containerHeight: 600, // Approximate table height
    overscan: 3 // Render 3 extra items for smooth scrolling
  });

  if (loading) {
    return <TableSkeleton 
      visibleColumns={visibleColumns} 
      sortColumn={sortColumn}
      sortDirection={sortDirection}
    />;
  }

  if (!drugs || drugs.length === 0) {
    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <p>{t('table.noResults')}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div 
        className={styles.tableWrapper}
        role="region"
        aria-label={t('table.tableLabel')}
        tabIndex="0"
      >
        <table 
          className={styles.table} 
          role="table"
          aria-label={`${t('table.tableLabel')} ${t('pagination.with')} ${drugs.length} ${t('pagination.entries')}`}
          aria-describedby={ariaDescribedBy}
        >
          <TableHeader 
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
            disabled={loading || isPending}
          />
          <Suspense fallback={<TableBodySkeleton visibleColumns={visibleColumns} />}>
            <TableBody 
              drugs={drugs} 
              isPending={isPending} 
              visibleColumns={visibleColumns}
              totalItems={drugs?.length || 0}
            />
          </Suspense>
        </table>
      </div>
      
      {/* Screen reader summary */}
      <div className="visually-hidden" aria-live="polite">
        {t('table.tableSummary')} {drugs.length} {drugs.length !== 1 ? t('pagination.entries') : t('pagination.entry')}.
        {sortColumn && ` ${t('table.tableSorted')} ${t(`table.headers.${sortColumn}`)} ${t('table.inOrder')} ${sortDirection === 'asc' ? t('table.ascending') : t('table.descending')}.`}
      </div>
    </div>
  );
}

/**
 * Table header component with sortable column headers
 * React Compiler will automatically optimize this component
 */
function TableHeader({ visibleColumns, sortColumn, sortDirection, onSort, disabled = false }) {
  return (
    <thead className={styles.tableHeader} role="rowgroup">
      <tr role="row">
        {SORTABLE_COLUMNS.map(column => (
          <SortableColumnHeader
            key={column.key}
            column={column}
            isVisible={visibleColumns[column.key]}
            isSorted={sortColumn === column.key}
            sortDirection={sortDirection}
            onSort={onSort}
            disabled={disabled}
            className={styles.headerCell}
          />
        ))}
      </tr>
    </thead>
  );
}

/**
 * Table body component with virtual scrolling support and React 19 optimizations
 * React Compiler will automatically memoize this component
 */
function TableBody({ drugs, isPending, visibleColumns, totalItems }) {
  const { t } = useTranslation();

  return (
    <tbody 
      className={`${styles.tableBody} ${isPending ? styles.pending : ''}`}
      role="rowgroup"
      aria-live={isPending ? "polite" : "off"}
      aria-label={`${t('table.tableBody')} ${drugs.length} ${t('pagination.of')} ${totalItems} ${t('pagination.entries')}`}
    >
      {drugs.map((drug, index) => (
        <DrugRow 
          key={drug.number} 
          drug={drug} 
          rowIndex={index + 1}
          totalRows={totalItems}
          visibleColumns={visibleColumns}
        />
      ))}
    </tbody>
  );
}

/**
 * Loading skeleton for the entire table
 */
function TableSkeleton({ visibleColumns = DEFAULT_VISIBLE_COLUMNS, sortColumn = null, sortDirection = 'asc' }) {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <TableHeader 
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={() => {}} // No-op for skeleton
            disabled={true}
          />
          <TableBodySkeleton visibleColumns={visibleColumns} />
        </table>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for table body
 */
function TableBodySkeleton() {
  return (
    <tbody className={styles.tableBody}>
      {Array.from({ length: 10 }, (_, index) => (
        <tr key={index} className={styles.skeletonRow}>
          {Array.from({ length: 11 }, (_, cellIndex) => (
            <td key={cellIndex} className={styles.skeletonCell}>
              <div className={styles.skeletonContent}></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default DrugTable;