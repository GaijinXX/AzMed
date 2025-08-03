import React, { useState } from 'react';
import styles from './ShareButton.module.css';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * ShareButton component for generating and copying complete URLs with all search state
 */
function ShareButton({ 
  searchText = '',
  currentPage = 1,
  pageSize = 10,
  sortColumn = null,
  sortDirection = 'asc',
  visibleColumns = {},
  currentLanguage = 'en',
  disabled = false 
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Generate complete URL with all parameters
  const generateFullURL = () => {
    const params = new URLSearchParams();
    
    // Add search term
    if (searchText && searchText.trim()) {
      params.set('q', searchText.trim());
    }
    
    // Add pagination
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    if (pageSize !== 10) {
      params.set('size', pageSize.toString());
    }
    
    // Add sorting
    if (sortColumn) {
      params.set('sort', sortColumn);
      if (sortDirection !== 'asc') {
        params.set('dir', sortDirection);
      }
    }
    
    // Add visible columns
    const visibleKeys = Object.entries(visibleColumns)
      .filter(([_, isVisible]) => isVisible)
      .map(([key]) => key)
      .sort();
    
    if (visibleKeys.length > 0) {
      params.set('cols', visibleKeys.join(','));
    }
    
    // Add language (only if not default English)
    if (currentLanguage && currentLanguage !== 'en') {
      params.set('lang', currentLanguage);
    }
    
    // Generate full URL
    const baseURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
  };

  // Handle share button click
  const handleShare = async () => {
    if (disabled) return;
    
    const fullURL = generateFullURL();
    
    try {
      // Try to use the Web Share API first (mobile-friendly)
      if (navigator.share) {
        await navigator.share({
          title: t('share.title', 'Drug Database Search'),
          text: t('share.description', 'Check out this drug database search'),
          url: fullURL
        });
        return;
      }
      
      // Fallback to clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullURL);
        setCopied(true);
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Final fallback - create a temporary input element
      const tempInput = document.createElement('input');
      tempInput.value = fullURL;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
    } catch (error) {
      console.error('Failed to share:', error);
      // Could show an error message to user here
    }
  };

  return (
    <button
      className={`${styles.shareButton} ${disabled ? styles.disabled : ''} ${copied ? styles.copied : ''}`}
      onClick={handleShare}
      disabled={disabled}
      title={copied ? t('share.copied') : t('share.tooltip')}
      aria-label={copied ? t('share.copied') : t('share.ariaLabel')}
    >
      <span className={styles.icon} aria-hidden="true">
        {copied ? '✓' : '🔗'}
      </span>
      <span className={styles.text}>
        {copied ? t('share.copied') : t('share.button')}
      </span>
    </button>
  );
}

export default ShareButton;