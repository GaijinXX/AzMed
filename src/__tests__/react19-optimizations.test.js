/**
 * Tests for React 19 optimizations and compiler benefits
 * Focuses on build-time and runtime optimizations
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import performanceMonitor from '../utils/performance';
import { analyzeReact19Performance } from '../utils/performanceAnalysis';

// Mock Supabase
vi.mock('../services/supabase', () => ({
  searchDrugs: vi.fn().mockResolvedValue({
    data: [
      {
        number: 1,
        product_name: 'Test Drug',
        active_ingredients: 'Test Ingredient',
        dosage_amount: '10mg',
        dosage_form: 'Tablet',
        packaging_form: 'Blister',
        amount: '30 tablets',
        manufacturer: 'Test Manufacturer',
        wholesale_price: 1000,
        retail_price: 1500,
        date: '2024-01-01'
      }
    ],
    total_count: 1,
    page_number: 1,
    page_size: 10,
    total_pages: 1
  }),
  getErrorMessage: vi.fn().mockReturnValue('Test error message')
}));

// Mock error logger
vi.mock('../services/errorLogger', () => ({
  default: {
    logApiError: vi.fn().mockReturnValue('test-error-id'),
    logError: vi.fn()
  }
}));

describe('React 19 Optimizations', () => {
  it('should have performance monitoring utilities available', () => {
    expect(performanceMonitor).toBeDefined();
    expect(typeof performanceMonitor.startMeasure).toBe('function');
    expect(typeof performanceMonitor.endMeasure).toBe('function');
  });

  it('should have performance analysis utilities available', () => {
    expect(analyzeReact19Performance).toBeDefined();
    expect(typeof analyzeReact19Performance).toBe('function');
  });

  it('should render the app without errors', () => {
    render(<App />);
    expect(screen.getByText('Azerbaijan Drug Database')).toBeInTheDocument();
  });

  it('should have React 19 optimization hooks available', async () => {
    const { useOptimizedUpdates } = await import('../hooks/useReact19Optimizations');
    expect(useOptimizedUpdates).toBeDefined();
    expect(typeof useOptimizedUpdates).toBe('function');
  });

  it('should have performance utilities configured', () => {
    // Check if performance monitoring is properly configured
    expect(performanceMonitor.isEnabled).toBeDefined();
    
    // Check if performance analysis functions exist
    const analysis = analyzeReact19Performance();
    expect(analysis).toHaveProperty('react19Features');
    expect(analysis).toHaveProperty('performanceGains');
    expect(analysis).toHaveProperty('recommendations');
  });
});