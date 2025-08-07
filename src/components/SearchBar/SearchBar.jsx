import React, { useActionState, useDeferredValue, useTransition, useState, useRef, useEffect } from 'react';
import { useCompilerOptimizations } from '../../hooks/useReact19Optimizations';
import { useTranslation } from '../../hooks/useTranslation';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import RecentSearchesDropdown from '../RecentSearchesDropdown/RecentSearchesDropdown';
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
  
  // Dropdown visibility state
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // Refs for focus management
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  // Recent searches hook
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
    hasRecentSearches
  } = useRecentSearches();

  // Sync input value with initialValue prop when it changes (from URL state)
  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);
  
  // Use useActionState for form handling with server actions
  const [searchState, searchAction, isSearchPending] = useActionState(
    async (prevState, formData) => {
      const searchText = formData.get('search')?.toString() || '';
      
      // Add to recent searches if not empty
      if (searchText.trim()) {
        addRecentSearch(searchText.trim());
      }
      
      // Hide dropdown after search
      setIsDropdownVisible(false);
      
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

  // Handle input focus - show dropdown if there are recent searches
  const handleInputFocus = () => {
    if (hasRecentSearches) {
      setIsDropdownVisible(true);
    }
  };

  // Handle input blur - hide dropdown with delay to allow for dropdown interactions
  const handleInputBlur = (e) => {
    // Check if the blur is moving to an element within our container
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setIsDropdownVisible(false);
      }
    }, 150);
  };

  // Handle recent search selection
  const handleSelectRecentSearch = (searchTerm) => {
    setInputValue(searchTerm);
    setIsDropdownVisible(false);
    
    // Trigger search immediately
    if (onSearch) {
      onSearch(searchTerm);
    }
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle recent search removal
  const handleRemoveRecentSearch = (searchTerm) => {
    removeRecentSearch(searchTerm);
    // Keep dropdown open if there are still searches
    if (recentSearches.length <= 1) {
      setIsDropdownVisible(false);
    }
  };

  // Handle clear all recent searches
  const handleClearAllRecentSearches = () => {
    clearAllRecentSearches();
    setIsDropdownVisible(false);
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle dropdown close
  const handleDropdownClose = () => {
    setIsDropdownVisible(false);
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    if (isDropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownVisible]);

  const isLoading = isPending || isSearchPending;

  // Use translated placeholder if not provided
  const searchPlaceholder = placeholder || t('search.placeholder');

  return (
    <div ref={containerRef} className={styles.searchContainer} role="search">
      <form action={searchAction} className={styles.searchForm} role="search">
        <label htmlFor="drug-search-input" className="visually-hidden">
          {t('search.ariaLabel')}
        </label>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            id="drug-search-input"
            name="search"
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={searchPlaceholder}
            disabled={disabled || isLoading}
            className={`${styles.searchInput} ${isLoading ? styles.loading : ''}`}
            aria-label={t('search.ariaLabel')}
            aria-describedby={ariaDescribedBy}
            autoComplete="off"
            spellCheck="false"
            role="searchbox"
            aria-expanded={isDropdownVisible}
            aria-haspopup="listbox"
            aria-owns={isDropdownVisible ? "recent-searches-dropdown" : undefined}
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
      
      {/* Recent Searches Dropdown */}
      <div className={styles.dropdownContainer}>
        <RecentSearchesDropdown
          isVisible={isDropdownVisible}
          recentSearches={recentSearches}
          onSelectSearch={handleSelectRecentSearch}
          onRemoveSearch={handleRemoveRecentSearch}
          onClearAll={handleClearAllRecentSearches}
          onClose={handleDropdownClose}
        />
      </div>
      
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