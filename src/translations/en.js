export default {
  common: {
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Try Again',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    clear: 'Clear',
    currency: 'in Azerbaijan Manat'
  },
  header: {
    title: 'Azerbaijan Drug Database',
    subtitle: 'Search and browse all officially registered drugs in Azerbaijan'
  },
  search: {
    placeholder: 'Search by drug name, active ingredient, or registration number...',
    ariaLabel: 'Search drugs database',
    noResults: 'No drugs found matching your search criteria',
    resultsFound: 'drugs found',
    showAllDrugs: 'Show All Drugs'
  },
  table: {
    headers: {
      number: 'Registration #',
      product_name: 'Product Name',
      active_ingredients: 'Active Ingredients',
      manufacturer: 'Manufacturer',
      country: 'Country',
      atc_code: 'ATC Code',
      registration_date: 'Registration Date',
      expiry_date: 'Expiry Date',
      dosage_amount: 'Dosage',
      dosage_form: 'Formulation',
      packaging_form: 'Packaging Form',
      amount: 'Amount',
      wholesale_price: 'Wholesale Price',
      retail_price: 'Retail Price'
    },
    sortBy: 'Sort by',
    ascending: 'Ascending',
    descending: 'Descending',
    noData: 'No data available',
    notSorted: 'not sorted',
    sorted: 'sorted',
    clickToSortAsc: 'click to sort ascending',
    clickToSort: 'click to sort',
    tableSorted: 'Table sorted by',
    inOrder: 'in',
    noResults: 'No drugs found. Try adjusting your search criteria.',
    tableLabel: 'Drug information table',
    tableSummary: 'Table showing',
    tableBody: 'Table body showing',
    sortingDisabled: 'Sorting disabled'
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    to: 'to',
    entries: 'entries',
    entry: 'entry',
    totalEntries: 'total entries',
    with: 'with',
    navigation: 'Pagination navigation',
    itemsPerPage: 'Items per page',
    selectPageSize: 'Select page size',
    currentlyShowing: 'currently showing',
    items: 'items',
    pageControls: 'Page navigation controls',
    goToPrevious: 'Go to previous page',
    goToNext: 'Go to next page',
    pageNumbers: 'Page numbers',
    currentPage: 'Current page',
    goToPage: 'Go to page',
    loadingPage: 'Loading page'
  },

  results: {
    loadingAriaLabel: 'Loading search results',
    noResultsForSearch: 'No results found for search term:',
    noItemsAvailable: 'No items available in the database',
    noResultsFound: 'No results found for',
    noItems: 'No items available',
    searchResults: 'Search results',
    found: 'Found',
    drug: 'drug',
    drugs: 'drugs',
    matching: 'matching',
    databaseContents: 'Database contents',
    available: 'available',
    currentlyShowing: 'Currently showing items',
    to: 'to',
    result: 'result',
    results: 'results',
    for: 'for',
    item: 'item',
    items: 'items',
    pageRange: 'Page range',
    showing: 'showing',
    of: 'of',
    total: 'total'
  },
  errors: {
    loadingFailed: 'Failed to load data',
    networkError: 'Network connection error',
    serverError: 'Server error occurred',
    tryAgain: 'Try Again',
    somethingWentWrong: 'Something went wrong',
    unexpectedError: 'We\'re sorry, but something unexpected happened. The application encountered an error and couldn\'t continue.',
    refreshPage: 'Refresh Page',
    errorDetails: 'Error Details (Development Only)',
    errorId: 'Error ID',
    message: 'Message',
    stack: 'Stack'
  },
  loading: {
    searchBar: 'Loading search bar',
    resultsInfo: 'Loading results information',
    tableData: 'Loading table data',
    pagination: 'Loading pagination controls',
    loading: 'Loading',
    loadingMessage: 'Loading...'
  },
  columns: {
    title: 'Column Visibility',
    showHide: 'Show/Hide Columns',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    settings: 'Column visibility settings',
    visible: 'columns visible',
    showHideColumns: 'Show/hide table columns',
    columns: 'Columns',
    visibilityOptions: 'Column visibility options',
    toggle: 'Toggle',
    columnVisibility: 'column visibility',
    required: 'Required column',
    showAll: 'Show All',
    hideOptional: 'Hide Optional',
    of: 'of'
  },
  language: {
    selector: 'Language',
    english: 'English',
    azeri: 'Azərbaycan',
    russian: 'Русский'
  },
  share: {
    button: 'Share',
    title: 'Drug Database Search',
    description: 'Check out this drug database search',
    tooltip: 'Share this search with all current filters and settings',
    ariaLabel: 'Share current search state',
    copied: 'Copied!'
  },
  recentSearches: {
    title: 'Recent Searches',
    dropdown: {
      label: 'Recent searches'
    },
    item: {
      label: 'Recent search: {{searchTerm}}',
      delete: {
        label: 'Remove "{{searchTerm}}" from recent searches'
      }
    },
    clearAll: {
      text: 'Clear All',
      label: 'Clear all recent searches'
    }
  }
};