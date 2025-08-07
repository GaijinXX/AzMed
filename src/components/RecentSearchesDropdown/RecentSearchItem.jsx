import React, { forwardRef, useState, useCallback, memo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './RecentSearchItem.module.css';

const RecentSearchItem = memo(forwardRef(({
  searchTerm,
  isSelected,
  onSelect,
  onRemove,
  index
}, ref) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const handleClick = useCallback((event) => {
    event.preventDefault();
    onSelect();
  }, [onSelect]);

  const handleDeleteClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  }, [onRemove]);

  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect();
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        onRemove();
        break;
    }
  }, [onSelect, onRemove]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setShowDeleteButton(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowDeleteButton(false);
  }, []);

  // Touch handlers for mobile with debouncing
  const handleTouchStart = useCallback(() => {
    setShowDeleteButton(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Keep delete button visible for a short time on mobile
    setTimeout(() => {
      setShowDeleteButton(false);
    }, 2000);
  }, []);

  return (
    <li
      ref={ref}
      className={`${styles.item} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={t('recentSearches.item.label', 'Recent search: {{searchTerm}}', { searchTerm })}
    >
      <span className={styles.searchTerm} title={searchTerm}>
        {searchTerm}
      </span>
      
      <button
        className={`${styles.deleteButton} ${showDeleteButton ? styles.visible : ''}`}
        onClick={handleDeleteClick}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label={t('recentSearches.item.delete.label', 'Remove "{{searchTerm}}" from recent searches', { searchTerm })}
        type="button"
        tabIndex={-1}
      >
        <span className={styles.deleteIcon} aria-hidden="true">×</span>
      </button>
    </li>
  );
}));

RecentSearchItem.displayName = 'RecentSearchItem';

export default RecentSearchItem;