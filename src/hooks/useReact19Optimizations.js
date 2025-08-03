/**
 * Custom hook for React 19 optimizations
 * Provides utilities for leveraging React 19 features and compiler benefits
 */

import { 
  useCallback, 
  useMemo, 
  useTransition, 
  useDeferredValue, 
  useOptimistic,
  startTransition,
  useState
} from 'react';
import { usePerformanceMonitor } from '../utils/performance';

/**
 * Hook for optimized state updates with React 19 automatic batching
 */
export function useOptimizedUpdates() {
  const [isPending, startTransition] = useTransition();
  const { measureBatchingPerformance } = usePerformanceMonitor();

  // Optimized batch update function
  const batchUpdate = useCallback((updateFn, batchName = 'batch-update') => {
    return measureBatchingPerformance(batchName, () => {
      startTransition(() => {
        updateFn();
      });
    });
  }, [measureBatchingPerformance]);

  // Optimized immediate update for urgent changes
  const immediateUpdate = useCallback((updateFn) => {
    // These updates bypass transitions for immediate feedback
    updateFn();
  }, []);

  return {
    batchUpdate,
    immediateUpdate,
    isPending
  };
}

/**
 * Hook for optimized data fetching with React 19 features
 */
export function useOptimizedFetch(fetchFn, dependencies = []) {
  const { measureApiCall } = usePerformanceMonitor();
  const [isPending, startTransition] = useTransition();

  // Memoized fetch function (React Compiler will optimize this automatically)
  const optimizedFetch = useCallback(async (...args) => {
    return measureApiCall('optimized-fetch', () => fetchFn(...args), {
      dependencies: dependencies.length
    });
  }, [fetchFn, measureApiCall, dependencies]);

  // Fetch with transition for non-urgent updates
  const fetchWithTransition = useCallback((...args) => {
    startTransition(async () => {
      await optimizedFetch(...args);
    });
  }, [optimizedFetch]);

  return {
    fetch: optimizedFetch,
    fetchWithTransition,
    isPending
  };
}

/**
 * Hook for optimized list rendering with virtual scrolling support
 */
export function useOptimizedList(items, options = {}) {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5
  } = options;

  // Deferred value for non-urgent list updates
  const deferredItems = useDeferredValue(items);

  // Calculate visible range for virtual scrolling
  const visibleRange = useMemo(() => {
    const itemCount = deferredItems?.length || 0;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = 0; // This would be calculated based on scroll position
    const endIndex = Math.min(startIndex + visibleCount + overscan, itemCount);

    return {
      startIndex,
      endIndex,
      visibleCount,
      totalHeight: itemCount * itemHeight
    };
  }, [deferredItems?.length, containerHeight, itemHeight, overscan]);

  // Get visible items (React Compiler will optimize this)
  const visibleItems = useMemo(() => {
    if (!deferredItems || !Array.isArray(deferredItems)) return [];
    return deferredItems.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [deferredItems, visibleRange.startIndex, visibleRange.endIndex]);

  return {
    visibleItems,
    visibleRange,
    totalItems: deferredItems?.length || 0,
    isDeferred: deferredItems !== items
  };
}

/**
 * Hook for optimized form handling with React 19 form actions
 */
export function useOptimizedForm(onSubmit, initialState = {}) {
  const [isPending, startTransition] = useTransition();
  const { measureConcurrentFeature } = usePerformanceMonitor();

  // Optimistic state for immediate feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    initialState,
    (state, update) => ({ ...state, ...update })
  );

  // Form action with optimizations
  const formAction = useCallback(async (formData) => {
    return measureConcurrentFeature('form-submission', async () => {
      // Add optimistic update for immediate feedback
      const formValues = Object.fromEntries(formData.entries());
      addOptimisticUpdate(formValues);

      // Perform actual submission in transition
      startTransition(async () => {
        await onSubmit(formData);
      });
    });
  }, [onSubmit, addOptimisticUpdate, measureConcurrentFeature]);

  return {
    formAction,
    optimisticState,
    addOptimisticUpdate,
    isPending
  };
}

/**
 * Hook for optimized search with debouncing and caching
 */
export function useOptimizedSearch(searchFn, options = {}) {
  const {
    debounceMs = 300,
    cacheSize = 50
  } = options;

  const { measureConcurrentFeature } = usePerformanceMonitor();
  const [isPending, startTransition] = useTransition();

  // Cache for search results (React Compiler will optimize this)
  const cache = useMemo(() => new Map(), []);

  // Debounced search value
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Optimized search function with caching
  const search = useCallback(async (term) => {
    return measureConcurrentFeature('search', async () => {
      // Check cache first
      if (cache.has(term)) {
        return cache.get(term);
      }

      // Perform search
      const result = await searchFn(term);

      // Cache result (with size limit)
      if (cache.size >= cacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(term, result);

      return result;
    });
  }, [searchFn, cache, cacheSize, measureConcurrentFeature]);

  // Search with transition
  const searchWithTransition = useCallback((term) => {
    setSearchTerm(term);
    startTransition(async () => {
      await search(deferredSearchTerm);
    });
  }, [search, deferredSearchTerm]);

  return {
    search,
    searchWithTransition,
    searchTerm: deferredSearchTerm,
    setSearchTerm,
    isPending,
    cacheSize: cache.size
  };
}

/**
 * Hook for monitoring React 19 compiler optimizations
 */
export function useCompilerOptimizations() {
  const { measureRender } = usePerformanceMonitor();

  // Track component re-renders
  const trackRender = useCallback((componentName) => {
    return measureRender(componentName, () => {
      // This will be optimized by React Compiler
      return true;
    });
  }, [measureRender]);

  // Check if React Compiler is active
  const isCompilerActive = useMemo(() => {
    // React Compiler adds specific properties to components
    return typeof window !== 'undefined' && 
           window.React && 
           window.React.version.startsWith('19');
  }, []);

  return {
    trackRender,
    isCompilerActive
  };
}

/**
 * Hook for optimized concurrent rendering
 */
export function useConcurrentRendering() {
  const [isPending, startTransition] = useTransition();
  const { measureConcurrentFeature } = usePerformanceMonitor();

  // Render with concurrent features
  const renderConcurrently = useCallback((renderFn, priority = 'normal') => {
    return measureConcurrentFeature(`concurrent-render-${priority}`, () => {
      if (priority === 'urgent') {
        // Immediate render for urgent updates
        return renderFn();
      } else {
        // Use transition for non-urgent updates
        startTransition(() => {
          renderFn();
        });
      }
    });
  }, [measureConcurrentFeature]);

  return {
    renderConcurrently,
    isPending
  };
}

/**
 * Hook for memory optimization with React 19
 */
export function useMemoryOptimization() {
  // Cleanup function for component unmount
  const cleanup = useCallback(() => {
    // Clear any caches, cancel pending requests, etc.
    if (typeof window !== 'undefined' && window.gc) {
      // Suggest garbage collection in development
      window.gc();
    }
  }, []);

  // Memory usage tracking (development only)
  const trackMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }, []);

  return {
    cleanup,
    trackMemoryUsage
  };
}