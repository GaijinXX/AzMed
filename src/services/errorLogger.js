// Error logging service for debugging and monitoring
class ErrorLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 100 // Keep last 100 error logs in memory
  }

  // Log error with context information
  logError(error, context = {}) {
    const errorLog = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      type: error.type || 'UNKNOWN_ERROR',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ...context
      },
      severity: this.determineSeverity(error),
      originalError: error
    }

    // Add to in-memory logs
    this.logs.unshift(errorLog)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Log [${errorLog.severity}] - ${errorLog.id}`)
      console.error('Message:', errorLog.message)
      console.error('Type:', errorLog.type)
      console.error('Context:', errorLog.context)
      if (errorLog.stack) {
        console.error('Stack:', errorLog.stack)
      }
      console.groupEnd()
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorLog)
    }

    return errorLog.id
  }

  // Log API errors with additional context
  logApiError(error, apiContext = {}) {
    const context = {
      type: 'API_ERROR',
      endpoint: apiContext.endpoint || 'unknown',
      method: apiContext.method || 'unknown',
      parameters: apiContext.parameters || {},
      responseStatus: apiContext.responseStatus,
      ...apiContext
    }

    return this.logError(error, context)
  }

  // Log component errors (for Error Boundaries)
  logComponentError(error, errorInfo, componentName = 'Unknown') {
    const context = {
      type: 'COMPONENT_ERROR',
      componentName,
      componentStack: errorInfo?.componentStack,
      errorBoundary: true
    }

    return this.logError(error, context)
  }

  // Log network connectivity issues
  logNetworkError(error, networkContext = {}) {
    const context = {
      type: 'NETWORK_ERROR',
      online: navigator.onLine,
      connectionType: this.getConnectionType(),
      ...networkContext
    }

    return this.logError(error, context)
  }

  // Log timeout errors
  logTimeoutError(error, timeoutContext = {}) {
    const context = {
      type: 'TIMEOUT_ERROR',
      timeout: timeoutContext.timeout || 'unknown',
      operation: timeoutContext.operation || 'unknown',
      ...timeoutContext
    }

    return this.logError(error, context)
  }

  // Get recent error logs
  getRecentLogs(count = 10) {
    return this.logs.slice(0, count)
  }

  // Get logs by type
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type || log.context?.type === type)
  }

  // Get logs by severity
  getLogsBySeverity(severity) {
    return this.logs.filter(log => log.severity === severity)
  }

  // Clear all logs
  clearLogs() {
    this.logs = []
  }

  // Generate unique error ID
  generateErrorId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `error_${timestamp}_${random}`
  }

  // Determine error severity
  determineSeverity(error) {
    if (error.type) {
      switch (error.type) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
          return 'WARNING'
        case 'INVALID_RESPONSE':
        case 'FUNCTION_ERROR':
          return 'ERROR'
        case 'SERVER_ERROR':
          return 'CRITICAL'
        default:
          return 'ERROR'
      }
    }

    // Determine by error name/message
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'CRITICAL'
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'WARNING'
    }

    return 'ERROR'
  }

  // Get connection type (if available)
  getConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType || 'unknown'
    }
    return 'unknown'
  }

  // Send error to external service (placeholder for production)
  sendToErrorService(errorLog) {
    // In a real application, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    // Example implementation:
    // try {
    //   fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorLog)
    //   })
    // } catch (e) {
    //   console.error('Failed to send error to tracking service:', e)
    // }
    
    console.log('Error would be sent to tracking service:', errorLog.id)
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.logs.length,
      byType: {},
      bySeverity: {},
      recent: this.logs.slice(0, 5).map(log => ({
        id: log.id,
        message: log.message,
        type: log.type,
        severity: log.severity,
        timestamp: log.timestamp
      }))
    }

    // Count by type
    this.logs.forEach(log => {
      const logType = log.context?.type || log.type
      stats.byType[logType] = (stats.byType[logType] || 0) + 1
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
    })

    return stats
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger()

// Listen for unhandled errors
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error || new Error(event.message), {
    type: 'UNHANDLED_ERROR',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(
    event.reason instanceof Error ? event.reason : new Error(event.reason),
    {
      type: 'UNHANDLED_PROMISE_REJECTION'
    }
  )
})

// Listen for network status changes
window.addEventListener('online', () => {
  console.log('Network connection restored')
})

window.addEventListener('offline', () => {
  errorLogger.logError(new Error('Network connection lost'), {
    type: 'NETWORK_OFFLINE'
  })
})

export default errorLogger