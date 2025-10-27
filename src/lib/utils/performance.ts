/**
 * Performance monitoring utilities
 * Track and log performance metrics for optimization
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  }

  /**
   * Start timing a performance metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  /**
   * End timing a performance metric
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metric.metadata)
    } else if (duration > 500) { // More than 500ms
      console.info(`Performance: ${name} took ${duration.toFixed(2)}ms`, metric.metadata)
    }

    return duration
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Get summary of performance metrics
   */
  getSummary(): {
    totalMetrics: number
    averageDuration: number
    slowestOperation: PerformanceMetric | null
    fastestOperation: PerformanceMetric | null
  } {
    const metrics = this.getMetrics().filter(m => m.duration !== undefined)
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      }
    }

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const averageDuration = totalDuration / metrics.length

    const slowestOperation = metrics.reduce((slowest, current) => 
      (current.duration || 0) > (slowest.duration || 0) ? current : slowest
    )

    const fastestOperation = metrics.reduce((fastest, current) => 
      (current.duration || 0) < (fastest.duration || 0) ? current : fastest
    )

    return {
      totalMetrics: metrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Higher-order function to measure performance of async operations
 */
export function measurePerformance<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    performanceMonitor.start(operationName)
    
    try {
      const result = await fn(...args)
      performanceMonitor.end(operationName)
      return result
    } catch (error) {
      performanceMonitor.end(operationName)
      throw error
    }
  }
}

/**
 * Measure performance of synchronous operations
 */
export function measureSyncPerformance<T extends any[], R>(
  fn: (...args: T) => R,
  operationName: string
) {
  return (...args: T): R => {
    performanceMonitor.start(operationName)
    
    try {
      const result = fn(...args)
      performanceMonitor.end(operationName)
      return result
    } catch (error) {
      performanceMonitor.end(operationName)
      throw error
    }
  }
}

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMeasure(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.start(`${componentName}-render`)
    
    return () => {
      performanceMonitor.end(`${componentName}-render`)
    }
  })
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> {
  return measurePerformance(apiCall, `api-${endpoint}`)()
}

/**
 * Measure database query performance
 */
export async function measureDbQuery<T>(
  query: () => Promise<T>,
  queryName: string
): Promise<T> {
  return measurePerformance(query, `db-${queryName}`)()
}

/**
 * Measure AI operation performance
 */
export async function measureAiOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return measurePerformance(operation, `ai-${operationName}`)()
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const summary = performanceMonitor.getSummary()
  
  console.group('🚀 Performance Summary')
  console.log(`Total operations: ${summary.totalMetrics}`)
  console.log(`Average duration: ${summary.averageDuration.toFixed(2)}ms`)
  
  if (summary.slowestOperation) {
    console.log(`Slowest: ${summary.slowestOperation.name} (${summary.slowestOperation.duration?.toFixed(2)}ms)`)
  }
  
  if (summary.fastestOperation) {
    console.log(`Fastest: ${summary.fastestOperation.name} (${summary.fastestOperation.duration?.toFixed(2)}ms)`)
  }
  
  console.groupEnd()
}

/**
 * Performance decorators for class methods
 */
export function Performance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const operationName = `${target.constructor.name}.${propertyName}`
    performanceMonitor.start(operationName)
    
    try {
      const result = await method.apply(this, args)
      performanceMonitor.end(operationName)
      return result
    } catch (error) {
      performanceMonitor.end(operationName)
      throw error
    }
  }
}

// Import React for the hook
import React from 'react'
