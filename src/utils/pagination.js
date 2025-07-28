/**
 * Calculates pagination metadata
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} pageSize - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {Object} Pagination metadata
 */
export function calculatePagination(currentPage, pageSize, totalCount) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  
  return {
    currentPage: Math.max(1, Math.min(currentPage, totalPages)),
    pageSize,
    totalCount,
    totalPages,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages || totalPages === 0
  };
}

/**
 * Generates array of page numbers for pagination display
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of page buttons to show
 * @returns {number[]} Array of page numbers to display
 */
export function generatePageNumbers(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Validates and normalizes pagination parameters
 * @param {number} page - Page number
 * @param {number} size - Page size
 * @param {number} totalCount - Total number of items
 * @returns {Object} Normalized pagination parameters
 */
export function normalizePaginationParams(page, size, totalCount = 0) {
  // Handle undefined/null size by using default, but handle 0 as invalid
  const inputSize = size === undefined || size === null ? 10 : size;
  const normalizedSize = Math.max(1, Math.min(inputSize, 100)); // Limit page size between 1-100
  const totalPages = Math.ceil(totalCount / normalizedSize);
  const normalizedPage = Math.max(1, Math.min(page || 1, Math.max(1, totalPages)));
  
  return {
    page: normalizedPage,
    size: normalizedSize,
    totalPages
  };
}

/**
 * Formats pagination display text
 * @param {number} startItem - First item number on current page
 * @param {number} endItem - Last item number on current page
 * @param {number} totalCount - Total number of items
 * @param {string} searchText - Current search text
 * @returns {string} Formatted pagination text
 */
export function formatPaginationText(startItem, endItem, totalCount, searchText = '') {
  if (totalCount === 0) {
    return searchText ? '0 results found' : 'No items available';
  }
  
  const baseText = `Showing ${startItem}-${endItem} of ${totalCount}`;
  const itemText = totalCount === 1 ? 'item' : 'items';
  
  if (searchText) {
    return `${baseText} results`;
  }
  
  return `${baseText} ${itemText}`;
}