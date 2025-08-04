import React from 'react';
import { formatPrice, truncateIngredients, truncateText } from '../../utils/formatters';
import styles from './DrugTable.module.css';

/**
 * DrugRow component for displaying individual drug data
 * Handles price formatting and text truncation
 */
function DrugRow({ drug, rowIndex, totalRows, visibleColumns = {} }) {
  if (!drug) {
    return null;
  }

  const {
    number,
    product_name,
    active_ingredients,
    dosage_amount,
    dosage_form,
    packaging_form,
    amount,
    manufacturer,
    wholesale_price,
    retail_price,
    date
  } = drug;

  // Format date for accessibility
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Not available';

  const shortDate = date ? new Date(date).toLocaleDateString() : 'N/A';

  return (
    <tr
      className={styles.tableRow}
      role="row"
      aria-rowindex={rowIndex + 1}
      aria-label={`Drug ${rowIndex} of ${totalRows}: ${product_name || 'Unknown product'}`}
    >
      {visibleColumns.number && (
        <td
          className={styles.tableCell}
          data-label="Registration #"
          role="gridcell"
          aria-label={`Registration number: ${number || 'Not available'}`}
        >
          <span className={styles.cellContent}>{number || 'N/A'}</span>
        </td>
      )}

      {visibleColumns.product_name && (
        <td
          className={styles.tableCell}
          data-label="Product Name"
          role="gridcell"
          aria-label={`Product name: ${product_name || 'Not available'}`}
        >
          <span className={styles.cellContent} title={product_name}>
            {truncateText(product_name, 50)}
          </span>
        </td>
      )}

      {visibleColumns.active_ingredients && (
        <td
          className={styles.tableCell}
          data-label="Active Ingredients"
          role="gridcell"
          aria-label={`Active ingredients: ${active_ingredients || 'Not available'}`}
        >
          <span className={styles.cellContent} title={active_ingredients}>
            {truncateIngredients(active_ingredients, 80)}
          </span>
        </td>
      )}

      {visibleColumns.dosage_amount && (
        <td
          className={styles.tableCell}
          data-label="Dosage"
          role="gridcell"
          aria-label={`Dosage: ${dosage_amount || 'Not available'}`}
        >
          <span className={styles.cellContent} title={dosage_amount}>
            {truncateText(dosage_amount, 30)}
          </span>
        </td>
      )}

      {visibleColumns.dosage_form && (
        <td
          className={styles.tableCell}
          data-label="Form"
          role="gridcell"
          aria-label={`Formulation: ${dosage_form || 'Not available'}`}
        >
          <span className={styles.cellContent} title={dosage_form}>
            {truncateText(dosage_form, 25)}
          </span>
        </td>
      )}

      {visibleColumns.packaging_form && (
        <td
          className={styles.tableCell}
          data-label="Packaging"
          role="gridcell"
          aria-label={`Packaging form: ${packaging_form || 'Not available'}`}
        >
          <span className={styles.cellContent} title={packaging_form}>
            {truncateText(packaging_form, 30)}
          </span>
        </td>
      )}

      {visibleColumns.amount && (
        <td
          className={styles.tableCell}
          data-label="Amount"
          role="gridcell"
          aria-label={`Amount: ${amount || 'Not available'}`}
        >
          <span className={styles.cellContent} title={amount}>
            {truncateText(amount, 25)}
          </span>
        </td>
      )}

      {visibleColumns.manufacturer && (
        <td
          className={styles.tableCell}
          data-label="Manufacturer"
          role="gridcell"
          aria-label={`Manufacturer: ${manufacturer || 'Not available'}`}
        >
          <span className={styles.cellContent} title={manufacturer}>
            {truncateText(manufacturer, 40)}
          </span>
        </td>
      )}

      {visibleColumns.wholesale_price && (
        <td
          className={styles.tableCell}
          data-label="Wholesale Price"
          role="gridcell"
          aria-label={`Wholesale price: ${formatPrice(wholesale_price)}`}
        >
          <span className={`${styles.cellContent} ${styles.priceCell}`}>
            <span className={styles.manatSymbol}>₼</span>{(wholesale_price / 100).toFixed(2)}
          </span>
        </td>
      )}

      {visibleColumns.retail_price && (
        <td
          className={styles.tableCell}
          data-label="Retail Price"
          role="gridcell"
          aria-label={`Retail price: ${formatPrice(retail_price)}`}
        >
          <span className={`${styles.cellContent} ${styles.priceCell}`}>
            <span className={styles.manatSymbol}>₼</span>{(retail_price / 100).toFixed(2)}
          </span>
        </td>
      )}

      {visibleColumns.date && (
        <td
          className={styles.tableCell}
          data-label="Date"
          role="gridcell"
          aria-label={`Registration date: ${formattedDate}`}
        >
          <span className={styles.cellContent}>
            <time dateTime={date} title={formattedDate}>
              {shortDate}
            </time>
          </span>
        </td>
      )}
    </tr>
  );
}

export default DrugRow;