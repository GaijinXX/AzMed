import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import RecentSearchItem from './RecentSearchItem';
import styles from './RecentSearchesDropdown.module.css';

const RecentSearchesDropdown = memo(({
  isVisible,
  recentSearches,
  onSelectSearch,
  onRemoveSearch,
  onClearAll,
  onClose
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  // All useCallback hooks must be called before any early returns
  const handleItemSelect = useCallback((searchTerm) => {
    onSelectSearch(searchTerm);
  }, [onSelectSearch]);

  const handleItemRemove = useCallback((searchTerm) => {
    onRemoveSearch(searchTerm);
    // Adjust selected index if needed
    if (selectedIndex >= recentSearches.length - 1) {
      setSelectedIndex(Math.max(-1, recentSearches.length - 2));
    }
  }, [onRemoveSearch, selectedIndex, recentSearches.length]);

  // Reset selected index when dropdown becomes visible or searches change
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(-1);
    }
  }, [isVisible, recentSearches]);

  // Handle keyboard navigation with debouncing for performance
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < recentSearches.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < recentSearches.length) {
            event.preventDefault();
            onSelectSearch(recentSearches[selectedIndex]);
          }
          // Don't prevent default if no item is selected - allow form submission
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, recentSearches, onSelectSearch, onClose]);

  // Focus management for selected item
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

  // Early return after all hooks to maintain hook order consistency
  if (!isVisible || recentSearches.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      role="listbox"
      aria-label={t('recentSearches.dropdown.label', 'Recent searches')}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {t('recentSearches.title', 'Recent Searches')}
        </span>
        <button
          className={styles.clearAllButton}
          onClick={onClearAll}
          aria-label={t('recentSearches.clearAll.label', 'Clear all recent searches')}
          type="button"
        >
          {t('recentSearches.clearAll.text', 'Clear All')}
        </button>
      </div>
      
      <ul className={styles.list} role="none">
        {recentSearches.map((searchTerm, index) => (
          <RecentSearchItem
            key={`${searchTerm}-${index}`}
            ref={el => itemRefs.current[index] = el}
            searchTerm={searchTerm}
            isSelected={selectedIndex === index}
            onSelect={() => handleItemSelect(searchTerm)}
            onRemove={() => handleItemRemove(searchTerm)}
            index={index}
          />
        ))}
      </ul>
    </div>
  );
});

RecentSearchesDropdown.displayName = 'RecentSearchesDropdown';

export default RecentSearchesDropdown;