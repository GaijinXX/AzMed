import React, { useState, useEffect } from 'react';
import styles from './ThemeSelector.module.css';

const THEMES = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark'
};

const THEME_LABELS = {
  [THEMES.AUTO]: 'Auto',
  [THEMES.LIGHT]: 'Light',
  [THEMES.DARK]: 'Dark'
};

const THEME_ICONS = {
  [THEMES.AUTO]: '🌓',
  [THEMES.LIGHT]: '☀️',
  [THEMES.DARK]: '🌙'
};

/**
 * ThemeSelector component for switching between light, dark, and auto themes
 * Persists user preference in localStorage and applies theme to document
 */
function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Get saved theme from localStorage or default to auto
    try {
      return localStorage.getItem('theme-preference') || THEMES.AUTO;
    } catch {
      return THEMES.AUTO;
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = (theme) => {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
      
      if (theme === THEMES.LIGHT) {
        root.classList.add('theme-light');
        root.style.colorScheme = 'light';
      } else if (theme === THEMES.DARK) {
        root.classList.add('theme-dark');
        root.style.colorScheme = 'dark';
      } else {
        // Auto theme - use system preference
        root.classList.add('theme-auto');
        root.style.colorScheme = 'light dark';
      }
    };

    applyTheme(currentTheme);

    // Save to localStorage
    try {
      localStorage.setItem('theme-preference', currentTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [currentTheme]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.themeSelector}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.themeSelector} onKeyDown={handleKeyDown}>
      <button
        className={styles.themeButton}
        onClick={toggleDropdown}
        aria-label={`Current theme: ${THEME_LABELS[currentTheme]}. Click to change theme.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <span className={styles.themeIcon} aria-hidden="true">
          {THEME_ICONS[currentTheme]}
        </span>
        <span className={styles.themeLabel}>
          {THEME_LABELS[currentTheme]}
        </span>
        <span className={styles.dropdownArrow} aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.themeDropdown} role="listbox" aria-label="Theme options">
          {Object.values(THEMES).map((theme) => (
            <button
              key={theme}
              className={`${styles.themeOption} ${
                currentTheme === theme ? styles.themeOptionActive : ''
              }`}
              onClick={() => handleThemeChange(theme)}
              role="option"
              aria-selected={currentTheme === theme}
              type="button"
            >
              <span className={styles.themeIcon} aria-hidden="true">
                {THEME_ICONS[theme]}
              </span>
              <span className={styles.themeLabel}>
                {THEME_LABELS[theme]}
              </span>
              {currentTheme === theme && (
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

export default ThemeSelector;