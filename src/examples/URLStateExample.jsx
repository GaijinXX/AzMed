/**
 * Example component demonstrating URL state management
 * This shows how to use the useURLState hook in a real component
 */

import React from 'react';
import { useURLState } from '../hooks/useURLState';
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/urlStateUtils';

function URLStateExample() {
  // Initialize URL state with default values
  const {
    urlState,
    updateURL,
    replaceURL,
    resetURL,
    isURLLoading,
    isValidURL,
    isDefaultState
  } = useURLState({
    searchText: '',
    currentPage: 1,
    pageSize: 10,
    sortColumn: null,
    sortDirection: 'asc',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS
  });

  // Handle search input change
  const handleSearchChange = (event) => {
    updateURL({
      searchText: event.target.value,
      currentPage: 1 // Reset to first page on new search
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    updateURL({ currentPage: newPage });
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    updateURL({
      pageSize: parseInt(event.target.value, 10),
      currentPage: 1 // Reset to first page
    });
  };

  // Handle sort change
  const handleSortChange = (column) => {
    const newDirection = 
      urlState.sortColumn === column && urlState.sortDirection === 'asc' 
        ? 'desc' 
        : 'asc';
    
    updateURL({
      sortColumn: column,
      sortDirection: newDirection,
      currentPage: 1 // Reset to first page
    });
  };

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey) => {
    updateURL({
      visibleColumns: {
        ...urlState.visibleColumns,
        [columnKey]: !urlState.visibleColumns[columnKey]
      }
    });
  };

  // Handle reset to defaults
  const handleReset = () => {
    resetURL();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>URL State Management Example</h2>
      
      {/* Status indicators */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <p><strong>Status:</strong></p>
        <ul>
          <li>Loading: {isURLLoading ? 'Yes' : 'No'}</li>
          <li>Valid URL: {isValidURL ? 'Yes' : 'No'}</li>
          <li>Default State: {isDefaultState() ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Search: 
          <input
            type="text"
            value={urlState.searchText}
            onChange={handleSearchChange}
            placeholder="Enter search term..."
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      {/* Page size selector */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Page Size: 
          <select
            value={urlState.pageSize}
            onChange={handlePageSizeChange}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {/* Pagination */}
      <div style={{ marginBottom: '20px' }}>
        <label>Current Page: {urlState.currentPage}</label>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => handlePageChange(Math.max(1, urlState.currentPage - 1))}
            disabled={urlState.currentPage <= 1}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(urlState.currentPage + 1)}
            style={{ padding: '5px 10px' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Sort by:</strong></p>
        <div>
          {['product_name', 'retail_price', 'manufacturer'].map(column => (
            <button
              key={column}
              onClick={() => handleSortChange(column)}
              style={{
                marginRight: '10px',
                padding: '5px 10px',
                backgroundColor: urlState.sortColumn === column ? '#007bff' : '#f8f9fa',
                color: urlState.sortColumn === column ? 'white' : 'black',
                border: '1px solid #ccc'
              }}
            >
              {column.replace('_', ' ')}
              {urlState.sortColumn === column && (
                <span> {urlState.sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Column visibility controls */}
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Visible Columns:</strong></p>
        <div>
          {Object.entries(urlState.visibleColumns).map(([column, isVisible]) => (
            <label key={column} style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => handleColumnToggle(column)}
                style={{ marginRight: '10px' }}
              />
              {column.replace('_', ' ')}
            </label>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Current state display */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef' }}>
        <h3>Current URL State:</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(urlState, null, 2)}
        </pre>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
        <h4>Instructions:</h4>
        <ul>
          <li>Make changes to the controls above and watch the URL update</li>
          <li>Copy the URL and paste it in a new tab to see state restoration</li>
          <li>Use browser back/forward buttons to navigate through state changes</li>
          <li>Try bookmarking the page with different states</li>
        </ul>
      </div>
    </div>
  );
}

export default URLStateExample;