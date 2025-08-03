// Sortable columns configuration for the drug database table
// Note: labels will be translated at runtime using the translation system
export const SORTABLE_COLUMNS = [
  {
    key: 'number',
    labelKey: 'table.headers.number',
    type: 'numeric',
    sortable: true,
    required: true
  },
  {
    key: 'product_name',
    labelKey: 'table.headers.product_name',
    type: 'text',
    sortable: true,
    required: true
  },
  {
    key: 'active_ingredients',
    labelKey: 'table.headers.active_ingredients',
    type: 'text',
    sortable: true,
    required: false
  },
  {
    key: 'dosage_amount',
    labelKey: 'table.headers.dosage_amount',
    type: 'alphanumeric',
    sortable: true,
    required: false
  },
  {
    key: 'dosage_form',
    labelKey: 'table.headers.dosage_form',
    type: 'text',
    sortable: true,
    required: false
  },
  {
    key: 'packaging_form',
    labelKey: 'table.headers.packaging_form',
    type: 'text',
    sortable: true,
    required: false
  },
  {
    key: 'amount',
    labelKey: 'table.headers.amount',
    type: 'alphanumeric',
    sortable: true,
    required: false
  },
  {
    key: 'manufacturer',
    labelKey: 'table.headers.manufacturer',
    type: 'text',
    sortable: true,
    required: false
  },
  {
    key: 'wholesale_price',
    labelKey: 'table.headers.wholesale_price',
    type: 'numeric',
    sortable: true,
    required: false
  },
  {
    key: 'retail_price',
    labelKey: 'table.headers.retail_price',
    type: 'numeric',
    sortable: true,
    required: false
  },
  {
    key: 'date',
    labelKey: 'table.headers.registration_date',
    type: 'date',
    sortable: true,
    required: false
  }
];

// Sort direction constants
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
};

// Utility functions for sort configuration
export const getSortableColumn = (columnKey) => {
  return SORTABLE_COLUMNS.find(col => col.key === columnKey);
};

export const isColumnSortable = (columnKey) => {
  const column = getSortableColumn(columnKey);
  return column ? column.sortable : false;
};

export const getColumnLabel = (columnKey, t) => {
  const column = getSortableColumn(columnKey);
  return column ? t(column.labelKey) : columnKey;
};

export const validateSortColumn = (columnKey) => {
  if (!columnKey) return false;
  const column = getSortableColumn(columnKey);
  return column ? column.sortable : false;
};

export const validateSortDirection = (direction) => {
  return direction === SORT_DIRECTIONS.ASC || direction === SORT_DIRECTIONS.DESC;
};

// Generate ARIA label for sort actions
export const getSortAriaLabel = (columnLabel, isSorted, sortDirection, t) => {
  if (!isSorted) {
    return `${columnLabel}, ${t('table.notSorted')}, ${t('table.clickToSortAsc')}`;
  }
  
  const currentDirection = sortDirection === SORT_DIRECTIONS.ASC ? t('table.ascending') : t('table.descending');
  const nextDirection = sortDirection === SORT_DIRECTIONS.ASC ? t('table.descending') : t('table.ascending');
  
  return `${columnLabel}, ${t('table.sorted')} ${currentDirection}, ${t('table.clickToSort')} ${nextDirection}`;
};

// Generate screen reader announcement for sort changes
export const getSortAnnouncement = (columnLabel, sortDirection, t) => {
  const direction = sortDirection === SORT_DIRECTIONS.ASC ? t('table.ascending') : t('table.descending');
  return `${t('table.tableSorted')} ${columnLabel} ${t('table.inOrder')} ${direction}`;
};