import React, { Component } from 'react'
import './ErrorBoundary.module.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for logging
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging for debugging
    const errorDetails = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Log to console for development
    console.error('Error Boundary caught an error:', errorDetails)

    // In production, you would send this to your error tracking service
    // Example: errorTrackingService.logError(errorDetails)

    this.setState({ errorInfo })
  }

  handleRetry = () => {
    // Clear error state and retry
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onRefresh={this.handleRefresh}
          />
        )
      }

      // Default error UI
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. 
              The application encountered an error and couldn't continue.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button primary"
                type="button"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleRefresh}
                className="refresh-button secondary"
                type="button"
              >
                Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  <strong>Error ID:</strong> {this.state.errorId}
                  {'\n'}
                  <strong>Message:</strong> {this.state.error.message}
                  {'\n'}
                  <strong>Stack:</strong>
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary