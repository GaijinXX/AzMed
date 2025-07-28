import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Pagination from '../Pagination';

// Mock React hooks that might not be available in current React version
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: actual.useActionState || vi.fn((reducer, initialState) => [initialState, vi.fn(), false]),
    useTransition: actual.useTransition || vi.fn(() => [false, vi.fn()]),
    useOptimistic: actual.useOptimistic || vi.fn((state, reducer) => [state, vi.fn()]),
  };
});

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalCount: 50,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders pagination controls when there are multiple pages', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByText('Items per page:')).toBeInTheDocument();
      expect(screen.getByText(/showing 1-10 of 50 items/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('does not render when there is only one page', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} totalCount={5} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('does not render when there are no results', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={0} totalCount={0} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders page size selector with correct options', () => {
      render(<Pagination {...defaultProps} />);
      
      const select = screen.getByRole('combobox', { name: /select page size/i });
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('10');
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('10');
      expect(options[1]).toHaveValue('25');
      expect(options[2]).toHaveValue('50');
      expect(options[3]).toHaveValue('100');
    });

    it('displays correct page info for different page sizes', () => {
      render(<Pagination {...defaultProps} currentPage={2} pageSize={25} totalCount={100} />);
      
      expect(screen.getByText(/showing 26-50 of 100 items/i)).toBeInTheDocument();
    });

    it('displays correct page info for last page', () => {
      render(<Pagination {...defaultProps} currentPage={5} pageSize={10} totalCount={47} />);
      
      expect(screen.getByText(/showing 41-47 of 47 items/i)).toBeInTheDocument();
    });
  });

  describe('Page Navigation', () => {
    it('renders page numbers correctly', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /current page, page 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to page 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to page 3/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to page 4/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to page 5/i })).toBeInTheDocument();
    });

    it('highlights current page', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: /current page, page 3/i });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
      expect(currentPageButton).toBeDisabled();
    });

    it('disables previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('calls onPageChange when page number is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const page2Button = screen.getByRole('button', { name: /go to page 2/i });
      fireEvent.click(page2Button);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous button is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when next button is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('does not call onPageChange for current page', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const currentPageButton = screen.getByRole('button', { name: /current page, page 1/i });
      fireEvent.click(currentPageButton);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Size Selection', () => {
    it('calls onPageSizeChange when page size is changed', () => {
      const onPageSizeChange = vi.fn();
      render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);
      
      const select = screen.getByRole('combobox', { name: /select page size/i });
      fireEvent.change(select, { target: { value: '25' } });
      
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
    });

    it('displays correct page size in selector', () => {
      render(<Pagination {...defaultProps} pageSize={50} />);
      
      const select = screen.getByRole('combobox', { name: /select page size/i });
      expect(select.value).toBe('50');
    });
  });

  describe('Disabled State', () => {
    it('disables all controls when disabled prop is true', () => {
      render(<Pagination {...defaultProps} disabled={true} />);
      
      const select = screen.getByRole('combobox', { name: /select page size/i });
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      const pageButtons = screen.getAllByRole('button', { name: /go to page/i });
      
      expect(select).toBeDisabled();
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      pageButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single page correctly', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} totalCount={5} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('handles zero results correctly', () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={0} totalCount={0} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('handles large page numbers correctly', () => {
      render(<Pagination {...defaultProps} currentPage={50} totalPages={100} pageSize={10} totalCount={1000} />);
      
      expect(screen.getByText(/showing 491-500 of 1000 items/i)).toBeInTheDocument();
    });

    it('handles page size larger than total count', () => {
      render(<Pagination {...defaultProps} pageSize={100} totalCount={25} />);
      
      expect(screen.getByText(/showing 1-25 of 25 items/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByRole('combobox', { name: /select page size/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /current page, page 1 of 5/i })).toBeInTheDocument();
    });

    it('has aria-current on current page', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: /current page, page 3 of 5/i });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('has aria-live region for page info', () => {
      render(<Pagination {...defaultProps} />);
      
      const pageInfo = screen.getByText(/showing 1-10 of 50 items/i);
      expect(pageInfo).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewports', () => {
      // This would typically require a more sophisticated test setup
      // for testing responsive behavior, but we can at least verify
      // the component renders without errors
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByText('Items per page:')).toBeInTheDocument();
      expect(screen.getByText(/showing 1-10 of 50 items/i)).toBeInTheDocument();
    });
  });
});