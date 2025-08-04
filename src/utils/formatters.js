/**
 * Formats price from qəpik to AZN with manat symbol
 * @param {number} priceInQepik - Price in qəpik (1/100 AZN)
 * @returns {string} Formatted price with ₼ symbol and two decimal places
 */
export function formatPrice(priceInQepik) {
  if (typeof priceInQepik !== 'number' || isNaN(priceInQepik)) {
    return '₼0.00';
  }
  
  const priceInAZN = priceInQepik / 100;
  return `₼${priceInAZN.toFixed(2)}`;
}

/**
 * Formats price as JSX with proper font fallback for Manat symbol
 * @param {number} priceInQepik - Price in qəpik (1/100 AZN)
 * @returns {JSX.Element} Formatted price with properly styled ₼ symbol
 */
export function formatPriceWithSymbol(priceInQepik) {
  if (typeof priceInQepik !== 'number' || isNaN(priceInQepik)) {
    return <><span className="manat-symbol">₼</span>0.00</>;
  }
  
  const priceInAZN = priceInQepik / 100;
  return <><span className="manat-symbol">₼</span>{priceInAZN.toFixed(2)}</>;
}

/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
  if (typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Truncates ingredient list with smart comma handling
 * @param {string} ingredients - Comma-separated ingredient list
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated ingredients with proper comma handling
 */
export function truncateIngredients(ingredients, maxLength = 150) {
  if (typeof ingredients !== 'string') {
    return '';
  }
  
  if (ingredients.length <= maxLength) {
    return ingredients;
  }
  
  // Find the last complete ingredient that fits within the limit
  const truncated = ingredients.substring(0, maxLength);
  const lastCommaIndex = truncated.lastIndexOf(',');
  
  if (lastCommaIndex > 0) {
    // Truncate at the last complete ingredient
    return truncated.substring(0, lastCommaIndex).trim() + '...';
  }
  
  // If no comma found, use regular truncation
  return truncated.trim() + '...';
}