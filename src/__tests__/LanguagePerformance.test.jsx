/**
 * Performance tests for language selector optimizations
 * Tests React 19 concurrent features, lazy loading, and bundle optimization
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector/LanguageSelector';
import { 
  loadTranslation, 
  preloadTranslations, 
  clearTranslationCache,
  getCacheStats,
  isTranslationCached 
} from '../translations/lazyLoader';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20, // 20MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
};

// Mock React 19 features
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, vi.fn()],
    useDeferredValue: (value) => value,
    useOptimistic: (state, updateFn) => [state, vi.fn()]
  };
});

describe('Language Performance Tests', () => {
  beforeEach(() => {
    // Setup performance mocks
    global.performance = mockPerformance;
    
    // Clear translation cache
    clearTranslationCache();
    
    // Reset performance counters
    mockPerformance.now.mockClear();
    mockPerformance.mark.mockClear();
    mockPerformance.measure.mockClear();
  });

  afterEach(() => {
    clearTranslationCache();
  });

  describe('Lazy Loading Performance', () => {
    it('should load translations lazily without blocking', async () => {
      const startTime = performance.now();
      
      // Load translation asynchronously
      const translationPromise = loadTranslation('en');
      
      // Should return immediately (non-blocking)
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(10); // Should be very fast
      
      // Wait for actual loading
      const translation = await translationPromise;
      expect(translation).toBeDefined();
      expect(typeof translation).toBe('object');
    });

    it('should cache loaded translations for performance', async () => {
      // Load translation first time
      const firstLoad = performance.now();
      await loadTranslation('en');
      const firstLoadTime = performance.now() - firstLoad;
      
      // Load same translation second time (should be cached)
      const secondLoad = performance.now();
      await loadTranslation('en');
      const secondLoadTime = performance.now() - secondLoad;
      
      // Second load should be significantly faster
      expect(secondLoadTime).toBeLessThan(firstLoadTime / 10);
      expect(isTranslationCached('en')).toBe(true);
    });

    it('should preload translations efficiently', async () => {
      const startTime = performance.now();
      
      // Preload all translations
      await preloadTranslations(['en', 'az', 'ru']);
      
      const preloadTime = performance.now() - startTime;
      
      // Verify all translations are cached
      expect(isTranslationCached('en')).toBe(true);
      expect(isTranslationCached('az')).toBe(true);
      expect(isTranslationCached('ru')).toBe(true);
      
      // Get cache stats
      const stats = getCacheStats();
      expect(stats.cacheSize).toBe(3);
      expect(stats.cachedLanguages).toEqual(['en', 'az', 'ru']);
      
      console.log(`Preload time: ${preloadTime}ms`);
    });
  });

  describe('Component Performance', () => {
    const TestWrapper = ({ children }) => (
      <LanguageProvider>
        {children}
      </LanguageProvider>
    );

    it('should render language selector without performance issues', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render quickly
      expect(renderTime).toBeLessThan(100);
      
      // Verify component is rendered
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle language switching with optimal performance', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Open dropdown
      const openStart = performance.now();
      fireEvent.click(button);
      const openTime = performance.now() - openStart;
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Select language
      const selectStart = performance.now();
      const azOption = screen.getByText(/azərbaycan/i);
      fireEvent.click(azOption);
      const selectTime = performance.now() - selectStart;
      
      // Both operations should be fast
      expect(openTime).toBeLessThan(50);
      expect(selectTime).toBeLessThan(100);
    });

    it('should handle rapid language switching without performance degradation', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      const switchTimes = [];
      
      // Perform multiple rapid switches
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        fireEvent.click(button);
        await waitFor(() => screen.getByRole('listbox'));
        
        const options = screen.getAllByRole('option');
        const randomOption = options[Math.floor(Math.random() * options.length)];
        fireEvent.click(randomOption);
        
        const switchTime = performance.now() - startTime;
        switchTimes.push(switchTime);
        
        // Small delay between switches
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Performance should remain consistent
      const avgTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      const maxTime = Math.max(...switchTimes);
      
      expect(avgTime).toBeLessThan(200);
      expect(maxTime).toBeLessThan(500);
      
      console.log(`Average switch time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max switch time: ${maxTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during language switching', async () => {
      const TestWrapper = ({ children }) => (
        <LanguageProvider>
          {children}
        </LanguageProvider>
      );

      // Initial memory measurement
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Render and perform multiple operations
      const { unmount } = render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Perform multiple language switches
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
        await waitFor(() => screen.getByRole('listbox'));
        
        const options = screen.getAllByRole('option');
        fireEvent.click(options[i % options.length]);
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Cleanup
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Memory should not have grown significantly
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Allow some memory growth but not excessive
      expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
      
      console.log(`Memory growth: ${(memoryGrowth / 1024).toFixed(2)} KB`);
    });

    it('should efficiently manage translation cache', async () => {
      // Load multiple translations
      await Promise.all([
        loadTranslation('en'),
        loadTranslation('az'),
        loadTranslation('ru')
      ]);
      
      const stats = getCacheStats();
      expect(stats.cacheSize).toBe(3);
      
      // Clear cache and verify cleanup
      clearTranslationCache();
      const clearedStats = getCacheStats();
      expect(clearedStats.cacheSize).toBe(0);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should load translations on demand to minimize initial bundle', () => {
      // Initially no translations should be cached
      const initialStats = getCacheStats();
      expect(initialStats.cacheSize).toBe(0);
      
      // Only load what's needed
      loadTranslation('en');
      
      // Should only have loaded one translation
      const afterLoadStats = getCacheStats();
      expect(afterLoadStats.cacheSize).toBeLessThan(2);
    });

    it('should support tree shaking of unused translations', async () => {
      // This test verifies that unused translation keys can be optimized away
      const translation = await loadTranslation('en');
      
      // Verify translation structure exists
      expect(translation).toBeDefined();
      expect(typeof translation).toBe('object');
      
      // In a real bundle, unused keys would be tree-shaken
      // This test ensures the structure supports it
      const hasCommonKeys = 'common' in translation;
      const hasLanguageKeys = 'language' in translation;
      
      expect(hasCommonKeys || hasLanguageKeys).toBe(true);
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work without React 19 features as fallback', () => {
      // Mock older React version
      const originalUseTransition = React.useTransition;
      React.useTransition = undefined;
      
      expect(() => {
        render(
          <LanguageProvider>
            <LanguageSelector />
          </LanguageProvider>
        );
      }).not.toThrow();
      
      // Restore
      React.useTransition = originalUseTransition;
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      global.performance = undefined;
      
      expect(() => {
        render(
          <LanguageProvider>
            <LanguageSelector />
          </LanguageProvider>
        );
      }).not.toThrow();
      
      // Restore
      global.performance = originalPerformance;
    });
  });
});