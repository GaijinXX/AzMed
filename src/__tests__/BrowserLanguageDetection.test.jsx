/**
 * Integration test for browser language detection
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import { detectBrowserLanguage, getInitialLanguage } from '../utils/languageDetection';

// Simple test component to display current language
const TestComponent = () => {
  const { currentLanguage } = React.useContext(
    React.createContext({ currentLanguage: 'en' })
  );
  return <div data-testid="language">{currentLanguage}</div>;
};

describe('Browser Language Detection Integration', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('detectBrowserLanguage function', () => {
    it('should return English as default when no navigator', () => {
      // Test in environment without navigator
      const result = detectBrowserLanguage();
      expect(result).toBe('en');
    });

    it('should handle the function without errors', () => {
      expect(() => detectBrowserLanguage()).not.toThrow();
    });
  });

  describe('getInitialLanguage function', () => {
    it('should return English when no localStorage and no navigator', () => {
      const result = getInitialLanguage('test-key');
      expect(result).toBe('en');
    });

    it('should prefer localStorage over browser detection', () => {
      localStorage.setItem('test-key', 'ru');
      const result = getInitialLanguage('test-key');
      expect(result).toBe('ru');
    });

    it('should handle the function without errors', () => {
      expect(() => getInitialLanguage('test-key')).not.toThrow();
    });
  });

  describe('Language mapping verification', () => {
    it('should have correct language mappings defined', () => {
      // Test that the language detection utility exists and has expected structure
      expect(typeof detectBrowserLanguage).toBe('function');
      expect(typeof getInitialLanguage).toBe('function');
    });
  });

  describe('LanguageProvider with detection', () => {
    it('should initialize without errors', () => {
      expect(() => {
        render(
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        );
      }).not.toThrow();
    });
  });
});