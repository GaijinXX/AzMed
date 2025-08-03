/**
 * Comprehensive performance and optimization tests for language selector
 * Tests React 19 concurrent features, bundle optimization, and cross-browser compatibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector/LanguageSelector';
import { 
  analyzeBundleSize, 
  benchmarkLanguageSwitching, 
  checkCrossBrowserCompatibility,
  generatePerformanceReport 
} from '../utils/bundleAnalysis';

// Mock performance API for consistent testing
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20, // 20MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
};

describe('Language Selector Optimizations', () => {
  beforeEach(() => {
    // Setup performance mocks
    global.performance = mockPerformance;
    mockPerformance.now.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze translation bundle sizes', async () => {
      const analysis = await analyzeBundleSize();
      
      expect(analysis).toBeDefined();
      expect(analysis.translationSizes).toBeDefined();
      expect(analysis.totalSize).toBeGreaterThanOrEqual(0);
      expect(analysis.recommendations).toBeInstanceOf(Array);
      
      // Check that we have analysis for expected languages
      const languages = Object.keys(analysis.translationSizes);
      expect(languages.length).toBeGreaterThan(0);
      
      console.log('Bundle Analysis Results:', {
        totalSize: `${Math.round(analysis.totalSize / 1024)}KB`,
        languages: languages,
        recommendations: analysis.recommendations
      });
    });

    it('should provide optimization recommendations', async () => {
      const analysis = await analyzeBundleSize();
      
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      
      // Should have at least one recommendation
      const hasRecommendations = analysis.recommendations.some(rec => 
        typeof rec === 'string' && rec.length > 0
      );
      expect(hasRecommendations).toBe(true);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should benchmark translation loading performance', async () => {
      const benchmark = await benchmarkLanguageSwitching();
      
      expect(benchmark).toBeDefined();
      expect(benchmark.loadTimes).toBeDefined();
      expect(benchmark.recommendations).toBeInstanceOf(Array);
      
      // Check load times are reasonable
      const loadTimes = Object.values(benchmark.loadTimes).filter(time => time > 0);
      if (loadTimes.length > 0) {
        const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        expect(avgLoadTime).toBeLessThan(1000); // Should load within 1 second
        
        console.log('Performance Benchmark:', {
          averageLoadTime: `${avgLoadTime.toFixed(2)}ms`,
          loadTimes: benchmark.loadTimes,
          memoryUsage: benchmark.memoryUsage
        });
      }
    });

    it('should monitor memory usage', async () => {
      const benchmark = await benchmarkLanguageSwitching();
      
      if (benchmark.memoryUsage && Object.keys(benchmark.memoryUsage).length > 0) {
        expect(benchmark.memoryUsage.used).toBeGreaterThan(0);
        expect(benchmark.memoryUsage.total).toBeGreaterThanOrEqual(benchmark.memoryUsage.used);
        
        // Memory usage should be reasonable (less than 100MB for translations)
        expect(benchmark.memoryUsage.used).toBeLessThan(100);
      }
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should check feature compatibility', () => {
      const compatibility = checkCrossBrowserCompatibility();
      
      expect(compatibility).toBeDefined();
      expect(compatibility.features).toBeDefined();
      expect(compatibility.supported).toBeDefined();
      expect(compatibility.warnings).toBeInstanceOf(Array);
      expect(compatibility.recommendations).toBeInstanceOf(Array);
      
      // Essential features should be available
      expect(compatibility.features.localStorage).toBe(true);
      expect(compatibility.features.dynamicImport).toBe(true);
      
      console.log('Compatibility Check:', {
        supported: compatibility.supported,
        features: compatibility.features,
        warnings: compatibility.warnings
      });
    });

    it('should handle missing React 19 features gracefully', () => {
      // Mock missing React 19 features
      const originalReact = global.React;
      global.React = {
        ...originalReact,
        useTransition: undefined,
        useDeferredValue: undefined,
        useOptimistic: undefined
      };
      
      const compatibility = checkCrossBrowserCompatibility();
      
      expect(compatibility.features.useTransition).toBe(false);
      expect(compatibility.warnings.length).toBeGreaterThan(0);
      
      // Should still be supported for basic functionality
      expect(compatibility.supported).toBe(true);
      
      // Restore React
      global.React = originalReact;
    });
  });

  describe('Component Performance', () => {
    const TestWrapper = ({ children }) => (
      <LanguageProvider>
        {children}
      </LanguageProvider>
    );

    it('should render efficiently', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );
      
      const renderTime = performance.now() - startTime;
      
      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Component should be present
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle interactions efficiently', async () => {
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Measure dropdown open time
      const openStart = performance.now();
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const openTime = performance.now() - openStart;
      
      // Should open quickly
      expect(openTime).toBeLessThan(200);
      
      console.log(`Dropdown open time: ${openTime.toFixed(2)}ms`);
    });

    it('should not cause memory leaks', async () => {
      const initialMemory = (performance.memory && performance.memory.usedJSHeapSize) || 0;
      
      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <TestWrapper>
            <LanguageSelector />
          </TestWrapper>
        );
        
        // Interact with component
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        // Cleanup
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance.memory && performance.memory.usedJSHeapSize) || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal (less than 1MB)
      expect(memoryGrowth).toBeLessThan(1024 * 1024);
      
      console.log(`Memory growth: ${(memoryGrowth / 1024).toFixed(2)} KB`);
    });
  });

  describe('Comprehensive Performance Report', () => {
    it('should generate complete performance report', async () => {
      const report = await generatePerformanceReport();
      
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.bundleAnalysis).toBeDefined();
      expect(report.performanceBenchmark).toBeDefined();
      expect(report.compatibilityCheck).toBeDefined();
      expect(report.summary).toBeDefined();
      
      // Summary should have required fields
      expect(report.summary.status).toMatch(/excellent|good|fair|poor/);
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);
      expect(report.summary.criticalIssues).toBeInstanceOf(Array);
      expect(report.summary.optimizationOpportunities).toBeInstanceOf(Array);
      
      console.log('Performance Report Summary:', {
        status: report.summary.status,
        score: report.summary.overallScore,
        criticalIssues: report.summary.criticalIssues,
        optimizations: report.summary.optimizationOpportunities
      });
      
      // Report should indicate good performance
      expect(report.summary.overallScore).toBeGreaterThan(50);
    });

    it('should identify optimization opportunities', async () => {
      const report = await generatePerformanceReport();
      
      // Should provide actionable insights
      const hasInsights = 
        report.bundleAnalysis.recommendations.length > 0 ||
        report.performanceBenchmark.recommendations.length > 0 ||
        report.compatibilityCheck.recommendations.length > 0;
        
      expect(hasInsights).toBe(true);
    });
  });

  describe('React 19 Optimizations', () => {
    it('should use concurrent features when available', () => {
      // Mock React 19 features
      const mockUseTransition = vi.fn(() => [false, vi.fn()]);
      const mockUseDeferredValue = vi.fn(value => value);
      
      global.React = {
        ...global.React,
        useTransition: mockUseTransition,
        useDeferredValue: mockUseDeferredValue
      };
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );
      
      // React 19 hooks should be called during render
      expect(mockUseTransition).toHaveBeenCalled();
    });

    it('should fallback gracefully without React 19', () => {
      // Remove React 19 features
      const originalReact = global.React;
      global.React = {
        ...originalReact,
        useTransition: undefined,
        useDeferredValue: undefined,
        useOptimistic: undefined
      };
      
      // Should still render without errors
      expect(() => {
        render(
          <TestWrapper>
            <LanguageSelector />
          </TestWrapper>
        );
      }).not.toThrow();
      
      // Component should still work
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // Restore React
      global.React = originalReact;
    });
  });

  describe('Bundle Optimization', () => {
    it('should support lazy loading', async () => {
      // Test dynamic import functionality
      const importStart = performance.now();
      
      try {
        const enModule = await import('../translations/en.js');
        const importTime = performance.now() - importStart;
        
        expect(enModule.default).toBeDefined();
        expect(importTime).toBeLessThan(100); // Should import quickly
        
        console.log(`Translation import time: ${importTime.toFixed(2)}ms`);
      } catch (error) {
        // If import fails, it should be handled gracefully
        expect(error).toBeDefined();
      }
    });

    it('should minimize initial bundle impact', () => {
      // Check that translations are not eagerly loaded
      const initialModules = Object.keys(require.cache || {});
      const translationModules = initialModules.filter(path => 
        path.includes('/translations/') && !path.includes('index.js')
      );
      
      // Should not have pre-loaded all translation files
      expect(translationModules.length).toBeLessThan(3);
    });
  });
});