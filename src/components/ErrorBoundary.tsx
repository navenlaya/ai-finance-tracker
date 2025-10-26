'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // In production, you would log to an error tracking service like Sentry
    // Sentry.captureException(error, { extra: errorInfo })
    
    this.setState({
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            We encountered an unexpected error. Don't worry, your data is safe.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-gray-100 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={resetError}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
          
          <p className="text-center text-xs text-gray-500">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error fallbacks for different contexts
export function DashboardErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Dashboard Error
          </CardTitle>
          <CardDescription className="text-red-700">
            Unable to load dashboard data. Please try refreshing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function TransactionErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Transaction Error
          </CardTitle>
          <CardDescription className="text-red-700">
            Unable to load transactions. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function InsightErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            AI Insights Error
          </CardTitle>
          <CardDescription className="text-red-700">
            Unable to generate insights. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { ErrorBoundary }
export default ErrorBoundary
