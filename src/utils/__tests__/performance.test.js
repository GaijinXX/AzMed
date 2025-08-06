import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import performanceMonitor, { usePerformanceMonitor } from '../performance'

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    DEV: false
  }
}))

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Clear any existing metrics
    performanceMonitor.cleanup()
  })

  afterEach(() => {
    performanceMonitor.cleanup()
  })

  describe('Environment Detection', () => {
    it('should detect test environment and disable monitoring', () => {
      expect(performanceMonitor.isEnabled).toBe(false)
      expect(performanceMonitor.isBrowser).toBe(false)
    })

    it('should not crash when window is undefined', () => {
      expect(() => {
        performanceMonitor.startMeasure('test-measure')
        performanceMonitor.endMeasure('test-measure')
      }).not.toThrow()
    })

    it('should not crash when performance API is unavailable', () => {
      expect(() => {
        performanceMonitor.measureBundlePerformance()
        performanceMonitor.getFirstPaint()
        performanceMonitor.getFirstContentfulPaint()
      }).not.toThrow()
    })
  })

  describe('Safe Operations in Test Environment', () => {
    it('should handle startMeasure safely', () => {
      expect(() => {
        performanceMonitor.startMeasure('test-measure', { type: 'test' })
      }).not.toThrow()
    })

    it('should handle endMeasure safely', () => {
      expect(() => {
        performanceMonitor.endMeasure('test-measure')
      }).not.toThrow()
    })

    it('should handle measureRender safely', () => {
      const renderFn = vi.fn(() => 'rendered')
      const result = performanceMonitor.measureRender('TestComponent', renderFn)
      
      expect(result).toBe('rendered')
      expect(renderFn).toHaveBeenCalled()
    })

    it('should handle measureApiCall safely', async () => {
      const apiCall = vi.fn().mockResolvedValue({ data: 'test' })
      const result = await performanceMonitor.measureApiCall('test-api', apiCall)
      
      expect(result).toEqual({ data: 'test' })
      expect(apiCall).toHaveBeenCalled()
    })

    it('should handle measureConcurrentFeature safely', () => {
      const operation = vi.fn(() => 'result')
      const result = performanceMonitor.measureConcurrentFeature('test-feature', operation)
      
      expect(result).toBe('result')
      expect(operation).toHaveBeenCalled()
    })

    it('should handle measureBatchingPerformance safely', () => {
      const batchedUpdates = vi.fn(() => 'batched')
      const result = performanceMonitor.measureBatchingPerformance('test-batch', batchedUpdates)
      
      expect(result).toBe('batched')
      expect(batchedUpdates).toHaveBeenCalled()
    })

    it('should return empty summary in test environment', () => {
      const summary = performanceMonitor.getSummary()
      
      expect(summary).toEqual({
        metrics: [],
        summary: {}
      })
    })
  })

  describe('usePerformanceMonitor Hook', () => {
    it('should provide all expected methods', () => {
      const hook = usePerformanceMonitor()
      
      expect(hook).toHaveProperty('startMeasure')
      expect(hook).toHaveProperty('endMeasure')
      expect(hook).toHaveProperty('measureRender')
      expect(hook).toHaveProperty('measureApiCall')
      expect(hook).toHaveProperty('measureConcurrentFeature')
      expect(hook).toHaveProperty('measureBatchingPerformance')
      expect(hook).toHaveProperty('getSummary')
    })

    it('should handle all methods safely in test environment', () => {
      const hook = usePerformanceMonitor()
      
      expect(() => {
        hook.startMeasure('test')
        hook.endMeasure('test')
        hook.measureRender('Component', () => 'rendered')
        hook.getSummary()
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // Mock console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // These should not throw even if they encounter errors
      expect(() => {
        performanceMonitor.logMetric({ name: 'test', duration: 100 })
        performanceMonitor.measureBundlePerformance()
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})