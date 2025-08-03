import React, { useState, useRef, useEffect } from 'react';
import styles from './ColumnSelector.module.css';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * ColumnSelector component for controlling table column visibility
 * Provides a dropdown interface to show/hide table columns
 */
function ColumnSelector({ 
  columns = [], 
  visibleColumns = {}, 
  onColumnToggle,
  onShowAll,
  onHideOptional,
  disabled = false 
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Handle escape key to close dropdown
  function handleEscapeKey(event) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }

  // Toggle dropdown visibility
  function toggleDropdown() {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }

  // Handle column toggle
  function handleColumnToggle(columnKey) {
    if (onColumnToggle) {
      onColumnToggle(columnKey);
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    }
  }

  // Count visible columns
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = columns.length;

  return (
    <div className={styles.columnSelector} ref={dropdownRef}>
      <button
        ref={buttonRef}
        className={`${styles.toggleButton} ${disabled ? styles.disabled : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${t('columns.settings')}. ${visibleCount} ${t('columns.of')} ${totalCount} ${t('columns.visible')}`}
        title={t('columns.showHideColumns')}
      >
        <span className={styles.buttonIcon} aria-hidden="true">⚙️</span>
        <span className={styles.buttonText}>{t('columns.columns')}</span>
        <span className={styles.columnCount}>({visibleCount}/{totalCount})</span>
        <span className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <div 
          className={styles.dropdown}
          role="menu"
          aria-label={t('columns.visibilityOptions')}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.headerText}>{t('columns.showHide')}</span>
          </div>
          
          <div className={styles.columnList}>
            {columns.map((column) => (
              <label
                key={column.key}
                className={styles.columnItem}
                role="menuitemcheckbox"
                aria-checked={visibleColumns[column.key]}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={visibleColumns[column.key] || false}
                  onChange={() => handleColumnToggle(column.key)}
                  aria-label={`${t('columns.toggle')} ${column.label} ${t('columns.columnVisibility')}`}
                />
                <span className={styles.checkboxCustom} aria-hidden="true">
                  {visibleColumns[column.key] ? '✓' : ''}
                </span>
                <span className={styles.columnLabel}>
                  {column.label}
                  {column.required && (
                    <span className={styles.requiredIndicator} title={t('columns.required')}>
                      *
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <div className={styles.dropdownFooter}>
            <button
              className={styles.actionButton}
              onClick={() => {
                if (onShowAll) {
                  onShowAll();
                } else {
                  // Fallback to individual toggles if onShowAll not provided
                  columns.forEach(column => {
                    if (!visibleColumns[column.key]) {
                      handleColumnToggle(column.key);
                    }
                  });
                }
              }}
              type="button"
            >
              {t('columns.showAll')}
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                if (onHideOptional) {
                  onHideOptional();
                } else {
                  // Fallback to individual toggles if onHideOptional not provided
                  columns.forEach(column => {
                    if (!column.required && visibleColumns[column.key]) {
                      handleColumnToggle(column.key);
                    }
                  });
                }
              }}
              type="button"
            >
              {t('columns.hideOptional')}
            </button>
          </div>
        </div>
      )}

      {/* Screen reader announcement for column changes */}
      <div 
        className="visually-hidden" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {visibleCount} {t('columns.of')} {totalCount} {t('columns.visible')}
      </div>
    </div>
  );
}

export default ColumnSelector;