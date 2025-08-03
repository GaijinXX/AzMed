import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SortIndicator from '../SortIndicator';
import { SORT_DIRECTIONS } from '../sortConfig';

describe('SortIndicator', () => {
  describe('Rendering', () => {
    it('renders neutral indicator when not sorted', () => {
      render(<SortIndicator isSorted={false} direction="asc" />);
      
      const indicator = screen.getByText('⇅');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('title', 'Click to sort');
    });

    it('renders ascending indicator when sorted ascending', () => {
      render(<SortIndicator isSorted={true} direction={SORT_DIRECTIONS.ASC} />);
      
      const indicator = screen.getByText('↑');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('title', 'Sorted ascending, click to sort descending');
    });

    it('renders descending indicator when sorted descending', () => {
      render(<SortIndicator isSorted={true} direction={SORT_DIRECTIONS.DESC} />);
      
      const indicator = screen.getByText('↓');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('title', 'Sorted descending, click to sort ascending');
    });
  });

  describe('Accessibility', () => {
    it('has aria-hidden attribute on indicator container', () => {
      const { container } = render(<SortIndicator isSorted={false} direction="asc" />);
      
      const indicatorContainer = container.querySelector('[aria-hidden="true"]');
      expect(indicatorContainer).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <SortIndicator isSorted={false} direction="asc" className="custom-class" />
      );
      
      const indicator = container.firstChild;
      expect(indicator).toHaveClass('custom-class');
    });
  });

  describe('Props handling', () => {
    it('handles undefined direction gracefully', () => {
      render(<SortIndicator isSorted={true} direction={undefined} />);
      
      // Should default to descending when direction is undefined
      const indicator = screen.getByText('↓');
      expect(indicator).toBeInTheDocument();
    });

    it('handles invalid direction gracefully', () => {
      render(<SortIndicator isSorted={true} direction="invalid" />);
      
      // Should default to descending when direction is invalid
      const indicator = screen.getByText('↓');
      expect(indicator).toBeInTheDocument();
    });
  });
});