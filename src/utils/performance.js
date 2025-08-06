/**
 * Performance monitoring utilities for React 19 optimizations
 * Tracks rendering performance, bundle size, and user interactions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isBrowser = this.checkBrowserEnvironment();
    this.isEnabled = this.shouldEnableMonitoring();
  }

  /**
   * Check if we're running in a browser environment
   */
  checkBrowserEnvironment() {
    // Check for test environments first
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return false;
    }
    
    // Check for Vitest environment
    if (typeof globalThis !== 'undefined' && globalThis.__vitest__) {
      return false;
    }
    
    // Check for Jest environment
    if (typeof global !== 'undefined' && global.jest) {
      return false;
    }
    
    // Check for JSDOM environment (common in tests)
    if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && 
        window.navigator.userAgent.includes('jsdom')) {
      return false;
    }
    
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' && 
           typeof performance !== 'undefined' &&
           typeof window.location !== 'undefined';
  }

  /**
   * Determine if performance monitoring should be enabled
   */
  shouldEnableMonitoring() {
    // Always disabled in test environments
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return false;
    }
    
    // Check for Vitest environment
    if (typeof globalThis !== 'undefined' && globalThis.__vitest__) {
      return false;
    }
    
    // Check for Jest environment
    if (typeof global !== 'undefined' && global.jest) {
      return false;
    }
    
    // Enable in development or when debug flag is present
    return import.meta.env.DEV || 
           (this.isBrowser && window.location.search.includes('debug=performance'));
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name, metadata = {}) {
    if (!this.isEnabled || !this.isBrowser) return;
    
    try {
      const startTime = performance.now();
      this.metrics.set(name, {
        startTime,
        metadata,
        type: 'measure'
      });
      
      // Use Performance API for precise measurements
      if (typeof performance.mark === 'function') {
        performance.mark(`${name}-start`);
      }
    } catch (error) {
      // Silently fail in environments where performance API is not available
      console.warn('Performance monitoring failed to start measure:', error.message);
    }
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name, additionalMetadata = {}) {
    if (!this.isEnabled || !this.isBrowser) return;
    
    try {
      const endTime = performance.now();
      const metric = this.metrics.get(name);
      
      if (!metric) {
        console.warn(`Performance measure "${name}" was not started`);
        return;
      }
      
      const duration = endTime - metric.startTime;
      
      // Use Performance API
      if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      
      const result = {
        name,
        duration,
        startTime: metric.startTime,
        endTime,
        metadata: { ...metric.metadata, ...additionalMetadata }
      };
      
      this.logMetric(result);
      this.metrics.delete(name);
      
      return result;
    } catch (error) {
      // Silently fail in environments where performance API is not available
      console.warn('Performance monitoring failed to end measure:', error.message);
      this.metrics.delete(name);
    }
  }

  /**
   * Measure React component render time
   */
  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    this.startMeasure(`render-${componentName}`, { type: 'component-render' });
    const result = renderFn();
    this.endMeasure(`render-${componentName}`);
    
    return result;
  }

  /**
   * Measure API call performance
   */
  async measureApiCall(name, apiCall, metadata = {}) {
    if (!this.isEnabled) return await apiCall();
    
    this.startMeasure(`api-${name}`, { type: 'api-call', ...metadata });
    
    try {
      const result = await apiCall();
      this.endMeasure(`api-${name}`, { success: true, resultSize: JSON.stringify(result).length });
      return result;
    } catch (error) {
      this.endMeasure(`api-${name}`, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Monitor React 19 concurrent features
   */
  measureConcurrentFeature(featureName, operation) {
    if (!this.isEnabled) return operation();
    
    this.startMeasure(`concurrent-${featureName}`, { 
      type: 'concurrent-feature',
      feature: featureName 
    });
    
    const result = operation();
    
    // For async operations, handle promises
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        this.endMeasure(`concurrent-${featureName}`);
      });
    }
    
    this.endMeasure(`concurrent-${featureName}`);
    return result;
  }

  /**
   * Monitor bundle size and loading performance
   */
  measureBundlePerformance() {
    if (!this.isEnabled || !this.isBrowser) return;
    
    try {
      // Measure initial bundle load time (only in browser environment)
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('load', () => {
          try {
            if (typeof performance.getEntriesByType === 'function') {
              const navigation = performance.getEntriesByType('navigation')[0];
              if (navigation) {
                this.logMetric({
                  name: 'bundle-load',
                  duration: navigation.loadEventEnd - navigation.fetchStart,
                  metadata: {
                    type: 'bundle-performance',
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Failed to measure bundle performance:', error.message);
          }
        });
      }

      // Monitor resource loading (only in browser environment)
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          const observer = new PerformanceObserver((list) => {
            try {
              for (const entry of list.getEntries()) {
                if (entry.name.includes('.js') || entry.name.includes('.css')) {
                  this.logMetric({
                    name: 'resource-load',
                    duration: entry.duration,
                    metadata: {
                      type: 'resource-loading',
                      resource: entry.name,
                      size: entry.transferSize,
                      cached: entry.transferSize === 0
                    }
                  });
                }
              }
            } catch (error) {
              console.warn('Failed to process performance entries:', error.message);
            }
          });
        
          observer.observe({ entryTypes: ['resource'] });
          this.observers.set('resource', observer);
        } catch (error) {
          console.warn('Failed to create PerformanceObserver:', error.message);
        }
      }
    } catch (error) {
      console.warn('Failed to initialize bundle performance monitoring:', error.message);
    }
  }

  /**
   * Get First Paint timing
   */
  getFirstPaint() {
    if (!this.isBrowser || typeof performance.getEntriesByType !== 'function') {
      return null;
    }
    
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : null;
    } catch (error) {
      console.warn('Failed to get first paint timing:', error.message);
      return null;
    }
  }

  /**
   * Get First Contentful Paint timing
   */
  getFirstContentfulPaint() {
    if (!this.isBrowser || typeof performance.getEntriesByType !== 'function') {
      return null;
    }
    
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    } catch (error) {
      console.warn('Failed to get first contentful paint timing:', error.message);
      return null;
    }
  }

  /**
   * Monitor React 19 automatic batching performance
   */
  measureBatchingPerformance(batchName, batchedUpdates) {
    if (!this.isEnabled || !this.isBrowser) return batchedUpdates();
    
    this.startMeasure(`batching-${batchName}`, { 
      type: 'automatic-batching',
      batchName 
    });
    
    // React 19 automatically batches these updates
    const result = batchedUpdates();
    
    try {
      // Use requestIdleCallback to measure after batching is complete
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          this.endMeasure(`batching-${batchName}`);
        });
      } else if (typeof setTimeout !== 'undefined') {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.endMeasure(`batching-${batchName}`);
        }, 0);
      } else {
        // Immediate fallback for environments without async scheduling
        this.endMeasure(`batching-${batchName}`);
      }
    } catch (error) {
      console.warn('Failed to schedule batching performance measurement:', error.message);
      this.endMeasure(`batching-${batchName}`);
    }
    
    return result;
  }

  /**
   * Log performance metric
   */
  logMetric(metric) {
    if (!this.isEnabled) return;
    
    try {
      const logLevel = metric.duration > 100 ? 'warn' : 'log';
      console[logLevel](`🚀 Performance: ${metric.name}`, {
        duration: `${metric.duration.toFixed(2)}ms`,
        ...metric.metadata
      });
      
      // Store for analysis (only in browser environment)
      if (this.isBrowser && typeof window !== 'undefined') {
        if (!window.__PERFORMANCE_METRICS__) {
          window.__PERFORMANCE_METRICS__ = [];
        }
        window.__PERFORMANCE_METRICS__.push(metric);
      }
    } catch (error) {
      // Silently fail if logging fails
      console.warn('Failed to log performance metric:', error.message);
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (!this.isBrowser || typeof window === 'undefined' || !window.__PERFORMANCE_METRICS__) {
      return { metrics: [], summary: {} };
    }
    
    try {
      const metrics = window.__PERFORMANCE_METRICS__;
      const summary = {
        totalMeasurements: metrics.length,
        averageRenderTime: this.getAverageByType(metrics, 'component-render'),
        averageApiTime: this.getAverageByType(metrics, 'api-call'),
        bundleLoadTime: metrics.find(m => m.name === 'bundle-load')?.duration || 0,
        slowestOperations: metrics
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map(m => ({ name: m.name, duration: m.duration }))
      };
      
      return { metrics, summary };
    } catch (error) {
      console.warn('Failed to generate performance summary:', error.message);
      return { metrics: [], summary: {} };
    }
  }

  /**
   * Get average duration by metric type
   */
  getAverageByType(metrics, type) {
    const typeMetrics = metrics.filter(m => m.metadata?.type === type);
    if (typeMetrics.length === 0) return 0;
    
    const total = typeMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / typeMetrics.length;
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React 19 specific performance hooks
export const usePerformanceMonitor = () => {
  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureConcurrentFeature: performanceMonitor.measureConcurrentFeature.bind(performanceMonitor),
    measureBatchingPerformance: performanceMonitor.measureBatchingPerformance.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor)
  };
};

// Initialize bundle performance monitoring (only in browser environment)
try {
  if (performanceMonitor.isBrowser && performanceMonitor.isEnabled) {
    performanceMonitor.measureBundlePerformance();
  }
} catch (error) {
  console.warn('Failed to initialize performance monitoring:', error.message);
}

export default performanceMonitor;