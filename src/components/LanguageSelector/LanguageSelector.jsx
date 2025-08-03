import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useOptimizedUpdates, useConcurrentRendering } from '../../hooks/useReact19Optimizations';
import styles from './LanguageSelector.module.css';

const LANGUAGES = {
  EN: 'en',
  AZ: 'az',
  RU: 'ru'
};

const LANGUAGE_FLAGS = {
  [LANGUAGES.EN]: '🇺🇸',
  [LANGUAGES.AZ]: '🇦🇿',
  [LANGUAGES.RU]: '🇷🇺'
};

/**
 * LanguageSelector component for switching between English, Azeri, and Russian languages
 * Optimized with React 19 concurrent features for smooth performance
 * Persists user preference in localStorage and updates all UI text
 */
function LanguageSelector() {
  const { currentLanguage, setLanguage, isPending } = useLanguageContext();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownPending, startDropdownTransition] = useTransition();
  const { batchUpdate, immediateUpdate } = useOptimizedUpdates();
  const { renderConcurrently } = useConcurrentRendering();

  // Memoized language labels for performance
  const languageLabels = useMemo(() => ({
    [LANGUAGES.EN]: t('language.english'),
    [LANGUAGES.AZ]: t('language.azeri'),
    [LANGUAGES.RU]: t('language.russian')
  }), [t]);

  // Get language labels from memoized cache
  const getLanguageLabel = useCallback((languageCode) => {
    return languageLabels[languageCode] || languageCode;
  }, [languageLabels]);

  // Optimized language change with concurrent features
  const handleLanguageChange = useCallback((languageCode) => {
    // Language change is urgent, use immediate update
    immediateUpdate(() => {
      setLanguage(languageCode);
    });
    
    // Dropdown close can be deferred
    startDropdownTransition(() => {
      setIsOpen(false);
    });
  }, [setLanguage, immediateUpdate]);

  // Optimized dropdown toggle with concurrent rendering
  const toggleDropdown = useCallback(() => {
    renderConcurrently(() => {
      setIsOpen(prev => !prev);
    }, 'urgent'); // Dropdown interactions should be immediate
  }, [renderConcurrently]);

  // Optimized keyboard handling with batched updates
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      immediateUpdate(() => setIsOpen(false));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target.getAttribute('role') === 'option') {
        const languageCode = e.target.getAttribute('data-language');
        if (languageCode) {
          handleLanguageChange(languageCode);
        }
      } else {
        toggleDropdown();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        immediateUpdate(() => setIsOpen(true));
        return;
      }

      // Batch DOM operations for better performance
      batchUpdate(() => {
        const options = e.currentTarget.querySelectorAll('[role="option"]');
        const currentIndex = Array.from(options).findIndex(option => 
          option === document.activeElement
        );
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }
        
        if (options[nextIndex]) {
          options[nextIndex].focus();
        }
      }, 'keyboard-navigation');
    }
  }, [isOpen, handleLanguageChange, toggleDropdown, immediateUpdate, batchUpdate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.languageSelector}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.languageSelector} onKeyDown={handleKeyDown}>
      <button
        className={styles.languageButton}
        onClick={toggleDropdown}
        aria-label={`${t('language.selector')}: ${getLanguageLabel(currentLanguage)}. Click to change language.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <span className={styles.languageIcon} aria-hidden="true">
          {LANGUAGE_FLAGS[currentLanguage]}
        </span>
        <span className={styles.languageLabel}>
          {getLanguageLabel(currentLanguage)}
        </span>
        <span className={styles.dropdownArrow} aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.languageDropdown} role="listbox" aria-label="Language options">
          {Object.values(LANGUAGES).map((languageCode) => (
            <button
              key={languageCode}
              className={`${styles.languageOption} ${
                currentLanguage === languageCode ? styles.languageOptionActive : ''
              }`}
              onClick={() => handleLanguageChange(languageCode)}
              onKeyDown={handleKeyDown}
              role="option"
              aria-selected={currentLanguage === languageCode}
              data-language={languageCode}
              type="button"
              tabIndex={isOpen ? 0 : -1}
            >
              <span className={styles.languageIcon} aria-hidden="true">
                {LANGUAGE_FLAGS[languageCode]}
              </span>
              <span className={styles.languageLabel}>
                {getLanguageLabel(languageCode)}
              </span>
              {currentLanguage === languageCode && (
                <span className={styles.checkmark} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;