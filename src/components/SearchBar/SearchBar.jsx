import { useActionState, useDeferredValue, useTransition, useOptimistic, useState } from 'react';
import { useOptimizedForm, useCompilerOptimizations } from '../../hooks/useReact19Optimizations';
import styles from './SearchBar.module.css';

/**
 * SearchBar component with React 19 features
 * Provides search functionality with form actions, debounced input, and optimistic updates
 * React Compiler will automatically optimize this component
 */
function SearchBar({ 
  onSearch, 
  initialValue = '', 
  placeholder = 'Search for drugs by name or active ingredient...',
  disabled = false,
  'aria-describedby': ariaDescribedBy
}) {
  // Track component render performance
  const { trackRender } = useCompilerOptimizations();
  trackRender('SearchBar');

  const [isPending, startTransition] = useTransition();
  
  // Local state for immediate input updates
  const [inputValue, setInputValue] = useState(initialValue);
  
  // Use useActionState for form handling with server actions
  const [searchState, searchAction, isSearchPending] = useActionState(
    async (prevState, formData) => {
      const searchText = formData.get('search')?.toString() || '';
      
      // Call the parent's search handler
      if (onSearch) {
        startTransition(() => {
          onSearch(searchText);
        });
      }
      
      return {
        ...prevState,
        searchText,
        lastSearched: Date.now()
      };
    },
    { 
      searchText: initialValue, 
      lastSearched: null 
    }
  );

  // Use useDeferredValue for non-urgent search updates
  const deferredInputValue = useDeferredValue(inputValue);

  // Optimistic updates for immediate UI feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    { searchText: inputValue, lastSearched: searchState.lastSearched },
    (state, newSearchText) => ({
      ...state,
      searchText: newSearchText,
      isOptimistic: true
    })
  );

  // Handle clear button with useTransition
  const handleClear = () => {
    setInputValue('');
    startTransition(() => {
      addOptimisticUpdate('');
      if (onSearch) {
        onSearch('');
      }
    });
  };

  // Handle input change for immediate updates
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    // Use optimistic update for immediate feedback
    addOptimisticUpdate(value);
  };

  const isLoading = isPending || isSearchPending;
  const showClearButton = inputValue.length > 0;

  return (
    <div className={styles.searchContainer} role="search">
      <form action={searchAction} className={styles.searchForm} role="search">
        <label htmlFor="drug-search-input" className="visually-hidden">
          Search for drugs by name or active ingredient
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="drug-search-input"
            name="search"
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`${styles.searchInput} ${isLoading ? styles.loading : ''}`}
            aria-label="Search drugs by name or active ingredient"
            aria-describedby={ariaDescribedBy}
            autoComplete="off"
            spellCheck="false"
            role="searchbox"
            aria-expanded="false"
          />
          
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className={styles.clearButton}
              aria-label={`Clear search term "${inputValue}"`}
              title="Clear search"
            >
              <span aria-hidden="true">✕</span>
              <span className="visually-hidden">Clear</span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={styles.searchButton}
            aria-label={isLoading ? 'Searching...' : 'Search for drugs'}
            title={isLoading ? 'Searching...' : 'Search'}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true">⟳</span>
                <span className="visually-hidden">Searching...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🔍</span>
                <span className="visually-hidden">Search</span>
              </>
            )}
          </button>
        </div>
      </form>
      
      {isLoading && (
        <div 
          className={styles.loadingIndicator} 
          role="status" 
          aria-live="polite"
          aria-label="Search in progress"
        >
          <span className={styles.spinner} aria-hidden="true">⟳</span>
          Searching for drugs...
        </div>
      )}
    </div>
  );
}

export default SearchBar;