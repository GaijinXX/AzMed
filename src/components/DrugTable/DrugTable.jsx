import React, { Suspense } from 'react';
import DrugRow from './DrugRow';
import { useOptimizedList, useCompilerOptimizations } from '../../hooks/useReact19Optimizations';
import styles from './DrugTable.module.css';

// Define available columns
const AVAILABLE_COLUMNS = [
  { key: 'number', label: 'Registration #', required: true },
  { key: 'product_name', label: 'Product Name', required: true },
  { key: 'active_ingredients', label: 'Active Ingredients', required: false },
  { key: 'dosage_amount', label: 'Dosage Amount', required: false },
  { key: 'dosage_form', label: 'Dosage Form', required: false },
  { key: 'packaging_form', label: 'Packaging Form', required: false },
  { key: 'amount', label: 'Package Amount', required: false },
  { key: 'manufacturer', label: 'Manufacturer', required: false },
  { key: 'wholesale_price', label: 'Wholesale Price', required: false },
  { key: 'retail_price', label: 'Retail Price', required: false },
  { key: 'date', label: 'Registration Date', required: false }
];

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
  onColumnToggle
}) {
  // Track component render performance
  const { trackRender } = useCompilerOptimizations();
  trackRender('DrugTable');

  // Use optimized list rendering for large datasets (only if we have drugs)
  const optimizedList = useOptimizedList(drugs || [], {
    itemHeight: 60, // Approximate row height
    containerHeight: 600, // Approximate table height
    overscan: 3 // Render 3 extra items for smooth scrolling
  });

  if (loading) {
    return <TableSkeleton visibleColumns={visibleColumns} />;
  }

  if (!drugs || drugs.length === 0) {
    return (
      <div className={styles.emptyState} role="status" aria-live="polite">
        <p>No drugs found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div 
        className={styles.tableWrapper}
        role="region"
        aria-label="Drug information table"
        tabIndex="0"
      >
        <table 
          className={styles.table} 
          role="table"
          aria-label={`Drug information table with ${drugs.length} entries`}
          aria-describedby={ariaDescribedBy}
        >
          <TableHeader visibleColumns={visibleColumns} />
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
        Table showing {drugs.length} drug{drugs.length !== 1 ? 's' : ''} with registration information, pricing, and manufacturer details.
      </div>
    </div>
  );
}

/**
 * Table header component with proper semantic structure
 * React Compiler will automatically optimize this component
 */
function TableHeader({ visibleColumns }) {
  return (
    <thead className={styles.tableHeader} role="rowgroup">
      <tr role="row">
        {visibleColumns.number && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            <abbr title="Registration Number">#</abbr>
          </th>
        )}
        {visibleColumns.product_name && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Product Name
          </th>
        )}
        {visibleColumns.active_ingredients && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Active Ingredients
          </th>
        )}
        {visibleColumns.dosage_amount && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Dosage Amount
          </th>
        )}
        {visibleColumns.dosage_form && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Dosage Form
          </th>
        )}
        {visibleColumns.packaging_form && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Packaging Form
          </th>
        )}
        {visibleColumns.amount && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Package Amount
          </th>
        )}
        {visibleColumns.manufacturer && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Manufacturer
          </th>
        )}
        {visibleColumns.wholesale_price && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            <abbr title="Wholesale Price in Azerbaijan Manat">Wholesale Price (₼)</abbr>
          </th>
        )}
        {visibleColumns.retail_price && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            <abbr title="Retail Price in Azerbaijan Manat">Retail Price (₼)</abbr>
          </th>
        )}
        {visibleColumns.date && (
          <th scope="col" className={styles.headerCell} aria-sort="none">
            Registration Date
          </th>
        )}
      </tr>
    </thead>
  );
}

/**
 * Table body component with virtual scrolling support and React 19 optimizations
 * React Compiler will automatically memoize this component
 */
function TableBody({ drugs, isPending, visibleColumns, totalItems }) {

  return (
    <tbody 
      className={`${styles.tableBody} ${isPending ? styles.pending : ''}`}
      role="rowgroup"
      aria-live={isPending ? "polite" : "off"}
      aria-label={`Table body showing ${drugs.length} of ${totalItems} drugs`}
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
function TableSkeleton({ visibleColumns = DEFAULT_VISIBLE_COLUMNS }) {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <TableHeader visibleColumns={visibleColumns} />
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