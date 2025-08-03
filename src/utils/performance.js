/**
 * Performance monitoring utilities for React 19 optimizations
 * Tracks rendering performance, bundle size, and user interactions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = import.meta.env.DEV || 
                     typeof window !== 'undefined' && window.location.search.includes('debug=performance');
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name, metadata = {}) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(name, {
      startTime,
      metadata,
      type: 'measure'
    });
    
    // Use Performance API for precise measurements
    performance.mark(`${name}-start`);
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name, additionalMetadata = {}) {
    if (!this.isEnabled) return;
    
    const endTime = performance.now();
    const metric = this.metrics.get(name);
    
    if (!metric) {
      console.warn(`Performance measure "${name}" was not started`);
      return;
    }
    
    const duration = endTime - metric.startTime;
    
    // Use Performance API
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
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
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    // Measure initial bundle load time
    window.addEventListener('load', () => {
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
    });

    // Monitor resource loading (only in browser environment)
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
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
      });
    
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    }
  }

  /**
   * Get First Paint timing
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  /**
   * Get First Contentful Paint timing
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  /**
   * Monitor React 19 automatic batching performance
   */
  measureBatchingPerformance(batchName, batchedUpdates) {
    if (!this.isEnabled) return batchedUpdates();
    
    this.startMeasure(`batching-${batchName}`, { 
      type: 'automatic-batching',
      batchName 
    });
    
    // React 19 automatically batches these updates
    const result = batchedUpdates();
    
    // Use requestIdleCallback to measure after batching is complete
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this.endMeasure(`batching-${batchName}`);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.endMeasure(`batching-${batchName}`);
      }, 0);
    }
    
    return result;
  }

  /**
   * Log performance metric
   */
  logMetric(metric) {
    if (!this.isEnabled) return;
    
    const logLevel = metric.duration > 100 ? 'warn' : 'log';
    console[logLevel](`🚀 Performance: ${metric.name}`, {
      duration: `${metric.duration.toFixed(2)}ms`,
      ...metric.metadata
    });
    
    // Store for analysis
    if (!window.__PERFORMANCE_METRICS__) {
      window.__PERFORMANCE_METRICS__ = [];
    }
    window.__PERFORMANCE_METRICS__.push(metric);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (typeof window === 'undefined' || !window.__PERFORMANCE_METRICS__) {
      return { metrics: [], summary: {} };
    }
    
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

// Initialize bundle performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.measureBundlePerformance();
}

export default performanceMonitor;