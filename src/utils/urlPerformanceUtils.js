/**
 * URL Performance Optimization Utilities
 * Provides debouncing, throttling, and performance monitoring for URL state updates
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, options = {}) {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId;
  let maxTimeoutId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let lastArgs;
  let lastThis;
  let result;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = maxTimeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;
  
  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Options object
 * @returns {Function} - Throttled function
 */
export function throttle(func, wait, options = {}) {
  const { leading = true, trailing = true } = options;
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  });
}

/**
 * Performance monitor for URL state operations
 */
export class URLPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = import.meta.env.DEV;
  }

  /**
   * Starts measuring a URL operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {Object} metadata - Additional metadata about the operation
   */
  startMeasure(operationId, metadata = {}) {
    if (!this.isEnabled) return;

    this.metrics.set(operationId, {
      startTime: performance.now(),
      metadata,
      status: 'started'
    });
  }

  /**
   * Ends measuring a URL operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {Object} result - Result metadata
   */
  endMeasure(operationId, result = {}) {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`No metric found for operation: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(operationId, {
      ...metric,
      endTime,
      duration,
      result,
      status: 'completed'
    });

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow URL operation detected: ${operationId} took ${duration.toFixed(2)}ms`, {
        metadata: metric.metadata,
        result
      });
    }
  }

  /**
   * Gets performance metrics for an operation
   * @param {string} operationId - Unique identifier for the operation
   * @returns {Object|null} - Performance metrics or null if not found
   */
  getMetrics(operationId) {
    return this.metrics.get(operationId) || null;
  }

  /**
   * Gets all performance metrics
   * @returns {Array} - Array of all metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.entries()).map(([id, metrics]) => ({
      operationId: id,
      ...metrics
    }));
  }

  /**
   * Clears all performance metrics
   */
  clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Generates a performance report
   * @returns {Object} - Performance report
   */
  generateReport() {
    const allMetrics = this.getAllMetrics();
    const completedMetrics = allMetrics.filter(m => m.status === 'completed');

    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: [],
        summary: 'No completed operations to report'
      };
    }

    const durations = completedMetrics.map(m => m.duration);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const slowOperations = completedMetrics.filter(m => m.duration > 100);

    return {
      totalOperations: completedMetrics.length,
      averageDuration: Math.round(averageDuration * 100) / 100,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowOperations: slowOperations.length,
      slowOperationDetails: slowOperations.map(op => ({
        operationId: op.operationId,
        duration: op.duration,
        metadata: op.metadata
      })),
      summary: `${completedMetrics.length} operations completed with average duration of ${Math.round(averageDuration * 100) / 100}ms`
    };
  }
}

// Global instance for URL performance monitoring
export const urlPerformanceMonitor = new URLPerformanceMonitor();

/**
 * Batch URL updates to prevent excessive history entries
 */
export class URLUpdateBatcher {
  constructor(options = {}) {
    this.batchDelay = options.batchDelay || 50;
    this.maxBatchSize = options.maxBatchSize || 10;
    this.pendingUpdates = [];
    this.timeoutId = null;
    this.onFlush = options.onFlush || (() => {});
  }

  /**
   * Adds an update to the batch
   * @param {Object} update - Update object
   */
  addUpdate(update) {
    this.pendingUpdates.push({
      ...update,
      timestamp: Date.now()
    });

    // If batch is full, flush immediately
    if (this.pendingUpdates.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flush();
      }, this.batchDelay);
    }
  }

  /**
   * Flushes all pending updates
   */
  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pendingUpdates.length === 0) {
      return;
    }

    // Get the most recent update (others are superseded)
    const latestUpdate = this.pendingUpdates[this.pendingUpdates.length - 1];
    
    // Call the flush handler with the latest update
    this.onFlush(latestUpdate);

    // Clear pending updates
    this.pendingUpdates = [];
  }

  /**
   * Cancels all pending updates
   */
  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingUpdates = [];
  }

  /**
   * Gets the number of pending updates
   * @returns {number} - Number of pending updates
   */
  getPendingCount() {
    return this.pendingUpdates.length;
  }
}

/**
 * Memory-efficient URL state cache
 */
export class URLStateCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Gets a cached state by URL
   * @param {string} url - URL to lookup
   * @returns {Object|null} - Cached state or null
   */
  get(url) {
    const cached = this.cache.get(url);
    if (cached) {
      // Move to end (LRU)
      this.cache.delete(url);
      this.cache.set(url, cached);
      return cached.state;
    }
    return null;
  }

  /**
   * Sets a cached state for a URL
   * @param {string} url - URL to cache
   * @param {Object} state - State to cache
   */
  set(url, state) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(url, {
      state: { ...state },
      timestamp: Date.now()
    });
  }

  /**
   * Clears the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global URL state cache instance
export const urlStateCache = new URLStateCache();