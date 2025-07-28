/**
 * @typedef {Object} Drug
 * @property {number} number - Registration number
 * @property {string} product_name - Product name
 * @property {string} active_ingredients - Active ingredients (comma-separated)
 * @property {string} dosage_amount - Dosage amount with units
 * @property {string} dosage_form - Form (tablet, injection, etc.)
 * @property {string} packaging_form - Packaging description
 * @property {string} amount - Package amount
 * @property {string} manufacturer - Manufacturer name and country
 * @property {number} wholesale_price - Price in qəpik (1/100 AZN)
 * @property {number} retail_price - Price in qəpik (1/100 AZN)
 * @property {string} date - Registration/update date
 */

/**
 * @typedef {Object} PaginationResponse
 * @property {Drug[]} data - Array of drug data
 * @property {number} total_count - Total number of results for pagination
 * @property {number} page_number - Current page number
 * @property {number} page_size - Items per page
 * @property {number} total_pages - Total number of pages
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} p_search_term - Search term (empty string for all results)
 * @property {number} [p_page_number] - Page number (defaults to 1)
 * @property {number} [p_page_size] - Items per page (defaults to 10)
 */

/**
 * @typedef {Object} AppState
 * @property {Drug[]} drugs - Current page drug data
 * @property {string} searchText - Current search input
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error state
 * @property {number} currentPage - Current pagination page
 * @property {number} pageSize - Items per page
 * @property {number} totalCount - Total number of results
 * @property {number} totalPages - Total number of pages
 */

export {};