import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResultsInfo from '../ResultsInfo';

describe('ResultsInfo', () => {
  describe('Loading state', () => {
    it('should display loading text when loading is true', () => {
      render(<ResultsInfo loading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Zero results state', () => {
    it('should display no results message for search mode with zero results', () => {
      render(
        <ResultsInfo 
          totalCount={0} 
          searchText="aspirin" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('No results found for "aspirin"')).toBeInTheDocument();
    });

    it('should display no items message for browse mode with zero results', () => {
      render(
        <ResultsInfo 
          totalCount={0} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('should handle whitespace-only search text as browse mode', () => {
      render(
        <ResultsInfo 
          totalCount={0} 
          searchText="   " 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
  });

  describe('Browse mode (no search)', () => {
    it('should display "Found 1 item" for single item', () => {
      render(
        <ResultsInfo 
          totalCount={1} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 1 item')).toBeInTheDocument();
    });

    it('should display "Found X items" for multiple items', () => {
      render(
        <ResultsInfo 
          totalCount={25} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 25 items')).toBeInTheDocument();
    });

    it('should display "Found X items" with formatted numbers for large counts', () => {
      render(
        <ResultsInfo 
          totalCount={1500} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 1,500 items')).toBeInTheDocument();
    });
  });

  describe('Search mode', () => {
    it('should display "Found 1 result" for single search result', () => {
      render(
        <ResultsInfo 
          totalCount={1} 
          searchText="aspirin" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 1 result for "aspirin"')).toBeInTheDocument();
    });

    it('should display "Found X results" for multiple search results', () => {
      render(
        <ResultsInfo 
          totalCount={15} 
          searchText="paracetamol" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 15 results for "paracetamol"')).toBeInTheDocument();
    });

    it('should display "Found X results" with formatted numbers for large search results', () => {
      render(
        <ResultsInfo 
          totalCount={2500} 
          searchText="vitamin" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 2,500 results for "vitamin"')).toBeInTheDocument();
    });
  });

  describe('Pagination range display', () => {
    it('should not show page range when total count is less than or equal to page size', () => {
      render(
        <ResultsInfo 
          totalCount={8} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('should show page range when total count exceeds page size - first page', () => {
      render(
        <ResultsInfo 
          totalCount={50} 
          searchText="" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('(1-10 of 50)')).toBeInTheDocument();
    });

    it('should show page range when total count exceeds page size - middle page', () => {
      render(
        <ResultsInfo 
          totalCount={50} 
          searchText="" 
          currentPage={3} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('(21-30 of 50)')).toBeInTheDocument();
    });

    it('should show page range when total count exceeds page size - last page', () => {
      render(
        <ResultsInfo 
          totalCount={47} 
          searchText="" 
          currentPage={5} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('(41-47 of 47)')).toBeInTheDocument();
    });

    it('should format large numbers in page range with commas', () => {
      render(
        <ResultsInfo 
          totalCount={15000} 
          searchText="test" 
          currentPage={10} 
          pageSize={100} 
        />
      );
      expect(screen.getByText('(901-1,000 of 15,000)')).toBeInTheDocument();
    });
  });

  describe('Default props', () => {
    it('should handle missing props with defaults', () => {
      render(<ResultsInfo />);
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('should use default values when props are undefined', () => {
      render(
        <ResultsInfo 
          totalCount={undefined} 
          currentPage={undefined} 
          pageSize={undefined} 
          searchText={undefined} 
        />
      );
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large page numbers correctly', () => {
      render(
        <ResultsInfo 
          totalCount={10000} 
          searchText="" 
          currentPage={1000} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('(9,991-10,000 of 10,000)')).toBeInTheDocument();
    });

    it('should handle page size of 1', () => {
      render(
        <ResultsInfo 
          totalCount={5} 
          searchText="" 
          currentPage={3} 
          pageSize={1} 
        />
      );
      expect(screen.getByText('(3-3 of 5)')).toBeInTheDocument();
    });

    it('should handle search text with special characters', () => {
      render(
        <ResultsInfo 
          totalCount={2} 
          searchText="test & search" 
          currentPage={1} 
          pageSize={10} 
        />
      );
      expect(screen.getByText('Found 2 results for "test & search"')).toBeInTheDocument();
    });
  });
});