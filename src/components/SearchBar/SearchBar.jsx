import React, { useActionState, useDeferredValue, useTransition, useState } from 'react';
import { useCompilerOptimizations } from '../../hooks/useReact19Optimizations';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './SearchBar.module.css';

/**
 * SearchBar component with React 19 features
 * Provides search functionality with form actions, debounced input, and optimistic updates
 * React Compiler will automatically optimize this component
 */
function SearchBar({ 
  onSearch, 
  initialValue = '', 
  placeholder,
  disabled = false,
  'aria-describedby': ariaDescribedBy
}) {
  // Track component render performance
  const { trackRender } = useCompilerOptimizations();
  trackRender('SearchBar');

  // Get translations
  const { t } = useTranslation();

  const [isPending, startTransition] = useTransition();
  
  // Local state for immediate input updates
  const [inputValue, setInputValue] = useState(initialValue);

  // Sync input value with initialValue prop when it changes (from URL state)
  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);
  
  // Use useActionState for form handling with server actions
  const [searchState, searchAction, isSearchPending] = useActionState(
    async (prevState, formData) => {
      const searchText = formData.get('search')?.toString() || '';
      
      // Call the parent's search handler immediately (not in transition)
      // The parent handler will manage its own transitions and URL updates
      if (onSearch) {
        onSearch(searchText);
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

  // Note: Optimistic updates removed for input changes as they're not needed
  // Input value updates are already immediate via setInputValue



  // Handle input change for immediate updates
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const isLoading = isPending || isSearchPending;

  // Use translated placeholder if not provided
  const searchPlaceholder = placeholder || t('search.placeholder');

  return (
    <div className={styles.searchContainer} role="search">
      <form action={searchAction} className={styles.searchForm} role="search">
        <label htmlFor="drug-search-input" className="visually-hidden">
          {t('search.ariaLabel')}
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="drug-search-input"
            name="search"
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={searchPlaceholder}
            disabled={disabled || isLoading}
            className={`${styles.searchInput} ${isLoading ? styles.loading : ''}`}
            aria-label={t('search.ariaLabel')}
            aria-describedby={ariaDescribedBy}
            autoComplete="off"
            spellCheck="false"
            role="searchbox"
            aria-expanded="false"
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className={styles.searchButton}
            aria-label={isLoading ? t('common.loading') : t('common.search')}
            title={isLoading ? t('common.loading') : t('common.search')}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true">⟳</span>
                <span className="visually-hidden">{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🔍</span>
                <span className="visually-hidden">{t('common.search')}</span>
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
          aria-label={t('common.loading')}
        >
          <span className={styles.spinner} aria-hidden="true">⟳</span>
          {t('common.loading')}
        </div>
      )}
    </div>
  );
}

export default SearchBar;