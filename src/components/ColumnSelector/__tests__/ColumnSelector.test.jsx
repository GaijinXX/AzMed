import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ColumnSelector from '../ColumnSelector';

// Mock columns for testing
const mockColumns = [
  { key: 'number', label: 'Registration #', required: true },
  { key: 'product_name', label: 'Product Name', required: true },
  { key: 'active_ingredients', label: 'Active Ingredients', required: false },
  { key: 'dosage_amount', label: 'Dosage Amount', required: false },
  { key: 'manufacturer', label: 'Manufacturer', required: false }
];

const mockVisibleColumns = {
  number: true,
  product_name: true,
  active_ingredients: true,
  dosage_amount: false,
  manufacturer: true
};

describe('ColumnSelector', () => {
  let mockOnColumnToggle;
  let user;

  beforeEach(() => {
    mockOnColumnToggle = vi.fn();
    user = userEvent.setup();
  });

  it('renders the toggle button with correct column count', () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Columns');
    expect(button).toHaveTextContent('(4/5)'); // 4 visible out of 5 total
  });

  it('opens dropdown when toggle button is clicked', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    expect(screen.getByRole('menu', { name: /column visibility options/i })).toBeInTheDocument();
    expect(screen.getByText('Show/Hide Columns')).toBeInTheDocument();
  });

  it('displays all columns with correct checked states', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    // Check that all columns are displayed
    expect(screen.getByText('Registration #')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Active Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Dosage Amount')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();

    // Check checkbox states
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked(); // number
    expect(checkboxes[1]).toBeChecked(); // product_name
    expect(checkboxes[2]).toBeChecked(); // active_ingredients
    expect(checkboxes[3]).not.toBeChecked(); // dosage_amount
    expect(checkboxes[4]).toBeChecked(); // manufacturer
  });

  it('shows required indicators for required columns', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    // Required columns should have asterisk
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators).toHaveLength(2); // number and product_name are required
  });

  it('calls onColumnToggle when checkbox is clicked', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    const dosageAmountCheckbox = screen.getByLabelText(/toggle dosage amount column visibility/i);
    await user.click(dosageAmountCheckbox);

    expect(mockOnColumnToggle).toHaveBeenCalledWith('dosage_amount');
  });

  it('shows all columns when "Show All" button is clicked', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    const showAllButton = screen.getByRole('button', { name: /show all/i });
    await user.click(showAllButton);

    // Should call onColumnToggle for hidden columns
    expect(mockOnColumnToggle).toHaveBeenCalledWith('dosage_amount');
  });

  it('hides optional columns when "Hide Optional" button is clicked', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    const hideOptionalButton = screen.getByRole('button', { name: /hide optional/i });
    await user.click(hideOptionalButton);

    // Should call onColumnToggle for visible optional columns
    expect(mockOnColumnToggle).toHaveBeenCalledWith('active_ingredients');
    expect(mockOnColumnToggle).toHaveBeenCalledWith('manufacturer');
    expect(mockOnColumnToggle).not.toHaveBeenCalledWith('number'); // required
    expect(mockOnColumnToggle).not.toHaveBeenCalledWith('product_name'); // required
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <ColumnSelector
          columns={mockColumns}
          visibleColumns={mockVisibleColumns}
          onColumnToggle={mockOnColumnToggle}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    const outsideElement = screen.getByTestId('outside');
    await user.click(outsideElement);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when Escape key is pressed', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
        disabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled');
  });

  it('supports keyboard navigation', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Open with Enter key
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Close with Escape key
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(button).toHaveFocus(); // Focus should return to button
  });

  it('updates screen reader announcement when column count changes', () => {
    const { rerender } = render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    expect(screen.getByText('4 of 5 columns visible')).toBeInTheDocument();

    // Update visible columns
    const newVisibleColumns = { ...mockVisibleColumns, dosage_amount: true };
    rerender(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={newVisibleColumns}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    expect(screen.getByText('5 of 5 columns visible')).toBeInTheDocument();
  });

  it('handles empty columns array gracefully', () => {
    render(
      <ColumnSelector
        columns={[]}
        visibleColumns={{}}
        onColumnToggle={mockOnColumnToggle}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    expect(button).toHaveTextContent('(0/0)');
  });

  it('handles missing onColumnToggle prop gracefully', async () => {
    render(
      <ColumnSelector
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
      />
    );

    const button = screen.getByRole('button', { name: /column visibility settings/i });
    await user.click(button);

    const checkbox = screen.getByLabelText(/toggle dosage amount column visibility/i);
    
    // Should not throw error when clicking checkbox without onColumnToggle
    expect(() => user.click(checkbox)).not.toThrow();
  });
});