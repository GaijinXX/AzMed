import { describe, it, expect } from 'vitest';
import { 
  calculatePagination, 
  generatePageNumbers, 
  normalizePaginationParams, 
  formatPaginationText 
} from '../pagination.js';

describe('calculatePagination', () => {
  it('should calculate pagination metadata correctly', () => {
    const result = calculatePagination(2, 10, 25);
    expect(result).toEqual({
      currentPage: 2,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
      startItem: 11,
      endItem: 20,
      hasNextPage: true,
      hasPreviousPage: true,
      isFirstPage: false,
      isLastPage: false
    });
  });

  it('should handle first page correctly', () => {
    const result = calculatePagination(1, 10, 25);
    expect(result.startItem).toBe(1);
    expect(result.endItem).toBe(10);
    expect(result.isFirstPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('should handle last page correctly', () => {
    const result = calculatePagination(3, 10, 25);
    expect(result.startItem).toBe(21);
    expect(result.endItem).toBe(25);
    expect(result.isLastPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });

  it('should handle empty results', () => {
    const result = calculatePagination(1, 10, 0);
    expect(result).toEqual({
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      startItem: 0,
      endItem: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      isFirstPage: true,
      isLastPage: true
    });
  });

  it('should handle single page', () => {
    const result = calculatePagination(1, 10, 5);
    expect(result.totalPages).toBe(1);
    expect(result.isFirstPage).toBe(true);
    expect(result.isLastPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('should clamp current page to valid range', () => {
    const result1 = calculatePagination(0, 10, 25);
    expect(result1.currentPage).toBe(1);
    
    const result2 = calculatePagination(10, 10, 25);
    expect(result2.currentPage).toBe(3); // Max page for 25 items with page size 10
  });
});

describe('generatePageNumbers', () => {
  it('should return all pages when total pages <= maxVisible', () => {
    expect(generatePageNumbers(2, 3, 5)).toEqual([1, 2, 3]);
    expect(generatePageNumbers(1, 1, 5)).toEqual([1]);
  });

  it('should generate correct page numbers for middle pages', () => {
    expect(generatePageNumbers(5, 10, 5)).toEqual([3, 4, 5, 6, 7]);
  });

  it('should handle pages near the beginning', () => {
    expect(generatePageNumbers(2, 10, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle pages near the end', () => {
    expect(generatePageNumbers(9, 10, 5)).toEqual([6, 7, 8, 9, 10]);
  });

  it('should use default maxVisible of 5', () => {
    const result = generatePageNumbers(5, 10);
    expect(result).toEqual([3, 4, 5, 6, 7]);
  });

  it('should handle edge cases', () => {
    expect(generatePageNumbers(1, 0, 5)).toEqual([]);
    expect(generatePageNumbers(1, 1, 5)).toEqual([1]);
  });
});

describe('normalizePaginationParams', () => {
  it('should normalize valid parameters', () => {
    const result = normalizePaginationParams(2, 25, 100);
    expect(result).toEqual({
      page: 2,
      size: 25,
      totalPages: 4
    });
  });

  it('should use defaults for missing parameters', () => {
    const result = normalizePaginationParams();
    expect(result).toEqual({
      page: 1,
      size: 10,
      totalPages: 0
    });
  });

  it('should clamp page size to valid range', () => {
    const result1 = normalizePaginationParams(1, 0, 100);
    expect(result1.size).toBe(1);
    
    const result2 = normalizePaginationParams(1, 200, 100);
    expect(result2.size).toBe(100);
  });

  it('should clamp page to valid range', () => {
    const result1 = normalizePaginationParams(0, 10, 100);
    expect(result1.page).toBe(1);
    
    const result2 = normalizePaginationParams(20, 10, 100);
    expect(result2.page).toBe(10); // Max page for 100 items with page size 10
  });

  it('should handle zero total count', () => {
    const result = normalizePaginationParams(5, 10, 0);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(0);
  });
});

describe('formatPaginationText', () => {
  it('should format pagination text for normal results', () => {
    expect(formatPaginationText(1, 10, 25)).toBe('Showing 1-10 of 25 items');
    expect(formatPaginationText(11, 20, 25)).toBe('Showing 11-20 of 25 items');
  });

  it('should format pagination text for search results', () => {
    expect(formatPaginationText(1, 10, 25, 'aspirin')).toBe('Showing 1-10 of 25 results');
  });

  it('should handle single item', () => {
    expect(formatPaginationText(1, 1, 1)).toBe('Showing 1-1 of 1 item');
  });

  it('should handle zero results', () => {
    expect(formatPaginationText(0, 0, 0)).toBe('No items available');
    expect(formatPaginationText(0, 0, 0, 'aspirin')).toBe('0 results found');
  });

  it('should handle empty search text', () => {
    expect(formatPaginationText(1, 10, 25, '')).toBe('Showing 1-10 of 25 items');
  });

  it('should handle last page with fewer items', () => {
    expect(formatPaginationText(21, 25, 25)).toBe('Showing 21-25 of 25 items');
  });
});