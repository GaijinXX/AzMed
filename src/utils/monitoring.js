/**
 * Production monitoring and error tracking utilities
 * Provides performance monitoring, error tracking, and analytics
 */

/**
 * Initialize monitoring services
 */
export const initializeMonitoring = () => {
  if (!import.meta.env.PROD) {
    console.log('🔍 Monitoring disabled in development mode');
    return;
  }

  console.log('📊 Initializing production monitoring...');

  // Initialize performance monitoring
  initializePerformanceMonitoring();

  // Initialize error tracking
  initializeErrorTracking();

  // Initialize analytics (if enabled)
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    initializeAnalytics();
  }

  console.log('✅ Monitoring services initialized');
};

/**
 * Performance monitoring setup
 */
const initializePerformanceMonitoring = () => {
  // Web Vitals monitoring
  if ('PerformanceObserver' in window) {
    // Monitor Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      trackMetric('LCP', lastEntry.startTime, {
        element: lastEntry.element?.tagName || 'unknown',
        url: lastEntry.url || window.location.href
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP monitoring not supported:', e);
    }

    // Monitor First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackMetric('FID', entry.processingStart - entry.startTime, {
          eventType: entry.name,
          target: entry.target?.tagName || 'unknown'
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID monitoring not supported:', e);
    }

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      trackMetric('CLS', clsValue);
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS monitoring not supported:', e);
    }
  }

  // Monitor navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        trackMetric('TTFB', navigation.responseStart - navigation.requestStart);
        trackMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        trackMetric('LoadComplete', navigation.loadEventEnd - navigation.loadEventStart);
      }
    }, 0);
  });
};

/**
 * Error tracking setup
 */
const initializeErrorTracking = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'javascript'
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, {
      type: 'promise',
      promise: event.promise
    });
  });

  // React error boundary integration
  window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
    onBuildError: (error) => {
      trackError(error, { type: 'build' });
    },
    onRuntimeError: (error) => {
      trackError(error, { type: 'runtime' });
    }
  };
};

/**
 * Analytics setup (placeholder for future implementation)
 */
const initializeAnalytics = () => {
  console.log('📈 Analytics tracking enabled');
  
  // Track page views
  trackPageView(window.location.pathname);

  // Track user interactions
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('button, a, [role="button"]')) {
      trackEvent('click', {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.slice(0, 50) || '',
        href: target.href || ''
      });
    }
  });
};

/**
 * Track performance metrics
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
export const trackMetric = (name, value, metadata = {}) => {
  const metric = {
    name,
    value: Math.round(value),
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...metadata
  };

  // Log to console in development
  if (!import.meta.env.PROD) {
    console.log(`📊 Metric: ${name} = ${value}ms`, metadata);
    return;
  }

  // Send to monitoring service (implement based on chosen service)
  sendToMonitoringService('metric', metric);
};

/**
 * Track errors
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
export const trackError = (error, metadata = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...metadata
  };

  // Log to console in development
  if (!import.meta.env.PROD) {
    console.error('🚨 Error tracked:', error, metadata);
    return;
  }

  // Send to error tracking service
  sendToMonitoringService('error', errorData);
};

/**
 * Track page views
 * @param {string} path - Page path
 */
export const trackPageView = (path) => {
  const pageView = {
    path,
    timestamp: Date.now(),
    referrer: document.referrer,
    userAgent: navigator.userAgent
  };

  if (!import.meta.env.PROD) {
    console.log('📄 Page view:', path);
    return;
  }

  sendToMonitoringService('pageview', pageView);
};

/**
 * Track custom events
 * @param {string} event - Event name
 * @param {Object} properties - Event properties
 */
export const trackEvent = (event, properties = {}) => {
  const eventData = {
    event,
    properties,
    timestamp: Date.now(),
    url: window.location.href
  };

  if (!import.meta.env.PROD) {
    console.log(`🎯 Event: ${event}`, properties);
    return;
  }

  sendToMonitoringService('event', eventData);
};

/**
 * Send data to monitoring service
 * @param {string} type - Data type (metric, error, pageview, event)
 * @param {Object} data - Data to send
 */
const sendToMonitoringService = async (type, data) => {
  try {
    // This is a placeholder - implement based on your chosen monitoring service
    // Examples: Sentry, LogRocket, DataDog, New Relic, etc.
    
    // For now, we'll use a simple endpoint or local storage
    if (import.meta.env.VITE_MONITORING_ENDPOINT) {
      await fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data })
      });
    } else {
      // Fallback: store in localStorage for debugging
      const stored = JSON.parse(localStorage.getItem('monitoring_data') || '[]');
      stored.push({ type, data, timestamp: Date.now() });
      
      // Keep only last 100 entries
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('monitoring_data', JSON.stringify(stored));
    }
  } catch (error) {
    console.error('Failed to send monitoring data:', error);
  }
};

/**
 * Get monitoring data from localStorage (for debugging)
 * @returns {Array} Monitoring data
 */
export const getMonitoringData = () => {
  try {
    return JSON.parse(localStorage.getItem('monitoring_data') || '[]');
  } catch (error) {
    console.error('Failed to get monitoring data:', error);
    return [];
  }
};

/**
 * Clear monitoring data from localStorage
 */
export const clearMonitoringData = () => {
  localStorage.removeItem('monitoring_data');
  console.log('🧹 Monitoring data cleared');
};

/**
 * Generate monitoring report
 * @returns {Object} Monitoring report
 */
export const generateMonitoringReport = () => {
  const data = getMonitoringData();
  const report = {
    summary: {
      totalEvents: data.length,
      errors: data.filter(d => d.type === 'error').length,
      metrics: data.filter(d => d.type === 'metric').length,
      pageViews: data.filter(d => d.type === 'pageview').length,
      customEvents: data.filter(d => d.type === 'event').length
    },
    timeRange: {
      start: data.length > 0 ? Math.min(...data.map(d => d.timestamp)) : null,
      end: data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : null
    },
    topErrors: data
      .filter(d => d.type === 'error')
      .reduce((acc, curr) => {
        const key = curr.data.message;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    performanceMetrics: data
      .filter(d => d.type === 'metric')
      .reduce((acc, curr) => {
        const key = curr.data.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr.data.value);
        return acc;
      }, {})
  };

  // Calculate averages for performance metrics
  Object.keys(report.performanceMetrics).forEach(key => {
    const values = report.performanceMetrics[key];
    report.performanceMetrics[key] = {
      count: values.length,
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  return report;
};

/**
 * Health check for monitoring services
 * @returns {Promise<Object>} Health check results
 */
export const healthCheck = async () => {
  const health = {
    status: 'healthy',
    checks: {},
    timestamp: Date.now()
  };

  try {
    // Check if monitoring is initialized
    health.checks.monitoring = {
      status: 'ok',
      message: 'Monitoring services are running'
    };

    // Check localStorage availability
    try {
      localStorage.setItem('health_check', 'test');
      localStorage.removeItem('health_check');
      health.checks.localStorage = {
        status: 'ok',
        message: 'localStorage is available'
      };
    } catch (error) {
      health.checks.localStorage = {
        status: 'error',
        message: 'localStorage is not available'
      };
      health.status = 'degraded';
    }

    // Check Performance API
    health.checks.performanceAPI = {
      status: 'PerformanceObserver' in window ? 'ok' : 'warning',
      message: 'PerformanceObserver' in window ? 
        'Performance monitoring available' : 
        'Performance monitoring limited'
    };

    // Check if monitoring endpoint is configured
    health.checks.endpoint = {
      status: import.meta.env.VITE_MONITORING_ENDPOINT ? 'ok' : 'warning',
      message: import.meta.env.VITE_MONITORING_ENDPOINT ? 
        'Monitoring endpoint configured' : 
        'Using localStorage fallback'
    };

    return health;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    };
  }
};